import {
  MAX_SHARE_TOKEN_LENGTH,
  SHARE_EXPIRED_ERROR,
  encodeSharePayload,
  isShareExpired,
  parseSharePayload,
  type SharePayload,
} from "@/lib/share/codec"

export const ENCRYPTED_SHARE_PREFIX = "enc1."

interface EncryptedEnvelope {
  salt: string
  iv: string
  data: string
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(token: string): Uint8Array {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (padded.length % 4)) % 4
  const binary = atob(padded + "=".repeat(padLength))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function isEncryptedShareToken(token: string): boolean {
  return token.startsWith(ENCRYPTED_SHARE_PREFIX)
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ])
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encodeEncryptedSharePayload(
  payload: SharePayload,
  password: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!password.trim()) {
    return { ok: false, error: "Add a password before creating a private link." }
  }

  const validated = encodeSharePayload(payload)
  if (!validated.ok) {
    return validated
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password.trim(), salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  const envelope: EncryptedEnvelope = {
    salt: bytesToBase64Url(salt),
    iv: bytesToBase64Url(iv),
    data: bytesToBase64Url(new Uint8Array(ciphertext)),
  }
  const token = `${ENCRYPTED_SHARE_PREFIX}${bytesToBase64Url(new TextEncoder().encode(JSON.stringify(envelope)))}`
  if (token.length > MAX_SHARE_TOKEN_LENGTH) {
    return { ok: false, error: "Too much data to share in a link. Export a JSON file instead." }
  }
  return { ok: true, token }
}

export async function decodeEncryptedSharePayload(
  token: string,
  password: string,
  now = new Date(),
): Promise<{ ok: true; payload: SharePayload } | { ok: false; error: string }> {
  if (!isEncryptedShareToken(token)) {
    return { ok: false, error: "This is not a password-protected share link." }
  }
  if (!password.trim()) {
    return { ok: false, error: "Enter the password for this link." }
  }

  try {
    const envelope = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(token.slice(ENCRYPTED_SHARE_PREFIX.length))),
    ) as EncryptedEnvelope
    const salt = base64UrlToBytes(envelope.salt)
    const iv = base64UrlToBytes(envelope.iv)
    const data = base64UrlToBytes(envelope.data)
    const key = await deriveKey(password.trim(), salt)
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
    const payload = parseSharePayload(JSON.parse(new TextDecoder().decode(plaintext)))
    if (!payload) {
      return { ok: false, error: "Invalid or corrupted share link" }
    }
    if (isShareExpired(payload, now)) {
      return { ok: false, error: SHARE_EXPIRED_ERROR }
    }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: "Wrong password or corrupted share link." }
  }
}

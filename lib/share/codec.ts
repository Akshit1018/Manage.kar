import { z } from "zod"
import type { Task } from "@/lib/domain/types"

export const MAX_SHARE_TOKEN_LENGTH = 6_000

export const SHARE_EXPIRED_ERROR = "This share link has expired."

export type ShareTtl = "1d" | "7d" | "30d" | "never"

export interface SharePayload {
  userName: string
  tasks: Task[]
  sharedAt: string
  customMessage?: string
  expiresAt?: string
}

const shareTaskSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    dueDate: z.string(),
    description: z.string().optional(),
    checklist: z
      .array(
        z.object({
          id: z.number(),
          text: z.string(),
          completed: z.boolean(),
        }),
      )
      .optional(),
  })
  .passthrough()

const sharePayloadSchema = z.object({
  userName: z.string(),
  tasks: z.array(shareTaskSchema),
  sharedAt: z.string(),
  customMessage: z.string().optional(),
  expiresAt: z.string().optional(),
})

export function shareExpiresAt(ttl: ShareTtl, now = new Date()): string | undefined {
  switch (ttl) {
    case "never":
      return undefined
    case "1d":
      return new Date(now.getTime() + 1 * 86_400_000).toISOString()
    case "7d":
      return new Date(now.getTime() + 7 * 86_400_000).toISOString()
    case "30d":
      return new Date(now.getTime() + 30 * 86_400_000).toISOString()
    default: {
      const exhaustive: never = ttl
      return exhaustive
    }
  }
}

export function isShareExpired(payload: SharePayload, now = new Date()): boolean {
  if (!payload.expiresAt) {
    return false
  }
  const expiry = Date.parse(payload.expiresAt)
  if (Number.isNaN(expiry)) {
    return false
  }
  return now.getTime() > expiry
}

function utf8ToBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToUtf8(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + "=".repeat(padLength)
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeSharePayload(
  payload: SharePayload,
): { ok: true; token: string } | { ok: false; error: string } {
  const parsed = sharePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Share data is incomplete." }
  }

  try {
    const token = utf8ToBase64Url(JSON.stringify(parsed.data))
    if (token.length > MAX_SHARE_TOKEN_LENGTH) {
      return { ok: false, error: "Too much data to share in a link. Export a JSON file instead." }
    }
    return { ok: true, token }
  } catch {
    return { ok: false, error: "Could not encode the share link." }
  }
}

export function parseSharePayload(raw: unknown): SharePayload | null {
  const parsed = sharePayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return null
  }
  return parsed.data as SharePayload
}

export function decodeSharePayload(
  token: string,
  now = new Date(),
): { ok: true; payload: SharePayload } | { ok: false; error: string } {
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH * 2) {
    return { ok: false, error: "Invalid or corrupted share link" }
  }
  if (token.startsWith("enc1.")) {
    return { ok: false, error: "This share link is password-protected." }
  }

  const attempts = [
    () => JSON.parse(base64UrlToUtf8(token)),
    () => JSON.parse(atob(token)),
  ]

  for (const attempt of attempts) {
    try {
      const payload = parseSharePayload(attempt())
      if (payload) {
        if (isShareExpired(payload, now)) {
          return { ok: false, error: SHARE_EXPIRED_ERROR }
        }
        return { ok: true, payload }
      }
    } catch {
      // try next decoder
    }
  }

  return { ok: false, error: "Invalid or corrupted share link" }
}

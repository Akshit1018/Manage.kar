import { z } from "zod"
import type { Task } from "@/lib/domain/types"

export const MAX_SHARE_TOKEN_LENGTH = 6_000

export interface SharePayload {
  userName: string
  tasks: Task[]
  sharedAt: string
  customMessage?: string
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
})

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

function parsePayload(raw: unknown): SharePayload | null {
  const parsed = sharePayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return null
  }
  return parsed.data as SharePayload
}

export function decodeSharePayload(
  token: string,
): { ok: true; payload: SharePayload } | { ok: false; error: string } {
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH * 2) {
    return { ok: false, error: "Invalid or corrupted share link" }
  }

  const attempts = [
    () => JSON.parse(base64UrlToUtf8(token)),
    () => JSON.parse(atob(token)),
  ]

  for (const attempt of attempts) {
    try {
      const payload = parsePayload(attempt())
      if (payload) {
        return { ok: true, payload }
      }
    } catch {
      // try next decoder
    }
  }

  return { ok: false, error: "Invalid or corrupted share link" }
}

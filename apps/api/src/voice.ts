import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, extname, join } from "node:path"

const SAFE_EXT = new Set(["m4a", "mp4", "aac", "wav", "webm", "caf"])

export function defaultVoiceDir() {
  return process.env.VOICE_DIR ?? join(process.cwd(), "storage", "voice")
}

export function voiceMime(path: string) {
  switch (extname(path).toLowerCase()) {
    case ".m4a":
    case ".mp4":
      return "audio/mp4"
    case ".webm":
      return "audio/webm"
    case ".wav":
      return "audio/wav"
    case ".caf":
      return "audio/x-caf"
    case ".aac":
      return "audio/aac"
    default:
      return "application/octet-stream"
  }
}

function safeExt(filename: string | undefined) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? ""
  return SAFE_EXT.has(ext) ? ext : "m4a"
}

export async function saveVoiceFile(
  root: string,
  userId: string,
  noteId: string,
  bytes: Buffer,
  filename?: string,
) {
  const ext = safeExt(filename)
  const relative = `${userId}/${noteId}.${ext}`
  const absolute = join(root, relative)
  await mkdir(dirname(absolute), { recursive: true })
  await writeFile(absolute, bytes)
  return relative
}

export async function readVoiceFile(root: string, voicePath: string) {
  const relative = voicePath.replace(/^voice\//, "")
  return readFile(join(root, relative))
}

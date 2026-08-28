import type { Note } from "@/lib/domain/types"

export interface NoteAnswer {
  note: Note
  score: number
  snippet: string
}

const SNIPPET_RADIUS = 80
const SNIPPET_MAX = 180

/** Lowercased unique terms of 2+ characters. Purely local text processing. */
export function tokenize(text: string): string[] {
  const terms: string[] = []
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length >= 2 && !terms.includes(raw)) {
      terms.push(raw)
    }
  }
  return terms
}

function snippetAround(content: string, terms: string[]): string {
  const lower = content.toLowerCase()
  let hit = -1
  for (const term of terms) {
    const index = lower.indexOf(term)
    if (index !== -1 && (hit === -1 || index < hit)) {
      hit = index
    }
  }
  const anchor = hit === -1 ? 0 : hit
  const start = Math.max(0, anchor - SNIPPET_RADIUS)
  const raw = content.slice(start, start + SNIPPET_MAX - 4).trim()
  const prefix = start > 0 ? "…" : ""
  const suffix = start + SNIPPET_MAX - 4 < content.length ? "…" : ""
  return `${prefix}${raw}${suffix}`
}

/**
 * Local keyword retrieval: rank notes by query-term overlap.
 * Title hits weigh double. No model, no network — this never leaves the device.
 */
export function askNotes(question: string, notes: Note[], limit = 5): NoteAnswer[] {
  const terms = tokenize(question)
  if (terms.length === 0) {
    return []
  }
  const scored: NoteAnswer[] = []
  for (const note of notes) {
    const titleTokens = tokenize(note.title)
    const contentTokens = tokenize(note.content)
    let score = 0
    for (const term of terms) {
      if (titleTokens.includes(term)) {
        score += 2
      }
      if (contentTokens.includes(term)) {
        score += 1
      }
    }
    if (score > 0) {
      scored.push({ note, score, snippet: snippetAround(note.content, terms) })
    }
  }
  return scored
    .sort((a, b) => b.score - a.score || b.note.createdAt.localeCompare(a.note.createdAt))
    .slice(0, limit)
}

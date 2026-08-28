import { describe, expect, it } from "vitest"
import type { Note } from "@/lib/domain/types"
import { askNotes, tokenize } from "./ask"

function note(id: number, title: string, content: string, createdAt = "2026-08-20T00:00:00.000Z"): Note {
  return { id, title, content, createdAt }
}

describe("tokenize", () => {
  it("lowercases, strips punctuation, and drops single characters", () => {
    expect(tokenize("What's my Wi-Fi password?")).toEqual(["what", "my", "wi", "fi", "password"])
  })

  it("returns an empty list for blank input", () => {
    expect(tokenize("   ")).toEqual([])
    expect(tokenize("")).toEqual([])
  })

  it("deduplicates repeated terms", () => {
    expect(tokenize("rent rent RENT")).toEqual(["rent"])
  })
})

describe("askNotes", () => {
  const notes = [
    note(1, "Wifi password", "Router password is hunter2, sticker on the back."),
    note(2, "Rent", "Rent is due on the 3rd. Landlord prefers bank transfer."),
    note(3, "Groceries", "Milk, eggs, bread."),
  ]

  it("returns an empty list for a blank question", () => {
    expect(askNotes("", notes)).toEqual([])
    expect(askNotes("   ", notes)).toEqual([])
  })

  it("ranks notes by term overlap, title matches first", () => {
    const results = askNotes("wifi password", notes)
    expect(results[0]?.note.id).toBe(1)
    expect(results.some((result) => result.note.id === 3)).toBe(false)
  })

  it("matches terms in the content too", () => {
    const results = askNotes("landlord bank transfer", notes)
    expect(results[0]?.note.id).toBe(2)
  })

  it("includes a snippet around the first matching term", () => {
    const results = askNotes("landlord", notes)
    expect(results[0]?.snippet.toLowerCase()).toContain("landlord")
  })

  it("ignores notes with no overlapping terms", () => {
    expect(askNotes("quantum chromodynamics", notes)).toEqual([])
  })

  it("respects the result limit", () => {
    const many = [note(1, "a rent", "rent"), note(2, "b rent", "rent"), note(3, "c rent", "rent")]
    expect(askNotes("rent", many, 2)).toHaveLength(2)
  })

  it("truncates long content into a bounded snippet", () => {
    const long = note(9, "Long", `${"x".repeat(400)} landlord ${"y".repeat(400)}`)
    const [result] = askNotes("landlord", [long])
    expect(result?.snippet.length).toBeLessThanOrEqual(180)
    expect(result?.snippet).toContain("landlord")
  })
})

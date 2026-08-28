import { describe, expect, it } from "vitest"
import type { Note } from "@/lib/domain/types"
import { notesWithLabel, sortNotesForDisplay, togglePinned } from "./organize"

function note(id: number, overrides: Partial<Note> = {}): Note {
  return {
    id,
    title: `Note ${id}`,
    content: "",
    createdAt: "2026-08-20T00:00:00.000Z",
    ...overrides,
  }
}

describe("sortNotesForDisplay", () => {
  it("keeps existing order when nothing is pinned", () => {
    const notes = [note(1), note(2), note(3)]
    expect(sortNotesForDisplay(notes).map((item) => item.id)).toEqual([1, 2, 3])
  })

  it("moves pinned notes to the top and keeps relative order otherwise", () => {
    const notes = [note(1), note(2, { pinned: true }), note(3), note(4, { pinned: true })]
    expect(sortNotesForDisplay(notes).map((item) => item.id)).toEqual([2, 4, 1, 3])
  })

  it("does not mutate the input array", () => {
    const notes = [note(1), note(2, { pinned: true })]
    sortNotesForDisplay(notes)
    expect(notes.map((item) => item.id)).toEqual([1, 2])
  })
})

describe("togglePinned", () => {
  it("flips the pin flag", () => {
    const original = note(1)
    expect(togglePinned(original).pinned).toBe(true)
    expect(togglePinned(togglePinned(original)).pinned).toBe(false)
  })
})

describe("notesWithLabel", () => {
  it("returns all notes when no label is selected", () => {
    const notes = [note(1, { labelIds: [5] }), note(2)]
    expect(notesWithLabel(notes, null)).toHaveLength(2)
  })

  it("filters to notes carrying the label", () => {
    const notes = [note(1, { labelIds: [5, 6] }), note(2, { labelIds: [6] }), note(3)]
    expect(notesWithLabel(notes, 5).map((item) => item.id)).toEqual([1])
    expect(notesWithLabel(notes, 6).map((item) => item.id)).toEqual([1, 2])
    expect(notesWithLabel(notes, 99)).toEqual([])
  })
})

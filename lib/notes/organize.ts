import type { Note } from "@/lib/domain/types"

/** Pinned notes first; otherwise the incoming order is preserved. */
export function sortNotesForDisplay(notes: Note[]): Note[] {
  const pinned = notes.filter((note) => note.pinned)
  const rest = notes.filter((note) => !note.pinned)
  return [...pinned, ...rest]
}

export function togglePinned(note: Note): Note {
  return { ...note, pinned: !note.pinned }
}

export function notesWithLabel(notes: Note[], labelId: number | null): Note[] {
  if (labelId === null) {
    return notes
  }
  return notes.filter((note) => (note.labelIds ?? []).includes(labelId))
}

"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import type { Note } from "@/lib/domain/types"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatTimestamp } from "@/lib/dates/due-date"
import { Plus } from "lucide-react"

interface NoteListProps {
  notes: Note[]
  searchQuery: string
  dateFormat: DateFormat
  onAddNote: () => void
  onEditNote: (note: Note) => void
}

export function NoteList({ notes, searchQuery, dateFormat, onAddNote, onEditNote }: NoteListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Notes</h3>
        <Button onClick={onAddNote}>
          <Plus className="h-4 w-4 mr-2" />
          Add note
        </Button>
      </div>
      {notes.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching notes" : "No notes yet"}
          description={searchQuery ? "Nothing matches that search." : "Capture a thought. It is saved locally."}
          actionLabel={searchQuery ? undefined : "Add note"}
          onAction={searchQuery ? undefined : onAddNote}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="p-4 cursor-pointer" onClick={() => onEditNote(note)}>
              <h4 className="font-semibold truncate">{note.title}</h4>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(note.createdAt, dateFormat)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import type { Note, WorkspaceLabel } from "@/lib/domain/types"
import { labelsForIds } from "@/lib/labels/book"
import { LabelChips } from "@/components/label-chips"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatTimestamp } from "@/lib/dates/due-date"
import { Mic, Plus } from "lucide-react"

interface NoteListProps {
  notes: Note[]
  searchQuery: string
  labels: WorkspaceLabel[]
  dateFormat: DateFormat
  onAddNote: () => void
  onEditNote: (note: Note) => void
  onRecordVoice?: () => void
}

export function NoteList({ notes, searchQuery, labels, dateFormat, onAddNote, onEditNote, onRecordVoice }: NoteListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-bold">Notes</h3>
        <div className="flex gap-2">
          {onRecordVoice ? (
            <Button variant="outline" className="mk-touch bg-transparent" onClick={onRecordVoice}>
              <Mic className="h-4 w-4 mr-2" />
              Record
            </Button>
          ) : null}
          <Button className="mk-touch" onClick={onAddNote}>
            <Plus className="h-4 w-4 mr-2" />
            Add note
          </Button>
        </div>
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
              <div className="mt-2">
                <LabelChips labels={labelsForIds(labels, note.labelIds)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(note.createdAt, dateFormat)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

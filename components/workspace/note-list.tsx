"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import type { Note, WorkspaceLabel } from "@/lib/domain/types"
import { displayLabelName, labelsForIds } from "@/lib/labels/book"
import { labelColor, labelColorDotClass } from "@/lib/labels/palette"
import { askNotes } from "@/lib/notes/ask"
import { notesWithLabel, sortNotesForDisplay } from "@/lib/notes/organize"
import { LabelChips } from "@/components/label-chips"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatTimestamp } from "@/lib/dates/due-date"
import { cn } from "@/lib/utils"
import { Mic, Pin, Plus, Search } from "lucide-react"

interface NoteListProps {
  notes: Note[]
  searchQuery: string
  labels: WorkspaceLabel[]
  dateFormat: DateFormat
  onAddNote: () => void
  onEditNote: (note: Note) => void
  onRecordVoice?: () => void
  onTogglePin: (noteId: number) => void
  onCycleLabelColor: (labelId: number) => void
}

export function NoteList({
  notes,
  searchQuery,
  labels,
  dateFormat,
  onAddNote,
  onEditNote,
  onRecordVoice,
  onTogglePin,
  onCycleLabelColor,
}: NoteListProps) {
  const [activeLabelId, setActiveLabelId] = useState<number | null>(null)
  const [question, setQuestion] = useState("")

  const usedLabels = useMemo(() => {
    const usedIds = new Set(notes.flatMap((note) => note.labelIds ?? []))
    return labels.filter((label) => usedIds.has(label.id))
  }, [notes, labels])

  const visibleNotes = sortNotesForDisplay(notesWithLabel(notes, activeLabelId))
  const answers = askNotes(question, notes)

  return (
    <div className="space-y-4">
      <div className="mk-section-toolbar">
        <div className="mk-section-toolbar-actions">
          {onRecordVoice ? (
            <Button variant="outline" className="mk-touch bg-transparent" onClick={onRecordVoice} aria-label="Record">
              <Mic className="h-4 w-4 min-[375px]:mr-2" />
              <span className="hidden min-[375px]:inline">Record</span>
            </Button>
          ) : null}
          <Button className="mk-touch" onClick={onAddNote} aria-label="Add note">
            <Plus className="h-4 w-4 min-[375px]:mr-2" />
            <span className="hidden min-[375px]:inline">Add note</span>
          </Button>
        </div>
      </div>

      <div className="modern-card p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h4 className="font-semibold">Ask my notes</h4>
        </div>
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. wifi password, rent due date..."
          className="mt-3 rounded-xl bg-card/95"
          aria-label="Ask my notes"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Keyword search across your notes, on this device only. No AI, nothing leaves your phone.
        </p>
        {question.trim() ? (
          answers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No notes match those words.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {answers.map((answer) => (
                <button
                  key={answer.note.id}
                  type="button"
                  className="block min-h-11 w-full rounded-xl border border-border/50 bg-accent/10 p-3 text-left"
                  onClick={() => onEditNote(answer.note)}
                >
                  <p className="truncate text-sm font-medium">{answer.note.title}</p>
                  {answer.snippet ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{answer.snippet}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )
        ) : null}
      </div>

      {usedLabels.length > 0 ? (
        <div className="mk-filter-rail" role="group" aria-label="Filter notes by label">
          <Button
            type="button"
            size="sm"
            variant={activeLabelId === null ? "default" : "outline"}
            className={activeLabelId === null ? "rounded-full" : "rounded-full bg-transparent"}
            onClick={() => setActiveLabelId(null)}
            aria-pressed={activeLabelId === null}
          >
            All
          </Button>
          {usedLabels.map((label) => (
            <span key={label.id} className="mk-label-filter">
              <button
                type="button"
                className="mk-chip-action rounded-full border border-border/50"
                onClick={() => onCycleLabelColor(label.id)}
                aria-label={`Change color of ${displayLabelName(label)}`}
                title="Tap to change color"
              >
                <span className={cn("h-3 w-3 rounded-full", labelColorDotClass(labelColor(label)))} />
              </button>
              <Button
                type="button"
                size="sm"
                variant={activeLabelId === label.id ? "default" : "outline"}
                className={activeLabelId === label.id ? "rounded-full" : "rounded-full bg-transparent"}
                onClick={() => setActiveLabelId((current) => (current === label.id ? null : label.id))}
                aria-pressed={activeLabelId === label.id}
              >
                {displayLabelName(label)}
              </Button>
            </span>
          ))}
        </div>
      ) : null}

      {visibleNotes.length === 0 ? (
        <EmptyState
          title={searchQuery || activeLabelId !== null ? "No matching notes" : "No notes yet"}
          description={
            searchQuery
              ? "Nothing matches that search."
              : activeLabelId !== null
                ? "No notes carry this label."
                : "Capture a thought. It is saved locally."
          }
          actionLabel={searchQuery || activeLabelId !== null ? undefined : "Add note"}
          onAction={searchQuery || activeLabelId !== null ? undefined : onAddNote}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleNotes.map((note) => (
            <div key={note.id} className="mk-editorial-card cursor-pointer p-4" onClick={() => onEditNote(note)}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="min-w-0 flex-1 truncate font-semibold">{note.title}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    onTogglePin(note.id)
                  }}
                  aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                  aria-pressed={Boolean(note.pinned)}
                >
                  <Pin
                    className={cn("h-4 w-4", note.pinned ? "fill-primary text-primary" : "text-muted-foreground")}
                  />
                </Button>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{note.content}</p>
              <div className="mt-2">
                <LabelChips labels={labelsForIds(labels, note.labelIds)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(note.createdAt, dateFormat)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

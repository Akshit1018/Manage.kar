"use client"

import { useEffect, useState } from "react"
import { Trash2, FileText, Volume2, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { MobileSheet } from "@/components/mobile-sheet"
import { VoiceAudio } from "@/components/voice-audio"
import { VoiceRecorder, type VoiceRecordingResult } from "@/components/voice-recorder"
import type { Note } from "@/lib/domain/types"

export interface NoteSaveExtras {
  voiceBlob?: Blob
  voiceTranscription?: string
  voiceDuration?: number
}

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<Note, "id" | "createdAt"> | Note, extras?: NoteSaveExtras) => void
  onDelete?: (noteId: number) => void
  note?: Note
  mode: "create" | "edit"
}

export function NoteModal({ isOpen, onClose, onSave, onDelete, note, mode }: NoteModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const [titleError, setTitleError] = useState("")
  const [pendingVoice, setPendingVoice] = useState<VoiceRecordingResult | null>(null)
  const [pendingVoiceUrl, setPendingVoiceUrl] = useState<string | null>(null)
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (note && mode === "edit") {
      setFormData({
        title: note.title,
        content: note.content,
      })
    } else {
      setFormData({
        title: "",
        content: "",
      })
    }
    setTitleError("")
    setPendingVoice(null)
    setRecorderOpen(false)
    setConfirmDelete(false)
  }, [note, mode, isOpen])

  useEffect(() => {
    if (!pendingVoice) {
      setPendingVoiceUrl(null)
      return
    }
    const url = URL.createObjectURL(pendingVoice.blob)
    setPendingVoiceUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingVoice])

  const handleSave = () => {
    const title = formData.title.trim()
    if (!title) {
      setTitleError("Add a title before saving.")
      return
    }

    const extras = pendingVoice
      ? {
          voiceBlob: pendingVoice.blob,
          voiceTranscription: pendingVoice.transcription,
          voiceDuration: pendingVoice.duration,
        }
      : undefined
    const payload = { ...formData, title }
    if (mode === "edit" && note) {
      onSave({ ...note, ...payload }, extras)
    } else {
      onSave(payload, extras)
    }
    onClose()
  }

  const handleDelete = () => {
    if (!note || !onDelete) {
      return
    }
    setConfirmDelete(true)
  }

  const confirmDeleteNote = () => {
    if (!note || !onDelete) {
      return
    }
    onDelete(note.id)
    setConfirmDelete(false)
    onClose()
  }

  const handlePlayAudio = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(formData.content)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const handleRecorded = (result: VoiceRecordingResult) => {
    setPendingVoice(result)
    setFormData((current) => ({
      title: current.title || result.transcription.slice(0, 40),
      content: current.content || result.transcription,
    }))
    setRecorderOpen(false)
  }

  return (
    <>
      <MobileSheet
        open={isOpen}
        onClose={onClose}
        title={mode === "create" ? "Create note" : "Edit note"}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            {mode === "edit" && onDelete ? (
              <Button variant="destructive" onClick={handleDelete} className="mk-touch rounded-xl">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete note
              </Button>
            ) : null}
            <div className="flex-1" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" onClick={onClose} className="mk-touch rounded-xl bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSave} className="mk-touch rounded-xl bg-green-500 hover:bg-green-600 text-white">
                {mode === "create" ? "Create note" : "Save changes"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {note?.voiceNote || pendingVoice ? "Voice note included" : "Typed or spoken. Saved on this phone."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-title">Note title</Label>
            <Input
              id="note-title"
              value={formData.title}
              onChange={(event) => {
                setFormData({ ...formData, title: event.target.value })
                if (titleError) {
                  setTitleError("")
                }
              }}
              placeholder="Enter note title..."
              className="mk-touch rounded-xl"
              aria-invalid={Boolean(titleError)}
            />
            {titleError ? <p className="text-sm text-destructive">{titleError}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="note-content">Content</Label>
              {formData.content ? (
                <Button variant="ghost" size="sm" onClick={handlePlayAudio} className="mk-touch">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Listen
                </Button>
              ) : null}
            </div>
            <Textarea
              id="note-content"
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
              placeholder="Write your note here..."
              className="min-h-[160px] rounded-xl resize-none"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="mk-touch w-full rounded-xl bg-transparent"
            onClick={() => setRecorderOpen(true)}
          >
            <Mic className="h-4 w-4 mr-2" />
            {pendingVoice || note?.voiceNote ? "Replace voice note" : "Record a voice note"}
          </Button>

          {pendingVoice ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">New recording · {pendingVoice.duration}s</span>
              </div>
              {pendingVoiceUrl ? <audio className="mb-2 w-full" controls src={pendingVoiceUrl} /> : null}
              <p className="text-sm text-muted-foreground">{pendingVoice.transcription}</p>
            </div>
          ) : note?.voiceNote ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Voice note</span>
                <span className="text-xs text-muted-foreground">{note.voiceNote.duration}s</span>
              </div>
              {note.voiceNote.audioUrl ? <VoiceAudio audioUrl={note.voiceNote.audioUrl} /> : null}
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Transcription:</span> {note.voiceNote.transcription}
              </p>
            </div>
          ) : null}

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formData.content.length} characters</span>
            {formData.content.length > 1000 ? <span>Long note</span> : null}
          </div>
        </div>
      </MobileSheet>
      <VoiceRecorder open={recorderOpen} onClose={() => setRecorderOpen(false)} onSave={handleRecorded} />
      <ConfirmSheet
        request={
          confirmDelete
            ? {
                title: "Delete this note?",
                message: "You can undo from the toast for a few seconds.",
                confirmLabel: "Delete",
                tone: "danger",
              }
            : null
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={confirmDeleteNote}
      />
    </>
  )
}

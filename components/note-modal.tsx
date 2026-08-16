"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Trash2, FileText, Volume2 } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  voiceNote?: {
    audioUrl: string
    transcription: string
    duration: number
  }
}

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<Note, "id" | "createdAt"> | Note) => void
  onDelete?: (noteId: number) => void
  note?: Note
  mode: "create" | "edit"
}

export function NoteModal({ isOpen, onClose, onSave, onDelete, note, mode }: NoteModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

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
  }, [note, mode, isOpen])

  const handleSave = () => {
    if (!formData.title.trim()) return

    if (mode === "edit" && note) {
      onSave({ ...note, ...formData })
    } else {
      onSave(formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (note && onDelete) {
      onDelete(note.id)
      onClose()
    }
  }

  const handlePlayAudio = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(formData.content)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-mobile bg-black/50 backdrop-blur-sm">
      <div className="modal-content-mobile bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-t-3xl sm:rounded-3xl max-w-2xl mx-auto overflow-hidden">
        <div className="responsive-container">
          <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="responsive-text-xl font-semibold text-readable font-sans">
                  {mode === "create" ? "Create New Note" : "Edit Note"}
                </h2>
                {note?.voiceNote && (
                  <p className="responsive-text-xs text-muted-readable flex items-center gap-1 mt-1">
                    <Volume2 className="h-3 w-3" />
                    Voice note included
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-accent/50 mobile-touch-target"
            >
              <X className="h-5 w-5 text-readable" />
            </Button>
          </div>

          <div className="space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="note-title" className="responsive-text-sm font-medium text-readable">
                Note Title
              </Label>
              <Input
                id="note-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter note title..."
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable placeholder:text-muted-readable mobile-touch-target"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="note-content" className="responsive-text-sm font-medium text-readable">
                  Content
                </Label>
                {formData.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayAudio}
                    className="responsive-text-xs text-muted-readable hover:text-readable responsive-button"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Listen
                  </Button>
                )}
              </div>
              <Textarea
                id="note-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note here..."
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] resize-none text-readable placeholder:text-muted-readable mobile-touch-target"
              />
            </div>

            {note?.voiceNote && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="responsive-text-sm font-medium text-readable">Voice Note</span>
                  <span className="responsive-text-xs text-muted-readable">{note.voiceNote.duration}s</span>
                </div>
                {note.voiceNote.audioUrl && (
                  <audio controls className="w-full mb-3 rounded-lg">
                    <source src={note.voiceNote.audioUrl} type="audio/webm" />
                    <source src={note.voiceNote.audioUrl} type="audio/mp4" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                <p className="responsive-text-sm text-muted-readable">
                  <span className="font-medium">Transcription:</span> {note.voiceNote.transcription}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center responsive-text-xs border-t border-border/50 pt-3">
              <span className="text-muted-readable">{formData.content.length} characters</span>
              {formData.content.length > 1000 && <span className="text-primary font-medium">Long note</span>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 pt-4 border-t border-border/50">
            {mode === "edit" && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-xl order-last sm:order-first responsive-button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Note
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 text-readable hover:bg-accent/50 responsive-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="rounded-xl bg-green-500 hover:bg-green-600 text-white responsive-button"
              >
                {mode === "create" ? "Create Note" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

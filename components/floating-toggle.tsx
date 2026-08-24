"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  X,
  CheckSquare,
  FileText,
  Circle,
  CheckCircle2,
  Calendar,
  Clock,
  Edit,
  Mic,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Note, Task } from "@/lib/domain/types"
import { MobileSheet } from "@/components/mobile-sheet"
import { VoiceRecorder } from "@/components/voice-recorder"

interface FloatingToggleProps {
  tasks?: Task[]
  notes?: Note[]
  onTaskToggle?: (taskId: number) => void
  onAddTask?: () => void
  onAddNote?: () => void
  onEditTask?: (task: Task) => void
  onEditNote?: (note: Note) => void
  onVoiceNote?: (audioBlob: Blob, transcription: string, duration?: number) => void
  onSpeechToText?: (text: string) => void
  onCreateTaskFromVoice?: (text: string) => void
  onStartFocus?: () => void
}

export function FloatingToggle({
  tasks = [],
  notes = [],
  onTaskToggle,
  onAddTask,
  onAddNote,
  onEditTask,
  onEditNote,
  onVoiceNote,
  onCreateTaskFromVoice,
  onStartFocus,
}: FloatingToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks")
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const longPressTimer = useRef<number | null>(null)
  const movedRef = useRef(false)
  const recorderRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("floating-toggle-position")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number }
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(parsed)
        }
      } catch {
        setPosition(null)
      }
    }
  }, [])

  useEffect(() => {
    if (position) {
      localStorage.setItem("floating-toggle-position", JSON.stringify(position))
    }
  }, [position])

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setHasMoved(false)
    movedRef.current = false
    recorderRef.current = false
    const origin = position ?? { x: clientX - 28, y: clientY - 28 }
    setDragStart({ x: clientX - origin.x, y: clientY - origin.y })
    longPressTimer.current = window.setTimeout(() => {
      if (!movedRef.current) {
        recorderRef.current = true
        setRecorderOpen(true)
      }
    }, 450)
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) {
      return
    }
    setHasMoved(true)
    movedRef.current = true
    clearLongPress()
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - 64, clientX - dragStart.x)),
      y: Math.max(8, Math.min(window.innerHeight - 64, clientY - dragStart.y)),
    })
  }

  const handleEnd = () => {
    clearLongPress()
    setIsDragging(false)
    setHasMoved(false)
  }

  useEffect(() => {
    if (!isDragging) {
      return
    }
    const onMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY)
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) {
        handleMove(touch.clientX, touch.clientY)
      }
    }
    const end = () => handleEnd()
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", end)
    document.addEventListener("touchmove", onTouchMove, { passive: false })
    document.addEventListener("touchend", end)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", end)
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", end)
    }
  }, [isDragging, dragStart, hasMoved, recorderOpen])

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <>
      <Button
        ref={buttonRef}
        size="icon"
        aria-label="Add task, note, or voice"
        onClick={() => {
          if (movedRef.current || recorderRef.current) {
            return
          }
          setIsOpen((value) => !value)
        }}
        onMouseDown={(event) => {
          handleStart(event.clientX, event.clientY)
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0]
          if (touch) {
            handleStart(touch.clientX, touch.clientY)
          }
        }}
        className={cn(
          "floating-button mk-touch fixed z-[70] h-14 w-14 rounded-full border-2 shadow-lg",
          isOpen || recorderOpen ? "bg-primary text-primary-foreground" : "bg-primary/90 text-primary-foreground",
        )}
        style={
          position
            ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
            : {
                right: "1rem",
                bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
              }
        }
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>

      <MobileSheet open={isOpen && !recorderOpen} onClose={() => setIsOpen(false)} title="Quick add">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button className="mk-touch rounded-xl" onClick={() => { setIsOpen(false); onAddTask?.() }}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Task
            </Button>
            <Button variant="outline" className="mk-touch rounded-xl bg-transparent" onClick={() => { setIsOpen(false); onAddNote?.() }}>
              <FileText className="h-4 w-4 mr-2" />
              Note
            </Button>
            <Button variant="outline" className="mk-touch rounded-xl bg-transparent" onClick={() => { setIsOpen(false); setRecorderOpen(true) }}>
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </Button>
            <Button variant="outline" className="mk-touch rounded-xl bg-transparent" onClick={() => { setIsOpen(false); onStartFocus?.() }}>
              <Clock className="h-4 w-4 mr-2" />
              Focus
            </Button>
          </div>

          <div className="grid grid-cols-2 rounded-xl border">
            <button
              type="button"
              className={cn("mk-touch rounded-l-xl text-sm", activeTab === "tasks" && "bg-primary/10 text-primary")}
              onClick={() => setActiveTab("tasks")}
            >
              Tasks ({pendingTasks.length})
            </button>
            <button
              type="button"
              className={cn("mk-touch rounded-r-xl text-sm", activeTab === "notes" && "bg-primary/10 text-primary")}
              onClick={() => setActiveTab("notes")}
            >
              Notes ({notes.length})
            </button>
          </div>

          {activeTab === "tasks" ? (
            <div className="space-y-2">
              {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : null}
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mk-touch rounded-full"
                    onClick={() => onTaskToggle?.(task.id)}
                    aria-label={`Complete ${task.title}`}
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                  {onEditTask ? (
                    <Button variant="ghost" size="icon" className="mk-touch" onClick={() => onEditTask(task)} aria-label={`Edit ${task.title}`}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {completedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl p-3 opacity-60">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="truncate text-sm line-through">{task.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet. Record from the bowl.</p> : null}
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="w-full rounded-xl border p-3 text-left"
                  onClick={() => onEditNote?.(note)}
                >
                  <p className="truncate text-sm font-medium">
                    {note.title}
                    {note.voiceNote ? <Volume2 className="ml-2 inline h-3 w-3 text-blue-500" /> : null}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </MobileSheet>

      <VoiceRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onSave={(result) => {
          onVoiceNote?.(result.blob, result.transcription, result.duration)
        }}
        onSaveAsTask={(text) => onCreateTaskFromVoice?.(text)}
      />
    </>
  )
}

export default FloatingToggle

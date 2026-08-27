"use client"

import { useEffect, useRef, useState } from "react"
import { CheckSquare, Clock, FileText, Mic, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "@/components/voice-recorder"
import { cn } from "@/lib/utils"
import {
  ICON_BAR_MS,
  LONG_PRESS_MS,
  clampOrbPosition,
  defaultOrbPosition,
  iconBarPosition,
  movementExceeded,
  orbReleaseAction,
} from "@/lib/ui/orb-gesture"

interface FloatingToggleProps {
  onAddTask?: () => void
  onAddNote?: () => void
  onVoiceNote?: (audioBlob: Blob, transcription: string, duration?: number) => void
  onCreateTaskFromVoice?: (text: string) => void
  onStartFocus?: () => void
}

export function FloatingToggle({
  onAddTask,
  onAddNote,
  onVoiceNote,
  onCreateTaskFromVoice,
  onStartFocus,
}: FloatingToggleProps) {
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const [showIconBar, setShowIconBar] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const longPressFiredRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("floating-toggle-position")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number }
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(
            clampOrbPosition(parsed.x, parsed.y, {
              width: window.innerWidth,
              height: window.innerHeight,
            }),
          )
          return
        }
      } catch {
        // Fall through to the default corner.
      }
    }
    setPosition(defaultOrbPosition({ width: window.innerWidth, height: window.innerHeight }))
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

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const revealIconBar = () => {
    setShowIconBar(true)
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => {
      setShowIconBar(false)
    }, ICON_BAR_MS)
  }

  const hideIconBarSoon = () => {
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => {
      setShowIconBar(false)
    }, 1000)
  }

  const resolvePosition = () => {
    if (position) {
      return position
    }
    return defaultOrbPosition({ width: window.innerWidth, height: window.innerHeight })
  }

  const handleStart = (clientX: number, clientY: number) => {
    const origin = resolvePosition()
    originRef.current = origin
    if (!position) {
      setPosition(origin)
    }
    setIsDragging(true)
    movedRef.current = false
    longPressFiredRef.current = false
    dragStartRef.current = { x: clientX - origin.x, y: clientY - origin.y }
    longPressTimer.current = window.setTimeout(() => {
      if (!movedRef.current) {
        longPressFiredRef.current = true
        setShowIconBar(false)
        setArmed(true)
      }
    }, LONG_PRESS_MS)
  }

  const handleMove = (clientX: number, clientY: number) => {
    const next = {
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    }
    if (!movedRef.current && !movementExceeded(next.x - originRef.current.x, next.y - originRef.current.y)) {
      return
    }
    movedRef.current = true
    clearLongPress()
    setPosition(
      clampOrbPosition(next.x, next.y, {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    )
  }

  const handleEnd = () => {
    clearLongPress()
    setIsDragging(false)
    const action = orbReleaseAction({
      moved: movedRef.current,
      longPressFired: longPressFiredRef.current,
    })
    setArmed(false)
    switch (action) {
      case "show-icons":
        revealIconBar()
        break
      case "record":
        setShowIconBar(false)
        setRecorderOpen(true)
        break
      case "ignore":
        break
      default: {
        const _exhaustive: never = action
        throw new Error(`Unhandled orb release: ${_exhaustive}`)
      }
    }
  }

  useEffect(() => {
    if (!isDragging) {
      return
    }
    const onMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY)
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) {
        event.preventDefault()
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
  }, [isDragging])

  useEffect(() => {
    return () => {
      clearLongPress()
      clearHideTimer()
    }
  }, [])

  const pick = (action?: () => void) => {
    setShowIconBar(false)
    clearHideTimer()
    action?.()
  }

  const icons = position && showIconBar && !recorderOpen ? iconBarPosition(position) : null

  return (
    <>
      {icons ? (
        <div
          className="fixed z-[80] flex items-center gap-2 rounded-full border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-xl"
          style={{ left: icons.x, top: icons.y }}
          onMouseEnter={clearHideTimer}
          onMouseLeave={hideIconBarSoon}
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-primary/20"
            onClick={() => pick(onAddTask)}
            title="Quick Task"
            aria-label="Add task"
          >
            <CheckSquare className="h-4 w-4 text-primary" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-green-500/20"
            onClick={() => pick(onAddNote)}
            title="Quick Note"
            aria-label="Add note"
          >
            <FileText className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-orange-500/20"
            onClick={() => pick(onStartFocus)}
            title="Focus"
            aria-label="Open focus timer"
          >
            <Clock className="h-4 w-4 text-orange-500" />
          </Button>
        </div>
      ) : null}

      <Button
        ref={buttonRef}
        size="icon"
        aria-label="Add task, note, or voice"
        onClick={(event) => {
          event.preventDefault()
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
        onContextMenu={(event) => event.preventDefault()}
        onMouseEnter={() => {
          if (!recorderOpen) {
            revealIconBar()
          }
        }}
        onMouseLeave={hideIconBarSoon}
        className={cn(
          "mk-touch fixed z-[80] h-14 w-14 cursor-move rounded-full border-2 shadow-lg select-none",
          "bg-primary/20 text-primary-foreground backdrop-blur-md border-primary/20",
          "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
          isDragging || showIconBar ? "scale-105 bg-primary/80 border-primary/30" : "",
          armed || recorderOpen ? "scale-110 animate-pulse bg-red-500/95 border-red-400/50 text-white" : "",
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
        {armed || recorderOpen ? <Mic className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>

      <VoiceRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        autoStart
        onSave={(result) => {
          onVoiceNote?.(result.blob, result.transcription, result.duration)
        }}
        onSaveAsTask={(text) => onCreateTaskFromVoice?.(text)}
      />
    </>
  )
}

export default FloatingToggle

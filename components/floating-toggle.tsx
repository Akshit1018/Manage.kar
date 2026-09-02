"use client"

import { useEffect, useRef, useState } from "react"
import { CheckSquare, FileText, Mic, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "@/components/voice-recorder"
import { cn } from "@/lib/utils"
import { dispatchComposerOpen } from "@/lib/dialer/dialer"
import {
  ICON_BAR_MS,
  ICON_BAR_WIDTH,
  LONG_PRESS_MS,
  applyOrbKeyboardIntent,
  orbSizeForStage,
  attachOrbPointerFallback,
  clampOrbPosition,
  defaultOrbPosition,
  iconBarPosition,
  movementExceeded,
  orbGestureOutcome,
  orbHoverOpensTray,
  orbKeyboardIntent,
  orbLostPointerPolicy,
  orbPlacementTransitionMs,
  orbViewportBounds,
  parseResolvedLengthPx,
  parseSavedOrbPosition,
  readChromeReservePx,
  resolveCustomPropertyPx,
  resolveOrbPlacement,
  resolveSafeAreaInsets,
  snapOrbToEdge,
  type OrbStage,
} from "@/lib/ui/orb-gesture"

const POSITION_KEY = "floating-toggle-position"

interface FloatingToggleProps {
  onAddTask?: () => void
  onAddNote?: () => void
  onVoiceNote?: (audioBlob: Blob, transcription: string, duration?: number) => void
  onCreateTaskFromVoice?: (text: string) => void
  suppressed?: boolean
  stage?: OrbStage
}

function resolveRootChromePx() {
  const root = document.documentElement
  const measured = resolveCustomPropertyPx(root, (tag) => document.createElement(tag), "--mk-bottom-chrome")
  if (measured > 0) {
    return measured
  }
  return parseResolvedLengthPx(getComputedStyle(root).getPropertyValue("--mk-bottom-chrome"))
}

function readChromeReserve() {
  const probe = document.querySelector("[data-mk-bottom-chrome]")
  const probeHeight = probe instanceof HTMLElement ? probe.getBoundingClientRect().height : 0
  const computedChromePx = probeHeight > 0 ? 0 : resolveRootChromePx()
  return readChromeReservePx({ probeHeight, computedChromePx })
}

function readCssInsetPx(property: string, axis: "width" | "height") {
  const root = document.documentElement
  const measured = resolveCustomPropertyPx(root, (tag) => document.createElement(tag), property, axis)
  if (measured > 0) {
    return measured
  }
  return parseResolvedLengthPx(getComputedStyle(root).getPropertyValue(property))
}

function readSafeAreaInsets() {
  return resolveSafeAreaInsets({
    top: readCssInsetPx("--mk-safe-top", "height"),
    right: readCssInsetPx("--mk-safe-right", "width"),
    left: readCssInsetPx("--mk-safe-left", "width"),
  })
}

function readBounds() {
  const visual = window.visualViewport
  const safe = readSafeAreaInsets()
  return orbViewportBounds({
    width: window.innerWidth,
    height: window.innerHeight,
    visualHeight: visual?.height,
    visualOffsetTop: visual?.offsetTop,
    chromeReserve: readChromeReserve(),
    topInset: safe.top,
    leftInset: safe.left,
    rightInset: safe.right,
  })
}

function readStageRect() {
  const stage = document.querySelector("[data-mk-home-stage]")
  if (!(stage instanceof HTMLElement)) {
    return null
  }
  const rect = stage.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

function persistPosition(position: { x: number; y: number }) {
  localStorage.setItem(POSITION_KEY, JSON.stringify(position))
}

function samePoint(
  a: { x: number; y: number } | null,
  b: { x: number; y: number },
): boolean {
  return a != null && a.x === b.x && a.y === b.y
}

export function FloatingToggle({
  onAddTask,
  onAddNote,
  onVoiceNote,
  onCreateTaskFromVoice,
  suppressed = false,
  stage = "edge",
}: FloatingToggleProps) {
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const [showIconBar, setShowIconBar] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const longPressFiredRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)
  const focusTrayAfterReveal = useRef(false)
  const activePointerRef = useRef<number | null>(null)
  const gestureEndedRef = useRef(true)
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null)
  const latestPosRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const fallbackDetachRef = useRef<(() => void) | null>(null)
  const finishGestureRef = useRef<(cancelled: boolean) => void>(() => {})
  const handleMoveRef = useRef<(clientX: number, clientY: number) => void>(() => {})
  const positionRef = useRef(position)
  positionRef.current = position

  const detachPointerFallback = () => {
    fallbackDetachRef.current?.()
    fallbackDetachRef.current = null
  }

  useEffect(() => {
    const syncPlacement = (reason: "hydrate" | "viewport") => {
      const bounds = readBounds()
      const saved = parseSavedOrbPosition(localStorage.getItem(POSITION_KEY))
      const planned = resolveOrbPlacement({
        prev: positionRef.current,
        saved,
        bounds,
        reason,
        stage,
        size: orbSizeForStage(stage),
        stageRect: readStageRect(),
      })
      if (planned.persist) {
        persistPosition(planned.next)
      }
      latestPosRef.current = planned.next
      setPosition((prev) => {
        const next = resolveOrbPlacement({
          prev,
          saved,
          bounds,
          reason,
          stage,
          size: orbSizeForStage(stage),
          stageRect: readStageRect(),
        }).next
        latestPosRef.current = next
        return samePoint(prev, next) ? prev : next
      })
    }

    syncPlacement("hydrate")

    const onViewport = () => syncPlacement("viewport")
    window.addEventListener("resize", onViewport)
    window.addEventListener("orientationchange", onViewport)
    window.visualViewport?.addEventListener("resize", onViewport)
    window.visualViewport?.addEventListener("scroll", onViewport)
    return () => {
      window.removeEventListener("resize", onViewport)
      window.removeEventListener("orientationchange", onViewport)
      window.visualViewport?.removeEventListener("resize", onViewport)
      window.visualViewport?.removeEventListener("scroll", onViewport)
    }
  }, [stage])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

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

  const flushRaf = () => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
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
    if (latestPosRef.current) {
      return latestPosRef.current
    }
    if (positionRef.current) {
      return positionRef.current
    }
    return defaultOrbPosition(readBounds())
  }

  const schedulePosition = (next: { x: number; y: number }) => {
    pendingPosRef.current = next
    latestPosRef.current = next
    if (rafRef.current != null) {
      return
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const pending = pendingPosRef.current
      if (pending) {
        setPosition(pending)
      }
    })
  }

  const handleStart = (clientX: number, clientY: number) => {
    const origin = resolvePosition()
    originRef.current = origin
    latestPosRef.current = origin
    if (!positionRef.current) {
      setPosition(origin)
    }
    setIsDragging(true)
    movedRef.current = false
    longPressFiredRef.current = false
    gestureEndedRef.current = false
    pendingPosRef.current = null
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
    setShowIconBar(false)
    setArmed(false)
    schedulePosition(clampOrbPosition(next.x, next.y, readBounds(), orbSizeForStage(stage)))
  }

  const finishGesture = (cancelled: boolean) => {
    detachPointerFallback()
    if (gestureEndedRef.current) {
      return
    }
    gestureEndedRef.current = true
    activePointerRef.current = null
    clearLongPress()
    flushRaf()
    setIsDragging(false)

    const live = pendingPosRef.current ?? latestPosRef.current ?? resolvePosition()
    pendingPosRef.current = null
    const outcome = orbGestureOutcome({
      moved: movedRef.current,
      longPressFired: longPressFiredRef.current,
      cancelled,
    })
    setArmed(false)

    switch (outcome) {
      case "show-icons":
        revealIconBar()
        break
      case "record":
        setShowIconBar(false)
        setRecorderOpen(true)
        break
      case "snap": {
        const bounds = readBounds()
        const size = orbSizeForStage(stage)
        const parked =
          stage === "home"
            ? resolveOrbPlacement({
                prev: live,
                saved: parseSavedOrbPosition(localStorage.getItem(POSITION_KEY)),
                bounds,
                reason: "viewport",
                stage,
                size,
                stageRect: readStageRect(),
              })
            : { next: snapOrbToEdge(live, bounds, size), persist: true }
        latestPosRef.current = parked.next
        setPosition(parked.next)
        if (parked.persist) {
          persistPosition(parked.next)
        }
        break
      }
      case "idle":
        setShowIconBar(false)
        break
      default: {
        const _exhaustive: never = outcome
        throw new Error(`Unhandled orb outcome: ${_exhaustive}`)
      }
    }
  }

  handleMoveRef.current = handleMove
  finishGestureRef.current = finishGesture

  useEffect(() => {
    if (suppressed && !recorderOpen && !gestureEndedRef.current) {
      finishGestureRef.current(true)
    }
  }, [suppressed, recorderOpen])

  useEffect(() => {
    if (!showIconBar || !focusTrayAfterReveal.current) {
      return
    }
    focusTrayAfterReveal.current = false
    trayRef.current?.querySelector("button")?.focus()
  }, [showIconBar])

  useEffect(() => {
    return () => {
      detachPointerFallback()
      clearLongPress()
      clearHideTimer()
      flushRaf()
    }
  }, [])

  const pick = (action?: () => void) => {
    setShowIconBar(false)
    clearHideTimer()
    action?.()
  }

  const diskSize = orbSizeForStage(stage)
  const icons =
    position && showIconBar && !recorderOpen && !suppressed
      ? iconBarPosition(position, readBounds(), ICON_BAR_WIDTH, diskSize)
      : null

  if (suppressed && !recorderOpen) {
    return null
  }

  const snapMs = orbPlacementTransitionMs(reducedMotion)

  return (
    <>
      {icons ? (
        <div
          ref={trayRef}
          className="fixed z-[80] flex items-center gap-2 rounded-lg border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-xl"
          style={{ left: icons.x, top: icons.y }}
          onMouseEnter={clearHideTimer}
          onMouseLeave={hideIconBarSoon}
        >
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-red-500/20"
            onClick={() => pick(() => setRecorderOpen(true))}
            title="Record"
            aria-label="Record voice note"
          >
            <Mic className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-primary/20"
            onClick={() => pick(onAddTask)}
            title="Quick Task"
            aria-label="Add task"
          >
            <CheckSquare className="h-4 w-4 text-primary" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-green-500/20"
            onClick={() => pick(onAddNote)}
            title="Quick Note"
            aria-label="Add note"
          >
            <FileText className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-primary/20"
            onClick={() => pick(() => dispatchComposerOpen({ openTab: true }))}
            title="Chats"
            aria-label="Open chats"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
          </Button>
        </div>
      ) : null}

      <Button
        ref={buttonRef}
        size="icon"
        aria-label="Record, add a task or note, or open chats"
        aria-expanded={showIconBar}
        aria-haspopup="true"
        onClick={(event) => {
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || activePointerRef.current !== null) {
            return
          }
          let captured = false
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
            captured = event.currentTarget.hasPointerCapture(event.pointerId)
          } catch {
            captured = false
          }
          activePointerRef.current = event.pointerId
          handleStart(event.clientX, event.clientY)
          if (!captured) {
            detachPointerFallback()
            fallbackDetachRef.current = attachOrbPointerFallback(window, event.pointerId, {
              onMove: (clientX, clientY) => handleMoveRef.current(clientX, clientY),
              onUp: () => finishGestureRef.current(false),
              onCancel: () => finishGestureRef.current(true),
            })
          }
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== activePointerRef.current) {
            return
          }
          handleMove(event.clientX, event.clientY)
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== activePointerRef.current) {
            return
          }
          finishGesture(false)
        }}
        onPointerCancel={(event) => {
          if (event.pointerId !== activePointerRef.current) {
            return
          }
          finishGesture(true)
        }}
        onLostPointerCapture={(event) => {
          if (
            orbLostPointerPolicy({
              activePointerId: activePointerRef.current,
              eventPointerId: event.pointerId,
              gestureEnded: gestureEndedRef.current,
            }) !== "handoff"
          ) {
            return
          }
          detachPointerFallback()
          fallbackDetachRef.current = attachOrbPointerFallback(window, event.pointerId, {
            onMove: (clientX, clientY) => handleMoveRef.current(clientX, clientY),
            onUp: () => finishGestureRef.current(false),
            onCancel: () => finishGestureRef.current(true),
          })
        }}
        onKeyDown={(event) => {
          const intent = orbKeyboardIntent(event.key)
          if (!intent) {
            return
          }
          event.preventDefault()
          if (intent.type === "activate") {
            if (!recorderOpen) {
              focusTrayAfterReveal.current = true
              if (showIconBar) {
                trayRef.current?.querySelector("button")?.focus()
                focusTrayAfterReveal.current = false
              } else {
                revealIconBar()
              }
            }
            return
          }
          const next = applyOrbKeyboardIntent(resolvePosition(), intent, readBounds())
          latestPosRef.current = next
          setPosition(next)
          persistPosition(next)
          setShowIconBar(false)
        }}
        onContextMenu={(event) => event.preventDefault()}
        onMouseEnter={() => {
          const hover = window.matchMedia("(hover: hover)").matches
          const fine = window.matchMedia("(pointer: fine)").matches
          if (!recorderOpen && orbHoverOpensTray({ hoverCapable: hover, finePointer: fine })) {
            revealIconBar()
          }
        }}
        onMouseLeave={() => {
          const hover = window.matchMedia("(hover: hover)").matches
          const fine = window.matchMedia("(pointer: fine)").matches
          if (orbHoverOpensTray({ hoverCapable: hover, finePointer: fine })) {
            hideIconBarSoon()
          }
        }}
        data-mk-ball=""
        data-mk-orb-stage={stage}
        data-armed={armed || recorderOpen ? "true" : "false"}
        className={cn(
          "mk-touch mk-ball fixed z-[80] cursor-move rounded-full overflow-hidden select-none [touch-action:none]",
          isDragging || showIconBar ? "scale-105" : "",
          armed || recorderOpen ? "scale-110 animate-pulse" : "",
          isDragging ? "cursor-grabbing" : "",
        )}
        style={
          position
            ? {
                left: position.x,
                top: position.y,
                width: diskSize,
                height: diskSize,
                right: "auto",
                bottom: "auto",
                touchAction: "none",
                transition: isDragging ? "none" : `left ${snapMs}ms ease, top ${snapMs}ms ease, width ${snapMs}ms ease, height ${snapMs}ms ease`,
              }
            : {
                right: "1rem",
                bottom: "var(--mk-bottom-chrome)",
                width: diskSize,
                height: diskSize,
                touchAction: "none",
              }
        }
      >
        {armed || recorderOpen ? <Mic className="h-6 w-6 text-white" /> : <span className="mk-ball-core" aria-hidden="true" />}
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

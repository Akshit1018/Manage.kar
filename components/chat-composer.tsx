"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Mic, Plus, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  COMPOSER_OPEN_EVENT,
  DIALER_CHANGED_EVENT,
  WHEEL_ITEM_HEIGHT,
  centeredWheelIndex,
  loadDialer,
  persistDialer,
  presenceDotClass,
  presenceLabel,
  queueCopy,
  queueMessage,
  queuedCountFor,
  resolveSession,
  targetTitle,
  visibleSessions,
  wheelItems,
} from "@/lib/dialer/dialer"
import { NEW_CHAT_TARGET, type ComposerOpenDetail, type DialerState } from "@/lib/dialer/types"
import { useVisualViewportInset } from "@/lib/ui/use-visual-viewport"
import { applyComposerExpandedChange } from "@/lib/ui/workspace-sections-layout"

interface ChatComposerProps {
  onVoice?: () => void
  onExpandedChange?: (expanded: boolean) => void
  preferredTarget?: string
}

export function ChatComposer({ onVoice, onExpandedChange, preferredTarget }: ChatComposerProps) {
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [wheelOpen, setWheelOpen] = useState(false)
  const [target, setTarget] = useState<string>(preferredTarget || NEW_CHAT_TARGET)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const scrollSettleTimer = useRef<number | null>(null)
  const sendingRef = useRef(false)
  const onExpandedChangeRef = useRef(onExpandedChange)
  onExpandedChangeRef.current = onExpandedChange
  useVisualViewportInset(expanded)

  const setExpandedAndNotify = (next: boolean) => {
    applyComposerExpandedChange(next, (value) => onExpandedChangeRef.current?.(value), setExpanded)
  }

  useEffect(() => {
    const reload = () => setDialer(loadDialer(window.localStorage))
    reload()
    const open = (event: Event) => {
      const detail = (event as CustomEvent<ComposerOpenDetail>).detail
      if (detail?.target) {
        setTarget(detail.target)
      }
      setExpandedAndNotify(true)
    }
    window.addEventListener(COMPOSER_OPEN_EVENT, open)
    window.addEventListener(DIALER_CHANGED_EVENT, reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(COMPOSER_OPEN_EVENT, open)
      window.removeEventListener(DIALER_CHANGED_EVENT, reload)
      window.removeEventListener("storage", reload)
    }
  }, [])

  useEffect(() => {
    if (preferredTarget) {
      setTarget(preferredTarget)
    }
  }, [preferredTarget])

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus()
    } else {
      setWheelOpen(false)
    }
  }, [expanded])

  useEffect(() => {
    return () => {
      if (scrollSettleTimer.current) {
        window.clearTimeout(scrollSettleTimer.current)
      }
    }
  }, [])

  const items = useMemo(() => (dialer ? wheelItems(visibleSessions(dialer)) : []), [dialer])
  const selected = items.find((item) => item.id === target) ?? items[0]
  const queuedForTarget = dialer ? queuedCountFor(dialer, target) : 0

  const openWheel = () => {
    setWheelOpen(true)
    // Scroll the current target into the center once the wheel is on screen.
    requestAnimationFrame(() => {
      const index = Math.max(
        0,
        items.findIndex((item) => item.id === target),
      )
      wheelRef.current?.scrollTo({ top: index * WHEEL_ITEM_HEIGHT })
    })
  }

  const onWheelScroll = () => {
    if (scrollSettleTimer.current) {
      window.clearTimeout(scrollSettleTimer.current)
    }
    scrollSettleTimer.current = window.setTimeout(() => {
      const node = wheelRef.current
      if (!node || items.length === 0) {
        return
      }
      const index = centeredWheelIndex(node.scrollTop, WHEEL_ITEM_HEIGHT, items.length)
      setTarget(items[index].id)
    }, 90)
  }

  const pickWheelItem = (id: string) => {
    setTarget(id)
    setWheelOpen(false)
    inputRef.current?.focus()
  }

  const handleSend = () => {
    if (sendingRef.current) {
      return
    }
    const draft = text.trim()
    if (!draft) {
      return
    }
    sendingRef.current = true
    const base = dialer ?? loadDialer(window.localStorage)
    const result = queueMessage(base, target, draft, new Date().toISOString())
    if (!result) {
      sendingRef.current = false
      return
    }
    setText("")
    persistDialer(window.localStorage, result.state)
    setDialer(result.state)
    const session = resolveSession(result.state, target)
    const title = targetTitle(visibleSessions(result.state), target)
    const copy = queueCopy({
      status: result.message.status,
      source: session?.source,
      presence: session?.presence,
    })
    toast(result.message.status === "sent" ? `Sent to ${title}` : `${copy} · ${title}`)
    sendingRef.current = false
  }

  if (!dialer) {
    return null
  }

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Open chat composer"
        onClick={() => setExpandedAndNotify(true)}
        className={cn(
          "mk-touch mk-composer mk-composer-collapsed fixed z-[70] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto select-none",
          "flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2.5",
          "text-sm text-muted-foreground shadow-lg backdrop-blur-xl",
        )}
      >
        <Plus className="h-4 w-4 text-primary" />
        Message an agent
      </button>
    )
  }

  return (
    <div
      className="mk-composer mk-composer-expanded fixed z-[70] sm:inset-x-auto sm:right-auto sm:left-1/2 sm:w-[28rem] sm:max-w-none sm:-translate-x-1/2"
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return
        }
        event.stopPropagation()
        if (wheelOpen) {
          setWheelOpen(false)
          return
        }
        setExpandedAndNotify(false)
      }}
    >
      {wheelOpen ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-xl bg-primary/10"
            />
            <div
              ref={wheelRef}
              role="listbox"
              aria-label="Send to"
              onScroll={onWheelScroll}
              className="max-h-36 snap-y snap-mandatory overflow-y-auto py-12"
              style={{ scrollbarWidth: "none" }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={item.id === target}
                  onClick={() => pickWheelItem(item.id)}
                  className={cn(
                    "flex h-12 w-full snap-center items-center justify-center gap-2 text-sm transition-colors",
                    item.id === target ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.presence ? (
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(item.presence))}
                      title={presenceLabel(item.presence)}
                    />
                  ) : (
                    <Plus className="h-3 w-3 shrink-0 text-primary" />
                  )}
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mk-composer-bar rounded-3xl border border-border/60 bg-card/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Close composer"
          className="mk-touch shrink-0 rounded-full"
          onClick={() => setExpandedAndNotify(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <button
          type="button"
          aria-label={`Send to ${selected?.title ?? "New chat"}`}
          aria-expanded={wheelOpen}
          aria-haspopup="listbox"
          onClick={() => (wheelOpen ? setWheelOpen(false) : openWheel())}
          className="mk-composer-target mk-touch rounded-full bg-secondary px-3 text-xs font-medium"
        >
          {selected?.presence ? (
            <span className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(selected.presence))} />
          ) : (
            <Plus className="h-3 w-3 shrink-0 text-primary" />
          )}
          <span className="truncate">{selected?.title ?? "New chat"}</span>
          {queuedForTarget > 0 ? (
            <span className="rounded-full bg-yellow-400/20 px-1.5 text-[10px] font-semibold text-yellow-600">
              {queuedForTarget}
            </span>
          ) : null}
          {wheelOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronUp className="h-3 w-3 shrink-0" />}
        </button>

        <input
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message…"
          aria-label="Message"
          enterKeyHint="send"
          className="mk-composer-field bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        {text.trim() ? (
          <Button
            size="icon"
            aria-label="Send message"
            className="mk-touch shrink-0 rounded-full"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Record a voice note"
            className="mk-touch shrink-0 rounded-full"
            onClick={onVoice}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Mic, Plus, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  COMPOSER_OPEN_EVENT,
  WHEEL_ITEM_HEIGHT,
  centeredWheelIndex,
  loadDialer,
  presenceDotClass,
  presenceLabel,
  queueMessage,
  queuedCountFor,
  saveDialer,
  targetTitle,
  wheelItems,
} from "@/lib/dialer/dialer"
import { NEW_CHAT_TARGET, type DialerState } from "@/lib/dialer/types"

interface ChatComposerProps {
  onVoice?: () => void
}

export function ChatComposer({ onVoice }: ChatComposerProps) {
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [wheelOpen, setWheelOpen] = useState(false)
  const [target, setTarget] = useState<string>(NEW_CHAT_TARGET)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const scrollSettleTimer = useRef<number | null>(null)

  useEffect(() => {
    setDialer(loadDialer(window.localStorage))
    const open = () => setExpanded(true)
    window.addEventListener(COMPOSER_OPEN_EVENT, open)
    return () => window.removeEventListener(COMPOSER_OPEN_EVENT, open)
  }, [])

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

  const items = useMemo(() => (dialer ? wheelItems(dialer.sessions) : []), [dialer])
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
    if (!dialer) {
      return
    }
    const result = queueMessage(dialer, target, text, new Date().toISOString())
    if (!result) {
      return
    }
    saveDialer(window.localStorage, result.state)
    setDialer(result.state)
    setText("")
    const title = targetTitle(result.state.sessions, target)
    if (result.message.status === "sent") {
      toast.success(`Sent to ${title}`)
    } else {
      toast(`Queued for ${title} — sends when the agent is back online`)
    }
  }

  if (!dialer) {
    return null
  }

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Open chat composer"
        onClick={() => setExpanded(true)}
        className={cn(
          "mk-touch fixed left-1/2 z-[70] -translate-x-1/2 select-none",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6",
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
      className={cn(
        "fixed inset-x-2 z-[70] sm:inset-x-auto sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6",
      )}
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

      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Close composer"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={() => setExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <button
          type="button"
          aria-label={`Send to ${selected?.title ?? "New chat"}`}
          onClick={() => (wheelOpen ? setWheelOpen(false) : openWheel())}
          className="flex max-w-[9rem] shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium"
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
          {wheelOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
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
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        {text.trim() ? (
          <Button
            size="icon"
            aria-label="Send message"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Record voice message"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={onVoice}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

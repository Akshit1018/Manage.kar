"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Cable, MessageCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { PairingSheet } from "@/components/pairing-sheet"
import { cn } from "@/lib/utils"
import {
  DIALER_CHANGED_EVENT,
  chatListItems,
  dispatchComposerOpen,
  loadDialer,
  messagesForTarget,
  presenceDotClass,
  presenceLabel,
  queueCopy,
  targetTitle,
  visibleSessions,
} from "@/lib/dialer/dialer"
import { NEW_CHAT_TARGET, type ChatListItem, type DialerState, type OutboxMessage } from "@/lib/dialer/types"

interface ChatsViewProps {
  sessionId: string
  searchQuery: string
  onOpenSession: (id: string) => void
  onBack: () => void
}

export function ChatsView({ sessionId, searchQuery, onOpenSession, onBack }: ChatsViewProps) {
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [pairingOpen, setPairingOpen] = useState(false)

  useEffect(() => {
    const reload = () => setDialer(loadDialer(window.localStorage))
    reload()
    window.addEventListener(DIALER_CHANGED_EVENT, reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(DIALER_CHANGED_EVENT, reload)
      window.removeEventListener("storage", reload)
    }
  }, [])

  if (!dialer) {
    return null
  }

  if (sessionId) {
    return (
      <ChatThread
        dialer={dialer}
        sessionId={sessionId}
        onBack={onBack}
        onCompose={() => dispatchComposerOpen({ target: sessionId })}
      />
    )
  }

  const items = chatListItems(dialer, searchQuery)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-bold">Chats</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="mk-touch bg-transparent"
            onClick={() => setPairingOpen(true)}
          >
            <Cable className="mr-2 h-4 w-4" />
            Machines
          </Button>
          <Button
            className="mk-touch"
            onClick={() => {
              onOpenSession(NEW_CHAT_TARGET)
              dispatchComposerOpen({ target: NEW_CHAT_TARGET })
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
        </div>
      </div>
      <PairingSheet open={pairingOpen} onClose={() => setPairingOpen(false)} />
      {items.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching chats" : "No chats yet"}
          description={
            searchQuery
              ? "Nothing matches that search."
              : "Messages stay on this device until you pair a Hermes machine."
          }
          actionLabel={searchQuery ? undefined : "New chat"}
          onAction={searchQuery ? undefined : () => onOpenSession(NEW_CHAT_TARGET)}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <ChatRow key={item.id} item={item} onOpen={() => onOpenSession(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChatRow({ item, onOpen }: { item: ChatListItem; onOpen: () => void }) {
  return (
    <Card className="cursor-pointer p-4" onClick={onOpen}>
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {item.id === NEW_CHAT_TARGET ? (
            <Plus className="h-4 w-4 text-primary" />
          ) : (
            <MessageCircle className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.presence ? (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(item.presence))}
                title={presenceLabel(item.presence)}
              />
            ) : null}
            <h4 className="truncate font-semibold">{item.title}</h4>
            {item.source === "demo" ? (
              <span
                aria-label="Demo session"
                className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                Demo
              </span>
            ) : null}
            {item.queuedCount > 0 ? (
              <span className="rounded-full bg-yellow-400/20 px-1.5 text-[10px] font-semibold text-yellow-700">
                {item.queuedCount} queued
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.preview}</p>
        </div>
      </div>
    </Card>
  )
}

function ChatThread({
  dialer,
  sessionId,
  onBack,
  onCompose,
}: {
  dialer: DialerState
  sessionId: string
  onBack: () => void
  onCompose: () => void
}) {
  const sessions = visibleSessions(dialer)
  const title = targetTitle(sessions, sessionId)
  const session = sessions.find((item) => item.id === sessionId)
  const messages = messagesForTarget(dialer, sessionId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="mk-touch" aria-label="Back to chats" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {session?.presence ? (
              <span className={cn("h-2 w-2 rounded-full", presenceDotClass(session.presence))} />
            ) : null}
            <h3 className="truncate text-xl font-bold">{title}</h3>
            {session?.source === "demo" ? (
              <span
                aria-label="Demo session"
                className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                Demo
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {session ? presenceLabel(session.presence) : "Not paired yet"}
          </p>
        </div>
        <Button className="mk-touch" onClick={onCompose}>
          <Plus className="mr-2 h-4 w-4" />
          Message
        </Button>
      </div>
      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="The dialer at the bottom is the quick-fire composer. Messages stay local until this machine is paired."
          actionLabel="Message"
          onAction={onCompose}
        />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <ThreadBubble key={message.id} message={message} source={session?.source} presence={session?.presence} />
          ))}
        </div>
      )}
    </div>
  )
}

function ThreadBubble({
  message,
  source,
  presence,
}: {
  message: OutboxMessage
  source?: "demo" | "paired"
  presence?: "active" | "idle" | "offline"
}) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-primary-foreground">
        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
        <p className="mt-1 text-[10px] opacity-80">{queueCopy({ status: message.status, source, presence })}</p>
      </div>
    </div>
  )
}

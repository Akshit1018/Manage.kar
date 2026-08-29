"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Cable, MessageCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApprovalCard } from "@/components/approval-card"
import { EmptyState } from "@/components/empty-state"
import { HermesWordmark } from "@/components/hermes-wordmark"
import { PairingSheet } from "@/components/pairing-sheet"
import { SkillsOnMachine } from "@/components/skills-on-machine"
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
import { resolvePendingApproval } from "@/lib/hermes/approval"
import { chatIdentityKind, chatIdentityLabel } from "@/lib/hermes/chat-identity"
import { loadPairing, PAIRING_CHANGED_EVENT } from "@/lib/pairing/pairing"
import type { PairingState } from "@/lib/pairing/types"
import { chatRowAccessibleName } from "@/lib/ui/workspace-sections-layout"

interface ChatsViewProps {
  sessionId: string
  searchQuery: string
  onOpenSession: (id: string) => void
  onBack: () => void
}

export function ChatsView({ sessionId, searchQuery, onOpenSession, onBack }: ChatsViewProps) {
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [pairing, setPairing] = useState<PairingState | null>(null)
  const [pairingOpen, setPairingOpen] = useState(false)

  useEffect(() => {
    const reload = () => {
      setDialer(loadDialer(window.localStorage))
      setPairing(loadPairing(window.localStorage))
    }
    reload()
    window.addEventListener(DIALER_CHANGED_EVENT, reload)
    window.addEventListener(PAIRING_CHANGED_EVENT, reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(DIALER_CHANGED_EVENT, reload)
      window.removeEventListener(PAIRING_CHANGED_EVENT, reload)
      window.removeEventListener("storage", reload)
    }
  }, [])

  if (!dialer) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading chats">
        <div className="mk-preloader">
          <HermesWordmark />
        </div>
        <article className="mk-chat-skeleton mk-editorial-card h-20 animate-pulse" />
        <article className="mk-chat-skeleton mk-editorial-card h-20 animate-pulse" />
        <article className="mk-chat-skeleton mk-editorial-card h-20 animate-pulse" />
      </div>
    )
  }

  if (sessionId) {
    return (
      <ChatThread dialer={dialer} sessionId={sessionId} onBack={onBack} />
    )
  }

  const items = chatListItems(dialer, searchQuery)
  return (
    <div className="space-y-4">
      <div className="mk-section-toolbar">
        <div className="mk-section-toolbar-actions">
          <Button
            variant="outline"
            className="mk-touch bg-transparent"
            onClick={() => setPairingOpen(true)}
            aria-label="Machines"
          >
            <Cable className="h-4 w-4 min-[375px]:mr-2" />
            <span className="hidden min-[375px]:inline">Machines</span>
          </Button>
          <Button
            className="mk-touch"
            onClick={() => {
              onOpenSession(NEW_CHAT_TARGET)
              dispatchComposerOpen({ target: NEW_CHAT_TARGET })
            }}
            aria-label="New chat"
          >
            <Plus className="h-4 w-4 min-[375px]:mr-2" />
            <span className="hidden min-[375px]:inline">New chat</span>
          </Button>
        </div>
      </div>
      <PairingSheet open={pairingOpen} onClose={() => setPairingOpen(false)} />
      <SkillsOnMachine
        paired={(pairing?.machines.length ?? 0) > 0}
        reported={pairing?.machines.flatMap((machine) => machine.skills ?? []) ?? []}
      />
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
  const identity = chatIdentityKind({ title: item.title, source: item.source })
  const title = chatIdentityLabel(identity, item.title)
  return (
    <article className="mk-editorial-card p-4">
      <button
        type="button"
        className="flex w-full items-start gap-3 rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onClick={onOpen}
        aria-label={chatRowAccessibleName({
          ...item,
          title,
          statusWord: item.presence ? presenceLabel(item.presence, item.source) : undefined,
        })}
      >
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {item.id === NEW_CHAT_TARGET ? (
            <Plus className="h-4 w-4 text-primary" />
          ) : (
            <MessageCircle className="h-4 w-4 text-primary" />
          )}
        </span>
        <span className="mk-entity-copy">
          <span className="mk-meta-row">
            {item.presence ? (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(item.presence, item.source))}
                title={presenceLabel(item.presence, item.source)}
              />
            ) : null}
            <span className="mk-entity-title font-semibold">{title}</span>
            {identity === "bot-chat" ? (
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                Bot Chat
              </span>
            ) : null}
            {item.source === "demo" ? (
              <span className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground">
                Demo
              </span>
            ) : null}
            {item.queuedCount > 0 ? (
              <span className="rounded-full bg-yellow-400/20 px-1.5 text-[10px] font-semibold text-yellow-700">
                {item.queuedCount} queued
              </span>
            ) : null}
          </span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.preview}</span>
        </span>
      </button>
    </article>
  )
}

function ChatThread({
  dialer,
  sessionId,
  onBack,
}: {
  dialer: DialerState
  sessionId: string
  onBack: () => void
}) {
  const sessions = visibleSessions(dialer)
  const session = sessions.find((item) => item.id === sessionId)
  const rawTitle = targetTitle(sessions, sessionId)
  const identity = chatIdentityKind({ title: rawTitle, source: session?.source })
  const title = chatIdentityLabel(identity, rawTitle)
  const messages = messagesForTarget(dialer, sessionId)

  return (
    <div className="space-y-4">
      <div className="mk-chat-header">
        <Button variant="ghost" size="icon" className="mk-touch" aria-label="Back to chats" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="mk-chat-header-copy">
          <div className="mk-meta-row">
            {session?.presence ? (
              <span className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(session.presence, session.source))} />
            ) : null}
            <h2 className="truncate text-xl font-bold">{title}</h2>
            {identity === "bot-chat" ? (
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                Bot Chat
              </span>
            ) : null}
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
            {session ? presenceLabel(session.presence, session.source) : "Not paired yet"}
          </p>
        </div>
      </div>
      <ApprovalCard approval={resolvePendingApproval([])} />
      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Use the composer at the bottom. Messages stay local until this machine is paired."
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
        <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
        <p className="mt-1 text-[10px] opacity-80">{queueCopy({ status: message.status, source, presence })}</p>
      </div>
    </div>
  )
}

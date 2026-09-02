"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Cable, MessageCircle, Plus, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApprovalCard } from "@/components/approval-card"
import { EmptyState } from "@/components/empty-state"
import { HermesWordmark } from "@/components/hermes-wordmark"
import { PairingSheet } from "@/components/pairing-sheet"
import { cn } from "@/lib/utils"
import {
  approvalForSession,
  approvalRespondParams,
  clearApproval,
  getCompanionRuntime,
  pendingApprovalFromEvent,
  setCompanionRuntime,
  subscribeCompanionRuntime,
  type ApprovalChoice,
} from "@/lib/hermes/approval-runtime"
import { connectPairedMachine, getCompanionClient } from "@/lib/hermes/session-client"
import { outboundHermesSessionId } from "@/lib/hermes/session-map"
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
import { chatIdentityKind, chatIdentityLabel } from "@/lib/hermes/chat-identity"
import { loadPairing, PAIRING_CHANGED_EVENT } from "@/lib/pairing/pairing"
import { chatRowAccessibleName } from "@/lib/ui/workspace-sections-layout"

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
    const reload = () => {
      const next = loadPairing(window.localStorage)
      setDialer(loadDialer(window.localStorage))
      connectPairedMachine(next, sessionId || undefined)
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
  }, [sessionId])

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
              <span className="rounded-sm bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
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

  useEffect(() => {
    connectPairedMachine(loadPairing(window.localStorage), sessionId)
  }, [sessionId])

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
              <span className="rounded-sm bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
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
      <LiveApproval sessionId={sessionId} />
      <LiveThread sessionId={sessionId} />
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

function LiveApproval({ sessionId }: { sessionId: string }) {
  const [runtime, setRuntime] = useState(getCompanionRuntime)
  useEffect(() => subscribeCompanionRuntime(setRuntime), [])
  const approval = approvalForSession(runtime, sessionId)
  const ignore = pendingApprovalFromEvent({ type: "message.delta" })
  return (
    <ApprovalCard
      approval={approval ?? ignore}
      yolo={runtime.yolo}
      onChoose={(choice: ApprovalChoice) => {
        const pending = approvalForSession(getCompanionRuntime(), sessionId)
        const params = approvalRespondParams(choice, outboundHermesSessionId(sessionId), pending?.id)
        void getCompanionClient()
          .request(params.method, {
            choice: params.choice,
            session_id: params.session_id,
            ...(params.request_id ? { request_id: params.request_id } : {}),
          })
          .catch(() => undefined)
        setCompanionRuntime(clearApproval(getCompanionRuntime(), sessionId))
      }}
    />
  )
}

function LiveThread({ sessionId }: { sessionId: string }) {
  const [runtime, setRuntime] = useState(getCompanionRuntime)
  useEffect(() => subscribeCompanionRuntime(setRuntime), [])
  const thread = runtime.threads[sessionId]
  if (!thread) {
    return null
  }
  return (
    <div className="space-y-3">
      {thread.streaming ? (
        <Button
          type="button"
          variant="outline"
          className="mk-touch"
          aria-label="Stop"
          onClick={() => {
            void getCompanionClient()
              .request("session.interrupt", { session_id: outboundHermesSessionId(sessionId) })
              .catch(() => undefined)
          }}
        >
          <Square className="mr-2 h-4 w-4" />
          Stop
        </Button>
      ) : null}
      {thread.items.map((item) => {
        switch (item.kind) {
          case "assistant":
            return (
              <div key={item.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-secondary px-4 py-2">
                  <p className="whitespace-pre-wrap break-words text-sm">{item.text || (item.streaming ? "…" : "")}</p>
                </div>
              </div>
            )
          case "tool":
            return (
              <article key={item.id} className="mk-editorial-card p-3 text-sm">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.phase}</p>
                {item.preview ? <p className="mt-1 text-muted-foreground">{item.preview}</p> : null}
              </article>
            )
          default: {
            const _exhaustive: never = item
            return _exhaustive
          }
        }
      })}
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

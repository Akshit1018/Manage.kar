"use client"

import type { ReactNode } from "react"
import { Activity, CheckSquare, FileText, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { chatIdentityKind, chatIdentityLabel } from "@/lib/hermes/chat-identity"
import { NEW_CHAT_TARGET, type ChatListItem, type HermesSession } from "@/lib/dialer/types"
import type { Habit, Note, Task } from "@/lib/domain/types"
import type { WorkspaceView } from "@/lib/navigation/workspace-url"
import {
  agentCaption,
  agentInitials,
  chatHasHomePreview,
  homeChatPreview,
  homeHabitPreview,
  homeJumpTiles,
  homeNotePreview,
  homeTaskPreview,
  showHomeListPreview,
  taskProgressDetail,
  type HomeSpotlight,
} from "@/lib/ui/home-feed"

const JUMP_ICONS = {
  tasks: CheckSquare,
  notes: FileText,
  chats: MessageCircle,
  habits: Activity,
} as const

interface HomeFeedProps {
  agents: HermesSession[]
  chats: ChatListItem[]
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  spotlight: HomeSpotlight
  onOpenAgent: (sessionId: string) => void
  onOpenChat: (sessionId: string) => void
  onOpenTask: (task: Task) => void
  onOpenNote: (note: Note) => void
  onOpenHabit: (habit: Habit) => void
  onOpenView: (view: Exclude<WorkspaceView, "overview">) => void
}

export function HomeFeed({
  agents,
  chats,
  tasks,
  notes,
  habits,
  spotlight,
  onOpenAgent,
  onOpenChat,
  onOpenTask,
  onOpenNote,
  onOpenHabit,
  onOpenView,
}: HomeFeedProps) {
  const remainingChats = homeChatPreview(chats, spotlight?.kind === "chat" ? spotlight.sessionId : undefined)
  const previewTasks = homeTaskPreview(tasks)
  const previewNotes = homeNotePreview(notes)
  const previewHabits = homeHabitPreview(habits)
  const openTasks = tasks.filter((task) => !task.completed)
  const remainingChatTotal = chats.filter((item) => {
    if (item.id === NEW_CHAT_TARGET || !chatHasHomePreview(item)) {
      return false
    }
    return spotlight?.kind !== "chat" || item.id !== spotlight.sessionId
  }).length

  return (
    <div className="space-y-6">
      {agents.length > 0 ? (
        <section aria-label="Agents">
          <div className="mk-home-agents">
            {agents.map((agent) => {
              const identity = chatIdentityKind(agent)
              const title = chatIdentityLabel(identity, agent.title)
              return (
                <button
                  key={agent.id}
                  type="button"
                  className="mk-home-circle"
                  onClick={() => onOpenAgent(agent.id)}
                  aria-label={`Open ${title}`}
                >
                  <span className="mk-home-circle-face" aria-hidden="true">
                    {agentInitials(title)}
                  </span>
                  <span className="mk-home-circle-name">{title}</span>
                  <span className="mk-home-circle-caption">{agentCaption(agent)}</span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <section aria-label="Jump to section">
        <div className="mk-home-jumps">
          {homeJumpTiles().map((tile) => {
            const Icon = JUMP_ICONS[tile.view]
            return (
              <button
                key={tile.view}
                type="button"
                className="mk-home-jump"
                onClick={() => onOpenView(tile.view)}
                aria-label={tile.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{tile.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {spotlight ? (
        <button
          type="button"
          className="mk-featured-surface mk-home-spotlight w-full p-5 text-left"
          onClick={() => {
            if (spotlight.kind === "chat") {
              onOpenChat(spotlight.sessionId)
              return
            }
            const task = tasks.find((item) => item.id === spotlight.taskId)
            if (task) {
              onOpenTask(task)
            }
          }}
          aria-label={`${spotlight.title}. ${spotlight.detail}`}
        >
          <p className="text-sm opacity-80">{spotlight.kind === "chat" ? "Chat" : "Task"}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{spotlight.title}</p>
          <p className="mt-2 text-sm">{spotlight.detail}</p>
        </button>
      ) : null}

      {showHomeListPreview(remainingChats.length) ? (
        <HomePreview
          title="Chat"
          hasMore={remainingChatTotal > remainingChats.length}
          onViewAll={() => onOpenView("chats")}
        >
          {remainingChats.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mk-editorial-card mk-home-row"
              onClick={() => onOpenChat(item.id)}
              aria-label={`Open ${item.title}`}
            >
              <span className="mk-entity-title">{item.title}</span>
              <span className="mk-section-support line-clamp-2">{item.preview}</span>
            </button>
          ))}
        </HomePreview>
      ) : null}

      {showHomeListPreview(previewTasks.length) ? (
        <HomePreview
          title="Task"
          hasMore={openTasks.length > previewTasks.length}
          onViewAll={() => onOpenView("tasks")}
        >
          {previewTasks.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mk-editorial-card mk-home-row"
              onClick={() => onOpenTask(item)}
              aria-label={`Open ${item.title}`}
            >
              <span className="mk-entity-title">{item.title}</span>
              <span className="mk-section-support">{taskProgressDetail(item)}</span>
            </button>
          ))}
        </HomePreview>
      ) : null}

      {showHomeListPreview(previewNotes.length) ? (
        <HomePreview
          title="Notes"
          hasMore={notes.length > previewNotes.length}
          onViewAll={() => onOpenView("notes")}
        >
          {previewNotes.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mk-editorial-card mk-home-row"
              onClick={() => onOpenNote(item)}
              aria-label={`Open ${item.title || "note"}`}
            >
              <span className="mk-entity-title">{item.title || "Untitled note"}</span>
              <span className="mk-section-support line-clamp-2">{item.content || "Empty"}</span>
            </button>
          ))}
        </HomePreview>
      ) : null}

      {showHomeListPreview(previewHabits.length) ? (
        <HomePreview
          title="Habits"
          hasMore={habits.length > previewHabits.length}
          onViewAll={() => onOpenView("habits")}
        >
          {previewHabits.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mk-editorial-card mk-home-row"
              onClick={() => onOpenHabit(item)}
              aria-label={`Open ${item.name}`}
            >
              <span className="mk-entity-title">{item.name}</span>
              <span className="mk-section-support">{item.completedToday ? "Done today" : "Not yet today"}</span>
            </button>
          ))}
        </HomePreview>
      ) : null}
    </div>
  )
}

function HomePreview({
  title,
  hasMore,
  onViewAll,
  children,
}: {
  title: string
  hasMore: boolean
  onViewAll: () => void
  children: ReactNode
}) {
  return (
    <section aria-label={title}>
      <h2 className="mk-home-heading mb-3">{title}</h2>
      <div className={hasMore ? "mk-home-fade" : undefined}>
        <div className="grid gap-3">{children}</div>
      </div>
      {hasMore ? (
        <Button variant="outline" className="mk-touch mt-3 w-full bg-transparent" onClick={onViewAll}>
          View all
        </Button>
      ) : null}
    </section>
  )
}

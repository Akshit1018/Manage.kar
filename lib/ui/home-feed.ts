import { CANONICAL_BOT_CHAT_TITLE, chatIdentityKind, isCanonicalBotChatTitle } from "@/lib/hermes/chat-identity"
import { NEW_CHAT_TARGET, type ChatListItem, type HermesSession } from "@/lib/dialer/types"
import type { Habit, Note, Task } from "@/lib/domain/types"
import { taskStatus } from "@/lib/tasks/board"
import type { CompanionRuntime } from "@/lib/hermes/runtime"
import type { ThreadState } from "@/lib/hermes/thread"
import type { WorkspaceView } from "@/lib/navigation/workspace-url"

export const HOME_PREVIEW_LIMIT = 4
export const HOME_CHAT_PREVIEW_LIMIT = 3

export function homeJumpTiles(): ReadonlyArray<{ view: Exclude<WorkspaceView, "overview">; label: string }> {
  return [
    { view: "tasks", label: "Task" },
    { view: "notes", label: "Notes" },
    { view: "chats", label: "Chat" },
    { view: "habits", label: "Habit" },
  ]
}

export function homeAgents(sessions: HermesSession[]): HermesSession[] {
  const bots = sessions.filter((session) => chatIdentityKind(session) === "bot-chat")
  if (bots.length > 0) {
    return bots
  }
  return sessions
}

export function agentInitials(title: string): string {
  if (isCanonicalBotChatTitle(title)) {
    return "B"
  }
  const words = title.trim().split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word))
  if (words.length === 0) {
    return "?"
  }
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export function agentCaption(session: HermesSession): string {
  return session.source === "demo" ? "Demo" : "Paired"
}

export function homeRuntimeSignals(
  runtime: CompanionRuntime,
  chats: ChatListItem[],
): {
  thinkingTitle?: string
  approvalTitle?: string
  busyChatId?: string
  busyDetail?: string
  approvalChatId?: string
} {
  const realChats = chats.filter((item) => item.id !== NEW_CHAT_TARGET)
  for (const chat of realChats) {
    const detail = threadBusyDetail(runtime.threads[chat.id])
    if (detail) {
      return {
        thinkingTitle: chat.title,
        busyChatId: chat.id,
        busyDetail: detail,
      }
    }
  }
  for (const chat of realChats) {
    if (runtime.approvals[chat.id]) {
      return {
        approvalTitle: chat.title,
        approvalChatId: chat.id,
      }
    }
  }
  return {}
}

export interface DaySumUpInput {
  thinkingTitle?: string
  approvalTitle?: string
  doingCount: number
  todayCount: number
  paired: boolean
}

export interface DayBriefingInput extends DaySumUpInput {
  agentTitle?: string
  agentIsDemo?: boolean
}

export function agentDaySumUp(input: DaySumUpInput): string {
  if (input.thinkingTitle) {
    return `${input.thinkingTitle} is thinking.`
  }
  if (input.approvalTitle) {
    return `${input.approvalTitle} is waiting for an approval.`
  }
  if (input.doingCount > 0) {
    return `${input.doingCount} in progress today.`
  }
  if (input.todayCount > 0) {
    return `${input.todayCount} due today.`
  }
  if (input.paired) {
    return "Paired. Nothing running."
  }
  return "Nothing running yet."
}

function briefingTaskPicture(input: Pick<DaySumUpInput, "doingCount" | "todayCount">): string {
  if (input.doingCount > 0 && input.todayCount > 0) {
    return `${input.doingCount} in progress, ${input.todayCount} due today.`
  }
  if (input.doingCount > 0) {
    return `${input.doingCount} in progress today.`
  }
  if (input.todayCount > 0) {
    return `${input.todayCount} due today.`
  }
  return "No tasks are in progress, and nothing is due today."
}

function briefingAgentPicture(input: DayBriefingInput): string | undefined {
  const title = input.agentTitle?.trim()
  if (!title) {
    return undefined
  }
  if (input.agentIsDemo) {
    return `${title} is here as a demo. It is not paired to a machine, so I can only brief what is on this phone.`
  }
  if (input.paired) {
    return `${title} is paired.`
  }
  return `${title} is on this phone.`
}

function joinBriefing(parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join("\n\n")
}

export function agentDayBriefing(input: DayBriefingInput): string {
  const tasks = briefingTaskPicture(input)
  const agent = briefingAgentPicture(input)
  if (input.thinkingTitle) {
    return joinBriefing([
      `${input.thinkingTitle} is thinking right now.`,
      tasks,
      "I will rewrite this every time you open the app.",
    ])
  }
  if (input.approvalTitle) {
    return joinBriefing([
      `${input.approvalTitle} is waiting for an approval.`,
      tasks,
      "Open that chat when you can decide.",
    ])
  }
  if (input.doingCount > 0 || input.todayCount > 0) {
    return joinBriefing([tasks, agent, "I will rewrite this every time you open the app."])
  }
  if (input.paired) {
    return joinBriefing([
      "You are paired. Nothing is running right now.",
      tasks,
      agent,
      "I will rewrite this every time you open the app.",
    ])
  }
  return joinBriefing([
    "Nothing is moving yet.",
    tasks,
    agent,
    "Add a task or pair Hermes and I will brief you here like a desk assistant.",
  ])
}

export function taskProgressDetail(task: Pick<Task, "completed" | "status" | "checklist">): string {
  if (task.checklist && task.checklist.length > 0) {
    const done = task.checklist.filter((item) => item.completed).length
    return `${done}/${task.checklist.length} checklist`
  }
  const status = taskStatus(task)
  switch (status) {
    case "doing":
      return "In progress"
    case "done":
      return "Done"
    case "todo":
      return "To do"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function threadBusyDetail(thread?: ThreadState): string | null {
  if (!thread) {
    return null
  }
  if (thread.streaming) {
    return "Thinking"
  }
  const tool = thread.items.find(
    (item) => item.kind === "tool" && (item.phase === "start" || item.phase === "progress"),
  )
  if (tool && tool.kind === "tool") {
    return tool.preview || tool.name
  }
  return null
}

export type HomeSpotlight =
  | { kind: "chat"; sessionId: string; title: string; detail: string }
  | { kind: "task"; taskId: number; title: string; detail: string }
  | null

export function pickHomeSpotlight(input: {
  chats: ChatListItem[]
  tasks: Task[]
  todayTasks: Task[]
  busyChatId?: string
  busyDetail?: string
  approvalChatId?: string
}): HomeSpotlight {
  const chats = input.chats.filter((item) => item.id !== NEW_CHAT_TARGET)
  if (input.busyChatId) {
    const chat = chats.find((item) => item.id === input.busyChatId)
    return {
      kind: "chat",
      sessionId: input.busyChatId,
      title: chat?.title ?? CANONICAL_BOT_CHAT_TITLE,
      detail: input.busyDetail ?? "Thinking",
    }
  }
  if (input.approvalChatId) {
    const chat = chats.find((item) => item.id === input.approvalChatId)
    return {
      kind: "chat",
      sessionId: input.approvalChatId,
      title: chat?.title ?? CANONICAL_BOT_CHAT_TITLE,
      detail: "Waiting for approval",
    }
  }
  const lastChat = [...chats].sort((left, right) => right.lastAt.localeCompare(left.lastAt))[0]
  if (lastChat && lastChat.preview !== "No messages yet" && lastChat.preview !== "Start a conversation") {
    return {
      kind: "chat",
      sessionId: lastChat.id,
      title: lastChat.title,
      detail: lastChat.preview,
    }
  }
  const doing = input.tasks.find((task) => taskStatus(task) === "doing")
  if (doing) {
    return { kind: "task", taskId: doing.id, title: doing.title, detail: taskProgressDetail(doing) }
  }
  const today = input.todayTasks[0]
  if (today) {
    return { kind: "task", taskId: today.id, title: today.title, detail: taskProgressDetail(today) }
  }
  const open = input.tasks.find((task) => !task.completed)
  if (open) {
    return { kind: "task", taskId: open.id, title: open.title, detail: taskProgressDetail(open) }
  }
  return null
}

export function previewAfter<T extends { id: string | number }>(
  items: T[],
  excludeId: string | number | undefined,
  limit: number,
): T[] {
  return items.filter((item) => excludeId === undefined || item.id !== excludeId).slice(0, limit)
}

export function homeTaskPreview(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((task) => !task.completed)
    .sort((left, right) => {
      const leftDoing = taskStatus(left) === "doing" ? 0 : 1
      const rightDoing = taskStatus(right) === "doing" ? 0 : 1
      return leftDoing - rightDoing
    })
    .slice(0, HOME_PREVIEW_LIMIT)
}

export function homeNotePreview(notes: Note[]): Note[] {
  return [...notes]
    .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)))
    .slice(0, HOME_PREVIEW_LIMIT)
}

export function homeHabitPreview(habits: Habit[]): Habit[] {
  return [...habits]
    .sort((left, right) => Number(left.completedToday) - Number(right.completedToday))
    .slice(0, HOME_PREVIEW_LIMIT)
}

export function homeChatPreview(chats: ChatListItem[], excludeId?: string): ChatListItem[] {
  return previewAfter(
    chats.filter((item) => item.id !== NEW_CHAT_TARGET),
    excludeId,
    HOME_CHAT_PREVIEW_LIMIT,
  )
}

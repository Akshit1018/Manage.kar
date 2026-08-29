import { describe, expect, it } from "vitest"
import { CANONICAL_BOT_CHAT_TITLE } from "@/lib/hermes/chat-identity"
import { NEW_CHAT_TARGET, type ChatListItem, type HermesSession } from "@/lib/dialer/types"
import type { Habit, Note, Task } from "@/lib/domain/types"
import { createCompanionRuntime } from "@/lib/hermes/runtime"
import {
  agentCaption,
  agentDaySumUp,
  agentInitials,
  homeAgents,
  homeChatPreview,
  homeHabitPreview,
  homeJumpTiles,
  homeNotePreview,
  homeRuntimeSignals,
  homeTaskPreview,
  pickHomeSpotlight,
  taskProgressDetail,
  threadBusyDetail,
} from "./home-feed"

const bot: HermesSession = {
  id: "demo-research",
  title: CANONICAL_BOT_CHAT_TITLE,
  presence: "offline",
  lastActivityAt: "2026-08-29T00:00:00.000Z",
  source: "demo",
}

const machine: HermesSession = {
  id: "demo-local",
  title: "Hermes · local",
  presence: "active",
  lastActivityAt: "2026-08-29T00:01:00.000Z",
  source: "demo",
}

const task = (id: number, extra: Partial<Task> = {}): Task => ({
  id,
  title: extra.title ?? `Task ${id}`,
  completed: extra.completed ?? false,
  priority: extra.priority ?? "medium",
  dueDate: extra.dueDate ?? "",
  ...extra,
})

const note = (id: number, extra: Partial<Note> = {}): Note => ({
  id,
  title: extra.title ?? `Note ${id}`,
  content: extra.content ?? "",
  createdAt: extra.createdAt ?? "2026-08-29T00:00:00.000Z",
  ...extra,
})

const habit = (id: number, extra: Partial<Habit> = {}): Habit => ({
  id,
  name: extra.name ?? `Habit ${id}`,
  category: extra.category ?? "health",
  frequency: extra.frequency ?? "daily",
  streak: extra.streak ?? 0,
  completed: extra.completed ?? false,
  completedToday: extra.completedToday ?? false,
  reminders: extra.reminders ?? false,
  createdAt: extra.createdAt ?? "2026-08-29T00:00:00.000Z",
  history: extra.history ?? [],
  ...extra,
})

const chat = (id: string, extra: Partial<ChatListItem> = {}): ChatListItem => ({
  id,
  title: extra.title ?? id,
  queuedCount: extra.queuedCount ?? 0,
  preview: extra.preview ?? "",
  lastAt: extra.lastAt ?? "1",
  ...extra,
})

describe("home feed helpers", () => {
  it("lists only Bot Chat agents when one exists", () => {
    expect(homeAgents([machine, bot]).map((item) => item.id)).toEqual(["demo-research"])
  })

  it("falls back to every session when no bot exists", () => {
    expect(homeAgents([machine]).map((item) => item.id)).toEqual(["demo-local"])
  })

  it("initials Bot Chat as B and skips punctuation in machine titles", () => {
    expect(agentInitials(CANONICAL_BOT_CHAT_TITLE)).toBe("B")
    expect(agentInitials("Hermes · local")).toBe("HL")
    expect(agentCaption(bot)).toBe("Demo")
    expect(agentCaption({ ...machine, source: "paired" })).toBe("Paired")
  })

  it("writes an honest day sum-up", () => {
    expect(agentDaySumUp({ thinkingTitle: "Bot Chat", doingCount: 2, todayCount: 3, paired: true })).toBe(
      "Bot Chat is thinking.",
    )
    expect(agentDaySumUp({ approvalTitle: "Bot Chat", doingCount: 1, todayCount: 1, paired: true })).toBe(
      "Bot Chat is waiting for an approval.",
    )
    expect(agentDaySumUp({ doingCount: 2, todayCount: 3, paired: false })).toBe("2 in progress today.")
    expect(agentDaySumUp({ doingCount: 0, todayCount: 1, paired: false })).toBe("1 due today.")
    expect(agentDaySumUp({ doingCount: 0, todayCount: 0, paired: true })).toBe("Paired. Nothing running.")
    expect(agentDaySumUp({ doingCount: 0, todayCount: 0, paired: false })).toBe("Nothing running yet.")
  })

  it("picks a busy chat before a task", () => {
    const spotlight = pickHomeSpotlight({
      chats: [chat("demo-research", { title: "Bot Chat", preview: "hi" })],
      tasks: [task(1, { title: "Write", status: "doing" })],
      todayTasks: [],
      busyChatId: "demo-research",
      busyDetail: "Thinking",
    })
    expect(spotlight).toEqual({
      kind: "chat",
      sessionId: "demo-research",
      title: "Bot Chat",
      detail: "Thinking",
    })
  })

  it("uses checklist progress on tasks", () => {
    expect(
      taskProgressDetail({
        completed: false,
        status: "doing",
        checklist: [
          { id: 1, text: "a", completed: true },
          { id: 2, text: "b", completed: false },
        ],
      }),
    ).toBe("1/2 checklist")
  })

  it("reads thinking from a streaming thread and approvals from runtime", () => {
    expect(threadBusyDetail({ sessionId: "s", items: [], streaming: true })).toBe("Thinking")
    expect(threadBusyDetail({ sessionId: "s", items: [], streaming: false })).toBeNull()
    const runtime = createCompanionRuntime()
    runtime.threads["demo-research"] = { sessionId: "demo-research", items: [], streaming: true }
    expect(homeRuntimeSignals(runtime, [chat("demo-research", { title: "Bot Chat" })])).toEqual({
      thinkingTitle: "Bot Chat",
      busyChatId: "demo-research",
      busyDetail: "Thinking",
    })
  })

  it("keeps four jump tiles and preview caps", () => {
    expect(homeJumpTiles().map((item) => item.label)).toEqual(["Task", "Notes", "Chat", "Habit"])
    expect(
      homeTaskPreview(Array.from({ length: 8 }, (_, id) => task(id))).map((item) => item.id),
    ).toEqual([0, 1, 2, 3])
    expect(homeNotePreview([note(2, { title: "b" }), note(1, { title: "a", pinned: true })]).map((item) => item.id)).toEqual([
      1, 2,
    ])
    expect(
      homeHabitPreview([habit(1, { name: "done", completedToday: true }), habit(2, { name: "open" })]).map(
        (item) => item.id,
      ),
    ).toEqual([2, 1])
    expect(
      homeChatPreview(
        [
          chat(NEW_CHAT_TARGET, { title: "New chat" }),
          chat("a", { title: "A", preview: "x", lastAt: "1" }),
          chat("b", { title: "B", preview: "y", lastAt: "2" }),
        ],
        "a",
      ).map((item) => item.id),
    ).toEqual(["b"])
  })
})

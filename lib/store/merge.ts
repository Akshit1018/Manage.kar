import type { DeletedIds, Workspace } from "@/lib/domain/types"

export function emptyDeletedIds(): DeletedIds {
  return {
    tasks: [],
    notes: [],
    habits: [],
    goals: [],
    timeEntries: [],
    focusSessions: [],
  }
}

type Identified = { id: number; updatedAt?: string }

function parseTime(value?: string): number {
  if (!value) {
    return 0
  }
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

function sortById<T extends { id: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.id - right.id)
}

function unionIds(...lists: number[][]): number[] {
  return [...new Set(lists.flat())].sort((left, right) => left - right)
}

function withoutUpdatedAt<T extends Identified>(item: T): string {
  const { updatedAt: _updatedAt, ...rest } = item
  return JSON.stringify(rest)
}

function idsOf(items: Array<{ id: number }>): number[] {
  return items.map((item) => item.id)
}

function removedIds(previous: Array<{ id: number }>, next: Array<{ id: number }>): number[] {
  const live = new Set(idsOf(next))
  return idsOf(previous).filter((id) => !live.has(id))
}

function stampedDeletedIds(
  previousDeleted: number[],
  nextDeleted: number[],
  previousItems: Array<{ id: number }>,
  nextItems: Array<{ id: number }>,
): number[] {
  const live = new Set(idsOf(nextItems))
  return unionIds(previousDeleted, nextDeleted, removedIds(previousItems, nextItems)).filter((id) => !live.has(id))
}

function mergeById<T extends Identified>(current: T[], incoming: T[], deleted: number[]): T[] {
  const deletedSet = new Set(deleted)
  const map = new Map<number, T>()
  for (const item of current) {
    if (!deletedSet.has(item.id)) {
      map.set(item.id, item)
    }
  }
  for (const item of incoming) {
    if (deletedSet.has(item.id)) {
      continue
    }
    const existing = map.get(item.id)
    if (!existing || parseTime(item.updatedAt) >= parseTime(existing.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return sortById([...map.values()])
}

function stampCollection<T extends Identified>(previous: T[], next: T[], nowIso: string): T[] {
  return next.map((item) => {
    const old = previous.find((candidate) => candidate.id === item.id)
    if (!old || withoutUpdatedAt(old) !== withoutUpdatedAt(item)) {
      return { ...item, updatedAt: nowIso }
    }
    return item.updatedAt ? item : { ...item, updatedAt: nowIso }
  })
}

export function stampWorkspaceMutation(
  previous: Workspace,
  next: Workspace,
  now = new Date(),
): Workspace {
  const nowIso = now.toISOString()
  const previousDeleted = previous.deletedIds ?? emptyDeletedIds()
  const nextDeleted = next.deletedIds ?? emptyDeletedIds()

  const deletedIds: DeletedIds = {
    tasks: stampedDeletedIds(previousDeleted.tasks, nextDeleted.tasks, previous.tasks, next.tasks),
    notes: stampedDeletedIds(previousDeleted.notes, nextDeleted.notes, previous.notes, next.notes),
    habits: stampedDeletedIds(previousDeleted.habits, nextDeleted.habits, previous.habits, next.habits),
    goals: stampedDeletedIds(previousDeleted.goals, nextDeleted.goals, previous.goals, next.goals),
    timeEntries: stampedDeletedIds(previousDeleted.timeEntries, nextDeleted.timeEntries, previous.timeEntries, next.timeEntries),
    focusSessions: stampedDeletedIds(
      previousDeleted.focusSessions,
      nextDeleted.focusSessions,
      previous.focusSessions,
      next.focusSessions,
    ),
  }

  return {
    ...next,
    deletedIds,
    tasks: stampCollection(previous.tasks, next.tasks, nowIso),
    notes: stampCollection(previous.notes, next.notes, nowIso),
    habits: stampCollection(previous.habits, next.habits, nowIso),
    goals: stampCollection(previous.goals, next.goals, nowIso),
    timeEntries: stampCollection(previous.timeEntries, next.timeEntries, nowIso),
    focusSessions: stampCollection(previous.focusSessions, next.focusSessions, nowIso),
  }
}

export function mergeWorkspaces(current: Workspace, incoming: Workspace): Workspace {
  const currentDeleted = current.deletedIds ?? emptyDeletedIds()
  const incomingDeleted = incoming.deletedIds ?? emptyDeletedIds()
  const deletedIds: DeletedIds = {
    tasks: unionIds(currentDeleted.tasks, incomingDeleted.tasks),
    notes: unionIds(currentDeleted.notes, incomingDeleted.notes),
    habits: unionIds(currentDeleted.habits, incomingDeleted.habits),
    goals: unionIds(currentDeleted.goals, incomingDeleted.goals),
    timeEntries: unionIds(currentDeleted.timeEntries, incomingDeleted.timeEntries),
    focusSessions: unionIds(currentDeleted.focusSessions, incomingDeleted.focusSessions),
  }

  const incomingIsNewer = parseTime(incoming.updatedAt) >= parseTime(current.updatedAt)
  const newer = incomingIsNewer ? incoming : current

  return {
    schemaVersion: 1,
    updatedAt: newer.updatedAt,
    nextEntityId: Math.max(current.nextEntityId || 1, incoming.nextEntityId || 1),
    tasks: mergeById(current.tasks, incoming.tasks, deletedIds.tasks),
    notes: mergeById(current.notes, incoming.notes, deletedIds.notes),
    habits: mergeById(current.habits, incoming.habits, deletedIds.habits),
    goals: mergeById(current.goals, incoming.goals, deletedIds.goals),
    timeEntries: mergeById(current.timeEntries, incoming.timeEntries, deletedIds.timeEntries),
    focusSessions: mergeById(current.focusSessions, incoming.focusSessions, deletedIds.focusSessions),
    activeFocus: newer.activeFocus,
    importedShareHashes: [...new Set([...current.importedShareHashes, ...incoming.importedShareHashes])],
    firedReminderKeys: [...new Set([...current.firedReminderKeys, ...incoming.firedReminderKeys])],
    deletedIds,
    settings: newer.settings,
    profile: newer.profile,
  }
}

export function sameWorkspaceEntities(left: Workspace, right: Workspace): boolean {
  const pick = (workspace: Workspace) =>
    JSON.stringify({
      nextEntityId: workspace.nextEntityId,
      tasks: sortById(workspace.tasks),
      notes: sortById(workspace.notes),
      habits: sortById(workspace.habits),
      goals: sortById(workspace.goals),
      timeEntries: sortById(workspace.timeEntries),
      focusSessions: sortById(workspace.focusSessions),
      activeFocus: workspace.activeFocus,
      importedShareHashes: [...workspace.importedShareHashes].sort(),
      firedReminderKeys: [...workspace.firedReminderKeys].sort(),
      deletedIds: workspace.deletedIds ?? emptyDeletedIds(),
      settings: workspace.settings,
      profile: workspace.profile,
    })
  return pick(left) === pick(right)
}

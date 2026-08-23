import type { Workspace } from "@/lib/domain/types"
import type { SharePayload } from "@/lib/share/codec"
import { normalizeDueDate } from "@/lib/dates/due-date"

function nextTaskId(items: Array<{ id: number }>): number {
  if (items.length === 0) {
    return 1
  }
  return Math.max(...items.map((item) => item.id)) + 1
}

export function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) + hash + value.charCodeAt(index)
    hash |= 0
  }
  return (hash >>> 0).toString(16)
}

export function sharePayloadHash(payload: SharePayload): string {
  return hashString(
    JSON.stringify({
      sharedAt: payload.sharedAt,
      userName: payload.userName,
      titles: payload.tasks.map((task) => task.title.trim()),
    }),
  )
}

export function importSharedTasks(
  workspace: Workspace,
  payload: SharePayload,
): { workspace: Workspace; imported: number; skipped: number; hash: string } {
  const hash = sharePayloadHash(payload)
  if (workspace.importedShareHashes.includes(hash)) {
    return { workspace, imported: 0, skipped: payload.tasks.length, hash }
  }

  let nextId = nextTaskId(workspace.tasks)
  const imported = payload.tasks.map((task) => {
    const copy = {
      ...task,
      id: nextId,
      title: task.title.trim(),
      dueDate: normalizeDueDate(task.dueDate),
    }
    nextId += 1
    return copy
  })

  return {
    workspace: {
      ...workspace,
      tasks: [...workspace.tasks, ...imported],
      importedShareHashes: [...workspace.importedShareHashes, hash],
    },
    imported: imported.length,
    skipped: 0,
    hash,
  }
}

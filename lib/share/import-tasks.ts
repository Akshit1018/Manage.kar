import type { Workspace } from "@/lib/domain/types"
import type { SharePayload } from "@/lib/share/codec"
import { normalizeDueDate } from "@/lib/dates/due-date"
import { allocateEntityId } from "@/lib/store/workspace"

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

  let current = workspace
  const imported = payload.tasks.map((task) => {
    const allocated = allocateEntityId(current)
    current = allocated.workspace
    return {
      ...task,
      id: allocated.id,
      title: task.title.trim(),
      dueDate: normalizeDueDate(task.dueDate),
    }
  })

  return {
    workspace: {
      ...current,
      tasks: [...current.tasks, ...imported],
      importedShareHashes: [...current.importedShareHashes, hash],
    },
    imported: imported.length,
    skipped: 0,
    hash,
  }
}

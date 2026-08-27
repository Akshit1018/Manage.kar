import type { LabelKind, Note, Task, WorkspaceLabel } from "@/lib/domain/types"

export const SEEDED_PLACES = ["home", "office", "errand", "phone"] as const

export function normalizeLabelName(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function displayLabelName(label: WorkspaceLabel): string {
  return `@${label.name}`
}

export function ensureSeededPlaces(
  labels: WorkspaceLabel[],
  allocateId: () => number,
): WorkspaceLabel[] {
  let next = [...labels]
  for (const name of SEEDED_PLACES) {
    const result = upsertLabel(next, name, "place", allocateId)
    next = result.labels
  }
  return next
}

export function upsertLabel(
  labels: WorkspaceLabel[],
  rawName: string,
  kind: LabelKind,
  allocateId: () => number,
): { labels: WorkspaceLabel[]; label: WorkspaceLabel } {
  const name = normalizeLabelName(rawName)
  const existing = labels.find((label) => label.name === name)
  if (existing) {
    return { labels, label: existing }
  }
  const label: WorkspaceLabel = { id: allocateId(), name, kind }
  return { labels: [...labels, label], label }
}

function asNameList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string" && normalizeLabelName(item).length > 0)
}

export function migrateLegacyMentions(
  labels: WorkspaceLabel[],
  tasks: Array<{ mentions?: unknown; assignedTo?: unknown; labelIds?: unknown }>,
  allocateId: () => number,
): { labels: WorkspaceLabel[]; labelIdsByIndex: number[][] } {
  let next = [...labels]
  const labelIdsByIndex = tasks.map((task) => {
    const current = Array.isArray(task.labelIds)
      ? task.labelIds.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
      : []
    const names = [...asNameList(task.mentions), ...asNameList(task.assignedTo)]
    const ids = [...current]
    for (const name of names) {
      const result = upsertLabel(next, name, "person", allocateId)
      next = result.labels
      if (!ids.includes(result.label.id)) {
        ids.push(result.label.id)
      }
    }
    return ids
  })
  return { labels: next, labelIdsByIndex }
}

export function parseAtTokens(text: string): string[] {
  const names: string[] = []
  const matches = text.match(/@[\p{L}\p{N}_-]+/gu) ?? text.match(/@[A-Za-z0-9_-]+/g) ?? []
  for (const token of matches) {
    const name = normalizeLabelName(token)
    if (name && !names.includes(name)) {
      names.push(name)
    }
  }
  return names
}

export function attachUnknownTokensAsTags(
  labels: WorkspaceLabel[],
  tokens: string[],
  allocateId: () => number,
): { labels: WorkspaceLabel[]; ids: number[] } {
  let next = [...labels]
  const ids: number[] = []
  for (const token of tokens) {
    const name = normalizeLabelName(token)
    if (!name) {
      continue
    }
    const result = upsertLabel(next, name, "tag", allocateId)
    next = result.labels
    if (!ids.includes(result.label.id)) {
      ids.push(result.label.id)
    }
  }
  return { labels: next, ids }
}

export function labelsForIds(labels: WorkspaceLabel[], ids: number[] | undefined): WorkspaceLabel[] {
  if (!ids || ids.length === 0) {
    return []
  }
  const byId = new Map(labels.map((label) => [label.id, label]))
  return ids.map((id) => byId.get(id)).filter((label): label is WorkspaceLabel => Boolean(label))
}

export function uniqueLabelIds(...lists: Array<number[] | undefined>): number[] {
  return [...new Set(lists.flatMap((list) => list ?? []))].sort((left, right) => left - right)
}

function kindOrder(kind: LabelKind): number {
  switch (kind) {
    case "place":
      return 0
    case "tag":
      return 1
    case "person":
      return 2
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function sortLabels(labels: WorkspaceLabel[]): WorkspaceLabel[] {
  return [...labels].sort((left, right) => {
    const kind = kindOrder(left.kind) - kindOrder(right.kind)
    return kind !== 0 ? kind : left.name.localeCompare(right.name)
  })
}

function knownIds(labels: WorkspaceLabel[], ids: number[]): number[] {
  const allowed = new Set(labels.map((label) => label.id))
  return ids.filter((id) => allowed.has(id))
}

export function hydrateWorkspaceLabels(input: {
  labels: WorkspaceLabel[]
  tasks: Task[]
  notes: Note[]
  rawTasks: unknown[]
  allocateId: () => number
}): { labels: WorkspaceLabel[]; tasks: Task[]; notes: Note[] } {
  let labels = ensureSeededPlaces(input.labels, input.allocateId)
  const rawById = new Map<number, { mentions?: unknown; assignedTo?: unknown; labelIds?: unknown }>()
  for (const item of input.rawTasks) {
    if (typeof item === "object" && item !== null && !Array.isArray(item) && "id" in item) {
      const record = item as { id: unknown; mentions?: unknown; assignedTo?: unknown; labelIds?: unknown }
      if (typeof record.id === "number") {
        rawById.set(record.id, record)
      }
    }
  }

  const tasks = input.tasks.map((task) => {
    const migrated = migrateLegacyMentions(labels, [rawById.get(task.id) ?? {}], input.allocateId)
    labels = migrated.labels
    const tagged = attachUnknownTokensAsTags(
      labels,
      parseAtTokens(`${task.title} ${task.description ?? ""}`),
      input.allocateId,
    )
    labels = tagged.labels
    return {
      ...task,
      labelIds: knownIds(labels, uniqueLabelIds(task.labelIds, migrated.labelIdsByIndex[0], tagged.ids)),
    }
  })

  const notes = input.notes.map((note) => {
    const tagged = attachUnknownTokensAsTags(
      labels,
      parseAtTokens(`${note.title} ${note.content}`),
      input.allocateId,
    )
    labels = tagged.labels
    return {
      ...note,
      labelIds: knownIds(labels, uniqueLabelIds(note.labelIds, tagged.ids)),
    }
  })

  return { labels: sortLabels(labels), tasks, notes }
}

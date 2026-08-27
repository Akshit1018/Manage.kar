import type { WorkspaceLabel } from "@/lib/domain/types"
import { normalizeLabelName } from "@/lib/labels/book"

export function parseAtQuery(text: string, cursor: number): { start: number; query: string } | null {
  const before = text.slice(0, cursor)
  const start = before.lastIndexOf("@")
  if (start === -1) {
    return null
  }
  const token = before.slice(start + 1)
  if (token.includes(" ") || token.includes("\n") || token.includes("\t")) {
    return null
  }
  return { start, query: token }
}

export function suggestLabels(labels: WorkspaceLabel[], query: string): WorkspaceLabel[] {
  const needle = normalizeLabelName(query)
  if (!needle) {
    return labels
  }
  return labels.filter((label) => label.name.startsWith(needle))
}

export function insertAtToken(text: string, cursor: number, name: string): { text: string; cursor: number } {
  const query = parseAtQuery(text, cursor)
  if (!query) {
    const prefix = text.length === 0 || text.endsWith(" ") ? text : `${text} `
    const next = `${prefix}@${name} `
    return { text: next, cursor: next.length }
  }
  const next = `${text.slice(0, query.start)}@${name} ${text.slice(cursor)}`
  return { text: next, cursor: query.start + name.length + 2 }
}

export function matchesLabelSearch(
  query: string,
  labels: WorkspaceLabel[],
  labelIds: number[] | undefined,
): boolean {
  const needle = normalizeLabelName(query)
  if (!needle || !labelIds || labelIds.length === 0) {
    return false
  }
  const attached = new Set(labelIds)
  return labels.some((label) => attached.has(label.id) && label.name.includes(needle))
}

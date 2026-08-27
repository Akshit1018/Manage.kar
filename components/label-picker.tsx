"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LabelKind, WorkspaceLabel } from "@/lib/domain/types"
import { displayLabelName, normalizeLabelName } from "@/lib/labels/book"
import { insertAtToken, parseAtQuery, suggestLabels } from "@/lib/labels/query"
const CREATE_KINDS: Array<{ kind: LabelKind; label: string }> = [
  { kind: "place", label: "Place" },
  { kind: "tag", label: "Tag" },
  { kind: "person", label: "Person" },
]

interface LabelPickerProps {
  labels: WorkspaceLabel[]
  selectedIds: number[]
  onSelectedIdsChange: (ids: number[]) => void
  onUpsertLabel: (name: string, kind: LabelKind) => WorkspaceLabel
}

export function LabelPicker({ labels, selectedIds, onSelectedIdsChange, onUpsertLabel }: LabelPickerProps) {
  const [draft, setDraft] = useState("")
  const needle = normalizeLabelName(draft)
  const suggestions = suggestLabels(labels, needle).filter((label) => !selectedIds.includes(label.id))
  const canCreate = Boolean(needle && !labels.some((label) => label.name === needle))

  const add = (label: WorkspaceLabel) => {
    if (!selectedIds.includes(label.id)) {
      onSelectedIdsChange([...selectedIds, label.id])
    }
    setDraft("")
  }

  const create = (kind: LabelKind) => {
    if (!needle) {
      return
    }
    add(onUpsertLabel(needle, kind))
  }

  const selected = labels.filter((label) => selectedIds.includes(label.id))

  return (
    <div className="space-y-2">
      <Label htmlFor="workspace-labels">@ tags</Label>
      <p className="text-xs text-muted-readable">
        Place, tag, or person. Type @home or create @kitchen.
      </p>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((label) => (
            <Badge key={label.id} variant="secondary" className="gap-1">
              {displayLabelName(label)}
              <button
                type="button"
                className="rounded-full"
                aria-label={`Remove ${displayLabelName(label)}`}
                onClick={() => onSelectedIdsChange(selectedIds.filter((id) => id !== label.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        id="workspace-labels"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="@home @kitchen @akshit"
        className="rounded-xl bg-card/95"
        aria-label="Add an @ tag"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            if (suggestions[0]) {
              add(suggestions[0])
              return
            }
            if (canCreate) {
              create("tag")
            }
          }
        }}
      />
      {draft.trim() ? (
        <div className="space-y-2 rounded-xl border border-border/40 bg-card/95 p-2">
          {suggestions.map((label) => (
            <button
              key={label.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-accent/20"
              onClick={() => add(label)}
            >
              <span>{displayLabelName(label)}</span>
              <span className="text-xs text-muted-foreground">{label.kind}</span>
            </button>
          ))}
          {canCreate ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {CREATE_KINDS.map((item) => (
                <Button key={item.kind} type="button" size="sm" variant="outline" onClick={() => create(item.kind)}>
                  {item.label} @{needle}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface AtTokenSuggestProps {
  text: string
  cursor: number
  labels: WorkspaceLabel[]
  selectedIds: number[]
  onUpsertLabel: (name: string, kind: LabelKind) => WorkspaceLabel
  onApply: (next: { text: string; cursor: number; labelIds: number[] }) => void
}

export function AtTokenSuggest({
  text,
  cursor,
  labels,
  selectedIds,
  onUpsertLabel,
  onApply,
}: AtTokenSuggestProps) {
  const query = parseAtQuery(text, cursor)
  if (!query) {
    return null
  }
  const suggestions = suggestLabels(labels, query.query)
  const needle = normalizeLabelName(query.query)
  const applyLabel = (label: WorkspaceLabel) => {
    const next = insertAtToken(text, cursor, label.name)
    onApply({
      text: next.text,
      cursor: next.cursor,
      labelIds: selectedIds.includes(label.id) ? selectedIds : [...selectedIds, label.id],
    })
  }
  return (
    <div className="space-y-1 rounded-xl border border-border/40 bg-card/95 p-2">
      {suggestions.map((label) => (
        <button
          key={label.id}
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm"
          onClick={() => applyLabel(label)}
        >
          <span>{displayLabelName(label)}</span>
          <span className="text-xs text-muted-foreground">{label.kind}</span>
        </button>
      ))}
      {needle && !labels.some((label) => label.name === needle) ? (
        <div className="flex flex-wrap gap-2">
          {CREATE_KINDS.map((item) => (
            <Button
              key={item.kind}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyLabel(onUpsertLabel(needle, item.kind))}
            >
              {item.label} @{needle}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}


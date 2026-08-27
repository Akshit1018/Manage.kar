import { Badge } from "@/components/ui/badge"
import type { LabelKind, WorkspaceLabel } from "@/lib/domain/types"
import { displayLabelName } from "@/lib/labels/book"

function badgeVariant(kind: LabelKind): "default" | "secondary" | "outline" {
  switch (kind) {
    case "place":
      return "default"
    case "person":
      return "outline"
    case "tag":
      return "secondary"
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function LabelChips({ labels }: { labels: WorkspaceLabel[] }) {
  if (labels.length === 0) {
    return null
  }
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <Badge key={label.id} variant={badgeVariant(label.kind)}>
          {displayLabelName(label)}
        </Badge>
      ))}
    </div>
  )
}

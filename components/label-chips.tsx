import { Badge } from "@/components/ui/badge"
import type { WorkspaceLabel } from "@/lib/domain/types"
import { displayLabelName } from "@/lib/labels/book"
import { labelColor, labelColorClasses } from "@/lib/labels/palette"
import { cn } from "@/lib/utils"

export function LabelChips({ labels }: { labels: WorkspaceLabel[] }) {
  if (labels.length === 0) {
    return null
  }
  return (
    <div className="mk-label-chips">
      {labels.map((label) => (
        <Badge key={label.id} variant="outline" className={cn(labelColorClasses(labelColor(label)))}>
          {displayLabelName(label)}
        </Badge>
      ))}
    </div>
  )
}

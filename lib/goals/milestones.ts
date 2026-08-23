import type { Goal, GoalMilestone } from "@/lib/domain/types"

export function addMilestone(goal: Goal, title: string, dueDate: string, id: number): Goal {
  const trimmed = title.trim()
  if (!trimmed) {
    throw new Error("Milestone title is required.")
  }
  const milestones: GoalMilestone[] = [
    ...goal.milestones,
    { id, title: trimmed, completed: false, dueDate },
  ]
  const completedCount = milestones.filter((milestone) => milestone.completed).length
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : goal.progress
  return { ...goal, milestones, progress }
}

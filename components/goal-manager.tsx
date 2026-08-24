"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Target, Plus, Calendar, TrendingUp, Award, CheckCircle2, Trash2 } from "lucide-react"
import type { Goal, Workspace } from "@/lib/domain/types"
import { allocateEntityId } from "@/lib/store/workspace"
import { addMilestone } from "@/lib/goals/milestones"

interface GoalManagerProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  persist: (mutator: (current: Workspace) => Workspace) => Workspace
}

export function GoalManager({ isOpen, onClose, workspace, persist }: GoalManagerProps) {
  const goals = workspace.goals

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [titleError, setTitleError] = useState("")
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<number, { title: string; dueDate: string }>>({})
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal" as Goal["category"],
    priority: "medium" as Goal["priority"],
    targetDate: "",
  })

  const createGoal = () => {
    const title = newGoal.title.trim()
    if (!title) {
      setTitleError("Add a goal title before saving.")
      return
    }

    persist((current) => {
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        goals: [
          {
            id: allocated.id,
            ...newGoal,
            title,
            progress: 0,
            milestones: [],
            status: "active",
            createdAt: new Date().toISOString(),
          },
          ...allocated.workspace.goals,
        ],
      }
    })
    setNewGoal({
      title: "",
      description: "",
      category: "personal",
      priority: "medium",
      targetDate: "",
    })
    setTitleError("")
    setShowCreateForm(false)
  }

  const updateGoalProgress = (goalId: number, progress: number) => {
    persist((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              progress: Math.min(100, Math.max(0, progress)),
              status: progress >= 100 ? "completed" : goal.status === "completed" ? "active" : goal.status,
            }
          : goal,
      ),
    }))
  }

  const setGoalStatus = (goalId: number, status: Goal["status"]) => {
    persist((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, status, progress: status === "completed" ? 100 : goal.progress }
          : goal,
      ),
    }))
  }

  const deleteGoal = (goalId: number) => {
    if (!window.confirm("Delete this goal? You can undo from the toast for a few seconds.")) {
      return
    }
    let removed: Goal | undefined
    persist((current) => {
      removed = current.goals.find((goal) => goal.id === goalId)
      return { ...current, goals: current.goals.filter((goal) => goal.id !== goalId) }
    })
    if (removed) {
      const snapshot = removed
      toast("Goal deleted", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => persist((current) => ({ ...current, goals: [...current.goals, snapshot] })),
        },
      })
    }
  }

  const createMilestone = (goalId: number) => {
    const draft = milestoneDrafts[goalId] ?? { title: "", dueDate: "" }
    const title = draft.title.trim()
    if (!title) {
      toast.error("Add a milestone title before saving.")
      return
    }
    persist((current) => {
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        goals: allocated.workspace.goals.map((goal) =>
          goal.id === goalId
            ? addMilestone(goal, title, draft.dueDate || goal.targetDate || new Date().toISOString().slice(0, 10), allocated.id)
            : goal,
        ),
      }
    })
    setMilestoneDrafts((current) => ({ ...current, [goalId]: { title: "", dueDate: "" } }))
  }

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    persist((current) => ({
      ...current,
      goals: current.goals.map((goal) => {
        if (goal.id !== goalId) {
          return goal
        }
        const updatedMilestones = goal.milestones.map((milestone) =>
          milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone,
        )
        const completedCount = updatedMilestones.filter((milestone) => milestone.completed).length
        const progress = updatedMilestones.length > 0 ? (completedCount / updatedMilestones.length) * 100 : 0
        return { ...goal, milestones: updatedMilestones, progress }
      }),
    }))
  }

  const getCategoryColor = (category: Goal["category"]) => {
    const colors = {
      personal: "bg-purple-500/10 text-purple-500",
      work: "bg-blue-500/10 text-blue-500",
      health: "bg-green-500/10 text-green-500",
      learning: "bg-orange-500/10 text-orange-500",
      financial: "bg-yellow-500/10 text-yellow-500",
    }
    return colors[category]
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-sans flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Goal Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{goals.filter((g) => g.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{goals.filter((g) => g.status === "completed").length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">
                    {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / Math.max(goals.length, 1))}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Award className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">
                    {goals.reduce((acc, goal) => acc + goal.milestones.filter((m) => m.completed).length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Milestones</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Create Goal Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold font-sans">Your Goals</h3>
            <Button onClick={() => setShowCreateForm(true)} className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>

          {/* Create Goal Form */}
          {showCreateForm && (
            <Card className="glass-card p-6 rounded-2xl">
              <h4 className="font-semibold font-sans mb-4">Create New Goal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Goal Title</Label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="What do you want to achieve?"
                  />
                  {titleError ? <p className="text-sm text-destructive">{titleError}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Target Date</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value: Goal["category"]) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value: Goal["priority"]) => setNewGoal({ ...newGoal, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Describe your goal in detail..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={createGoal} disabled={!newGoal.title.trim()}>
                  Create Goal
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Goals List */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet. Create one and it will stay on this device.</p>
            ) : null}
            {goals.map((goal) => (
              <Card key={goal.id} className="glass-card p-6 rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold font-sans">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                        <Badge
                          variant={
                            goal.priority === "high"
                              ? "destructive"
                              : goal.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {goal.priority} priority
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold text-primary">{goal.progress}%</p>
                      <p className="text-sm text-muted-foreground">{goal.status}</p>
                      <div className="flex justify-end gap-2">
                        {goal.status !== "completed" ? (
                          <Button size="sm" variant="outline" onClick={() => setGoalStatus(goal.id, "completed")}>
                            Mark done
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setGoalStatus(goal.id, "active")}>
                            Reopen
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {goal.title}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, goal.progress - 10)}
                          disabled={goal.progress <= 0}
                        >
                          -10%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, goal.progress + 10)}
                          disabled={goal.progress >= 100}
                        >
                          +10%
                        </Button>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Milestones</h5>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={milestoneDrafts[goal.id]?.title ?? ""}
                        onChange={(event) =>
                          setMilestoneDrafts((current) => ({
                            ...current,
                            [goal.id]: {
                              title: event.target.value,
                              dueDate: current[goal.id]?.dueDate ?? "",
                            },
                          }))
                        }
                        placeholder="Add a milestone"
                        aria-label={`Milestone title for ${goal.title}`}
                      />
                      <Input
                        type="date"
                        value={milestoneDrafts[goal.id]?.dueDate ?? ""}
                        onChange={(event) =>
                          setMilestoneDrafts((current) => ({
                            ...current,
                            [goal.id]: {
                              title: current[goal.id]?.title ?? "",
                              dueDate: event.target.value,
                            },
                          }))
                        }
                        aria-label={`Milestone due date for ${goal.title}`}
                      />
                      <Button type="button" variant="outline" onClick={() => createMilestone(goal.id)}>
                        Add
                      </Button>
                    </div>
                    {goal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-3 p-2 bg-accent/20 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => toggleMilestone(goal.id, milestone.id)}
                          aria-label={
                            milestone.completed
                              ? `Mark ${milestone.title} incomplete`
                              : `Complete ${milestone.title}`
                          }
                        >
                          {milestone.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <p className={`text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "No date"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

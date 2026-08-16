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
import { Target, Plus, Calendar, TrendingUp, Award, CheckCircle2 } from "lucide-react"

interface Goal {
  id: number
  title: string
  description: string
  category: "personal" | "work" | "health" | "learning" | "financial"
  priority: "high" | "medium" | "low"
  targetDate: string
  progress: number
  milestones: { id: number; title: string; completed: boolean; dueDate: string }[]
  status: "active" | "completed" | "paused"
  createdAt: string
}

interface GoalManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function GoalManager({ isOpen, onClose }: GoalManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: "Learn React Development",
      description: "Master React and build 3 projects",
      category: "learning",
      priority: "high",
      targetDate: "2024-06-30",
      progress: 65,
      milestones: [
        { id: 1, title: "Complete React basics course", completed: true, dueDate: "2024-02-15" },
        { id: 2, title: "Build first React project", completed: true, dueDate: "2024-03-15" },
        { id: 3, title: "Learn React hooks", completed: false, dueDate: "2024-04-15" },
        { id: 4, title: "Build portfolio website", completed: false, dueDate: "2024-05-15" },
      ],
      status: "active",
      createdAt: "2024-01-01",
    },
    {
      id: 2,
      title: "Run a Marathon",
      description: "Complete a full 26.2 mile marathon",
      category: "health",
      priority: "medium",
      targetDate: "2024-10-15",
      progress: 30,
      milestones: [
        { id: 1, title: "Run 5K consistently", completed: true, dueDate: "2024-03-01" },
        { id: 2, title: "Complete 10K race", completed: false, dueDate: "2024-05-01" },
        { id: 3, title: "Run half marathon", completed: false, dueDate: "2024-08-01" },
      ],
      status: "active",
      createdAt: "2024-01-15",
    },
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal" as Goal["category"],
    priority: "medium" as Goal["priority"],
    targetDate: "",
  })

  const createGoal = () => {
    if (!newGoal.title.trim()) return

    const goal: Goal = {
      id: Date.now(),
      ...newGoal,
      progress: 0,
      milestones: [],
      status: "active",
      createdAt: new Date().toISOString(),
    }

    setGoals([goal, ...goals])
    setNewGoal({
      title: "",
      description: "",
      category: "personal",
      priority: "medium",
      targetDate: "",
    })
    setShowCreateForm(false)
  }

  const updateGoalProgress = (goalId: number, progress: number) => {
    setGoals(
      goals.map((goal) => (goal.id === goalId ? { ...goal, progress: Math.min(100, Math.max(0, progress)) } : goal)),
    )
  }

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === goalId) {
          const updatedMilestones = goal.milestones.map((milestone) =>
            milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone,
          )
          const completedCount = updatedMilestones.filter((m) => m.completed).length
          const progress = updatedMilestones.length > 0 ? (completedCount / updatedMilestones.length) * 100 : 0

          return { ...goal, milestones: updatedMilestones, progress }
        }
        return goal
      }),
    )
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
      <DialogContent className="glass-modal max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
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
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{goal.progress}%</p>
                      <p className="text-sm text-muted-foreground">Complete</p>
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

                  {goal.milestones.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Milestones</h5>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-3 p-2 bg-accent/20 rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={() => toggleMilestone(goal.id, milestone.id)}
                            >
                              {milestone.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <p
                                className={`text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {milestone.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

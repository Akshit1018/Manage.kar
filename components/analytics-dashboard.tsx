"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, BarChart3, Brain, Clock, Target, Zap } from "lucide-react"
import { MobileSheet } from "@/components/mobile-sheet"
import type { Habit, Task } from "@/lib/domain/types"

interface AnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
  tasks?: Task[]
  habits?: Habit[]
}

export function AnalyticsDashboard({ isOpen, onClose, tasks = [], habits = [] }: AnalyticsDashboardProps) {
  const [insights, setInsights] = useState<
    Array<{
      type: string
      title: string
      description: string
      recommendation: string
      impact: string
      icon: typeof Target
    }>
  >([])

  useEffect(() => {
    const generateInsights = () => {
      const completedTasks = tasks.filter((t) => t.completed).length
      const totalTasks = tasks.length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      const activeHabits = habits.filter((h) => h.completedToday).length
      const totalHabits = habits.length
      const habitConsistency = totalHabits > 0 ? (activeHabits / totalHabits) * 100 : 0

      return [
        {
          type: "habits",
          title: "Habits today",
          description: `${activeHabits} of ${totalHabits} habits marked done today (${habitConsistency.toFixed(0)}%).`,
          recommendation: totalHabits === 0 ? "Add one habit you can keep." : "Keep the list short enough to finish.",
          impact: "medium",
          icon: Target,
        },
        {
          type: "tasks",
          title: "Task completion",
          description: `${completedTasks} of ${totalTasks} tasks complete (${completionRate.toFixed(0)}%).`,
          recommendation: totalTasks === 0 ? "Add a task to start measuring." : "Finish or delete stale tasks.",
          impact: "high",
          icon: BarChart3,
        },
      ]
    }

    setInsights(generateInsights())
  }, [tasks, habits])

  const productivityScore = Math.round(
    (tasks.filter((t) => t.completed).length / Math.max(tasks.length, 1)) * 50 +
      (habits.filter((h) => h.completedToday).length / Math.max(habits.length, 1)) * 50,
  )

  return (
    <MobileSheet open={isOpen} onClose={onClose} title="Counts" wide>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Counts come from this device&apos;s workspace. Recommendations are heuristics, not a model.
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-sans">Performance Overview</h3>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{productivityScore}</p>
                  <p className="text-sm text-muted-foreground">Productivity Score</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{tasks.filter((t) => t.completed).length}</p>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{tasks.filter((t) => !t.completed).length}</p>
                  <p className="text-sm text-muted-foreground">Open Tasks</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{habits.filter((h) => h.completedToday).length}</p>
                  <p className="text-sm text-muted-foreground">Habits Done</p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Insights */}
          <div>
            <h3 className="text-lg font-semibold font-sans mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Workspace notes
            </h3>
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <Card key={index} className="glass-card p-4 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-xl ${
                          insight.impact === "high"
                            ? "bg-red-500/10"
                            : insight.impact === "medium"
                              ? "bg-yellow-500/10"
                              : "bg-green-500/10"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            insight.impact === "high"
                              ? "text-red-500"
                              : insight.impact === "medium"
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold font-sans">{insight.title}</h4>
                          <Badge
                            variant={
                              insight.impact === "high"
                                ? "destructive"
                                : insight.impact === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <p className="text-sm font-medium text-primary">{insight.recommendation}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <Card className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold font-sans mb-4">All items</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Task Completion</span>
                <span className="text-sm text-muted-foreground">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(tasks.filter((t) => t.completed).length / Math.max(tasks.length, 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Habit Consistency</span>
                <span className="text-sm text-muted-foreground">
                  {habits.filter((h) => h.completedToday).length}/{habits.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(habits.filter((h) => h.completedToday).length / Math.max(habits.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            Task completion is all stored tasks, not a calendar week. Habit consistency is today only.
          </p>
        </div>
    </MobileSheet>
  )
}

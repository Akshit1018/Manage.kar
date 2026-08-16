"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Clock, Target, Brain, Award, Zap } from "lucide-react"

interface AnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
  tasks?: any[]
  habits?: any[]
}

export function AnalyticsDashboard({ isOpen, onClose, tasks = [], habits = [] }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week")
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => {
    // Generate AI-powered insights
    const generateInsights = () => {
      const completedTasks = tasks.filter((t) => t.completed).length
      const totalTasks = tasks.length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      const activeHabits = habits.filter((h) => h.completedToday).length
      const totalHabits = habits.length
      const habitConsistency = totalHabits > 0 ? (activeHabits / totalHabits) * 100 : 0

      return [
        {
          type: "productivity",
          title: "Peak Productivity Hours",
          description: "You're most productive between 9-11 AM",
          recommendation: "Schedule important tasks during this window",
          impact: "high",
          icon: TrendingUp,
        },
        {
          type: "habits",
          title: "Habit Streak Analysis",
          description: `${habitConsistency.toFixed(0)}% habit completion rate this week`,
          recommendation: "Focus on 2-3 core habits for better consistency",
          impact: "medium",
          icon: Target,
        },
        {
          type: "tasks",
          title: "Task Completion Pattern",
          description: `${completionRate.toFixed(0)}% task completion rate`,
          recommendation: "Break large tasks into smaller, manageable chunks",
          impact: "high",
          icon: BarChart3,
        },
        {
          type: "focus",
          title: "Focus Session Optimization",
          description: "Average focus session: 25 minutes",
          recommendation: "Try 45-minute deep work blocks for complex tasks",
          impact: "medium",
          icon: Brain,
        },
      ]
    }

    setInsights(generateInsights())
  }, [tasks, habits, timeRange])

  const productivityScore = Math.round(
    (tasks.filter((t) => t.completed).length / Math.max(tasks.length, 1)) * 50 +
      (habits.filter((h) => h.completedToday).length / Math.max(habits.length, 1)) * 50,
  )

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-sans flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Insights
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-sans">Performance Overview</h3>
            <Select value={timeRange} onValueChange={(value: "week" | "month" | "quarter") => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
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
                  <p className="text-2xl font-bold font-sans">4.2h</p>
                  <p className="text-sm text-muted-foreground">Focus Time</p>
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
              AI-Powered Insights
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
            <h3 className="text-lg font-semibold font-sans mb-4">Weekly Progress</h3>
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

          {/* Action Items */}
          <Card className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold font-sans mb-4">Recommended Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm">Schedule your most important task for 9-11 AM tomorrow</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Try a 45-minute focus session for your next complex task</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-500/5 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Reduce active habits to 3 core ones for better consistency</span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

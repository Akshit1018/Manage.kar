"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Target, TrendingUp, Calendar, CheckCircle2, Circle, Edit, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileSheet } from "@/components/mobile-sheet"

interface Habit {
  id: number
  name: string
  description?: string
  category: "health" | "productivity" | "learning" | "lifestyle" | "fitness" | "mindfulness"
  frequency: "daily" | "weekly" | "custom"
  customDays?: string[]
  goal?: number
  unit?: string
  streak: number
  completed: boolean
  completedToday: boolean
  reminders: boolean
  reminderTime?: string
  createdAt: string
  history: { date: string; completed: boolean; value?: number }[]
}

interface HabitDashboardProps {
  isOpen: boolean
  onClose: () => void
  habits: Habit[]
  onHabitToggle: (habitId: number) => void
  onAddHabit: () => void
  onEditHabit: (habit: Habit) => void
}

export function HabitDashboard({
  isOpen,
  onClose,
  habits,
  onHabitToggle,
  onAddHabit,
  onEditHabit,
}: HabitDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "habits" | "analytics">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const categoryOptions = [
    { value: "all", label: "All Categories", icon: "📋" },
    { value: "health", label: "Health", icon: "🏥" },
    { value: "fitness", label: "Fitness", icon: "💪" },
    { value: "mindfulness", label: "Mindfulness", icon: "🧘" },
    { value: "productivity", label: "Productivity", icon: "⚡" },
    { value: "learning", label: "Learning", icon: "📚" },
    { value: "lifestyle", label: "Lifestyle", icon: "🌟" },
  ]

  const filteredHabits = habits.filter((habit) => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || habit.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const completedToday = habits.filter((habit) => habit.completedToday).length
  const totalHabits = habits.length
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0
  const averageStreak =
    totalHabits > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.streak, 0) / totalHabits) : 0

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500"
    if (streak >= 14) return "text-blue-500"
    if (streak >= 7) return "text-primary"
    return "text-orange-500"
  }

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find((opt) => opt.value === category)
    return option?.icon || "📋"
  }

  return (
    <MobileSheet
      open={isOpen}
      onClose={onClose}
      title="Habit tracker"
      wide
      footer={
        <div className="flex w-full gap-2">
          <Button variant="outline" onClick={onClose} className="mk-touch flex-1 rounded-xl bg-transparent">
            Close
          </Button>
          <Button onClick={onAddHabit} className="mk-touch rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add habit
          </Button>
        </div>
      }
    >
      <div>
          <div className="flex border-b border-border/20 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex-1 p-3 text-sm font-medium transition-colors",
                activeTab === "overview"
                  ? "text-primary bg-primary/10 border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Target className="h-4 w-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("habits")}
              className={cn(
                "flex-1 p-3 text-sm font-medium transition-colors",
                activeTab === "habits"
                  ? "text-primary bg-primary/10 border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Habits ({habits.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex-1 p-3 text-sm font-medium transition-colors",
                activeTab === "analytics"
                  ? "text-primary bg-primary/10 border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-sans">{completedToday}</p>
                        <p className="text-xs text-muted-foreground font-serif">Today</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Target className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-sans">{totalHabits}</p>
                        <p className="text-xs text-muted-foreground font-serif">Total</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-xl">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-sans">{completionRate}%</p>
                        <p className="text-xs text-muted-foreground font-serif">Rate</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Calendar className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-sans">{averageStreak}</p>
                        <p className="text-xs text-muted-foreground font-serif">Avg Streak</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Progress Overview */}
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium font-sans">Today's Progress</h3>
                    <span className="text-sm text-muted-foreground">
                      {completedToday}/{totalHabits}
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </Card>

                {/* Recent Habits */}
                <div>
                  <h3 className="font-medium font-sans mb-3">Today's Habits</h3>
                  <div className="space-y-2">
                    {habits.slice(0, 5).map((habit) => (
                      <Card
                        key={habit.id}
                        className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-3 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => onHabitToggle(habit.id)}
                          >
                            {habit.completedToday ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <p className="text-sm font-serif text-foreground">{habit.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs">{getCategoryIcon(habit.category)}</span>
                              <span className={cn("text-xs font-medium", getStreakColor(habit.streak))}>
                                {habit.streak} day streak
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "habits" && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search habits..."
                      className="pl-10 glass rounded-xl"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48 glass rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={onAddHabit} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Habit
                  </Button>
                </div>

                {/* Habits List */}
                <div className="space-y-3">
                  {filteredHabits.length > 0 ? (
                    filteredHabits.map((habit) => (
                      <Card
                        key={habit.id}
                        className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => onHabitToggle(habit.id)}
                          >
                            {habit.completedToday ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{getCategoryIcon(habit.category)}</span>
                              <p className="font-medium font-sans text-foreground">{habit.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {habit.frequency}
                              </Badge>
                            </div>
                            {habit.description && (
                              <p className="text-sm text-muted-foreground font-serif mb-2">{habit.description}</p>
                            )}
                            <div className="flex items-center gap-4">
                              <span className={cn("text-sm font-medium", getStreakColor(habit.streak))}>
                                🔥 {habit.streak} day streak
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Goal: {habit.goal} {habit.unit}
                              </span>
                              {habit.reminders && (
                                <span className="text-sm text-muted-foreground">🔔 {habit.reminderTime}</span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => onEditHabit(habit)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground font-serif">
                        {searchQuery || categoryFilter !== "all"
                          ? "No matching habits found"
                          : "No habits yet. Create your first habit!"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                {/* Category Breakdown */}
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                  <h3 className="font-medium font-sans mb-4">Habits by Category</h3>
                  <div className="space-y-3">
                    {categoryOptions.slice(1).map((category) => {
                      const categoryHabits = habits.filter((habit) => habit.category === category.value)
                      const percentage = totalHabits > 0 ? (categoryHabits.length / totalHabits) * 100 : 0

                      return (
                        <div key={category.value} className="flex items-center gap-3">
                          <span className="text-sm">{category.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-serif">{category.label}</span>
                              <span className="text-sm text-muted-foreground">{categoryHabits.length}</span>
                            </div>
                            <Progress value={percentage} className="h-1" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Streak Leaderboard */}
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-xl">
                  <h3 className="font-medium font-sans mb-4">Longest Streaks</h3>
                  <div className="space-y-2">
                    {habits
                      .sort((a, b) => b.streak - a.streak)
                      .slice(0, 5)
                      .map((habit, index) => (
                        <div key={habit.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm">{getCategoryIcon(habit.category)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-serif text-foreground">{habit.name}</p>
                          </div>
                          <span className={cn("text-sm font-medium", getStreakColor(habit.streak))}>
                            {habit.streak} days
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
      </div>
    </MobileSheet>
  )
}

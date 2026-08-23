"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import type { Habit } from "@/lib/domain/types"
import { isHabitScheduledOn } from "@/lib/habits/schedule"
import { CheckCircle2, Circle, Edit, Plus } from "lucide-react"

interface HabitListProps {
  habits: Habit[]
  searchQuery: string
  todayKey: string
  weekStartsOn: "sunday" | "monday"
  onAddHabit: () => void
  onToggleHabit: (habitId: number) => void
  onEditHabit: (habit: Habit) => void
}

export function HabitList({
  habits,
  searchQuery,
  todayKey,
  weekStartsOn,
  onAddHabit,
  onToggleHabit,
  onEditHabit,
}: HabitListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Habits</h3>
        <Button onClick={onAddHabit}>
          <Plus className="h-4 w-4 mr-2" />
          Add habit
        </Button>
      </div>
      {habits.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching habits" : "No habits yet"}
          description={
            searchQuery ? "Nothing matches that search." : "Track one daily action. Completions reset at local midnight."
          }
          actionLabel={searchQuery ? undefined : "Add habit"}
          onAction={searchQuery ? undefined : onAddHabit}
        />
      ) : (
        habits.map((habit) => (
          <Card key={habit.id} className="p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleHabit(habit.id)}
                aria-label={habit.completedToday ? `Unmark ${habit.name} for today` : `Complete ${habit.name} today`}
              >
                {habit.completedToday ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </Button>
              <div className="flex-1">
                <p>{habit.name}</p>
                <p className="text-xs text-muted-foreground">
                  Streak {habit.streak}
                  {isHabitScheduledOn(habit, todayKey, weekStartsOn) ? "" : " · off today"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEditHabit(habit)} aria-label={`Edit ${habit.name}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

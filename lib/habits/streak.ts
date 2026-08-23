import type { Habit } from "@/lib/domain/types"
import { shiftLocalDate } from "@/lib/dates/due-date"

export function computeStreak(
  history: Array<{ date: string; completed: boolean }>,
  today: string,
): number {
  const completed = new Set(history.filter((entry) => entry.completed).map((entry) => entry.date))
  let cursor = completed.has(today) ? today : shiftLocalDate(today, -1)
  if (!completed.has(cursor)) {
    return 0
  }

  let streak = 0
  while (completed.has(cursor)) {
    streak += 1
    cursor = shiftLocalDate(cursor, -1)
  }
  return streak
}

export function toggleHabitOnDate(habit: Habit, date: string): Habit {
  const alreadyCompleted = habit.history.some((entry) => entry.date === date && entry.completed)
  const history = habit.history.filter((entry) => entry.date !== date)
  history.push({ date, completed: !alreadyCompleted })
  return { ...habit, history }
}

export function hydrateHabit(habit: Habit, today: string): Habit {
  const completedToday = habit.history.some((entry) => entry.date === today && entry.completed)
  return {
    ...habit,
    completedToday,
    completed: completedToday,
    streak: computeStreak(habit.history, today),
  }
}

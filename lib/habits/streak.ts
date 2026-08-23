import type { Habit } from "@/lib/domain/types"
import { shiftLocalDate } from "@/lib/dates/due-date"
import { isHabitScheduledOn } from "@/lib/habits/schedule"

export function computeStreak(
  history: Array<{ date: string; completed: boolean }>,
  today: string,
  isScheduled: (date: string) => boolean = () => true,
): number {
  const completed = new Set(history.filter((entry) => entry.completed).map((entry) => entry.date))
  let cursor = today
  if (!completed.has(today)) {
    cursor = shiftLocalDate(today, -1)
    while (!isScheduled(cursor) && cursor > "1970-01-01") {
      cursor = shiftLocalDate(cursor, -1)
    }
  }
  if (!completed.has(cursor) || !isScheduled(cursor)) {
    return 0
  }

  let streak = 0
  let safety = 0
  while (safety < 4000) {
    safety += 1
    if (!isScheduled(cursor)) {
      cursor = shiftLocalDate(cursor, -1)
      continue
    }
    if (!completed.has(cursor)) {
      break
    }
    streak += 1
    cursor = shiftLocalDate(cursor, -1)
  }
  return streak
}

export function toggleHabitOnDate(
  habit: Habit,
  date: string,
  weekStartsOn: "sunday" | "monday" = "monday",
): Habit {
  if (!isHabitScheduledOn(habit, date, weekStartsOn)) {
    return habit
  }
  const alreadyCompleted = habit.history.some((entry) => entry.date === date && entry.completed)
  const history = habit.history.filter((entry) => entry.date !== date)
  history.push({ date, completed: !alreadyCompleted })
  return { ...habit, history }
}

export function hydrateHabit(
  habit: Habit,
  today: string,
  weekStartsOn: "sunday" | "monday" = "monday",
): Habit {
  const completedToday = habit.history.some((entry) => entry.date === today && entry.completed)
  return {
    ...habit,
    completedToday,
    completed: completedToday,
    streak: computeStreak(habit.history, today, (date) => isHabitScheduledOn(habit, date, weekStartsOn)),
  }
}

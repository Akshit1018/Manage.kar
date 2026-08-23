import type { Habit } from "@/lib/domain/types"
import { weekdayName, weekdayOrder } from "@/lib/dates/week"

export function scheduledWeekdays(habit: Habit, weekStartsOn: "sunday" | "monday"): string[] {
  if (habit.frequency === "daily") {
    return weekdayOrder(weekStartsOn)
  }
  if (habit.customDays && habit.customDays.length > 0) {
    return habit.customDays
  }
  if (habit.frequency === "weekly") {
    return [weekStartsOn === "sunday" ? "Sunday" : "Monday"]
  }
  return []
}

export function isHabitScheduledOn(
  habit: Habit,
  isoDate: string,
  weekStartsOn: "sunday" | "monday" = "monday",
): boolean {
  return scheduledWeekdays(habit, weekStartsOn).includes(weekdayName(isoDate))
}

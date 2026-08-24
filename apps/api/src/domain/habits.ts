import { shiftLocalDate, weekdayName, weekdayOrder } from "./dates.js"

export type HabitFrequency = "daily" | "weekly" | "custom"

export function scheduledWeekdays(
  frequency: HabitFrequency,
  customDays: string[],
  weekStartsOn: "sunday" | "monday",
): string[] {
  if (frequency === "daily") {
    return weekdayOrder(weekStartsOn)
  }
  if (customDays.length > 0) {
    return customDays
  }
  if (frequency === "weekly") {
    return [weekStartsOn === "sunday" ? "Sunday" : "Monday"]
  }
  return []
}

export function isHabitScheduledOn(
  frequency: HabitFrequency,
  customDays: string[],
  isoDate: string,
  weekStartsOn: "sunday" | "monday" = "monday",
): boolean {
  return scheduledWeekdays(frequency, customDays, weekStartsOn).includes(weekdayName(isoDate))
}

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

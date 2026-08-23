export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

export function weekdayOrder(weekStartsOn: "sunday" | "monday"): string[] {
  if (weekStartsOn === "sunday") {
    return [...WEEKDAYS]
  }
  return [...WEEKDAYS.slice(1), WEEKDAYS[0]]
}

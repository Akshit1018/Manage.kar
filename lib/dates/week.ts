export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

export function weekdayOrder(weekStartsOn: "sunday" | "monday"): string[] {
  if (weekStartsOn === "sunday") {
    return [...WEEKDAYS]
  }
  return [...WEEKDAYS.slice(1), WEEKDAYS[0]]
}

export function weekdayName(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}

export function daysUntilEndOfWeek(isoDate: string, weekStartsOn: "sunday" | "monday"): number {
  const order = weekdayOrder(weekStartsOn)
  const index = order.indexOf(weekdayName(isoDate))
  return order.length - 1 - Math.max(0, index)
}

export function endOfWeek(isoDate: string, weekStartsOn: "sunday" | "monday"): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + daysUntilEndOfWeek(isoDate, weekStartsOn))
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getDate()).padStart(2, "0")
  return `${nextYear}-${nextMonth}-${nextDay}`
}

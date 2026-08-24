export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function shiftLocalDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const next = new Date(year, month - 1, day + days)
  return localDateKey(next)
}

export function weekdayName(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "long" })
}

export function weekdayOrder(weekStartsOn: "sunday" | "monday"): string[] {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  if (weekStartsOn === "sunday") {
    return days
  }
  return [...days.slice(1), days[0]]
}

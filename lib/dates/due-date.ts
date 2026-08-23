import type { RecurringRule } from "@/lib/domain/types"

export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function localDateKey(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function shiftLocalDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}

export function normalizeDueDate(value: string, now = new Date()): string {
  const trimmed = value.trim()
  if (ISO_DATE.test(trimmed)) {
    return trimmed
  }

  const today = localDateKey(now)
  switch (trimmed.toLowerCase()) {
    case "today":
      return today
    case "tomorrow":
      return shiftLocalDate(today, 1)
    case "this week":
      return shiftLocalDate(today, 3)
    case "next week":
      return shiftLocalDate(today, 7)
    case "this month":
      return shiftLocalDate(today, 14)
    default:
      return today
  }
}

export function formatDueDate(isoDate: string, format: DateFormat): string {
  const normalized = ISO_DATE.test(isoDate) ? isoDate : normalizeDueDate(isoDate)
  const [year, month, day] = normalized.split("-")
  switch (format) {
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`
    default: {
      const exhaustive: never = format
      return exhaustive
    }
  }
}

export function formatTimestamp(value: string, format: DateFormat): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return formatDueDate(localDateKey(date), format)
}

export function nextDueDate(isoDate: string, rule: RecurringRule): string {
  const normalized = normalizeDueDate(isoDate)
  const [year, month, day] = normalized.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  switch (rule) {
    case "none":
      return normalized
    case "daily":
      date.setDate(date.getDate() + 1)
      return localDateKey(date)
    case "weekly":
      date.setDate(date.getDate() + 7)
      return localDateKey(date)
    case "monthly": {
      const targetMonth = date.getMonth() + 1
      const targetYear = date.getFullYear() + Math.floor(targetMonth / 12)
      const monthIndex = targetMonth % 12
      const lastDay = new Date(targetYear, monthIndex + 1, 0).getDate()
      return localDateKey(new Date(targetYear, monthIndex, Math.min(day, lastDay)))
    }
    default: {
      const exhaustive: never = rule
      return exhaustive
    }
  }
}

export function isDueOnOrBefore(isoDate: string, now = new Date()): boolean {
  return normalizeDueDate(isoDate, now) <= localDateKey(now)
}

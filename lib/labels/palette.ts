import type { LabelColor } from "@/lib/domain/types"

export const LABEL_COLORS: readonly LabelColor[] = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "purple",
]

export type { LabelColor }

export function isLabelColor(value: unknown): value is LabelColor {
  return typeof value === "string" && (LABEL_COLORS as readonly string[]).includes(value)
}

/** Stable palette pick so an unassigned label keeps the same color forever. */
export function defaultLabelColor(name: string): LabelColor {
  let hash = 0
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return LABEL_COLORS[hash % LABEL_COLORS.length]
}

export function labelColor(label: { name: string; color?: LabelColor }): LabelColor {
  return label.color ?? defaultLabelColor(label.name)
}

export function nextLabelColor(color: LabelColor): LabelColor {
  const index = LABEL_COLORS.indexOf(color)
  return LABEL_COLORS[(index + 1) % LABEL_COLORS.length]
}

/** Static class strings so Tailwind keeps them in the build. */
export function labelColorClasses(color: LabelColor): string {
  switch (color) {
    case "slate":
      return "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300"
    case "red":
      return "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300"
    case "orange":
      return "border-orange-500/30 bg-orange-500/15 text-orange-700 dark:text-orange-300"
    case "amber":
      return "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
    case "green":
      return "border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300"
    case "teal":
      return "border-teal-500/30 bg-teal-500/15 text-teal-700 dark:text-teal-300"
    case "blue":
      return "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300"
    case "purple":
      return "border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-300"
    default: {
      const exhaustive: never = color
      return exhaustive
    }
  }
}

export function labelColorDotClass(color: LabelColor): string {
  switch (color) {
    case "slate":
      return "bg-slate-500"
    case "red":
      return "bg-red-500"
    case "orange":
      return "bg-orange-500"
    case "amber":
      return "bg-amber-500"
    case "green":
      return "bg-green-600"
    case "teal":
      return "bg-teal-500"
    case "blue":
      return "bg-blue-500"
    case "purple":
      return "bg-purple-500"
    default: {
      const exhaustive: never = color
      return exhaustive
    }
  }
}

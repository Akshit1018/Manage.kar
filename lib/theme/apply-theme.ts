import type { ThemePreference } from "@/lib/domain/types"

export function resolveDarkMode(
  theme: ThemePreference,
  prefersDark: boolean,
): boolean {
  if (theme === "dark") {
    return true
  }
  if (theme === "light") {
    return false
  }
  return prefersDark
}

export function applyThemePreference(theme: ThemePreference): boolean {
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  const shouldUseDark = resolveDarkMode(theme, prefersDark)

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", shouldUseDark)
  }

  return shouldUseDark
}

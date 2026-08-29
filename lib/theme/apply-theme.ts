import type { AppearanceSkin, AppSettings, ThemePreference } from "@/lib/domain/types"

export function normalizeSkin(value: unknown): AppearanceSkin {
  switch (value) {
    case "classic":
    case "white":
    case "black":
    case "hermes":
      return value
    default:
      return "hermes"
  }
}

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

export function applyAppearance(settings: AppSettings): void {
  if (typeof document === "undefined") {
    return
  }
  applyThemePreference(settings.appearance.theme)
  document.documentElement.dataset.skin = normalizeSkin(settings.appearance.skin)
  document.documentElement.dataset.fontSize = settings.appearance.fontSize
  document.documentElement.dataset.animations = settings.appearance.animations ? "on" : "off"
}

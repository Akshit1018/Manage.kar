export function sanitizeAvatarUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== "https:") {
      return ""
    }
    return url.toString()
  } catch {
    return ""
  }
}

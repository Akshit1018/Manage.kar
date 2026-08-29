export const HERMES_DEFAULT_PORT = 9119
export const HERMES_WS_PATH = "/api/ws"
export const HERMES_STATUS_PATH = "/api/status"
export const HERMES_DEFAULT_BASE = `http://127.0.0.1:${HERMES_DEFAULT_PORT}`

export function normalizeHermesBaseUrl(input: string): string | null {
  const trimmed = input.trim()
  const raw = trimmed === "" ? HERMES_DEFAULT_BASE : trimmed.includes("://") ? trimmed : `http://${trimmed}`
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null
    }
    const path = url.pathname.replace(/\/+$/, "")
    return `${url.protocol}//${url.host}${path}`
  } catch {
    return null
  }
}

export function hermesStatusUrl(base: string): string {
  return `${normalizeHermesBaseUrl(base) ?? HERMES_DEFAULT_BASE}${HERMES_STATUS_PATH}`
}

export function hermesWsUrl(input: { base: string; token?: string }): string {
  const base = normalizeHermesBaseUrl(input.base) ?? HERMES_DEFAULT_BASE
  const url = new URL(base)
  const protocol = url.protocol === "https:" ? "wss:" : "ws:"
  const query = new URLSearchParams()
  if (input.token && input.token.trim() !== "") {
    query.set("token", input.token.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return `${protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}${HERMES_WS_PATH}${suffix}`
}

export function buildHermesWsUrl(input: {
  host?: string
  port?: number
  path?: string
  protocol?: "ws" | "wss"
  token?: string
  baseUrl?: string
}): string {
  if (input.baseUrl) {
    return hermesWsUrl({ base: input.baseUrl, token: input.token })
  }
  const host = input.host ?? "127.0.0.1"
  const port = input.port ?? HERMES_DEFAULT_PORT
  const path = input.path ?? HERMES_WS_PATH
  const protocol = input.protocol ?? "ws"
  const normalized = path.startsWith("/") ? path : `/${path}`
  const query = new URLSearchParams()
  if (input.token && input.token.trim() !== "") {
    query.set("token", input.token.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return `${protocol}://${host}:${port}${normalized}${suffix}`
}

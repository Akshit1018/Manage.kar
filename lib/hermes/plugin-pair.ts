import { normalizeHermesBaseUrl, HERMES_DEFAULT_BASE } from "./endpoint"

export const MANAGEKAR_PAIR_KIND = "managekar.pair.v1"
export const MANAGEKAR_PLUGIN_NAME = "managekar"
export const MANAGEKAR_PAIR_PATH = "/api/plugins/managekar/pair"
export const MANAGEKAR_CLAIM_PATH = "/api/plugins/managekar/claim"
export const MANAGEKAR_PAIR_TTL_MS = 10 * 60 * 1000

export interface ManagekarPairTicket {
  v: 1
  kind: typeof MANAGEKAR_PAIR_KIND
  pairId: string
  claimUrl: string
  qrUrl?: string
  hostLabel?: string
  expiresAt: string
}

export interface ManagekarClaimResult {
  endpoint: string
  token: string
  installId?: string
  version?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function pluginPairUrl(base: string): string {
  return `${normalizeHermesBaseUrl(base) ?? HERMES_DEFAULT_BASE}${MANAGEKAR_PAIR_PATH}`
}

export function pluginClaimUrl(base: string): string {
  return `${normalizeHermesBaseUrl(base) ?? HERMES_DEFAULT_BASE}${MANAGEKAR_CLAIM_PATH}`
}

export function pluginQrUrl(base: string, pairId: string): string {
  return `${normalizeHermesBaseUrl(base) ?? HERMES_DEFAULT_BASE}/pair/${encodeURIComponent(pairId)}`
}

export function buildManagekarPairTicket(input: {
  pairId: string
  claimUrl: string
  expiresAt: string
  qrUrl?: string
  hostLabel?: string
}): ManagekarPairTicket {
  return {
    v: 1,
    kind: MANAGEKAR_PAIR_KIND,
    pairId: input.pairId.trim(),
    claimUrl: input.claimUrl.trim(),
    expiresAt: input.expiresAt,
    ...(input.qrUrl ? { qrUrl: input.qrUrl } : {}),
    ...(input.hostLabel ? { hostLabel: input.hostLabel } : {}),
  }
}

export function parseManagekarPairTicket(value: unknown): ManagekarPairTicket | null {
  if (!isRecord(value) || value.v !== 1 || value.kind !== MANAGEKAR_PAIR_KIND) {
    return null
  }
  if (typeof value.pairId !== "string" || value.pairId.trim() === "") {
    return null
  }
  if (typeof value.claimUrl !== "string" || !isHttpUrl(value.claimUrl)) {
    return null
  }
  if (typeof value.expiresAt !== "string" || Number.isNaN(Date.parse(value.expiresAt))) {
    return null
  }
  return buildManagekarPairTicket({
    pairId: value.pairId,
    claimUrl: value.claimUrl,
    expiresAt: value.expiresAt,
    ...(typeof value.qrUrl === "string" && isHttpUrl(value.qrUrl) ? { qrUrl: value.qrUrl } : {}),
    ...(typeof value.hostLabel === "string" && value.hostLabel.trim() !== ""
      ? { hostLabel: value.hostLabel.trim().slice(0, 80) }
      : {}),
  })
}

export function compactPairPayload(ticket: ManagekarPairTicket): string {
  return `${MANAGEKAR_PAIR_KIND}|${ticket.pairId}|${ticket.claimUrl}`
}

function ticketFromPairPath(raw: string): ManagekarPairTicket | null {
  try {
    const url = new URL(raw)
    const match = url.pathname.match(/\/pair\/([^/]+)$/)
    if (!match?.[1]) {
      return null
    }
    const pairId = decodeURIComponent(match[1])
    const base = `${url.protocol}//${url.host}`
    return buildManagekarPairTicket({
      pairId,
      claimUrl: pluginClaimUrl(base),
      qrUrl: pluginQrUrl(base, pairId),
      expiresAt: new Date(Date.now() + MANAGEKAR_PAIR_TTL_MS).toISOString(),
    })
  } catch {
    return null
  }
}

export function parsePairPayload(raw: string): ManagekarPairTicket | null {
  const text = raw.trim()
  if (!text) {
    return null
  }
  if (text.startsWith("{")) {
    try {
      return parseManagekarPairTicket(JSON.parse(text))
    } catch {
      return null
    }
  }
  if (text.startsWith(`${MANAGEKAR_PAIR_KIND}|`)) {
    const [, pairId, claimUrl] = text.split("|")
    if (!pairId || !claimUrl || !isHttpUrl(claimUrl)) {
      return null
    }
    return buildManagekarPairTicket({
      pairId,
      claimUrl,
      expiresAt: new Date(Date.now() + MANAGEKAR_PAIR_TTL_MS).toISOString(),
    })
  }
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text)
      const pairId = url.searchParams.get("pair_id") ?? url.searchParams.get("pairId")
      const claim = url.searchParams.get("claim") ?? url.searchParams.get("claim_url")
      if (pairId && claim && isHttpUrl(claim)) {
        return buildManagekarPairTicket({
          pairId,
          claimUrl: claim,
          expiresAt: new Date(Date.now() + MANAGEKAR_PAIR_TTL_MS).toISOString(),
        })
      }
    } catch {
      return null
    }
    return ticketFromPairPath(text)
  }
  return null
}

export function parseManagekarClaimResult(value: unknown): ManagekarClaimResult | null {
  if (!isRecord(value) || typeof value.endpoint !== "string" || typeof value.token !== "string") {
    return null
  }
  if (!isHttpUrl(value.endpoint) || value.token.trim() === "") {
    return null
  }
  return {
    endpoint: value.endpoint.trim(),
    token: value.token.trim(),
    ...(typeof value.install_id === "string" && value.install_id.trim() !== ""
      ? { installId: value.install_id.trim() }
      : {}),
    ...(typeof value.version === "string" && value.version.trim() !== ""
      ? { version: value.version.trim() }
      : {}),
  }
}

export async function requestPluginPair(input: {
  fetchImpl: typeof fetch
  baseUrl: string
  hostLabel?: string
}): Promise<ManagekarPairTicket> {
  const response = await input.fetchImpl(pluginPairUrl(input.baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      host_label: input.hostLabel ?? "Hermes",
    }),
  })
  if (!response.ok) {
    throw new Error(`pair mint failed (${response.status})`)
  }
  const body: unknown = await response.json()
  const fromWrapper = isRecord(body) ? parseManagekarPairTicket(body.ticket) : null
  const ticket = fromWrapper ?? parseManagekarPairTicket(body)
  if (!ticket) {
    throw new Error("host did not return a managekar.pair.v1 ticket")
  }
  return ticket
}

export async function claimPluginPair(input: {
  fetchImpl: typeof fetch
  ticket: ManagekarPairTicket
  deviceId: string
  deviceName: string
  nowIso?: string
}): Promise<ManagekarClaimResult> {
  const now = input.nowIso ?? new Date().toISOString()
  if (Date.parse(now) >= Date.parse(input.ticket.expiresAt)) {
    throw new Error("This pairing ticket expired.")
  }
  const response = await input.fetchImpl(input.ticket.claimUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pair_id: input.ticket.pairId,
      device_id: input.deviceId,
      device_name: input.deviceName,
    }),
  })
  if (!response.ok) {
    throw new Error(`claim failed (${response.status})`)
  }
  const claimed = parseManagekarClaimResult(await response.json())
  if (!claimed) {
    throw new Error("host did not return endpoint and token")
  }
  return claimed
}

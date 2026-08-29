import { hermesStatusUrl, hermesWsUrl } from "./endpoint"
import { parseHermesDashboardStatus } from "./status"
import type { PairingProbe } from "@/lib/pairing/types"

export type AttachMode = "probe" | "connect"

export interface AttachToHermesInput {
  fetchImpl: typeof fetch
  openSocket: (url: string) => Promise<void>
  request: (method: string, params: Record<string, unknown>) => Promise<unknown>
  baseUrl: string
  token?: string
  machineId: string
  name: string
  nowIso: string
  mode: AttachMode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function probeHermesDashboard(
  fetchImpl: typeof fetch,
  baseUrl: string,
): Promise<PairingProbe> {
  try {
    const response = await fetchImpl(hermesStatusUrl(baseUrl), { method: "GET" })
    if (!response.ok) {
      return { kind: "unreachable" }
    }
    const body: unknown = await response.json()
    const dashboard = parseHermesDashboardStatus(body)
    if (!dashboard) {
      return { kind: "unreachable" }
    }
    return { kind: "waiting", dashboard }
  } catch {
    return { kind: "helper_not_running" }
  }
}

export function readCreatedSessionId(result: unknown): string | null {
  if (!isRecord(result) || typeof result.session_id !== "string" || result.session_id.trim() === "") {
    return null
  }
  return result.session_id.trim()
}

export async function attachToHermesDashboard(input: AttachToHermesInput): Promise<PairingProbe> {
  const probe = await probeHermesDashboard(input.fetchImpl, input.baseUrl)
  if (probe.kind !== "waiting") {
    return probe
  }
  if (input.mode === "probe") {
    return probe
  }
  try {
    await input.openSocket(hermesWsUrl({ base: input.baseUrl, token: input.token }))
    const created = await input.request("session.create", {
      title: input.name.trim() || "Manage.kar",
      source: "managekar",
    })
    const hermesSessionId = readCreatedSessionId(created)
    if (!hermesSessionId) {
      return { kind: "unreachable" }
    }
    return {
      kind: "paired",
      machineId: input.machineId,
      name: input.name.trim() || "Manage.kar",
      hermesSessionId,
      endpoint: input.baseUrl,
      token: input.token,
      installId: probe.dashboard?.installId,
      hermesVersion: probe.dashboard?.version,
    }
  } catch {
    if (probe.dashboard?.authRequired) {
      return { kind: "needs_token" }
    }
    return { kind: "unreachable" }
  }
}

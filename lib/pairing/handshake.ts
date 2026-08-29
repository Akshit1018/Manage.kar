import { probeHermesDashboard } from "@/lib/hermes/attach"
import { HERMES_DEFAULT_BASE } from "@/lib/hermes/endpoint"
import type { DialerState } from "@/lib/dialer/types"
import { completeSimulatedPairing } from "./pairing"
import type { MachineKind, PairingDraft, PairingFailure, PairingProbe, PairingState } from "./types"

export const PAIRING_CODE_TTL_MS = 10 * 60 * 1000

export interface StartHandshakeInput {
  name: string
  kind: MachineKind
  code: string
  nowIso: string
  endpoint?: string
}

export function startHandshake(input: StartHandshakeInput): PairingDraft {
  return {
    name: input.name.trim() || "Unnamed machine",
    kind: input.kind,
    code: input.code,
    startedAt: input.nowIso,
    expiresAt: new Date(Date.parse(input.nowIso) + PAIRING_CODE_TTL_MS).toISOString(),
    phase: "waiting",
    ...(input.endpoint ? { endpoint: input.endpoint } : {}),
  }
}

export function pairingFailureCopy(failure: PairingFailure): string {
  switch (failure) {
    case "helper_not_running":
      return "Hermes helper is not running on that machine."
    case "code_expired":
      return "This pairing code expired. Generate a new one."
    case "unreachable":
      return "The machine is unreachable."
    case "needs_token":
      return "This Hermes dashboard needs a session token. Paste it from the helper, then Connect."
    case "claim_failed":
      return "The host ticket could not be claimed. Mint a new QR on the computer."
    default: {
      const _exhaustive: never = failure
      return _exhaustive
    }
  }
}

export function handshakeStatusCopy(draft: PairingDraft, now = new Date()): string {
  if (draft.phase === "paired") {
    return "Paired with the Hermes helper."
  }
  if (draft.phase === "failed" && draft.failure) {
    return pairingFailureCopy(draft.failure)
  }
  if (now.getTime() >= Date.parse(draft.expiresAt)) {
    return pairingFailureCopy("code_expired")
  }
  const seconds = Math.max(0, Math.floor((Date.parse(draft.expiresAt) - now.getTime()) / 1000))
  if (draft.dashboardVersion) {
    return `Hermes ${draft.dashboardVersion} is running. ${seconds}s left to Connect.`
  }
  return `Waiting for the computer. ${seconds}s left.`
}

export function applyHelperProbe(draft: PairingDraft, probe: PairingProbe, nowIso: string): PairingDraft {
  if (Date.parse(nowIso) >= Date.parse(draft.expiresAt) || probe.kind === "code_expired") {
    return { ...draft, phase: "failed", failure: "code_expired" }
  }
  switch (probe.kind) {
    case "waiting":
      return {
        ...draft,
        phase: "waiting",
        failure: undefined,
        ...(probe.dashboard?.version ? { dashboardVersion: probe.dashboard.version } : {}),
        ...(probe.dashboard ? { authRequired: probe.dashboard.authRequired } : {}),
        ...(probe.dashboard?.installId ? { installId: probe.dashboard.installId } : {}),
      }
    case "helper_not_running":
      return { ...draft, phase: "failed", failure: "helper_not_running" }
    case "unreachable":
      return { ...draft, phase: "failed", failure: "unreachable" }
    case "needs_token":
      return { ...draft, phase: "failed", failure: "needs_token" }
    case "paired":
      return {
        ...draft,
        phase: "paired",
        machineId: probe.machineId,
        name: probe.name?.trim() || draft.name,
        failure: undefined,
        ...(probe.hermesSessionId ? { hermesSessionId: probe.hermesSessionId } : {}),
        ...(probe.endpoint ? { endpoint: probe.endpoint } : {}),
        ...(probe.installId ? { installId: probe.installId } : {}),
        ...(probe.hermesVersion ? { hermesVersion: probe.hermesVersion } : {}),
      }
    default: {
      const _exhaustive: never = probe
      return _exhaustive
    }
  }
}

export function completeHandshakePairing(
  pairing: PairingState,
  dialer: DialerState,
  draft: PairingDraft,
  nowIso: string,
  token?: string,
): { pairing: PairingState; dialer: DialerState } | null {
  if (draft.phase !== "paired" || !draft.machineId) {
    return null
  }
  return completeSimulatedPairing(pairing, dialer, {
    id: draft.machineId,
    name: draft.name,
    kind: draft.kind,
    nowIso,
    endpoint: draft.endpoint,
    token,
    installId: draft.installId,
    hermesVersion: draft.hermesVersion,
    hermesSessionId: draft.hermesSessionId,
  })
}

export async function probeLocalHelper(
  fetchImpl: typeof fetch,
  url = `${HERMES_DEFAULT_BASE}/api/status`,
): Promise<PairingProbe> {
  const base = url.replace(/\/api\/status\/?$/, "")
  return probeHermesDashboard(fetchImpl, base || HERMES_DEFAULT_BASE)
}

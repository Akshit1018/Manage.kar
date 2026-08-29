import type { HermesDashboardStatus } from "@/lib/hermes/status"
import type { MachineSkill } from "@/lib/hermes/skills"

export const PAIRING_STORAGE_KEY = "managekar.pairing.v1"

export type MachineKind = "vps" | "local"

export type PairingFailure = "helper_not_running" | "code_expired" | "unreachable" | "needs_token"

export type HandshakePhase = "waiting" | "failed" | "paired"

export interface PairingDraft {
  name: string
  kind: MachineKind
  code: string
  startedAt: string
  expiresAt: string
  phase: HandshakePhase
  failure?: PairingFailure
  machineId?: string
  endpoint?: string
  dashboardVersion?: string
  authRequired?: boolean
  hermesSessionId?: string
  installId?: string
  hermesVersion?: string
}

export type PairingProbe =
  | { kind: "waiting"; dashboard?: HermesDashboardStatus }
  | { kind: "helper_not_running" }
  | { kind: "unreachable" }
  | { kind: "code_expired" }
  | { kind: "needs_token" }
  | {
      kind: "paired"
      machineId: string
      name?: string
      hermesSessionId?: string
      endpoint?: string
      token?: string
      installId?: string
      hermesVersion?: string
    }

export interface PairedMachine {
  id: string
  name: string
  kind: MachineKind
  pairedAt: string
  lastSeenAt: string
  skills?: MachineSkill[]
  endpoint?: string
  token?: string
  installId?: string
  hermesVersion?: string
  hermesSessionId?: string
}

export interface PairingState {
  schemaVersion: 1
  machines: PairedMachine[]
  draft?: PairingDraft
}

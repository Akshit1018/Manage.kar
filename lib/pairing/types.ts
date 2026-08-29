import type { MachineSkill } from "@/lib/hermes/skills"

export const PAIRING_STORAGE_KEY = "managekar.pairing.v1"

export type MachineKind = "vps" | "local"

export type PairingFailure = "helper_not_running" | "code_expired" | "unreachable"

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
}

export type PairingProbe =
  | { kind: "waiting" }
  | { kind: "helper_not_running" }
  | { kind: "unreachable" }
  | { kind: "code_expired" }
  | { kind: "paired"; machineId: string; name?: string }

export interface PairedMachine {
  id: string
  name: string
  kind: MachineKind
  pairedAt: string
  lastSeenAt: string
  skills?: MachineSkill[]
}

export interface PairingState {
  schemaVersion: 1
  machines: PairedMachine[]
  draft?: PairingDraft
}

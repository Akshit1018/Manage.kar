import type { MachineSkill } from "@/lib/hermes/skills"

export type MachineKind = "vps" | "local"

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
}

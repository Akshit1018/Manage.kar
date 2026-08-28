export type MachineKind = "vps" | "local"

export interface PairedMachine {
  id: string
  name: string
  kind: MachineKind
  pairedAt: string
  lastSeenAt: string
}

export interface PairingState {
  schemaVersion: 1
  machines: PairedMachine[]
}

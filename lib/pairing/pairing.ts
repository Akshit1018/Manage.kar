import type { KeyValueStore } from "@/lib/store/workspace"
import type { DialerState, HermesSession } from "@/lib/dialer/types"
import { parseMachineSkills } from "@/lib/hermes/skills"
import type { HandshakePhase, MachineKind, PairedMachine, PairingDraft, PairingFailure, PairingState } from "./types"
import { PAIRING_STORAGE_KEY } from "./types"

export const PAIRING_KEY = PAIRING_STORAGE_KEY
export const PAIRING_CHANGED_EVENT = "managekar:pairing-changed"

/** No O/0/1/I/L so codes survive being read out loud or retyped. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const CODE_GROUPS = 2
const CODE_GROUP_LENGTH = 4

export function createEmptyPairing(): PairingState {
  return { schemaVersion: 1, machines: [] }
}

function asHandshakePhase(value: unknown): HandshakePhase | null {
  switch (value) {
    case "waiting":
    case "failed":
    case "paired":
      return value
    default:
      return null
  }
}

function asPairingFailure(value: unknown): PairingFailure | undefined {
  switch (value) {
    case "helper_not_running":
    case "code_expired":
    case "unreachable":
    case "needs_token":
      return value
    default:
      return undefined
  }
}

function asDraft(value: unknown): PairingDraft | undefined {
  if (!isRecord(value) || typeof value.code !== "string" || typeof value.name !== "string") {
    return undefined
  }
  const phase = asHandshakePhase(value.phase)
  if (!phase || typeof value.startedAt !== "string" || typeof value.expiresAt !== "string") {
    return undefined
  }
  const failure = asPairingFailure(value.failure)
  return {
    name: value.name.trim().slice(0, 120) || "Unnamed machine",
    kind: asMachineKind(value.kind),
    code: value.code,
    startedAt: value.startedAt,
    expiresAt: value.expiresAt,
    phase,
    ...(failure ? { failure } : {}),
    ...(typeof value.machineId === "string" ? { machineId: value.machineId } : {}),
    ...(typeof value.endpoint === "string" ? { endpoint: value.endpoint } : {}),
    ...(typeof value.dashboardVersion === "string" ? { dashboardVersion: value.dashboardVersion } : {}),
    ...(typeof value.hermesSessionId === "string" ? { hermesSessionId: value.hermesSessionId } : {}),
    ...(typeof value.installId === "string" ? { installId: value.installId } : {}),
    ...(typeof value.hermesVersion === "string" ? { hermesVersion: value.hermesVersion } : {}),
    ...(value.authRequired === true ? { authRequired: true } : {}),
  }
}

/**
 * Generated and shown on this device only. Until a real Hermes backend is
 * connected, nothing listens for this code — pairing stays a local scaffold.
 */
export function generatePairingCode(random: () => number = Math.random): string {
  const groups: string[] = []
  for (let group = 0; group < CODE_GROUPS; group++) {
    let chunk = ""
    for (let index = 0; index < CODE_GROUP_LENGTH; index++) {
      chunk += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length) % CODE_ALPHABET.length]
    }
    groups.push(chunk)
  }
  return `MK-${groups.join("-")}`
}

/** The magic-link shape a Hermes machine would open. Local scaffold for now. */
export function pairingLink(code: string): string {
  return `managekar://pair?code=${encodeURIComponent(code)}`
}

export function machineSessionId(machineId: string): string {
  return `machine-${machineId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asMachineKind(value: unknown): MachineKind {
  return value === "vps" ? "vps" : "local"
}

function asMachine(value: unknown): PairedMachine | null {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim() === "") {
    return null
  }
  if (typeof value.name !== "string" || value.name.trim() === "") {
    return null
  }
  const skills = parseMachineSkills(value.skills)
  return {
    id: value.id.slice(0, 128),
    name: value.name.trim().slice(0, 120),
    kind: asMachineKind(value.kind),
    pairedAt: typeof value.pairedAt === "string" ? value.pairedAt : new Date(0).toISOString(),
    lastSeenAt: typeof value.lastSeenAt === "string" ? value.lastSeenAt : new Date(0).toISOString(),
    ...(skills.length > 0 ? { skills } : {}),
    ...(typeof value.endpoint === "string" && value.endpoint.trim() !== ""
      ? { endpoint: value.endpoint.trim().slice(0, 300) }
      : {}),
    ...(typeof value.token === "string" && value.token.trim() !== "" ? { token: value.token.trim().slice(0, 512) } : {}),
    ...(typeof value.installId === "string" && value.installId.trim() !== ""
      ? { installId: value.installId.trim().slice(0, 128) }
      : {}),
    ...(typeof value.hermesVersion === "string" && value.hermesVersion.trim() !== ""
      ? { hermesVersion: value.hermesVersion.trim().slice(0, 64) }
      : {}),
    ...(typeof value.hermesSessionId === "string" && value.hermesSessionId.trim() !== ""
      ? { hermesSessionId: value.hermesSessionId.trim().slice(0, 128) }
      : {}),
  }
}

export function parsePairing(value: unknown): PairingState {
  if (!isRecord(value) || !Array.isArray(value.machines)) {
    return createEmptyPairing()
  }
  const machines = value.machines
    .map(asMachine)
    .filter((item): item is PairedMachine => item !== null)
  const draft = asDraft(value.draft)
  return { schemaVersion: 1, machines, ...(draft ? { draft } : {}) }
}

export function loadPairing(storage: KeyValueStore): PairingState {
  const raw = storage.getItem(PAIRING_KEY)
  if (!raw) {
    return createEmptyPairing()
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return createEmptyPairing()
  }
  return parsePairing(parsed)
}

export function savePairing(storage: KeyValueStore, state: PairingState): void {
  storage.setItem(PAIRING_KEY, JSON.stringify(state))
}

export function clearPairing(storage: KeyValueStore): void {
  storage.removeItem(PAIRING_KEY)
}

export function notifyPairingChanged(): void {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new Event(PAIRING_CHANGED_EVENT))
}

export function persistPairing(storage: KeyValueStore, state: PairingState): void {
  savePairing(storage, state)
  if (typeof queueMicrotask === "function") {
    queueMicrotask(() => notifyPairingChanged())
    return
  }
  notifyPairingChanged()
}

export interface SimulatedPairingInput {
  id: string
  name: string
  kind: MachineKind
  nowIso: string
  endpoint?: string
  token?: string
  installId?: string
  hermesVersion?: string
  hermesSessionId?: string
}

/**
 * Dev-only simulation of a completed pairing: registers the machine locally
 * and creates the matching dialer session with source "paired" and presence
 * "active". No real handshake happens — there is no backend yet.
 */
export function completeSimulatedPairing(
  pairing: PairingState,
  dialer: DialerState,
  input: SimulatedPairingInput,
): { pairing: PairingState; dialer: DialerState; machine: PairedMachine } {
  const existing = pairing.machines.find((item) => item.id === input.id)
  const machine: PairedMachine = {
    id: input.id,
    name: input.name.trim() || "Unnamed machine",
    kind: input.kind,
    pairedAt: existing?.pairedAt ?? input.nowIso,
    lastSeenAt: input.nowIso,
    ...(existing?.skills && existing.skills.length > 0 ? { skills: existing.skills } : {}),
    ...(input.endpoint || existing?.endpoint ? { endpoint: input.endpoint ?? existing?.endpoint } : {}),
    ...(input.token || existing?.token ? { token: input.token ?? existing?.token } : {}),
    ...(input.installId || existing?.installId ? { installId: input.installId ?? existing?.installId } : {}),
    ...(input.hermesVersion || existing?.hermesVersion
      ? { hermesVersion: input.hermesVersion ?? existing?.hermesVersion }
      : {}),
    ...(input.hermesSessionId || existing?.hermesSessionId
      ? { hermesSessionId: input.hermesSessionId ?? existing?.hermesSessionId }
      : {}),
  }
  const machines = existing
    ? pairing.machines.map((item) => (item.id === input.id ? machine : item))
    : [...pairing.machines, machine]

  const sessionId = machineSessionId(machine.id)
  const session: HermesSession = {
    id: sessionId,
    title: machine.name,
    presence: "active",
    lastActivityAt: input.nowIso,
    source: "paired",
  }
  const hasSession = dialer.sessions.some((item) => item.id === sessionId)
  const sessions = hasSession
    ? dialer.sessions.map((item) => (item.id === sessionId ? session : item))
    : [...dialer.sessions, session]

  return {
    pairing: { ...pairing, machines },
    dialer: { ...dialer, sessions },
    machine,
  }
}

export function markMachineSeen(pairing: PairingState, machineId: string, nowIso: string): PairingState {
  return {
    ...pairing,
    machines: pairing.machines.map((machine) =>
      machine.id === machineId ? { ...machine, lastSeenAt: nowIso } : machine,
    ),
  }
}

export function removeMachine(
  pairing: PairingState,
  dialer: DialerState,
  machineId: string,
): { pairing: PairingState; dialer: DialerState } {
  const sessionId = machineSessionId(machineId)
  return {
    pairing: { ...pairing, machines: pairing.machines.filter((machine) => machine.id !== machineId) },
    dialer: { ...dialer, sessions: dialer.sessions.filter((session) => session.id !== sessionId) },
  }
}

export function generateMachineId(random: () => number = Math.random): string {
  let id = ""
  for (let index = 0; index < 10; index++) {
    id += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length) % CODE_ALPHABET.length]
  }
  return id.toLowerCase()
}

export function machineKindLabel(kind: MachineKind): string {
  switch (kind) {
    case "vps":
      return "VPS"
    case "local":
      return "Local machine"
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

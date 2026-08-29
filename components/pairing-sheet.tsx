"use client"

import { useEffect, useRef, useState } from "react"
import { Cable, Copy, FlaskConical, Plus, Server, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileSheet } from "@/components/mobile-sheet"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { SkillsOnMachine } from "@/components/skills-on-machine"
import { cn } from "@/lib/utils"
import { browserStorage } from "@/lib/store/workspace"
import { DIALER_CHANGED_EVENT, loadDialer, persistDialer, presenceDotClass, presenceLabel } from "@/lib/dialer/dialer"
import type { DialerState } from "@/lib/dialer/types"
import {
  PAIRING_CHANGED_EVENT,
  completeSimulatedPairing,
  generateMachineId,
  generatePairingCode,
  loadPairing,
  machineKindLabel,
  machineSessionId,
  pairingLink,
  persistPairing,
  removeMachine,
} from "@/lib/pairing/pairing"
import {
  applyHelperProbe,
  completeHandshakePairing,
  handshakeStatusCopy,
  startHandshake,
} from "@/lib/pairing/handshake"
import { showSimulatedPairingControl } from "@/lib/pairing/developer"
import type { MachineKind, PairingDraft, PairingState } from "@/lib/pairing/types"
import { attachToHermesDashboard } from "@/lib/hermes/attach"
import { HERMES_DEFAULT_BASE } from "@/lib/hermes/endpoint"
import {
  claimPluginPair,
  parsePairPayload,
  requestPluginPair,
  type ManagekarPairTicket,
} from "@/lib/hermes/plugin-pair"
import { connectCompanion, getCompanionClient } from "@/lib/hermes/session-client"
import { bindHermesSession } from "@/lib/hermes/session-map"
import { PairQr } from "@/components/pair-qr"

interface PairingSheetProps {
  open: boolean
  onClose: () => void
}

interface DraftPairing {
  name: string
  kind: MachineKind
  code: string
  endpoint: string
  token: string
  handshake: PairingDraft
  connecting?: boolean
  ticketText: string
  ticket?: ManagekarPairTicket
}

function lastSeenCopy(iso: string, now = new Date()): string {
  const ms = now.getTime() - Date.parse(iso)
  if (Number.isNaN(ms) || ms < 0) {
    return "just now"
  }
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) {
    return "just now"
  }
  if (minutes < 60) {
    return `${minutes} min ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} h ago`
  }
  return `${Math.floor(hours / 24)} d ago`
}

/** Decorative deterministic pattern; a real scannable QR arrives with the Hermes backend. */
function QrPlaceholder({ code }: { code: string }) {
  const size = 11
  const cells: boolean[] = []
  let hash = 7
  for (let index = 0; index < size * size; index++) {
    hash = (hash * 31 + code.charCodeAt(index % code.length) + index) >>> 0
    cells.push(hash % 3 !== 0)
  }
  return (
    <div
      aria-hidden="true"
      className="mk-pairing-qr"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {cells.map((filled, index) => (
        <span key={index} className={cn(filled ? "bg-foreground" : "bg-transparent")} />
      ))}
    </div>
  )
}

export function PairingSheet({ open, onClose }: PairingSheetProps) {
  const [pairing, setPairing] = useState<PairingState | null>(null)
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [draft, setDraft] = useState<DraftPairing | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [developerPairing, setDeveloperPairing] = useState(false)
  const draftRef = useRef<DraftPairing | null>(null)
  draftRef.current = draft

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setConfirmRemoveId(null)
      return
    }
    setDeveloperPairing(
      showSimulatedPairingControl({
        hash: window.location.hash,
        search: window.location.search,
      }),
    )
    const reload = () => {
      setPairing(loadPairing(browserStorage()))
      setDialer(loadDialer(browserStorage()))
    }
    reload()
    window.addEventListener(PAIRING_CHANGED_EVENT, reload)
    window.addEventListener(DIALER_CHANGED_EVENT, reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(PAIRING_CHANGED_EVENT, reload)
      window.removeEventListener(DIALER_CHANGED_EVENT, reload)
      window.removeEventListener("storage", reload)
    }
  }, [open])

  const startDraft = () => {
    const code = generatePairingCode()
    const nowIso = new Date().toISOString()
    const handshake = startHandshake({
      name: "",
      kind: "vps",
      code,
      nowIso,
      endpoint: HERMES_DEFAULT_BASE,
    })
    setDraft({
      name: "",
      kind: "vps",
      code,
      endpoint: HERMES_DEFAULT_BASE,
      token: "",
      handshake,
      ticketText: "",
    })
  }

  useEffect(() => {
    if (!open || !draft || draft.handshake.phase !== "waiting") {
      return
    }
    let cancelled = false
    const tick = async () => {
      const current = draftRef.current
      if (!current || current.handshake.phase !== "waiting") {
        return
      }
      const probe = await attachToHermesDashboard({
        fetchImpl: fetch,
        openSocket: async () => undefined,
        request: async () => ({}),
        baseUrl: current.endpoint || HERMES_DEFAULT_BASE,
        token: current.token,
        machineId: generateMachineId(),
        name: current.name,
        nowIso: new Date().toISOString(),
        mode: "probe",
      })
      if (cancelled) {
        return
      }
      if (probe.kind !== "waiting") {
        return
      }
      const nowIso = new Date().toISOString()
      const next = applyHelperProbe(current.handshake, probe, nowIso)
      if (next.dashboardVersion === current.handshake.dashboardVersion) {
        return
      }
      setDraft((value) => (value ? { ...value, handshake: next } : value))
    }
    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, 4000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [open, draft?.code, draft?.handshake.phase, draft?.endpoint])

  const connectHermes = async () => {
    const current = draftRef.current
    if (!current || current.connecting) {
      return
    }
    setDraft({ ...current, connecting: true })
    const machineId = generateMachineId()
    const nowIso = new Date().toISOString()
    const probe = await attachToHermesDashboard({
      fetchImpl: fetch,
      openSocket: async () => {
        await connectCompanion({
          baseUrl: current.endpoint || HERMES_DEFAULT_BASE,
          token: current.token,
        })
        if (getCompanionClient().connectionState !== "open") {
          throw new Error("WebSocket connection failed")
        }
      },
      request: (method, params) => getCompanionClient().request(method, params),
      baseUrl: current.endpoint || HERMES_DEFAULT_BASE,
      token: current.token,
      machineId,
      name: current.name.trim() || "Hermes",
      nowIso,
      mode: "connect",
    })
    persistPaired(probe, current, machineId, nowIso, current.token)
  }

  const persistPaired = (
    probe: Awaited<ReturnType<typeof attachToHermesDashboard>>,
    current: DraftPairing,
    machineId: string,
    nowIso: string,
    token?: string,
  ) => {
    const next = applyHelperProbe(current.handshake, probe, nowIso)
    if (next.phase === "paired") {
      const storage = browserStorage()
      const result = completeHandshakePairing(
        loadPairing(storage),
        loadDialer(storage),
        next,
        nowIso,
        token,
      )
      if (result) {
        persistPairing(storage, { ...result.pairing, draft: undefined })
        persistDialer(storage, result.dialer)
        setPairing(result.pairing)
        if (next.hermesSessionId) {
          bindHermesSession(machineSessionId(next.machineId ?? machineId), next.hermesSessionId)
        }
        setDraft(null)
        toast.success(`${next.name} connected to Hermes. Its chat is in the Chats tab.`)
        return true
      }
    }
    setDraft({ ...current, connecting: false, handshake: next })
    if (next.failure) {
      toast.error(handshakeStatusCopy(next))
    }
    return false
  }

  const claimHostTicket = async (ticket = draftRef.current?.ticket) => {
    const current = draftRef.current
    if (!current || current.connecting || !ticket) {
      return
    }
    setDraft({ ...current, connecting: true })
    const machineId = generateMachineId()
    const nowIso = new Date().toISOString()
    try {
      const claimed = await claimPluginPair({
        fetchImpl: fetch,
        ticket,
        deviceId: machineId,
        deviceName: current.name.trim() || "Manage.kar",
        nowIso,
      })
      const probe = await attachToHermesDashboard({
        fetchImpl: fetch,
        openSocket: async () => {
          await connectCompanion({
            baseUrl: claimed.endpoint,
            token: claimed.token,
          })
          if (getCompanionClient().connectionState !== "open") {
            throw new Error("WebSocket connection failed")
          }
        },
        request: (method, params) => getCompanionClient().request(method, params),
        baseUrl: claimed.endpoint,
        token: claimed.token,
        machineId,
        name: current.name.trim() || ticket.hostLabel || "Hermes",
        nowIso,
        mode: "connect",
      })
      persistPaired(probe, { ...current, endpoint: claimed.endpoint, token: claimed.token }, machineId, nowIso, claimed.token)
    } catch {
      setDraft({
        ...current,
        connecting: false,
        handshake: { ...current.handshake, phase: "failed", failure: "claim_failed" },
      })
      toast.error("The host ticket could not be claimed. Mint a new QR on the computer.")
    }
  }

  const requestTicketFromUrl = async () => {
    const current = draftRef.current
    if (!current || current.connecting) {
      return
    }
    setDraft({ ...current, connecting: true })
    try {
      const ticket = await requestPluginPair({
        fetchImpl: fetch,
        baseUrl: current.endpoint || HERMES_DEFAULT_BASE,
        hostLabel: current.name.trim() || "Hermes",
      })
      setDraft({
        ...current,
        connecting: false,
        ticket,
        ticketText: JSON.stringify(ticket),
      })
      toast.success("Host minted a managekar.pair.v1 ticket. Claim it on this phone.")
    } catch {
      setDraft({
        ...current,
        connecting: false,
        handshake: { ...current.handshake, phase: "failed", failure: "helper_not_running" },
      })
      toast.error("This Hermes URL did not mint a Manage.kar ticket.")
    }
  }

  const simulatePairing = () => {
    if (!draft) {
      return
    }
    const storage = browserStorage()
    const nowIso = new Date().toISOString()
    const result = completeSimulatedPairing(loadPairing(storage), loadDialer(storage), {
      id: generateMachineId(),
      name: draft.name.trim() || "Unnamed machine",
      kind: draft.kind,
      nowIso,
    })
    persistPairing(storage, result.pairing)
    persistDialer(storage, result.dialer)
    setPairing(result.pairing)
    setDraft(null)
    toast.success(`${result.machine.name} paired (simulation). Its chat is in the Chats tab.`)
  }

  const handleRemove = (machineId: string) => {
    const storage = browserStorage()
    const result = removeMachine(loadPairing(storage), loadDialer(storage), machineId)
    persistPairing(storage, result.pairing)
    persistDialer(storage, result.dialer)
    setPairing(result.pairing)
    setConfirmRemoveId(null)
  }

  const copyCode = async () => {
    if (!draft) {
      return
    }
    try {
      await navigator.clipboard.writeText(pairingLink(draft.code))
      toast.success("Pairing link copied.")
    } catch {
      toast.error("Could not copy on this device.")
    }
  }

  if (!pairing && open) {
    return null
  }

  return (
    <>
      <MobileSheet
        open={open}
        onClose={onClose}
        title="Paired machines"
        description="This phone waits for a Hermes helper. Mint a managekar.pair.v1 ticket on the host (QR / link), or paste a dashboard URL and token. Simulate pairing stays behind #dev."
      >
        <div className="space-y-4">
          {pairing && pairing.machines.length > 0 ? (
            <div className="space-y-3">
              {pairing.machines.map((machine) => {
                const session = dialer?.sessions.find((item) => item.id === machineSessionId(machine.id))
                return (
                  <Card key={machine.id} className="mk-editorial-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        {machine.kind === "vps" ? (
                          <Server className="h-4 w-4 text-primary" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {session ? (
                            <span
                              className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(session.presence, session.source))}
                              title={presenceLabel(session.presence, session.source)}
                            />
                          ) : null}
                          <h4 className="truncate font-semibold">{machine.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {machineKindLabel(machine.kind)} · last seen {lastSeenCopy(machine.lastSeenAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mk-touch"
                        onClick={() => setConfirmRemoveId(machine.id)}
                        aria-label={`Remove ${machine.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <SkillsOnMachine paired reported={machine.skills ?? []} />
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <>
              <Card className="mk-editorial-card p-4">
                <div className="flex items-start gap-3">
                  <Cable className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    On the computer run `hermes managekar` or the dashboard Manage.kar tab.
                    Scan that host QR, paste the ticket, or use URL + token then Connect.
                    This is host claim plus dashboard attach, not DM pairing.
                  </p>
                </div>
              </Card>
              <SkillsOnMachine paired={false} />
            </>
          )}

          {draft ? (
            <Card className="mk-editorial-card space-y-4 p-4">
              <h4 className="font-semibold">Add a machine</h4>
              <div className="mk-form-grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="machine-name">Name</Label>
                  <Input
                    id="machine-name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        name: event.target.value,
                        handshake: { ...draft.handshake, name: event.target.value },
                      })
                    }
                    placeholder="e.g. Home VPS"
                    className="mk-touch rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="helper-url">Hermes URL</Label>
                  <Input
                    id="helper-url"
                    value={draft.endpoint}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        endpoint: event.target.value,
                        handshake: { ...draft.handshake, endpoint: event.target.value },
                      })
                    }
                    placeholder="http://127.0.0.1:9119"
                    className="mk-touch rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="helper-token">Dashboard token</Label>
                  <Input
                    id="helper-token"
                    type="password"
                    autoComplete="off"
                    value={draft.token}
                    onChange={(event) => setDraft({ ...draft, token: event.target.value })}
                    placeholder="From hermes dashboard"
                    className="mk-touch rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(value: MachineKind) =>
                      setDraft({ ...draft, kind: value, handshake: { ...draft.handshake, kind: value } })
                    }
                  >
                    <SelectTrigger className="mk-touch rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vps">VPS</SelectItem>
                      <SelectItem value="local">Local machine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border/50 bg-accent/10 p-4">
                <div className="space-y-2">
                  <Label htmlFor="pair-ticket">Host ticket or QR payload</Label>
                  <Input
                    id="pair-ticket"
                    value={draft.ticketText}
                    onChange={(event) => {
                      const ticketText = event.target.value
                      setDraft({
                        ...draft,
                        ticketText,
                        ticket: parsePairPayload(ticketText) ?? undefined,
                      })
                    }}
                    placeholder="managekar.pair.v1|… or paste JSON"
                    className="mk-touch rounded-lg"
                  />
                </div>
                {draft.ticket ? (
                  <>
                    <h5 className="text-center text-sm font-semibold">Host QR from managekar.pair.v1</h5>
                    <PairQr ticket={draft.ticket} />
                    <p className="text-center text-xs text-muted-foreground">
                      This QR encodes the host ticket. Claiming it once returns the dashboard token.
                    </p>
                  </>
                ) : (
                  <>
                    <h5 className="text-center text-sm font-semibold">Not a real QR yet</h5>
                    <QrPlaceholder code={draft.code} />
                    <p className="mk-pairing-code text-center text-2xl font-semibold tracking-widest">{draft.code}</p>
                    <p className="mk-pairing-code text-xs text-muted-foreground">{pairingLink(draft.code)}</p>
                    <p className="text-center text-xs text-muted-foreground">
                      QR placeholder — generated on this device. Showing it does not mean a QR was scanned.
                    </p>
                  </>
                )}
                <p className="text-center text-sm">{handshakeStatusCopy(draft.handshake)}</p>
                <Button variant="outline" size="sm" className="mk-touch w-full bg-transparent" onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </div>

              <div className="mk-sheet-footer-actions">
                <Button variant="outline" className="mk-touch bg-transparent" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="mk-touch bg-transparent"
                  disabled={draft.connecting}
                  onClick={() => void requestTicketFromUrl()}
                >
                  Request ticket
                </Button>
                <Button
                  variant="outline"
                  className="mk-touch bg-transparent"
                  disabled={draft.connecting || !draft.ticket}
                  onClick={() => void claimHostTicket()}
                >
                  Claim ticket
                </Button>
                <Button className="mk-touch" disabled={draft.connecting} onClick={() => void connectHermes()}>
                  <Cable className="mr-2 h-4 w-4" />
                  {draft.connecting ? "Connecting…" : "Connect"}
                </Button>
                {developerPairing ? (
                  <Button className="mk-touch" onClick={simulatePairing}>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Simulate pairing (dev)
                  </Button>
                ) : null}
              </div>
              {developerPairing ? (
                <p className="text-xs text-muted-foreground">
                  Simulation only: registers the machine locally and opens a chat for it. No real handshake
                  happens.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Connect talks to the MIT helper. Showing a QR does not complete pairing.
                </p>
              )}
            </Card>
          ) : (
            <Button className="mk-touch w-full" onClick={startDraft}>
              <Plus className="mr-2 h-4 w-4" />
              Pair a computer
            </Button>
          )}
        </div>
      </MobileSheet>
      <ConfirmSheet
        request={
          confirmRemoveId
            ? {
                title: "Remove this machine?",
                message: "Its chat entry is removed too. Messages already saved stay in the outbox.",
                confirmLabel: "Remove",
                tone: "danger",
              }
            : null
        }
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => confirmRemoveId && handleRemove(confirmRemoveId)}
      />
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Cable, Copy, FlaskConical, Plus, Server, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileSheet } from "@/components/mobile-sheet"
import { ConfirmSheet } from "@/components/confirm-sheet"
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
import type { MachineKind, PairingState } from "@/lib/pairing/types"

interface PairingSheetProps {
  open: boolean
  onClose: () => void
}

interface DraftPairing {
  name: string
  kind: MachineKind
  code: string
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
      className="mx-auto grid w-fit gap-[2px] rounded-lg border border-border/50 bg-background p-2"
      style={{ gridTemplateColumns: `repeat(${size}, 8px)` }}
    >
      {cells.map((filled, index) => (
        <span key={index} className={cn("h-2 w-2 rounded-[1px]", filled ? "bg-foreground" : "bg-transparent")} />
      ))}
    </div>
  )
}

export function PairingSheet({ open, onClose }: PairingSheetProps) {
  const [pairing, setPairing] = useState<PairingState | null>(null)
  const [dialer, setDialer] = useState<DialerState | null>(null)
  const [draft, setDraft] = useState<DraftPairing | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setConfirmRemoveId(null)
      return
    }
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
    setDraft({ name: "", kind: "vps", code: generatePairingCode() })
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
        description="Pairing is a local scaffold until a Hermes backend is connected. Nothing talks to a server yet."
      >
        <div className="space-y-4">
          {pairing && pairing.machines.length > 0 ? (
            <div className="space-y-3">
              {pairing.machines.map((machine) => {
                const session = dialer?.sessions.find((item) => item.id === machineSessionId(machine.id))
                return (
                  <Card key={machine.id} className="p-4">
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
                              className={cn("h-2 w-2 shrink-0 rounded-full", presenceDotClass(session.presence))}
                              title={presenceLabel(session.presence)}
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
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Cable className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No machines paired. Add one to generate a pairing code — once a real Hermes machine
                  scans it, its chats will appear in the Chats tab.
                </p>
              </div>
            </Card>
          )}

          {draft ? (
            <Card className="space-y-4 p-4">
              <h4 className="font-semibold">Add a machine</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="machine-name">Name</Label>
                  <Input
                    id="machine-name"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    placeholder="e.g. Home VPS"
                    className="mk-touch rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(value: MachineKind) => setDraft({ ...draft, kind: value })}
                  >
                    <SelectTrigger className="mk-touch rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vps">VPS</SelectItem>
                      <SelectItem value="local">Local machine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/50 bg-accent/10 p-4">
                <QrPlaceholder code={draft.code} />
                <p className="text-center font-mono text-lg tracking-widest">{draft.code}</p>
                <p className="break-all text-center font-mono text-xs text-muted-foreground">
                  {pairingLink(draft.code)}
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  QR placeholder — generated on this device. Nothing is listening for this code until a
                  Hermes backend is connected.
                </p>
                <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="mk-touch flex-1 bg-transparent" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button className="mk-touch flex-1" onClick={simulatePairing}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Simulate pairing (dev)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulation only: registers the machine locally and opens a chat for it. No real handshake
                happens.
              </p>
            </Card>
          ) : (
            <Button className="mk-touch w-full" onClick={startDraft}>
              <Plus className="mr-2 h-4 w-4" />
              Add machine
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

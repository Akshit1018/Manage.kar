"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { browserStorage } from "@/lib/store/workspace"
import { loadDialer, persistDialer } from "@/lib/dialer/dialer"
import {
  completeHandshakePairing,
  startHandshake,
} from "@/lib/pairing/handshake"
import {
  generateMachineId,
  loadPairing,
  machineSessionId,
  persistPairing,
} from "@/lib/pairing/pairing"
import { attachToHermesDashboard } from "@/lib/hermes/attach"
import { claimPluginPair, parsePairPayload } from "@/lib/hermes/plugin-pair"
import { connectCompanion, getCompanionClient } from "@/lib/hermes/session-client"
import { bindHermesSession } from "@/lib/hermes/session-map"

function ClaimInner() {
  const params = useSearchParams()
  const [status, setStatus] = useState("Reading ticket…")

  useEffect(() => {
    const raw = params.get("ticket") ?? params.get("payload") ?? ""
    const pairId = params.get("pair_id") ?? params.get("pairId") ?? ""
    const claim = params.get("claim") ?? params.get("claim_url") ?? ""
    const ticket =
      parsePairPayload(raw) ??
      (pairId && claim
        ? parsePairPayload(
            `${typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1"}/claim?pair_id=${encodeURIComponent(pairId)}&claim=${encodeURIComponent(claim)}`,
          )
        : null) ??
      (pairId && claim
        ? {
            v: 1 as const,
            kind: "managekar.pair.v1" as const,
            pairId,
            claimUrl: claim,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          }
        : null)
    if (!ticket) {
      setStatus("No managekar.pair.v1 ticket in this link.")
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const machineId = generateMachineId()
        const nowIso = new Date().toISOString()
        const claimed = await claimPluginPair({
          fetchImpl: fetch,
          ticket,
          deviceId: machineId,
          deviceName: "Manage.kar",
          nowIso,
        })
        const probe = await attachToHermesDashboard({
          fetchImpl: fetch,
          openSocket: async () => {
            await connectCompanion({ baseUrl: claimed.endpoint, token: claimed.token })
            if (getCompanionClient().connectionState !== "open") {
              throw new Error("WebSocket connection failed")
            }
          },
          request: (method, params) => getCompanionClient().request(method, params),
          baseUrl: claimed.endpoint,
          token: claimed.token,
          machineId,
          name: ticket.hostLabel || "Hermes",
          nowIso,
          mode: "connect",
        })
        if (cancelled) {
          return
        }
        const draft = startHandshake({
          name: ticket.hostLabel || "Hermes",
          kind: "vps",
          code: ticket.pairId,
          nowIso,
          endpoint: claimed.endpoint,
        })
        const applied = {
          ...draft,
          phase: "paired" as const,
          machineId,
          hermesSessionId: probe.kind === "paired" ? probe.hermesSessionId : undefined,
          endpoint: claimed.endpoint,
          installId: claimed.installId,
          hermesVersion: claimed.version,
        }
        const storage = browserStorage()
        const result = completeHandshakePairing(
          loadPairing(storage),
          loadDialer(storage),
          applied,
          nowIso,
          claimed.token,
        )
        if (result && probe.kind === "paired") {
          persistPairing(storage, { ...result.pairing, draft: undefined })
          persistDialer(storage, result.dialer)
          if (probe.hermesSessionId) {
            bindHermesSession(machineSessionId(machineId), probe.hermesSessionId)
          }
          setStatus("Paired. Open Chats to talk to this Hermes.")
          toast.success("Host ticket claimed.")
          return
        }
        setStatus("Claimed the token, but the dashboard socket did not finish session.create.")
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Claim failed.")
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [params])

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-primary">HERMES</p>
      <h1 className="text-2xl font-semibold">Claim host ticket</h1>
      <p className="text-sm text-muted-foreground">{status}</p>
      <Button asChild className="rounded-lg">
        <a href="/">Back to workspace</a>
      </Button>
    </main>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-muted-foreground">Opening claim…</main>}>
      <ClaimInner />
    </Suspense>
  )
}

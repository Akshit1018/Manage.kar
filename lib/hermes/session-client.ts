import { machineSessionId } from "@/lib/pairing/pairing"
import type { PairingState } from "@/lib/pairing/types"
import { HermesJsonRpcClient, type SocketLike } from "./client"
import { buildHermesWsUrl } from "./endpoint"
import { applyRuntimeEvent, getCompanionRuntime, setCompanionRuntime } from "./runtime"
import { bindHermesSession, mapInboundSessionId } from "./session-map"

function browserSocketFactory(url: string): SocketLike {
  if (typeof WebSocket === "undefined") {
    throw new Error("WebSocket is not available")
  }
  return new WebSocket(url) as unknown as SocketLike
}

let client: HermesJsonRpcClient | null = null
let lastUrl = ""

export function getCompanionClient(): HermesJsonRpcClient {
  if (!client) {
    client = new HermesJsonRpcClient({ socketFactory: browserSocketFactory })
    client.onEvent((event) => {
      const mapped = {
        ...event,
        ...(event.session_id ? { session_id: mapInboundSessionId(event.session_id) } : {}),
      }
      setCompanionRuntime(applyRuntimeEvent(getCompanionRuntime(), mapped))
    })
  }
  return client
}

export interface ConnectCompanionInput {
  host?: string
  baseUrl?: string
  token?: string
}

export async function connectCompanion(input: ConnectCompanionInput | string = {}): Promise<void> {
  const options: ConnectCompanionInput = typeof input === "string" ? { host: input } : input
  const url = options.baseUrl
    ? buildHermesWsUrl({ baseUrl: options.baseUrl, token: options.token })
    : buildHermesWsUrl({ host: options.host ?? "127.0.0.1", token: options.token })
  if (lastUrl && lastUrl !== url && client) {
    disconnectCompanion()
  }
  lastUrl = url
  const runtime = getCompanionRuntime()
  setCompanionRuntime({ ...runtime, connection: "connecting" })
  try {
    await getCompanionClient().connect(url)
    setCompanionRuntime({ ...getCompanionRuntime(), connection: "open" })
  } catch {
    setCompanionRuntime({ ...getCompanionRuntime(), connection: "error" })
  }
}

export function disconnectCompanion(): void {
  getCompanionClient().disconnect()
  lastUrl = ""
  setCompanionRuntime({ ...getCompanionRuntime(), connection: "closed" })
}

export function restorePairedHermesBindings(pairing: PairingState): void {
  for (const machine of pairing.machines) {
    if (machine.hermesSessionId) {
      bindHermesSession(machineSessionId(machine.id), machine.hermesSessionId)
    }
  }
}

export function connectPairedMachine(pairing: PairingState, dialerSessionId?: string): void {
  restorePairedHermesBindings(pairing)
  const machine = dialerSessionId
    ? pairing.machines.find((item) => machineSessionId(item.id) === dialerSessionId)
    : pairing.machines.find((item) => item.endpoint)
  if (!machine?.endpoint) {
    return
  }
  void connectCompanion({ baseUrl: machine.endpoint, token: machine.token })
}

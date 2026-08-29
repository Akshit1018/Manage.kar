import { HermesJsonRpcClient, type SocketLike } from "./client"
import { buildHermesWsUrl } from "./protocol"
import { applyRuntimeEvent, getCompanionRuntime, setCompanionRuntime } from "./runtime"

function browserSocketFactory(url: string): SocketLike {
  if (typeof WebSocket === "undefined") {
    throw new Error("WebSocket is not available")
  }
  return new WebSocket(url) as unknown as SocketLike
}

let client: HermesJsonRpcClient | null = null

export function getCompanionClient(): HermesJsonRpcClient {
  if (!client) {
    client = new HermesJsonRpcClient({ socketFactory: browserSocketFactory })
    client.onEvent((event) => {
      setCompanionRuntime(applyRuntimeEvent(getCompanionRuntime(), event))
    })
  }
  return client
}

export async function connectCompanion(host = "127.0.0.1"): Promise<void> {
  const runtime = getCompanionRuntime()
  setCompanionRuntime({ ...runtime, connection: "connecting" })
  try {
    await getCompanionClient().connect(buildHermesWsUrl({ host }))
    setCompanionRuntime({ ...getCompanionRuntime(), connection: "open" })
  } catch {
    setCompanionRuntime({ ...getCompanionRuntime(), connection: "error" })
  }
}

export function disconnectCompanion(): void {
  getCompanionClient().disconnect()
  setCompanionRuntime({ ...getCompanionRuntime(), connection: "closed" })
}

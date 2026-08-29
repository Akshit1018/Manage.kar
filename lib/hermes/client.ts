import { decodeJsonRpc, encodeJsonRpc, type HermesEvent, type JsonRpcId } from "./protocol"

export type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error"

export const SOCKET_CONNECTING = 0
export const SOCKET_OPEN = 1
export const SOCKET_CLOSING = 2
export const SOCKET_CLOSED = 3

type SocketHandler = (event: { data?: string }) => void

export interface SocketLike {
  readyState: number
  send(data: string): void
  close(): void
  addEventListener(type: "open" | "message" | "error" | "close", handler: SocketHandler): void
  removeEventListener(type: "open" | "message" | "error" | "close", handler: SocketHandler): void
}

export class MemorySocket implements SocketLike {
  readyState = SOCKET_CONNECTING
  lastReceived = ""
  peer: MemorySocket | null = null
  private readonly handlers = new Map<string, Set<SocketHandler>>()

  static pair(): [MemorySocket, MemorySocket] {
    const local = new MemorySocket()
    const remote = new MemorySocket()
    local.peer = remote
    remote.peer = local
    return [local, remote]
  }

  addEventListener(type: "open" | "message" | "error" | "close", handler: SocketHandler): void {
    const set = this.handlers.get(type) ?? new Set()
    set.add(handler)
    this.handlers.set(type, set)
  }

  removeEventListener(type: "open" | "message" | "error" | "close", handler: SocketHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  send(data: string): void {
    this.lastReceived = data
    if (this.peer) {
      this.peer.lastReceived = data
      this.peer.emit("message", { data })
    }
  }

  close(): void {
    this.readyState = SOCKET_CLOSED
    this.emit("close", {})
  }

  open(): void {
    this.readyState = SOCKET_OPEN
    this.emit("open", {})
  }

  deliver(data: string): void {
    this.emit("message", { data })
  }

  error(): void {
    this.readyState = SOCKET_CLOSED
    this.emit("error", {})
  }

  private emit(type: string, event: { data?: string }): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(event)
    }
  }
}

interface PendingCall {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export interface HermesClientOptions {
  socketFactory: (url: string) => SocketLike
  createRequestId?: (nextId: number) => JsonRpcId
  requestTimeoutMs?: number
}

export class HermesJsonRpcClient {
  connectionState: ConnectionState = "idle"
  private socket: SocketLike | null = null
  private nextId = 0
  private readonly pending = new Map<JsonRpcId, PendingCall>()
  private readonly eventHandlers = new Set<(event: HermesEvent) => void>()
  private readonly options: Required<HermesClientOptions>

  constructor(options: HermesClientOptions) {
    this.options = {
      socketFactory: options.socketFactory,
      createRequestId: options.createRequestId ?? ((nextId) => `r${nextId}`),
      requestTimeoutMs: options.requestTimeoutMs ?? 15_000,
    }
  }

  onEvent(handler: (event: HermesEvent) => void): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  async connect(url: string): Promise<void> {
    if (this.connectionState === "open" || this.connectionState === "connecting") {
      return
    }
    this.connectionState = "connecting"
    const socket = this.options.socketFactory(url)
    this.socket = socket
    socket.addEventListener("message", (event) => {
      this.handleMessage(typeof event.data === "string" ? event.data : "")
    })
    socket.addEventListener("close", () => {
      if (this.socket !== socket) {
        return
      }
      this.connectionState = "closed"
      this.rejectAll(new Error("WebSocket closed"))
    })

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup()
        this.connectionState = "open"
        resolve()
      }
      const onError = () => {
        cleanup()
        this.connectionState = "error"
        reject(new Error("WebSocket connection failed"))
      }
      const cleanup = () => {
        socket.removeEventListener("open", onOpen)
        socket.removeEventListener("error", onError)
      }
      socket.addEventListener("open", onOpen)
      socket.addEventListener("error", onError)
      if (socket.readyState === SOCKET_OPEN) {
        onOpen()
      }
    })
  }

  disconnect(): void {
    const socket = this.socket
    this.socket = null
    this.connectionState = "closed"
    this.rejectAll(new Error("WebSocket closed"))
    socket?.close()
  }

  request<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const socket = this.socket
    if (!socket || socket.readyState !== SOCKET_OPEN || this.connectionState !== "open") {
      return Promise.reject(new Error("gateway not connected"))
    }
    const id = this.options.createRequestId(++this.nextId)
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      })
      socket.send(encodeJsonRpc({ jsonrpc: "2.0", id, method, params }))
    })
  }

  private handleMessage(raw: string): void {
    const frame = decodeJsonRpc(raw)
    if (!frame) {
      return
    }
    switch (frame.kind) {
      case "event":
        for (const handler of this.eventHandlers) {
          handler(frame.event)
        }
        return
      case "result": {
        const call = this.pending.get(frame.id)
        if (!call) {
          return
        }
        this.pending.delete(frame.id)
        call.resolve(frame.result)
        return
      }
      case "error": {
        const call = this.pending.get(frame.id)
        if (!call) {
          return
        }
        this.pending.delete(frame.id)
        call.reject(new Error(frame.error.message))
        return
      }
      default: {
        const _exhaustive: never = frame
        return _exhaustive
      }
    }
  }

  private rejectAll(error: Error): void {
    for (const call of this.pending.values()) {
      call.reject(error)
    }
    this.pending.clear()
  }
}

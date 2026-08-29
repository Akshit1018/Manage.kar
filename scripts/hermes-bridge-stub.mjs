#!/usr/bin/env node
/**
 * Local Hermes-shaped helper for Manage.kar pairing.
 * Implements GET /api/status, plugin pair/claim, a QR page, and /api/ws.
 * This is not the official hermes-agent dashboard.
 */
import { createServer } from "node:http"
import { createHash, randomBytes } from "node:crypto"

const port = Number(process.env.HERMES_BRIDGE_PORT || process.argv[2] || 9119)
const host = process.env.HERMES_BRIDGE_HOST || "127.0.0.1"
const version = "0.5.0-stub"
const installId = "stub-install"
const dashboardToken = process.env.HERMES_STUB_TOKEN || "stub-dashboard-token"
const pairs = new Map()
const tokens = new Set([dashboardToken])

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
  })
  res.end(JSON.stringify(body))
}

function text(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "access-control-allow-origin": "*",
  })
  res.end(body)
}

function publicBase(req) {
  const override = process.env.MANAGEKAR_PUBLIC_BASE
  if (override) {
    return override.replace(/\/+$/, "")
  }
  return `http://${req.headers.host || `${host}:${port}`}`
}

function normalizeBase(base) {
  return String(base || "").replace(/\/+$/, "") || "http://127.0.0.1:9119"
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function mintPair(req, label) {
  const base = normalizeBase(publicBase(req))
  const pairId = randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const token = `mk_${randomBytes(16).toString("hex")}`
  const ticket = {
    v: 1,
    kind: "managekar.pair.v1",
    pairId,
    claimUrl: `${base}/api/plugins/managekar/claim`,
    qrUrl: `${base}/pair/${pairId}`,
    hostLabel: label,
    expiresAt,
  }
  pairs.set(pairId, { ticket, token, claimed: false, expiresAt: Date.parse(expiresAt), endpoint: base })
  return ticket
}

function compactPayload(ticket) {
  return `managekar.pair.v1|${ticket.pairId}|${ticket.claimUrl}`
}

function qrPage(ticket) {
  const payload = compactPayload(ticket)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Manage.kar pair</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #e8f2fd; color: #170d02; }
  main { max-width: 28rem; margin: 2rem auto; padding: 1.25rem; background: #fff; border: 1px solid #c5d8f2; border-radius: 0.5rem; }
  code { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 0.75rem; word-break: break-all; }
</style></head>
<body><main>
  <p style="letter-spacing:0.2em;font-size:0.7rem;font-weight:700;color:#0053fd">HERMES</p>
  <h1 style="font-size:1.25rem">Scan or open this ticket</h1>
  <p>Single-use <code>managekar.pair.v1</code> ticket. Paste it into Manage.kar or open the claim link.</p>
  <p><code>${payload}</code></p>
  <p><a href="/claim-local?pair_id=${encodeURIComponent(ticket.pairId)}">Claim in this browser</a></p>
</main></body></html>`
}

function acceptKey(key) {
  return createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64")
}

function encodeWs(payload) {
  const data = Buffer.from(payload)
  if (data.length < 126) {
    return Buffer.concat([Buffer.from([0x81, data.length]), data])
  }
  const header = Buffer.alloc(4)
  header[0] = 0x81
  header[1] = 126
  header.writeUInt16BE(data.length, 2)
  return Buffer.concat([header, data])
}

function decodeWs(buffer) {
  if (buffer.length < 2) {
    return null
  }
  const masked = Boolean(buffer[1] & 0x80)
  let length = buffer[1] & 0x7f
  let offset = 2
  if (length === 126) {
    length = buffer.readUInt16BE(2)
    offset = 4
  }
  let mask
  if (masked) {
    mask = buffer.subarray(offset, offset + 4)
    offset += 4
  }
  const data = buffer.subarray(offset, offset + length)
  if (!masked) {
    return data.toString("utf8")
  }
  const out = Buffer.alloc(data.length)
  for (let index = 0; index < data.length; index += 1) {
    out[index] = data[index] ^ mask[index % 4]
  }
  return out.toString("utf8")
}

function handleSocket(socket, url) {
  const token = new URL(url, "http://127.0.0.1").searchParams.get("token") || ""
  if (token && !tokens.has(token) && token !== dashboardToken) {
    socket.end()
    return
  }
  const send = (obj) => socket.write(encodeWs(JSON.stringify(obj)))
  send({ jsonrpc: "2.0", method: "event", params: { type: "gateway.ready", payload: { version } } })
  socket.on("data", (chunk) => {
    const line = decodeWs(chunk)
    if (!line) {
      return
    }
    let parsed
    try {
      parsed = JSON.parse(line)
    } catch {
      return
    }
    if (!parsed || parsed.jsonrpc !== "2.0" || parsed.id == null) {
      return
    }
    if (parsed.method === "session.create") {
      const sessionId = randomBytes(4).toString("hex")
      send({
        jsonrpc: "2.0",
        id: parsed.id,
        result: { session_id: sessionId, stored_session_id: `stored-${sessionId}` },
      })
      return
    }
    if (parsed.method === "gateway.ping") {
      send({ jsonrpc: "2.0", id: parsed.id, result: { ok: true } })
      return
    }
    if (parsed.method === "prompt.submit") {
      const sessionId = parsed.params?.session_id
      send({ jsonrpc: "2.0", id: parsed.id, result: { ok: true } })
      send({
        jsonrpc: "2.0",
        method: "event",
        params: { type: "message.complete", session_id: sessionId, payload: { text: "stub reply" } },
      })
      return
    }
    send({ jsonrpc: "2.0", id: parsed.id, result: { ok: true } })
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    })
    res.end()
    return
  }
  try {
    if (req.method === "GET" && url.pathname === "/api/status") {
      json(res, 200, {
        version,
        gateway_running: true,
        auth_required: true,
        install_id: installId,
      })
      return
    }
    if (req.method === "POST" && url.pathname === "/api/plugins/managekar/pair") {
      const body = await readBody(req)
      const ticket = mintPair(req, String(body.host_label || body.label || "stub"))
      json(res, 200, {
        ticket,
        pair_id: ticket.pairId,
        claim_url: ticket.claimUrl,
        qr_url: ticket.qrUrl,
        expires_at: ticket.expiresAt,
        payload: compactPayload(ticket),
      })
      return
    }
    if (req.method === "POST" && url.pathname === "/api/plugins/managekar/claim") {
      const body = await readBody(req)
      const pairId = String(body.pair_id || body.pairId || "")
      const record = pairs.get(pairId)
      if (!record) {
        json(res, 404, { error: "unknown pair" })
        return
      }
      if (record.claimed) {
        json(res, 409, { error: "already claimed" })
        return
      }
      if (Date.now() >= record.expiresAt) {
        json(res, 410, { error: "expired" })
        return
      }
      record.claimed = true
      tokens.add(record.token)
      json(res, 200, {
        endpoint: record.endpoint,
        token: record.token,
        install_id: installId,
        version,
      })
      return
    }
    const pairMatch = url.pathname.match(/^\/pair\/([^/]+)$/)
    if (req.method === "GET" && pairMatch) {
      const record = pairs.get(pairMatch[1])
      if (!record) {
        text(res, 404, "unknown pair")
        return
      }
      text(res, 200, qrPage(record.ticket), "text/html; charset=utf-8")
      return
    }
    if (req.method === "GET" && url.pathname === "/claim-local") {
      const pairId = url.searchParams.get("pair_id") || ""
      const record = pairs.get(pairId)
      if (!record || record.claimed) {
        text(res, 409, "cannot claim")
        return
      }
      record.claimed = true
      tokens.add(record.token)
      json(res, 200, {
        endpoint: record.endpoint,
        token: record.token,
        install_id: installId,
        version,
      })
      return
    }
    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true, version })
      return
    }
    json(res, 404, { error: "not found" })
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : "stub error" })
  }
})

server.on("upgrade", (req, socket) => {
  const url = new URL(req.url || "/", "http://127.0.0.1")
  if (url.pathname !== "/api/ws") {
    socket.end()
    return
  }
  const key = req.headers["sec-websocket-key"]
  if (!key) {
    socket.end()
    return
  }
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey(key)}`,
      "\r\n",
    ].join("\r\n"),
  )
  handleSocket(socket, req.url || "/")
})

server.listen(port, host, () => {
  process.stdout.write(`hermes-bridge-stub listening on http://${host}:${port}\n`)
})

export { server }

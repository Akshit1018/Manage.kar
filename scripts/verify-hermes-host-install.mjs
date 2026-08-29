#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { createConnection } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { cpSync } from "node:fs"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const mode = process.argv[2]
const failures = []

function fail(message) {
  failures.push(message)
}

function read(rel) {
  const path = join(root, rel)
  if (!existsSync(path)) {
    fail(`missing file ${rel}`)
    return ""
  }
  return readFileSync(path, "utf8")
}

function requireIncludes(rel, needles) {
  const source = read(rel)
  if (!source) {
    return source
  }
  for (const needle of needles) {
    if (!source.includes(needle)) {
      fail(`${rel} missing ${JSON.stringify(needle)}`)
    }
  }
  return source
}

function requireAbsent(rel, needles) {
  const source = read(rel)
  if (!source) {
    return
  }
  for (const needle of needles) {
    if (source.includes(needle)) {
      fail(`${rel} still has ${JSON.stringify(needle)}`)
    }
  }
}

function encodeClientWs(payload) {
  const data = Buffer.from(payload)
  const mask = randomBytes(4)
  const header = Buffer.alloc(2)
  header[0] = 0x81
  header[1] = 0x80 | data.length
  const masked = Buffer.alloc(data.length)
  for (let index = 0; index < data.length; index += 1) {
    masked[index] = data[index] ^ mask[index % 4]
  }
  return Buffer.concat([header, mask, masked])
}

function decodeServerWsFrames(buffer) {
  const messages = []
  let offset = 0
  while (offset + 2 <= buffer.length) {
    let length = buffer[offset + 1] & 0x7f
    let header = 2
    if (length === 126) {
      if (offset + 4 > buffer.length) {
        break
      }
      length = buffer.readUInt16BE(offset + 2)
      header = 4
    } else if (length === 127) {
      if (offset + 10 > buffer.length) {
        break
      }
      length = Number(buffer.readBigUInt64BE(offset + 2))
      header = 10
    }
    if (offset + header + length > buffer.length) {
      break
    }
    messages.push(buffer.subarray(offset + header, offset + header + length).toString("utf8"))
    offset += header + length
  }
  return { messages, rest: buffer.subarray(offset) }
}

async function unusedPort() {
  return await new Promise((resolve, reject) => {
    const probe = createServer()
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address()
      probe.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve(address.port)
      })
    })
    probe.on("error", reject)
  })
}

async function waitHttp(url, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs
  let last = ""
  while (Date.now() < end) {
    try {
      const response = await fetch(url)
      last = `${response.status}`
      if (response.ok) {
        return response
      }
    } catch (error) {
      last = error instanceof Error ? error.message : "fetch failed"
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`timeout waiting for ${url} (${last})`)
}

async function sessionCreate(host, port, token) {
  return await new Promise((resolve, reject) => {
    const socket = createConnection({ host, port })
    const key = randomBytes(16).toString("base64")
    socket.on("error", reject)
    socket.write(
      [
        `GET /api/ws?token=${token} HTTP/1.1`,
        `Host: ${host}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "\r\n",
      ].join("\r\n"),
    )
    let buffer = Buffer.alloc(0)
    let upgraded = false
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      if (!upgraded) {
        const text = buffer.toString("utf8")
        if (!text.includes("\r\n\r\n")) {
          return
        }
        if (!text.includes("101")) {
          reject(new Error(`websocket upgrade failed: ${text.split("\r\n", 1)[0]}`))
          socket.end()
          return
        }
        upgraded = true
        buffer = buffer.subarray(buffer.indexOf("\r\n\r\n") + 4)
        socket.write(
          encodeClientWs(
            JSON.stringify({
              jsonrpc: "2.0",
              id: "r1",
              method: "session.create",
              params: { title: "Bot Chat", source: "managekar" },
            }),
          ),
        )
        return
      }
      const decoded = decodeServerWsFrames(buffer)
      buffer = decoded.rest
      for (const message of decoded.messages) {
        if (!message.includes('"id":"r1"') && !message.includes('"id": "r1"')) {
          continue
        }
        if (message.includes("session_id")) {
          socket.end()
          resolve(message)
          return
        }
        reject(new Error(`session.create error: ${message.slice(0, 240)}`))
        socket.end()
        return
      }
    })
    setTimeout(() => reject(new Error("session.create timed out")), 8000)
  })
}

function verifyResearch() {
  requireIncludes("docs/superpowers/specs/2026-08-29-hermes-host-install-design.md", [
    "4209d37",
    "0.20.6",
    "PUBLIC_API_PATHS",
    "[web]",
    "scheduled",
    "hermes://plugin/install",
    "managekar.pair.v1",
  ])
  requireIncludes("docs/superpowers/grillme/2026-08-29-hermes-host-50.md", [
    "4209d37",
    "0.20.6",
    "scheduled",
    "X-Hermes-Session-Token",
    "--insecure",
    "grill-me",
    "hermes://plugin/install",
    "Bot Chat",
    "401",
  ])
  requireIncludes("docs/DECISIONS.md", ["D013", "0.20.6", "scheduled"])
}

function verifyGrill() {
  const grill = read("docs/superpowers/grillme/2026-08-29-hermes-host-50.md")
  const questions = grill.match(/^### Q\d+/gm) ?? []
  if (questions.length < 50) {
    fail(`grill has ${questions.length} questions, need 50`)
  }
  const answers = grill.match(/\*\*A:\*\*/g) ?? []
  const suggestions = grill.match(/\*\*Suggestion:\*\*/g) ?? []
  if (answers.length < 50) {
    fail(`grill has ${answers.length} answers, need 50`)
  }
  if (suggestions.length < 50) {
    fail(`grill has ${suggestions.length} suggestions, need 50`)
  }
  if (!grill.includes("## Recommendations")) {
    fail("grill is missing recommendations")
  }
}

function verifyCompanion() {
  requireIncludes("packages/hermes-managekar-plugin/plugin.yaml", [
    "name: managekar",
    "kind: platform",
    "license: MIT",
  ])
  requireIncludes("packages/hermes-managekar-plugin/LICENSE", ["MIT License"])
  requireIncludes("packages/hermes-managekar-plugin/README.md", [
    "hermes plugins install",
    "X-Hermes-Session-Token",
    "--serve",
    "403",
  ])
  requireAbsent("packages/hermes-managekar-plugin/README.md", [
    "Dashboard plugin routes are unauthenticated on a localhost-bound Hermes dashboard",
  ])
  requireIncludes("packages/hermes-managekar-plugin/qr.py", ["matrix_to_svg", "crispEdges"])
  requireIncludes("packages/hermes-managekar-plugin/serve.py", ["ticket_qr_svg", "pair QR"])
  requireIncludes("packages/hermes-managekar-plugin/dashboard/plugin_api.py", [
    "X-Hermes-Session-Token",
    "MANAGEKAR_PAIR_BASE",
    "qr_svg",
  ])
  requireIncludes("packages/hermes-managekar-plugin/dashboard/dist/index.js", ["qr_svg", "pair QR"])
  requireIncludes("lib/hermes/chat-identity.ts", ['"Bot Chat"'])
  requireIncludes("app/globals.css", ["--radius: 0.5rem"])
  requireIncludes("lib/theme/hermes-tokens.ts", ["featuredUsesDashboardRadius"])
  const tests = spawnSync("pnpm", ["test", "lib/theme/hermes-tokens.test.ts", "lib/hermes/chat-identity.test.ts"], {
    cwd: root,
    encoding: "utf8",
  })
  if (tests.status !== 0) {
    fail(`theme/identity tests exited ${tests.status}`)
    if (tests.stdout) {
      process.stderr.write(tests.stdout)
    }
  }
}

function verifyServe() {
  const pairing = spawnSync("python3", ["pairing_test.py"], {
    cwd: join(root, "packages/hermes-managekar-plugin"),
    encoding: "utf8",
  })
  if (pairing.status !== 0) {
    fail(`python pairing_test.py exited ${pairing.status}`)
    if (pairing.stderr) {
      process.stderr.write(pairing.stderr)
    }
    if (pairing.stdout) {
      process.stderr.write(pairing.stdout)
    }
  }
  const serve = spawnSync("python3", ["serve_test.py"], {
    cwd: join(root, "packages/hermes-managekar-plugin"),
    encoding: "utf8",
  })
  if (serve.status !== 0) {
    fail(`python serve_test.py exited ${serve.status}`)
    if (serve.stderr) {
      process.stderr.write(serve.stderr)
    }
    if (serve.stdout) {
      process.stderr.write(serve.stdout)
    }
  }
}

async function verifyStubAttach() {
  const port = await unusedPort()
  const child = spawn(process.execPath, [join(root, "scripts/hermes-bridge-stub.mjs"), String(port)], {
    cwd: root,
    env: { ...process.env, HERMES_BRIDGE_PORT: String(port), HERMES_BRIDGE_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  try {
    await waitHttp(`http://127.0.0.1:${port}/health`, 4000)
    const status = await fetch(`http://127.0.0.1:${port}/api/status`).then((item) => item.json())
    if (!status.version || status.gateway_running !== true) {
      fail("stub /api/status is not Hermes-shaped")
    }
    await sessionCreate("127.0.0.1", port, "stub-dashboard-token")
  } finally {
    child.kill("SIGTERM")
  }
}

async function verifyOfficialAttach() {
  const hermes = process.env.HERMES_BIN || "/tmp/hermes-venv/bin/hermes"
  if (!existsSync(hermes)) {
    process.stdout.write("official hermes skipped (no binary)\n")
    return
  }
  const home = mkdtempSync(join(tmpdir(), "mk-hermes-"))
  const token = "mk-host-verify-token"
  const dashboardPort = await unusedPort()
  const pairPort = await unusedPort()
  cpSync(join(root, "packages/hermes-managekar-plugin"), join(home, "plugins", "managekar"), {
    recursive: true,
  })
  writeFileSync(
    join(home, "config.yaml"),
    "model: dummy\nplugins:\n  enabled:\n    - managekar\n",
    "utf8",
  )
  writeFileSync(join(home, ".env"), "", "utf8")
  const env = {
    ...process.env,
    HERMES_HOME: home,
    HERMES_DASHBOARD_SESSION_TOKEN: token,
    MANAGEKAR_PUBLIC_BASE: `http://127.0.0.1:${dashboardPort}`,
    MANAGEKAR_PAIR_BASE: `http://127.0.0.1:${pairPort}`,
    MANAGEKAR_DASHBOARD_TOKEN: token,
  }
  const dashboard = spawn(hermes, ["serve", "--host", "127.0.0.1", "--port", String(dashboardPort)], {
    cwd: home,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const pair = spawn(
    "python3",
    [
      join(root, "packages/hermes-managekar-plugin/cli.py"),
      "--serve",
      "--host",
      `http://127.0.0.1:${dashboardPort}`,
      "--port",
      String(pairPort),
      "--bind",
      "127.0.0.1",
      "--token",
      token,
      "--label",
      "verify",
    ],
    { cwd: home, env, stdio: ["ignore", "pipe", "pipe"] },
  )
  try {
    const statusResponse = await waitHttp(`http://127.0.0.1:${dashboardPort}/api/status`, 25000)
    const status = await statusResponse.json()
    if (status.version !== "0.20.6" && !String(status.version || "").length) {
      fail("official /api/status missing version")
    }
    const denied = await fetch(`http://127.0.0.1:${dashboardPort}/api/plugins/managekar/pair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host_label: "verify" }),
    })
    if (denied.status !== 401) {
      fail(`official pair without token should be 401, got ${denied.status}`)
    }
    await waitHttp(`http://127.0.0.1:${pairPort}/health`, 4000)
    const minted = await fetch(`http://127.0.0.1:${pairPort}/api/plugins/managekar/pair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host_label: "verify" }),
    }).then((item) => item.json())
    if (!minted.ticket || minted.ticket.kind !== "managekar.pair.v1") {
      fail("official --serve did not mint managekar.pair.v1")
    }
    const qr = await fetch(minted.qr_url)
    const qrText = await qr.text()
    if (!qr.ok || !qrText.includes("<svg") || !qrText.includes("managekar.pair.v1")) {
      fail("official QR page missing SVG ticket")
    }
    const claimed = await fetch(minted.claim_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pair_id: minted.pair_id, device_id: "verify", device_name: "gate" }),
    }).then(async (item) => ({ status: item.status, body: await item.json() }))
    if (claimed.status !== 200 || claimed.body.endpoint !== `http://127.0.0.1:${dashboardPort}`) {
      fail("official claim did not return the dashboard endpoint")
    }
    if (claimed.body.token !== token) {
      fail("official claim did not return the dashboard session token")
    }
    const reuse = await fetch(minted.claim_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pair_id: minted.pair_id, device_id: "other", device_name: "gate" }),
    })
    if (reuse.status !== 409) {
      fail(`official second claim should be 409, got ${reuse.status}`)
    }
    await sessionCreate("127.0.0.1", dashboardPort, claimed.body.token)
  } finally {
    pair.kill("SIGTERM")
    dashboard.kill("SIGTERM")
    rmSync(home, { recursive: true, force: true })
  }
}

async function verifyLive() {
  try {
    await verifyStubAttach()
  } catch (error) {
    fail(error instanceof Error ? error.message : "stub attach failed")
  }
  try {
    await verifyOfficialAttach()
  } catch (error) {
    fail(error instanceof Error ? error.message : "official attach failed")
  }
}

const markers = {
  research: "hermes host research verification passed",
  grill: "hermes host grill verification passed",
  serve: "hermes host serve verification passed",
  live: "hermes host live verification passed",
  companion: "hermes host companion verification passed",
}

if (!mode || !markers[mode]) {
  process.stderr.write(`usage: verify-hermes-host-install.mjs <${Object.keys(markers).join("|")}>\n`)
  process.exit(2)
}

async function main() {
  switch (mode) {
    case "research":
      verifyResearch()
      break
    case "grill":
      verifyGrill()
      break
    case "serve":
      verifyServe()
      break
    case "live":
      await verifyLive()
      break
    case "companion":
      verifyCompanion()
      break
    default: {
      const unseen = mode
      fail(`unhandled mode ${unseen}`)
    }
  }
  if (failures.length > 0) {
    for (const item of failures) {
      process.stderr.write(`${item}\n`)
    }
    process.exit(1)
  }
  process.stdout.write(`${markers[mode]}\n`)
}

await main()

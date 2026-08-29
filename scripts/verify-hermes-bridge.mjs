#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { createConnection } from "node:net"
import { dirname, join } from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
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

function run(args) {
  const result = spawnSync("pnpm", ["test", ...args], {
    cwd: root,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    fail(`pnpm test ${args.join(" ")} exited ${result.status}`)
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
  }
}

function verifyProtocol() {
  requireIncludes("lib/hermes/plugin-pair.ts", [
    "managekar.pair.v1",
    "/api/plugins/managekar/pair",
    "/api/plugins/managekar/claim",
    "parsePairPayload",
    "claimPluginPair",
  ])
  requireIncludes("lib/hermes/plugin-pair.test.ts", [
    "rejects non-tickets",
    "does not claim an expired ticket",
    "pairs from a host mint then claims once",
  ])
  requireIncludes("lib/hermes/qr-byte.ts", ["encodeQrMatrix", "qrMatrixToSvg"])
  run(["lib/hermes/plugin-pair.test.ts", "lib/hermes/qr-byte.test.ts"])
  const py = spawnSync("python3", ["pairing_test.py"], {
    cwd: join(root, "packages/hermes-managekar-plugin"),
    encoding: "utf8",
  })
  if (py.status !== 0) {
    fail(`python pairing_test.py exited ${py.status}`)
    if (py.stderr) {
      process.stderr.write(py.stderr)
    }
    if (py.stdout) {
      process.stderr.write(py.stdout)
    }
  }
}

function verifyPlugin() {
  requireIncludes("packages/hermes-managekar-plugin/plugin.yaml", [
    "name: managekar",
    "kind: platform",
    "license: MIT",
  ])
  requireIncludes("packages/hermes-managekar-plugin/LICENSE", ["MIT License"])
  requireIncludes("packages/hermes-managekar-plugin/README.md", [
    "hermes plugins install",
    "managekar.pair.v1",
    "--enable",
  ])
  requireIncludes("packages/hermes-managekar-plugin/__init__.py", ["register"])
  requireIncludes("packages/hermes-managekar-plugin/adapter.py", [
    "register_platform",
    'name="managekar"',
    "register_cli_command",
  ])
  requireIncludes("packages/hermes-managekar-plugin/dashboard/manifest.json", [
    '"api": "plugin_api.py"',
    '"name": "managekar"',
  ])
  requireIncludes("packages/hermes-managekar-plugin/dashboard/plugin_api.py", [
    'router = APIRouter()',
    '@router.post("/pair")',
    '@router.post("/claim")',
  ])
  requireIncludes("packages/hermes-managekar-plugin/cli.py", ["print_pair", "QR page"])
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

async function waitForStub(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)
      if (response.ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  throw new Error("stub did not start")
}

async function verifyLive() {
  const port = await unusedPort()
  const child = spawn(process.execPath, [join(root, "scripts/hermes-bridge-stub.mjs"), String(port)], {
    cwd: root,
    env: { ...process.env, HERMES_BRIDGE_PORT: String(port), HERMES_BRIDGE_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let started = ""
  child.stdout.on("data", (chunk) => {
    started += chunk.toString()
  })
  try {
    await waitForStub(port)
    const status = await fetch(`http://127.0.0.1:${port}/api/status`).then((item) => item.json())
    if (status.version !== "0.5.0-stub" || status.gateway_running !== true) {
      fail("stub /api/status is not a Hermes-shaped dashboard")
    }
    const minted = await fetch(`http://127.0.0.1:${port}/api/plugins/managekar/pair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host_label: "verify" }),
    }).then((item) => item.json())
    if (!minted.ticket || minted.ticket.kind !== "managekar.pair.v1") {
      fail("stub pair did not mint managekar.pair.v1")
    }
    const qr = await fetch(minted.qr_url)
    const qrText = await qr.text()
    if (!qr.ok || !qrText.includes("managekar.pair.v1")) {
      fail("QR page did not include the pair ticket")
    }
    const claimed = await fetch(minted.claim_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pair_id: minted.pair_id, device_id: "verify", device_name: "gate" }),
    }).then((item) => item.json())
    if (!claimed.token || !claimed.endpoint) {
      fail("claim did not return endpoint and token")
    }
    const second = await fetch(minted.claim_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pair_id: minted.pair_id, device_id: "other", device_name: "gate" }),
    })
    if (second.status !== 409) {
      fail(`second claim should be 409, got ${second.status}`)
    }
    await new Promise((resolve, reject) => {
      const socket = createConnection({ host: "127.0.0.1", port })
      const key = randomBytes(16).toString("base64")
      socket.on("error", reject)
      socket.write(
        [
          `GET /api/ws?token=${claimed.token} HTTP/1.1`,
          "Host: 127.0.0.1",
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
            reject(new Error("websocket upgrade failed"))
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
                params: { title: "Manage.kar", source: "managekar" },
              }),
            ),
          )
          return
        }
        const decoded = decodeServerWsFrames(buffer)
        buffer = decoded.rest
        if (decoded.messages.some((message) => message.includes("session_id") && message.includes('"id":"r1"'))) {
          socket.end()
          resolve()
        }
      })
      setTimeout(() => reject(new Error("session.create timed out")), 3000)
    }).catch((error) => {
      fail(error instanceof Error ? error.message : "websocket failed")
    })
    if (!started.includes("listening")) {
      fail("stub did not print listen banner")
    }
  } finally {
    child.kill("SIGTERM")
  }
}

function verifyUi() {
  requireIncludes("components/pairing-sheet.tsx", [
    "helper-url",
    "helper-token",
    "Connect",
    "attachToHermesDashboard",
    "claimPluginPair",
    "managekar.pair.v1",
    "Simulate pairing (dev)",
    "Not a real QR yet",
  ])
  requireIncludes("components/pair-qr.tsx", ["encodeQrMatrix", "compactPairPayload"])
  requireIncludes("app/claim/page.tsx", ["claimPluginPair", "pair_id"])
  requireIncludes("components/workspace/chats-view.tsx", ["Bot Chat", "chatIdentityLabel"])
  requireIncludes("lib/hermes/chat-identity.ts", ['"Bot Chat"'])
  requireIncludes("docs/DECISIONS.md", ["managekar.pair.v1", "/api/plugins/managekar/"])
}

function verifyTheme() {
  requireIncludes("app/globals.css", [".mk-editorial-card", "border-radius: var(--radius)", "--radius: 0.5rem"])
  const css = read("app/globals.css")
  const card = css.match(/\.mk-editorial-card\s*\{[^}]+\}/)?.[0] ?? ""
  if (!card.includes("border-radius: var(--radius)")) {
    fail("editorial card is not using the dashboard radius token")
  }
  if (card.includes("calc(var(--radius) + 4px)")) {
    fail("editorial card still uses the extra-rounded editorial radius")
  }
  requireIncludes("lib/theme/hermes-tokens.ts", ["editorialUsesDashboardRadius"])
  run(["lib/theme/hermes-tokens.test.ts", "lib/hermes/chat-identity.test.ts"])
}

function verifyGrill() {
  const grill = read("docs/superpowers/grillme/2026-08-29-hermes-bridge-50.md")
  const questions = grill.match(/^### Q\d+/gm) ?? []
  if (questions.length < 50) {
    fail(`grill has ${questions.length} questions, need 50`)
  }
  if (!grill.includes("## Recommendations") && !grill.includes("## Suggestion")) {
    fail("grill is missing recommendations")
  }
  requireIncludes("docs/superpowers/specs/2026-08-29-hermes-bridge-plugin.md", [
    "managekar.pair.v1",
    "WhatsApp",
  ])
}

const markers = {
  protocol: "hermes bridge protocol verification passed",
  plugin: "hermes bridge plugin verification passed",
  live: "hermes bridge live verification passed",
  ui: "hermes bridge ui verification passed",
  theme: "hermes bridge theme verification passed",
  grill: "hermes bridge grill verification passed",
}

if (!mode || !markers[mode]) {
  process.stderr.write(`usage: verify-hermes-bridge.mjs <${Object.keys(markers).join("|")}>\n`)
  process.exit(2)
}

async function main() {
  switch (mode) {
    case "protocol":
      verifyProtocol()
      break
    case "plugin":
      verifyPlugin()
      break
    case "live":
      await verifyLive()
      break
    case "ui":
      verifyUi()
      break
    case "theme":
      verifyTheme()
      break
    case "grill":
      verifyGrill()
      break
    default:
      fail(`unhandled mode ${mode}`)
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

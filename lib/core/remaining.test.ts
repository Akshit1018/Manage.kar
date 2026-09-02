import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8")
}

describe("remaining companion gates", () => {
  it("looks up Hermes socket constants on endpoint.ts, not leftover protocol.ts literals", () => {
    const source = read("scripts/verify-remaining-companion.mjs")
    expect(source).toContain('requireIncludes("lib/hermes/endpoint.ts"')
    expect(source).toContain("/api/ws")
    expect(source).toContain("9119")
    expect(source).toMatch(/requireIncludes\("lib\/hermes\/endpoint\.ts", \["\/api\/ws", "9119"\]\)/)
    expect(source).not.toMatch(/requireIncludes\("lib\/hermes\/protocol\.ts", \[[\s\S]*?"\/api\/ws"/)
  })

  it("source-checks Flutter leftovers when the SDK is missing", () => {
    const source = read("scripts/verify-remaining-companion.mjs")
    expect(source).toContain("ENOENT")
    expect(source).toContain("flutter not installed")
  })

  it("can run every remaining companion gate in one pass", () => {
    const source = read("scripts/verify-remaining-companion.mjs")
    expect(source).toContain('"all"')
    expect(source).toContain("verifyFlutterPresence")
    expect(source).toContain("verifyProtocol")
    expect(source).toContain("verifyOverlay")
  })
})

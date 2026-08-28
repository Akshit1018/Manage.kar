import { describe, expect, it } from "vitest"
import { normalizeSkin, resolveDarkMode } from "./apply-theme"

describe("theme resolution", () => {
  it("honors an explicit dark or light choice over the system preference", () => {
    expect(resolveDarkMode("dark", false)).toBe(true)
    expect(resolveDarkMode("light", true)).toBe(false)
  })

  it("follows the system preference when theme is system", () => {
    expect(resolveDarkMode("system", true)).toBe(true)
    expect(resolveDarkMode("system", false)).toBe(false)
  })
})

describe("skin resolution", () => {
  it("keeps the classic skin when chosen", () => {
    expect(normalizeSkin("classic")).toBe("classic")
  })

  it("defaults everything else to the Hermes skin", () => {
    expect(normalizeSkin("hermes")).toBe("hermes")
    expect(normalizeSkin(undefined)).toBe("hermes")
    expect(normalizeSkin("neon")).toBe("hermes")
  })
})

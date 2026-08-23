import { describe, expect, it } from "vitest"
import { resolveDarkMode } from "./apply-theme"

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

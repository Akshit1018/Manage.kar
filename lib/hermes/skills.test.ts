import { describe, expect, it } from "vitest"
import {
  parseMachineSkills,
  skillsAreInstallable,
  skillsEmptyCopy,
  skillsOnMachine,
} from "./skills"

describe("skills on a paired machine", () => {
  it("parses a read-only list and drops broken rows", () => {
    const skills = parseMachineSkills([
      { name: "web-search", description: "Search the web", enabled: true },
      { name: "  ", enabled: true },
      { name: "vision", enabled: false },
      "nope",
    ])
    expect(skills).toEqual([
      { name: "web-search", description: "Search the web", enabled: true },
      { name: "vision", enabled: false },
    ])
  })

  it("shows nothing until a paired machine reports skills", () => {
    expect(skillsOnMachine({ paired: false, reported: [{ name: "web-search", enabled: true }] })).toEqual([])
    expect(skillsOnMachine({ paired: true, reported: [] })).toEqual([])
    expect(
      skillsOnMachine({
        paired: true,
        reported: [{ name: "web-search", description: "Search the web", enabled: true }],
      }),
    ).toEqual([{ name: "web-search", description: "Search the web", enabled: true }])
  })

  it("never offers an install store", () => {
    expect(skillsAreInstallable()).toBe(false)
    expect(skillsEmptyCopy(false)).toEqual({
      title: "Skills live on the machine",
      description: "Pair a Hermes computer to see skills installed there. This app does not install or sell skills.",
    })
    expect(skillsEmptyCopy(true)).toEqual({
      title: "No skills listed yet",
      description: "This machine has not reported skills. Refresh after pairing for real — nothing is installed from here.",
    })
  })
})

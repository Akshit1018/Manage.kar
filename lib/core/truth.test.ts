import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  forensicMapIsDated,
  habitToggleHonorsSchedule,
  liveTruthMapIsCurrent,
  overlayHonestyIsStub,
  remindersStayTabOpen,
  scorecardMatchesHead,
} from "./truth"

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8")
}

describe("core logic honesty", () => {
  it("keeps the live truth map on HEAD facts, not the 34ef512 forensic freeze", () => {
    expect(liveTruthMapIsCurrent(read("docs/FEATURE_TRUTH_MAP.md"))).toBe(true)
    expect(forensicMapIsDated(read("docs/forensic/FEATURE_TRUTH_MAP.md"))).toBe(true)
  })

  it("enforces habit custom days in toggle, not only in the form", () => {
    expect(habitToggleHonorsSchedule(read("lib/habits/streak.ts"))).toBe(true)
    expect(habitToggleHonorsSchedule(read("lib/habits/schedule.ts"))).toBe(true)
  })

  it("keeps PWA reminders on a tab-open timer, not a push server", () => {
    expect(remindersStayTabOpen(read("lib/reminders/use-local-reminders.ts"))).toBe(true)
  })

  it("keeps the Android overlay as a stub that never claims a live draw", () => {
    expect(overlayHonestyIsStub(read("apps/mobile/lib/src/overlay/overlay_capability.dart"))).toBe(true)
  })

  it("stops the quality scorecard from claiming 14 tests and no API", () => {
    expect(scorecardMatchesHead(read("docs/QUALITY_SCORECARD.md"))).toBe(true)
  })

  it("locks D021 and two un-synced stores in the live map", () => {
    const decisions = read("docs/DECISIONS.md")
    const live = read("docs/FEATURE_TRUTH_MAP.md")
    expect(decisions).toContain("D021")
    expect(live).toContain("two stores")
    expect(live).toContain("model: dummy")
    expect(live).toContain("idb:voice:")
  })
})

export function liveTruthMapIsCurrent(source: string): boolean {
  return (
    source.includes("isHabitScheduledOn") &&
    source.includes("tab is open") &&
    source.includes("idb:voice:") &&
    source.includes("model: dummy") &&
    source.includes("two stores") &&
    source.includes("?view=") &&
    source.includes("deleteGoal") &&
    !source.includes("Canonical forensic copy") &&
    !source.includes("toggleHabitOnDate never reads them")
  )
}

export function forensicMapIsDated(source: string): boolean {
  return (
    source.includes("34ef512") &&
    source.includes("docs/FEATURE_TRUTH_MAP.md") &&
    source.includes("Not HEAD")
  )
}

export function habitToggleHonorsSchedule(source: string): boolean {
  return source.includes("isHabitScheduledOn")
}

export function remindersStayTabOpen(source: string): boolean {
  return source.includes("setInterval") && source.includes("60_000")
}

export function overlayHonestyIsStub(source: string): boolean {
  return source.includes("does not verify a live overlay draw")
}

export function scorecardMatchesHead(source: string): boolean {
  return (
    source.includes("apps/api") &&
    source.includes("goals") &&
    source.includes("time") &&
    !source.includes("14 unit tests") &&
    !source.includes("goals/time not in it yet") &&
    !source.includes("API | n/a")
  )
}

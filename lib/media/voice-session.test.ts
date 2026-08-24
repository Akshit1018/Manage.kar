import { describe, expect, it } from "vitest"
import { formatRecordingClock, reduceVoiceSession } from "./voice-session"

describe("full-screen voice session", () => {
  it("walks idle → requesting → recording → review like iOS Voice Memos", () => {
    expect(reduceVoiceSession("idle", { type: "start" })).toBe("requesting")
    expect(reduceVoiceSession("requesting", { type: "granted" })).toBe("recording")
    expect(reduceVoiceSession("recording", { type: "pause" })).toBe("paused")
    expect(reduceVoiceSession("paused", { type: "resume" })).toBe("recording")
    expect(reduceVoiceSession("recording", { type: "stop" })).toBe("review")
    expect(reduceVoiceSession("review", { type: "save" })).toBe("idle")
    expect(reduceVoiceSession("review", { type: "discard" })).toBe("idle")
  })

  it("surfaces denied and unsupported instead of staying on a hidden card", () => {
    expect(reduceVoiceSession("requesting", { type: "denied" })).toBe("denied")
    expect(reduceVoiceSession("requesting", { type: "unsupported" })).toBe("unsupported")
    expect(reduceVoiceSession("denied", { type: "start" })).toBe("requesting")
  })

  it("formats a large elapsed clock for the full-screen bowl", () => {
    expect(formatRecordingClock(0)).toBe("00:00")
    expect(formatRecordingClock(9)).toBe("00:09")
    expect(formatRecordingClock(75)).toBe("01:15")
    expect(formatRecordingClock(3600)).toBe("60:00")
  })
})

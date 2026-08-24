export type VoicePhase = "idle" | "requesting" | "recording" | "paused" | "review" | "denied" | "unsupported"

export type VoiceEvent =
  | { type: "start" }
  | { type: "granted" }
  | { type: "denied" }
  | { type: "unsupported" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "discard" }
  | { type: "save" }

export function reduceVoiceSession(phase: VoicePhase, event: VoiceEvent): VoicePhase {
  switch (phase) {
    case "idle":
    case "denied":
    case "unsupported":
      return event.type === "start" ? "requesting" : phase
    case "requesting":
      if (event.type === "granted") {
        return "recording"
      }
      if (event.type === "denied") {
        return "denied"
      }
      if (event.type === "unsupported") {
        return "unsupported"
      }
      if (event.type === "discard") {
        return "idle"
      }
      return phase
    case "recording":
      if (event.type === "pause") {
        return "paused"
      }
      if (event.type === "stop") {
        return "review"
      }
      if (event.type === "discard") {
        return "idle"
      }
      return phase
    case "paused":
      if (event.type === "resume") {
        return "recording"
      }
      if (event.type === "stop") {
        return "review"
      }
      if (event.type === "discard") {
        return "idle"
      }
      return phase
    case "review":
      if (event.type === "save" || event.type === "discard") {
        return "idle"
      }
      return phase
    default: {
      const exhaustive: never = phase
      return exhaustive
    }
  }
}

export function formatRecordingClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

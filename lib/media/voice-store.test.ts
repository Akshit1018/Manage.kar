import { describe, expect, it } from "vitest"
import type { Note } from "@/lib/domain/types"
import {
  createMemoryBinaryStore,
  deleteVoice,
  getVoice,
  isDataUrl,
  isVoiceRef,
  migrateVoiceDataUrls,
  putVoice,
  voiceRef,
} from "./voice-store"

describe("voice store pointers", () => {
  it("stores audio under an idb pointer instead of a data URL", async () => {
    const store = createMemoryBinaryStore()
    const blob = new Blob(["wav-bytes"], { type: "audio/webm" })
    const ref = await putVoice(store, 12, blob)

    expect(ref).toBe(voiceRef(12))
    expect(isVoiceRef(ref)).toBe(true)
    expect(isDataUrl(ref)).toBe(false)

    const loaded = await getVoice(store, ref)
    expect(loaded).toBeTruthy()
    expect(await loaded?.text()).toBe("wav-bytes")
  })

  it("ignores ordinary URLs and deletes by pointer", async () => {
    const store = createMemoryBinaryStore()
    await putVoice(store, 3, new Blob(["x"]))
    expect(await getVoice(store, "https://example.com/a.webm")).toBeNull()
    await deleteVoice(store, voiceRef(3))
    expect(await getVoice(store, voiceRef(3))).toBeNull()
  })

  it("migrates legacy data URLs into pointer notes", async () => {
    const store = createMemoryBinaryStore()
    const dataUrl = `data:audio/webm;base64,${btoa("legacy")}`
    const notes: Note[] = [
      {
        id: 8,
        title: "Voice",
        content: "hello",
        createdAt: "2026-08-23T00:00:00.000Z",
        voiceNote: { audioUrl: dataUrl, transcription: "hello", duration: 2 },
      },
      {
        id: 9,
        title: "Text",
        content: "plain",
        createdAt: "2026-08-23T00:00:00.000Z",
      },
    ]

    const migrated = await migrateVoiceDataUrls(notes, store)
    expect(migrated[0]?.voiceNote?.audioUrl).toBe(voiceRef(8))
    expect(isDataUrl(migrated[0]?.voiceNote?.audioUrl ?? "")).toBe(false)
    expect(await (await getVoice(store, voiceRef(8)))?.text()).toBe("legacy")
    expect(migrated[1]?.voiceNote).toBeUndefined()
  })
})

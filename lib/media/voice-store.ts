import type { Note } from "@/lib/domain/types"

export const VOICE_REF_PREFIX = "idb:voice:"
export const VOICE_DB_NAME = "managekar-media"
export const VOICE_STORE_NAME = "voice"

export interface BinaryStore {
  put(key: string, blob: Blob): Promise<void>
  get(key: string): Promise<Blob | null>
  delete(key: string): Promise<void>
}

export function voiceRef(id: number): string {
  return `${VOICE_REF_PREFIX}${id}`
}

export function isVoiceRef(value: string): boolean {
  return value.startsWith(VOICE_REF_PREFIX)
}

export function isDataUrl(value: string): boolean {
  return value.startsWith("data:")
}

export function createMemoryBinaryStore(): BinaryStore {
  const data = new Map<string, Blob>()
  return {
    async put(key, blob) {
      data.set(key, blob)
    },
    async get(key) {
      return data.get(key) ?? null
    },
    async delete(key) {
      data.delete(key)
    },
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",")
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream"
  const bytes = Uint8Array.from(atob(payload ?? ""), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

export async function putVoice(store: BinaryStore, id: number, blob: Blob): Promise<string> {
  const ref = voiceRef(id)
  await store.put(ref, blob)
  return ref
}

export async function getVoice(store: BinaryStore, ref: string): Promise<Blob | null> {
  if (!isVoiceRef(ref)) {
    return null
  }
  return store.get(ref)
}

export async function deleteVoice(store: BinaryStore, ref: string): Promise<void> {
  if (!isVoiceRef(ref)) {
    return
  }
  await store.delete(ref)
}

export async function migrateVoiceDataUrls(notes: Note[], store: BinaryStore): Promise<Note[]> {
  const next: Note[] = []
  for (const note of notes) {
    const audioUrl = note.voiceNote?.audioUrl
    if (!audioUrl || !isDataUrl(audioUrl)) {
      next.push(note)
      continue
    }
    const ref = await putVoice(store, note.id, dataUrlToBlob(audioUrl))
    next.push({
      ...note,
      voiceNote: note.voiceNote ? { ...note.voiceNote, audioUrl: ref } : undefined,
    })
  }
  return next
}

function openVoiceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VOICE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(VOICE_STORE_NAME)) {
        db.createObjectStore(VOICE_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Could not open voice storage."))
  })
}

export function createIndexedDbVoiceStore(): BinaryStore {
  return {
    async put(key, blob) {
      const db = await openVoiceDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(VOICE_STORE_NAME, "readwrite")
        tx.objectStore(VOICE_STORE_NAME).put(blob, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error("Could not save voice note."))
      })
      db.close()
    },
    async get(key) {
      const db = await openVoiceDb()
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(VOICE_STORE_NAME, "readonly")
        const request = tx.objectStore(VOICE_STORE_NAME).get(key)
        request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null)
        request.onerror = () => reject(request.error ?? new Error("Could not read voice note."))
      })
      db.close()
      return blob
    },
    async delete(key) {
      const db = await openVoiceDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(VOICE_STORE_NAME, "readwrite")
        tx.objectStore(VOICE_STORE_NAME).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error("Could not delete voice note."))
      })
      db.close()
    },
  }
}

"use client"

import { useEffect, useState } from "react"
import { createIndexedDbVoiceStore, getVoice, isVoiceRef } from "@/lib/media/voice-store"

export function VoiceAudio({ audioUrl }: { audioUrl: string }) {
  const [src, setSrc] = useState<string | null>(isVoiceRef(audioUrl) ? null : audioUrl)

  useEffect(() => {
    if (!isVoiceRef(audioUrl)) {
      setSrc(audioUrl)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false
    void getVoice(createIndexedDbVoiceStore(), audioUrl).then((blob) => {
      if (cancelled || !blob) {
        return
      }
      objectUrl = URL.createObjectURL(blob)
      setSrc(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [audioUrl])

  if (!src) {
    return <p className="responsive-text-xs text-muted-readable">Audio is stored on this device…</p>
  }

  return (
    <audio controls className="w-full mb-3 rounded-lg" src={src}>
      Your browser does not support the audio element.
    </audio>
  )
}

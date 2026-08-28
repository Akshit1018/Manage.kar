"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Mic, Pause, Play, Square, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSheet } from "@/components/mobile-sheet"
import { cn } from "@/lib/utils"
import {
  classifyGetUserMediaError,
  detectHelpPlatform,
  microphoneHelpCopy,
  pickRecorderMimeType,
} from "@/lib/media/microphone"
import { formatRecordingClock, reduceVoiceSession, type VoicePhase } from "@/lib/media/voice-session"

export interface VoiceRecordingResult {
  blob: Blob
  transcription: string
  duration: number
}

interface VoiceRecorderProps {
  open: boolean
  onClose: () => void
  onSave: (result: VoiceRecordingResult) => void
  onSaveAsTask?: (text: string) => void
  autoStart?: boolean
}

export function VoiceRecorder({ open, onClose, onSave, onSaveAsTask, autoStart = false }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<VoicePhase>("idle")
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [help, setHelp] = useState<{ title: string; body: string } | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const timerRef = useRef<number | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  const clearClockAndStream = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  const reset = () => {
    clearClockAndStream()
    chunksRef.current = []
    blobRef.current = null
    setPreviewUrl(null)
    setSeconds(0)
    setTranscript("")
    setHelp(null)
    setPhase("idle")
  }

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    return () => {
      clearClockAndStream()
    }
  }, [open])

  const startClock = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    timerRef.current = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)
  }

  const stopClock = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startOptionalSpeech = () => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as Window & { webkitSpeechRecognition?: new () => BrowserSpeechRecognition }).webkitSpeechRecognition ||
          (window as Window & { SpeechRecognition?: new () => BrowserSpeechRecognition }).SpeechRecognition
        : undefined
    if (!SpeechRecognitionCtor) {
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = ""
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index]?.[0]?.transcript ?? ""
      }
      setTranscript(text.trim())
    }
    recognition.onerror = () => {
      recognition.stop()
    }
    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch {
      recognitionRef.current = null
    }
  }

  const requestMic = async () => {
    setPhase(reduceVoiceSession(phase, { type: "start" }))
    setHelp(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      const copy = microphoneHelpCopy(detectHelpPlatform(navigator.userAgent), "unsupported")
      setHelp(copy)
      setPhase("unsupported")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      const mimeType = pickRecorderMimeType((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/mp4" })
        blobRef.current = blob
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
        }
        const nextUrl = URL.createObjectURL(blob)
        previewUrlRef.current = nextUrl
        setPreviewUrl(nextUrl)
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      startOptionalSpeech()
      startClock()
      setPhase("recording")
    } catch (error) {
      const kind = classifyGetUserMediaError(error as { name?: string })
      const platform = detectHelpPlatform(navigator.userAgent)
      if (kind === "denied") {
        setHelp(microphoneHelpCopy(platform, "denied"))
        setPhase("denied")
        return
      }
      setHelp(microphoneHelpCopy(platform, "unsupported"))
      setPhase(kind === "unsupported" ? "unsupported" : "denied")
    }
  }

  useEffect(() => {
    if (open && autoStart) {
      void requestMic()
    }
  }, [open, autoStart])

  const pauseOrResume = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) {
      return
    }
    if (phase === "recording" && recorder.state === "recording") {
      recorder.pause()
      stopClock()
      setPhase(reduceVoiceSession(phase, { type: "pause" }))
      return
    }
    if (phase === "paused" && recorder.state === "paused") {
      recorder.resume()
      startClock()
      setPhase(reduceVoiceSession(phase, { type: "resume" }))
    }
  }

  const stop = () => {
    recognitionRef.current?.stop()
    stopClock()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setPhase(reduceVoiceSession(phase, { type: "stop" }))
  }

  const discard = () => {
    reset()
    onClose()
  }

  const saveNote = () => {
    const blob = blobRef.current
    if (!blob) {
      discard()
      return
    }
    onSave({
      blob,
      transcription: transcript || "Voice note",
      duration: seconds,
    })
    reset()
    onClose()
  }

  const saveTask = () => {
    onSaveAsTask?.(transcript || "Voice task")
    reset()
    onClose()
  }

  return (
    <MobileSheet open={open} onClose={discard} title="Voice note" variant="full" hideHeader>
      <div className="mk-voice">
        <div className="mk-voice-top">
          <Button variant="ghost" className="mk-touch text-white" onClick={discard} aria-label="Close recorder">
            <X className="h-5 w-5" />
            Close
          </Button>
          <p className="text-sm text-white/70">Stays on this device</p>
        </div>

        <div className="mk-voice-stage">
          <p className="mk-voice-clock" aria-live="polite">
            {formatRecordingClock(seconds)}
          </p>
          <button
            type="button"
            className={cn("mk-voice-bowl", phase === "recording" && "mk-voice-bowl-live", phase === "paused" && "mk-voice-bowl-paused")}
            onClick={phase === "idle" || phase === "denied" || phase === "unsupported" ? requestMic : undefined}
            aria-label={phase === "recording" ? "Recording" : "Start recording"}
          >
            <span className="mk-voice-bowl-ring" />
            <Mic className="h-10 w-10 text-white" />
          </button>
          <div className="mk-voice-wave" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className={cn("mk-voice-bar", phase === "recording" && "mk-voice-bar-live")} />
            ))}
          </div>
          <p className="mk-voice-status">
            {phase === "idle" && "Tap the bowl to record. Safari or Chrome will ask for the microphone."}
            {phase === "requesting" && "Waiting for microphone permission…"}
            {phase === "recording" && "Recording. The bowl fills the screen like Voice Memos."}
            {phase === "paused" && "Paused"}
            {phase === "review" && "Preview, then keep it as a note."}
            {phase === "denied" && (help?.title ?? "Microphone is blocked")}
            {phase === "unsupported" && (help?.title ?? "Recording is not available")}
          </p>
          {help ? <p className="mk-voice-help">{help.body}</p> : null}
          {transcript ? <p className="mk-voice-transcript">{transcript}</p> : null}
          {previewUrl && phase === "review" ? (
            <audio controls className="mk-voice-audio" src={previewUrl}>
              Your browser cannot play this recording.
            </audio>
          ) : null}
        </div>

        <div className="mk-voice-actions">
          {phase === "idle" || phase === "denied" || phase === "unsupported" ? (
            <Button className="mk-touch w-full rounded-full bg-red-500 text-white hover:bg-red-600" onClick={requestMic}>
              <Mic className="h-4 w-4" />
              Record
            </Button>
          ) : null}
          {phase === "recording" || phase === "paused" ? (
            <div className="mk-voice-action-row">
              <Button variant="outline" className="mk-touch rounded-full bg-transparent text-white" onClick={discard}>
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
              <Button variant="outline" className="mk-touch rounded-full bg-transparent text-white" onClick={pauseOrResume}>
                {phase === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {phase === "paused" ? "Resume" : "Pause"}
              </Button>
              <Button className="mk-touch rounded-full bg-red-500 text-white hover:bg-red-600" onClick={stop}>
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </div>
          ) : null}
          {phase === "review" ? (
            <div className="grid gap-2">
              <Button className="mk-touch w-full rounded-full" onClick={saveNote}>
                <Check className="h-4 w-4" />
                Save voice note
              </Button>
              {onSaveAsTask ? (
                <Button variant="outline" className="mk-touch w-full rounded-full bg-transparent text-white" onClick={saveTask}>
                  Save as task
                </Button>
              ) : null}
              <Button variant="ghost" className="mk-touch w-full text-white" onClick={discard}>
                Discard
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </MobileSheet>
  )
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, VolumeX, Pause, Play, SkipForward, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface TextToSpeechProps {
  text: string
  autoPlay?: boolean
  showControls?: boolean
  className?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

interface Voice {
  name: string
  lang: string
  localService: boolean
  default: boolean
}

export function TextToSpeech({
  text,
  autoPlay = false,
  showControls = true,
  className,
  onStart,
  onEnd,
  onError,
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [rate, setRate] = useState([1])
  const [pitch, setPitch] = useState([1])
  const [volume, setVolume] = useState([0.8])
  const [showSettings, setShowSettings] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setTtsSupported(true)
      synthRef.current = window.speechSynthesis

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || []
        const voiceList = availableVoices.map((voice) => ({
          name: voice.name,
          lang: voice.lang,
          localService: voice.localService,
          default: voice.default,
        }))
        setVoices(voiceList)

        // Set default voice (prefer English voices)
        const englishVoice = availableVoices.find((voice) => voice.lang.startsWith("en") && voice.localService)
        if (englishVoice && !selectedVoice) {
          setSelectedVoice(englishVoice.name)
        }
      }

      loadVoices()

      // Some browsers load voices asynchronously
      if (synthRef.current?.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    }
  }, [selectedVoice])

  useEffect(() => {
    if (autoPlay && text && ttsSupported) {
      handlePlay()
    }
  }, [autoPlay, text, ttsSupported])

  const createUtterance = (textToSpeak: string) => {
    if (!synthRef.current) return null

    const utterance = new SpeechSynthesisUtterance(textToSpeak)

    // Find selected voice
    const availableVoices = synthRef.current.getVoices()
    const voice = availableVoices.find((v) => v.name === selectedVoice)
    if (voice) {
      utterance.voice = voice
    }

    utterance.rate = rate[0]
    utterance.pitch = pitch[0]
    utterance.volume = volume[0]

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      onStart?.()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      onEnd?.()
    }

    utterance.onerror = (event) => {
      setIsPlaying(false)
      setIsPaused(false)
      onError?.(event.error)
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    return utterance
  }

  const handlePlay = () => {
    if (!synthRef.current || !text) return

    if (isPaused) {
      synthRef.current.resume()
      return
    }

    // Stop any current speech
    synthRef.current.cancel()

    const utterance = createUtterance(text)
    if (utterance) {
      utteranceRef.current = utterance
      synthRef.current.speak(utterance)
    }
  }

  const handlePause = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause()
    }
  }

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsPlaying(false)
      setIsPaused(false)
    }
  }

  const handleSkip = () => {
    if (synthRef.current && utteranceRef.current) {
      // Skip to next sentence or paragraph
      const sentences = text.split(/[.!?]+/)
      if (sentences.length > 1) {
        const currentText = utteranceRef.current.text
        const currentIndex = sentences.findIndex((s) => currentText.includes(s))
        if (currentIndex < sentences.length - 1) {
          handleStop()
          const nextText = sentences.slice(currentIndex + 1).join(". ")
          const utterance = createUtterance(nextText)
          if (utterance) {
            utteranceRef.current = utterance
            synthRef.current.speak(utterance)
          }
        }
      }
    }
  }

  if (!ttsSupported) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-accent/20"
        onClick={isPlaying ? (isPaused ? handlePlay : handlePause) : handlePlay}
        disabled={!text}
      >
        {isPlaying && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      {showControls && (
        <>
          {/* Stop Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent/20"
            onClick={handleStop}
            disabled={!isPlaying}
          >
            <VolumeX className="h-4 w-4" />
          </Button>

          {/* Skip Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent/20"
            onClick={handleSkip}
            disabled={!isPlaying}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent/20"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Volume Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-1">
          <Volume2 className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Speaking...</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-full mt-2 right-0 glass-card p-4 rounded-2xl shadow-2xl z-50 w-80">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold font-sans">Voice Settings</h4>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rate Control */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Speed: {rate[0].toFixed(1)}x</label>
              <Slider value={rate} onValueChange={setRate} min={0.5} max={2} step={0.1} className="w-full" />
            </div>

            {/* Pitch Control */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Pitch: {pitch[0].toFixed(1)}</label>
              <Slider value={pitch} onValueChange={setPitch} min={0.5} max={2} step={0.1} className="w-full" />
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Volume: {Math.round(volume[0] * 100)}%
              </label>
              <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.1} className="w-full" />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Hook for easy TTS integration
export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)
      synthRef.current = window.speechSynthesis
    }
  }, [])

  const speak = (
    text: string,
    options?: {
      rate?: number
      pitch?: number
      volume?: number
      voice?: string
    },
  ) => {
    if (!synthRef.current || !text) return

    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (options) {
      if (options.rate) utterance.rate = options.rate
      if (options.pitch) utterance.pitch = options.pitch
      if (options.volume) utterance.volume = options.volume

      if (options.voice) {
        const voices = synthRef.current.getVoices()
        const voice = voices.find((v) => v.name === options.voice)
        if (voice) utterance.voice = voice
      }
    }

    synthRef.current.speak(utterance)
  }

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }

  const pause = () => {
    if (synthRef.current) {
      synthRef.current.pause()
    }
  }

  const resume = () => {
    if (synthRef.current) {
      synthRef.current.resume()
    }
  }

  return {
    isSupported,
    speak,
    stop,
    pause,
    resume,
  }
}

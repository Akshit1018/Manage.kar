"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  X,
  CheckSquare,
  FileText,
  Circle,
  CheckCircle2,
  Calendar,
  Clock,
  Edit,
  Mic,
  Volume2,
  MicOff,
  Settings,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: number
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate: string
  description?: string
  recurring?: "none" | "daily" | "weekly" | "monthly"
  reminders?: boolean
  checklist?: { id: number; text: string; completed: boolean }[]
}

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  voiceNote?: {
    audioUrl: string
    transcription: string
    duration: number
  }
}

interface FloatingToggleProps {
  tasks?: Task[]
  notes?: Note[]
  onTaskToggle?: (taskId: number) => void
  onAddTask?: () => void
  onAddNote?: () => void
  onEditTask?: (task: Task) => void
  onEditNote?: (note: Note) => void
  onVoiceNote?: (audioBlob: Blob, transcription: string) => void
  onSpeechToText?: (text: string) => void
  onCreateTaskFromVoice?: (text: string) => void
}

export function FloatingToggle({
  tasks = [],
  notes = [],
  onTaskToggle,
  onAddTask,
  onAddNote,
  onEditTask,
  onEditNote,
  onVoiceNote,
  onSpeechToText,
  onCreateTaskFromVoice,
}: FloatingToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks")
  const [popupPosition, setPopupPosition] = useState<"top" | "bottom">("bottom")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechText, setSpeechText] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0)

  const [showIconBar, setShowIconBar] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [focusDuration, setFocusDuration] = useState(25) // minutes
  const [focusTimer, setFocusTimer] = useState<NodeJS.Timeout | null>(null)
  const [focusTimeLeft, setFocusTimeLeft] = useState(0)

  const [showVoiceChoice, setShowVoiceChoice] = useState(false)
  const [recordedContent, setRecordedContent] = useState("")
  const [choiceTimer, setChoiceTimer] = useState<NodeJS.Timeout | null>(null)
  const [countdown, setCountdown] = useState(5)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  const [permissionsGranted, setPermissionsGranted] = useState({
    microphone: false,
    notifications: false,
    storage: true, // localStorage is always available
  })

  useEffect(() => {
    const savedPosition = localStorage.getItem("floating-toggle-position")
    if (savedPosition) {
      const parsed = JSON.parse(savedPosition)
      setPosition(parsed)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("floating-toggle-position", JSON.stringify(position))
  }, [position])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onstart = () => {
          console.log("[v0] Speech recognition started")
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setSpeechText(finalTranscript + interimTranscript)
          setLastSpeechTime(Date.now())

          if (silenceTimer) {
            clearTimeout(silenceTimer)
          }

          const timer = setTimeout(() => {
            if (finalTranscript.trim() || interimTranscript.trim()) {
              const fullText = (finalTranscript + interimTranscript).trim()
              if (fullText) {
                console.log("[v0] Auto-saving voice note:", fullText)
                onSpeechToText?.(fullText)
                stopRecording()

                // Auto-close after successful save
                setTimeout(() => {
                  setIsOpen(false)
                }, 1000)
              }
            }
          }, 3000)

          setSilenceTimer(timer)

          if (finalTranscript) {
            console.log("[v0] Final transcript:", finalTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.error("[v0] Speech recognition error:", event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          console.log("[v0] Speech recognition ended")
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [onSpeechToText, recordingTime])

  useEffect(() => {
    setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
  }, [])

  useEffect(() => {
    const checkPermissions = async () => {
      // Check microphone permission
      try {
        const micPermission = await navigator.permissions.query({ name: "microphone" as PermissionName })
        setPermissionsGranted((prev) => ({ ...prev, microphone: micPermission.state === "granted" }))

        micPermission.addEventListener("change", () => {
          setPermissionsGranted((prev) => ({ ...prev, microphone: micPermission.state === "granted" }))
        })
      } catch (error) {
        console.log("[v0] Microphone permission check not supported")
      }

      // Check notification permission
      if ("Notification" in window) {
        setPermissionsGranted((prev) => ({
          ...prev,
          notifications: Notification.permission === "granted",
        }))
      }
    }

    checkPermissions()
  }, [])

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Voice recording is not supported in this browser. Please use Chrome, Firefox, or Safari.")
        return
      }

      // Check if we have microphone permission
      if (!permissionsGranted.microphone) {
        setShowPermissionPrompt(true)
        return
      }

      if (speechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.start()
          setRecordingTime(0)
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1)
          }, 1000)
          return
        } catch (error) {
          console.error("[v0] Speech recognition failed, falling back to audio recording:", error)
        }
      }

      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/wav",
        })
        const transcription = speechText || "Voice note recorded at " + new Date().toLocaleTimeString()

        if (permissionsGranted.notifications) {
          new Notification("Voice Note Saved", {
            body: `"${transcription.substring(0, 50)}${transcription.length > 50 ? "..." : ""}"`,
            icon: "/icon.png",
          })
        }

        onVoiceNote?.(audioBlob, transcription)
        stream.getTracks().forEach((track) => track.stop())

        // Auto-close after successful save
        setTimeout(() => {
          setIsOpen(false)
        }, 1000)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setShowPermissionPrompt(true)
      } else {
        alert("Unable to access microphone. Please check your browser permissions and try again.")
      }
    }
  }

  const stopRecording = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      setSilenceTimer(null)
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    const content = speechText.trim() || "Voice note recorded at " + new Date().toLocaleTimeString()
    if (content && content !== "Voice note recorded at " + new Date().toLocaleTimeString()) {
      setRecordedContent(content)
      setShowVoiceChoice(true)
      setCountdown(5)

      // Start 5-second countdown timer
      const timer = setTimeout(() => {
        saveAsNote(content)
        setShowVoiceChoice(false)
      }, 5000)
      setChoiceTimer(timer)

      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    setRecordingTime(0)
    setSpeechText("")

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }

  const saveAsNote = (content: string) => {
    if (permissionsGranted.notifications) {
      new Notification("Voice Note Saved", {
        body: `"${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        icon: "/icon.png",
      })
    }

    onSpeechToText?.(content)
    cleanupChoice()
  }

  const saveAsTask = (content: string) => {
    onCreateTaskFromVoice?.(content)

    if (permissionsGranted.notifications) {
      new Notification("Voice Task Created", {
        body: `"${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        icon: "/icon.png",
      })
    }

    cleanupChoice()
  }

  const cleanupChoice = () => {
    if (choiceTimer) {
      clearTimeout(choiceTimer)
      setChoiceTimer(null)
    }
    setShowVoiceChoice(false)
    setRecordedContent("")
    setCountdown(5)
    setTimeout(() => {
      setIsOpen(false)
    }, 1000)
  }

  const requestPermissions = async () => {
    try {
      // Request microphone permission
      if (!permissionsGranted.microphone) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop()) // Stop immediately after getting permission
        setPermissionsGranted((prev) => ({ ...prev, microphone: true }))
      }

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        setPermissionsGranted((prev) => ({ ...prev, notifications: permission === "granted" }))
      }

      setShowPermissionPrompt(false)
    } catch (error) {
      console.error("[v0] Permission request failed:", error)
      alert("Please allow microphone access in your browser settings to use voice recording.")
    }
  }

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({ x: clientX - position.x, y: clientY - position.y })

    const timer = setTimeout(() => {
      if (!hasMoved) {
        startRecording()
      }
    }, 2000)
    setLongPressTimer(timer)
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    setHasMoved(true)
    const newX = Math.max(0, Math.min(window.innerWidth - 56, clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 56, clientY - dragStart.y))
    setPosition({ x: newX, y: newY })
  }

  const handleEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    if (isRecording || isListening) {
      stopRecording()
    } else if (!hasMoved && !isRecording && !isListening) {
      if (!showIconBar) {
        setShowIconBar(true)
        setTimeout(() => setShowIconBar(false), 3000) // Auto-hide after 3 seconds
      } else {
        setIsOpen(!isOpen)
      }
    }

    setIsDragging(false)
    setHasMoved(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    handleEnd()
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd, { passive: false })

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, hasMoved])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const windowHeight = window.innerHeight
      const buttonCenter = position.y + 28
      setPopupPosition(buttonCenter < windowHeight / 2 ? "bottom" : "top")
    }
  }, [isOpen, position])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (longPressTimer) clearTimeout(longPressTimer)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
      if (isRecording || isListening) stopRecording()
      if (focusTimer) clearInterval(focusTimer)
      if (choiceTimer) clearTimeout(choiceTimer)
    }
  }, [])

  const startFocusMode = (duration: number) => {
    setFocusMode(true)
    setFocusDuration(duration)
    setFocusTimeLeft(duration * 60) // convert to seconds

    const timer = setInterval(() => {
      setFocusTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setFocusMode(false)
          if (permissionsGranted.notifications) {
            new Notification("Focus Session Complete!", {
              body: `You've completed a ${duration}-minute focus session!`,
              icon: "/icon.png",
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setFocusTimer(timer)
    setIsOpen(false)
  }

  const stopFocusMode = () => {
    if (focusTimer) {
      clearInterval(focusTimer)
      setFocusTimer(null)
    }
    setFocusMode(false)
    setFocusTimeLeft(0)
  }

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  const isActiveRecording = isRecording || isListening

  return (
    <>
      {showPermissionPrompt && (
        <div className="modal-mobile bg-black/50 backdrop-blur-sm">
          <Card className="modal-content-mobile bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-0 hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Permissions Required</h3>
                  <p className="text-sm text-muted-foreground">Enable features for better experience</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/20">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Microphone Access</p>
                      <p className="text-xs text-muted-foreground">For voice notes and speech-to-text</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      permissionsGranted.microphone ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/20">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground">For task reminders and confirmations</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      permissionsGranted.notifications ? "bg-green-500" : "bg-yellow-500",
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowPermissionPrompt(false)} variant="outline" className="flex-1">
                  Skip
                </Button>
                <Button onClick={requestPermissions} className="flex-1">
                  Grant Permissions
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showIconBar && !isOpen && !isActiveRecording && (
        <div
          className="fixed z-[9999] transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 fade-in-0"
          style={{
            left: `${position.x - 60}px`,
            top: `${position.y - 60}px`,
          }}
        >
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-full p-2 shadow-2xl">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full hover:bg-primary/20"
              onClick={onAddTask}
              title="Quick Task"
            >
              <CheckSquare className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full hover:bg-green-500/20"
              onClick={onAddNote}
              title="Quick Note"
            >
              <FileText className="h-4 w-4 text-green-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full hover:bg-orange-500/20"
              onClick={() => startFocusMode(25)}
              title="Focus Mode (25min)"
            >
              <Clock className="h-4 w-4 text-orange-500" />
            </Button>
          </div>
        </div>
      )}

      {focusMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-center justify-center">
          <Card className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-0 hover:shadow-xl transition-all duration-300 text-center max-w-sm mx-4 shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-orange-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-readable">Focus Mode Active</h3>
              <p className="text-3xl font-bold text-orange-500 mb-4">
                {Math.floor(focusTimeLeft / 60)}:{(focusTimeLeft % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-muted-readable mb-6">Stay focused! You're doing great.</p>
              <div className="flex gap-2">
                <Button onClick={stopFocusMode} variant="outline" className="flex-1 bg-transparent">
                  End Session
                </Button>
                <Button onClick={() => startFocusMode(5)} variant="ghost" className="flex-1">
                  +5 min
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showVoiceChoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <Card className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-0 hover:shadow-xl transition-all duration-300 text-center max-w-sm mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-readable">Save Voice Recording As:</h3>
              <div className="mt-4 p-3 bg-accent/20 rounded-xl mb-4">
                <p className="text-sm text-readable">{recordedContent}</p>
              </div>
              <p className="text-sm text-muted-readable mb-6">Auto-saving as note in {countdown} seconds...</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveAsNote(recordedContent)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Save as Note
                </Button>
                <Button onClick={() => saveAsTask(recordedContent)} variant="outline" className="flex-1">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Save as Task
                </Button>
              </div>
              <Button onClick={cleanupChoice} variant="ghost" className="w-full mt-2 text-muted-foreground">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Button
        ref={buttonRef}
        size="icon"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => {
          setIsHovered(true)
          if (!isOpen && !isActiveRecording) {
            setShowIconBar(true)
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setTimeout(() => setShowIconBar(false), 1000)
        }}
        className={cn(
          "floating-button h-14 w-14 rounded-full shadow-lg transition-all duration-300 select-none",
          "fixed z-[9999] cursor-move border-2",
          isOpen || isActiveRecording || isDragging
            ? "bg-primary/95 backdrop-blur-md border-primary/50 text-primary-foreground scale-110"
            : focusMode
              ? "bg-orange-500/95 backdrop-blur-md border-orange-400/50 text-white animate-pulse"
              : isHovered || showIconBar
                ? "bg-primary/80 backdrop-blur-md border-primary/30 text-primary-foreground scale-105"
                : "bg-primary/20 backdrop-blur-md border-primary/20 text-primary-foreground hover:bg-primary/30",
          isActiveRecording ? "animate-pulse bg-red-500/95 border-red-400/50 text-white" : "",
          isDragging ? "scale-110 shadow-2xl" : "",
          "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {isActiveRecording ? (
          <div className="flex flex-col items-center">
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            <span className="text-xs font-medium">{recordingTime}s</span>
          </div>
        ) : focusMode ? (
          <div className="flex flex-col items-center">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">{Math.floor(focusTimeLeft / 60)}</span>
          </div>
        ) : isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {isActiveRecording && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] flex items-center justify-center">
          <Card className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-0 hover:shadow-xl transition-all duration-300 text-center max-w-sm mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center animate-pulse shadow-lg",
                    isListening ? "bg-blue-500 shadow-blue-500/30" : "bg-red-500 shadow-red-500/30",
                  )}
                >
                  {isListening ? <Mic className="h-8 w-8 text-white" /> : <MicOff className="h-8 w-8 text-white" />}
                </div>
              </div>
              <p className="text-lg font-semibold mb-2 text-readable">
                {isListening ? "Listening..." : "Recording Voice Note"}
              </p>
              <p className="text-sm text-muted-readable mb-4">
                {isListening ? "Auto-saves after 3s of silence" : "Release to stop"} • {recordingTime}s
              </p>
              {speechText && (
                <div className="mt-4 p-3 bg-accent/20 rounded-xl">
                  <p className="text-sm text-readable">{speechText}</p>
                </div>
              )}
              <p className="text-xs text-muted-readable">
                {speechSupported
                  ? "Using speech recognition with auto-save"
                  : "Long press for 2+ seconds to start recording"}
              </p>
            </div>
          </Card>
        </div>
      )}

      {isOpen && !isActiveRecording && (
        <div
          ref={popupRef}
          className="fixed w-80 max-w-[calc(100vw-2rem)] z-[9999] transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 fade-in-0"
          style={{
            left: Math.min(position.x, window.innerWidth - 320 - 16),
            [popupPosition === "bottom" ? "top" : "bottom"]:
              popupPosition === "bottom" ? `${position.y + 70}px` : `${window.innerHeight - position.y + 14}px`,
          }}
        >
          <Card className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-0 hover:shadow-xl transition-all duration-300 overflow-hidden shadow-2xl">
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "flex-1 p-4 text-sm font-medium transition-colors rounded-tl-3xl",
                  activeTab === "tasks"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks ({pendingTasks.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "flex-1 p-4 text-sm font-medium transition-colors rounded-tr-3xl",
                  activeTab === "notes"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes ({notes.length})
                </div>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {activeTab === "tasks" ? (
                <div className="p-4 space-y-3">
                  <Button
                    onClick={onAddTask}
                    className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Task
                  </Button>

                  {pendingTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-readable mb-2 font-sans">
                        Pending ({pendingTasks.length})
                      </h4>
                      {pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-accent/20 transition-colors group"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-primary/20"
                            onClick={() => onTaskToggle?.(task.id)}
                          >
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-readable truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "destructive"
                                    : task.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                              <span className="text-xs text-muted-readable flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate}
                              </span>
                            </div>
                          </div>
                          {onEditTask && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onEditTask(task)}
                            >
                              <Edit className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-readable mb-2 font-sans">
                        Completed ({completedTasks.length})
                      </h4>
                      {completedTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl opacity-60">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => onTaskToggle?.(task.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-readable line-through truncate">{task.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingTasks.length === 0 && completedTasks.length === 0 && (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-readable">No tasks yet. Create your first task!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <Button
                    onClick={onAddNote}
                    className="w-full justify-start bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Note
                  </Button>

                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-2xl hover:bg-accent/20 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-readable truncate flex-1">
                            {note.title}
                            {(note as any).voiceNote && <Volume2 className="h-3 w-3 inline ml-2 text-blue-500" />}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-readable flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {note.createdAt}
                            </span>
                            {onEditNote && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onEditNote(note)}
                              >
                                <Edit className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-readable line-clamp-2">{note.content}</p>
                        {(note as any).voiceNote && (
                          <div className="mt-2 p-2 bg-primary/10 rounded-xl">
                            <p className="text-xs text-muted-readable">
                              Voice transcription: {(note as any).voiceNote.transcription}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-readable">No notes yet. Create your first note!</p>
                      <p className="text-xs text-muted-readable mt-2">
                        Long press the + button to{" "}
                        {speechSupported ? "use speech recognition with auto-save" : "record a voice note"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export default FloatingToggle

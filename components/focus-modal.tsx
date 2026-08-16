"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, Timer, Brain, Coffee, Target, TrendingUp, Clock, Zap } from "lucide-react"

interface FocusSession {
  id: number
  type: "pomodoro" | "deep-work" | "break" | "custom"
  duration: number
  completed: boolean
  startTime: string
  endTime?: string
}

interface FocusModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FocusModal({ isOpen, onClose }: FocusModalProps) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [selectedType, setSelectedType] = useState<"pomodoro" | "deep-work" | "break" | "custom">("pomodoro")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const focusTypes = [
    { type: "pomodoro" as const, name: "Pomodoro", duration: 25, icon: Timer, color: "bg-red-500/20 text-red-500" },
    { type: "deep-work" as const, name: "Deep Work", duration: 90, icon: Brain, color: "bg-blue-500/20 text-blue-500" },
    { type: "break" as const, name: "Break", duration: 5, icon: Coffee, color: "bg-green-500/20 text-green-500" },
    { type: "custom" as const, name: "Custom", duration: 30, icon: Target, color: "bg-purple-500/20 text-purple-500" },
  ]

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining])

  const handleTap = () => {
    setTapCount((prev) => prev + 1)

    // Reset tap count after 3 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    tapTimeoutRef.current = setTimeout(() => {
      if (tapCount < 4) {
        setTapCount(0)
      }
    }, 3000)

    if (tapCount >= 4) {
      setIsUnlocked(true)
      setTapCount(0)
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }

  const startSession = (type: typeof selectedType, duration: number) => {
    const newSession: FocusSession = {
      id: Date.now(),
      type,
      duration: duration * 60, // Convert to seconds
      completed: false,
      startTime: new Date().toISOString(),
    }

    setCurrentSession(newSession)
    setTimeRemaining(duration * 60)
    setIsRunning(true)
    setIsUnlocked(false)
    setTapCount(0)
  }

  const pauseSession = () => {
    setIsRunning(false)
  }

  const resumeSession = () => {
    setIsRunning(true)
  }

  const stopSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        completed: false,
        endTime: new Date().toISOString(),
      }
      setSessions((prev) => [...prev, updatedSession])
    }

    setCurrentSession(null)
    setTimeRemaining(0)
    setIsRunning(false)
    setIsUnlocked(false)
    setTapCount(0)
  }

  const handleSessionComplete = () => {
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        completed: true,
        endTime: new Date().toISOString(),
      }
      setSessions((prev) => [...prev, completedSession])
    }

    setCurrentSession(null)
    setIsRunning(false)
    setIsUnlocked(false)
    setTapCount(0)

    // Show completion notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Focus Session Complete!", {
        body: `Great job! You completed a ${currentSession?.type} session.`,
        icon: "/favicon.ico",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTodaysSessions = () => {
    const today = new Date().toDateString()
    return sessions.filter((session) => new Date(session.startTime).toDateString() === today)
  }

  const getCompletedSessionsToday = () => {
    return getTodaysSessions().filter((session) => session.completed).length
  }

  const getTotalFocusTimeToday = () => {
    const completedSessions = getTodaysSessions().filter((session) => session.completed)
    return completedSessions.reduce((total, session) => total + session.duration, 0) / 60 // Convert to minutes
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-sans flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Focus Mode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold font-sans text-primary">{getCompletedSessionsToday()}</div>
              <div className="text-xs text-muted-foreground font-serif">Sessions</div>
            </Card>
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold font-sans text-blue-500">{Math.round(getTotalFocusTimeToday())}</div>
              <div className="text-xs text-muted-foreground font-serif">Minutes</div>
            </Card>
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold font-sans text-green-500">
                {sessions.filter((s) => s.completed).length}
              </div>
              <div className="text-xs text-muted-foreground font-serif">Total</div>
            </Card>
          </div>

          {currentSession ? (
            <div className="space-y-6">
              {/* Current Session */}
              <Card className="glass-card p-6 rounded-2xl text-center">
                <div className="mb-4">
                  <Badge className="mb-2 capitalize">{currentSession.type.replace("-", " ")}</Badge>
                  <div className="text-4xl font-bold font-sans mb-2">{formatTime(timeRemaining)}</div>
                  <Progress
                    value={((currentSession.duration - timeRemaining) / currentSession.duration) * 100}
                    className="h-2"
                  />
                </div>

                {!isUnlocked ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-serif">
                      Tap {5 - tapCount} more times to unlock controls
                    </p>
                    <Button size="lg" className="w-full rounded-full glass" onClick={handleTap}>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < tapCount ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full glass bg-transparent"
                      onClick={isRunning ? pauseSession : resumeSession}
                    >
                      {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isRunning ? "Pause" : "Resume"}
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 rounded-full" onClick={stopSession}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Focus Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                {focusTypes.map((focus) => {
                  const Icon = focus.icon
                  return (
                    <Card
                      key={focus.type}
                      className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                        selectedType === focus.type ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setSelectedType(focus.type)
                        setSelectedDuration(focus.duration)
                      }}
                    >
                      <div className="text-center space-y-2">
                        <div className={`w-10 h-10 rounded-xl ${focus.color} flex items-center justify-center mx-auto`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold font-sans text-sm">{focus.name}</div>
                          <div className="text-xs text-muted-foreground font-serif">{focus.duration}min</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Custom Duration */}
              {selectedType === "custom" && (
                <Card className="glass-card p-4 rounded-xl">
                  <div className="space-y-3">
                    <label className="text-sm font-medium font-sans">Duration (minutes)</label>
                    <div className="flex gap-2">
                      {[15, 30, 45, 60, 90].map((duration) => (
                        <Button
                          key={duration}
                          variant={selectedDuration === duration ? "default" : "outline"}
                          size="sm"
                          className="flex-1 rounded-full"
                          onClick={() => setSelectedDuration(duration)}
                        >
                          {duration}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Start Button */}
              <Button
                size="lg"
                className="w-full rounded-full"
                onClick={() => startSession(selectedType, selectedDuration)}
              >
                <Play className="h-5 w-5 mr-2" />
                Start {selectedType.replace("-", " ")} ({selectedDuration}min)
              </Button>
            </div>
          )}

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold font-sans flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Sessions
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {sessions
                  .slice(-3)
                  .reverse()
                  .map((session) => (
                    <Card key={session.id} className="glass-card p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${session.completed ? "bg-green-500" : "bg-orange-500"}`}
                          />
                          <span className="text-sm font-serif capitalize">{session.type.replace("-", " ")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Math.round(session.duration / 60)}min
                          {session.completed && <span className="text-green-500">✓</span>}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

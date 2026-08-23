"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, Timer, Brain, Coffee, Target, TrendingUp, Clock, Zap } from "lucide-react"
import type { ActiveFocus, FocusType, Workspace } from "@/lib/domain/types"
import { nextNumericId } from "@/lib/store/workspace"
import { localDateKey } from "@/lib/dates/due-date"

interface FocusModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  persist: (mutator: (current: Workspace) => Workspace) => Workspace
}

function remainingSeconds(focus: ActiveFocus, now = Date.now()) {
  if (!focus.isRunning) {
    return focus.remainingSeconds
  }
  const elapsed = Math.floor((now - new Date(focus.startedAt).getTime()) / 1000)
  return Math.max(0, focus.remainingSeconds - elapsed)
}

export function FocusModal({ isOpen, onClose, workspace, persist }: FocusModalProps) {
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [selectedType, setSelectedType] = useState<FocusType>("pomodoro")
  const [now, setNow] = useState(Date.now())
  const active = workspace.activeFocus
  const sessions = workspace.focusSessions

  useEffect(() => {
    if (!active?.isRunning) {
      return
    }
    const interval = window.setInterval(() => {
      const left = remainingSeconds(active)
      setNow(Date.now())
      if (left <= 0) {
        persist((current) => {
          if (!current.activeFocus) {
            return current
          }
          const completed = {
            id: current.activeFocus.sessionId,
            type: current.activeFocus.type,
            durationSeconds: current.activeFocus.durationSeconds,
            completed: true,
            startTime: current.activeFocus.startedAt,
            endTime: new Date().toISOString(),
          }
          if (
            current.settings.notifications.enabled &&
            current.settings.notifications.focusBreaks &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("Focus session complete", { body: `Finished a ${completed.type} session.` })
          }
          return {
            ...current,
            activeFocus: null,
            focusSessions: [...current.focusSessions, completed],
          }
        })
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [active, persist])

  const focusTypes = [
    { type: "pomodoro" as const, name: "Pomodoro", duration: 25, icon: Timer, color: "bg-red-500/20 text-red-500" },
    { type: "deep-work" as const, name: "Deep Work", duration: 90, icon: Brain, color: "bg-blue-500/20 text-blue-500" },
    { type: "break" as const, name: "Break", duration: 5, icon: Coffee, color: "bg-green-500/20 text-green-500" },
    { type: "custom" as const, name: "Custom", duration: 30, icon: Target, color: "bg-purple-500/20 text-purple-500" },
  ]

  const startSession = (type: FocusType, durationMinutes: number) => {
    persist((current) => ({
      ...current,
      activeFocus: {
        sessionId: nextNumericId(current.focusSessions),
        type,
        durationSeconds: durationMinutes * 60,
        remainingSeconds: durationMinutes * 60,
        isRunning: true,
        startedAt: new Date().toISOString(),
        accumulatedElapsed: 0,
      },
    }))
  }

  const pauseSession = () => {
    if (!active) {
      return
    }
    persist((current) => {
      if (!current.activeFocus) {
        return current
      }
      return {
        ...current,
        activeFocus: {
          ...current.activeFocus,
          isRunning: false,
          remainingSeconds: remainingSeconds(current.activeFocus),
        },
      }
    })
  }

  const resumeSession = () => {
    persist((current) => {
      if (!current.activeFocus) {
        return current
      }
      return {
        ...current,
        activeFocus: {
          ...current.activeFocus,
          isRunning: true,
          startedAt: new Date().toISOString(),
        },
      }
    })
  }

  const stopSession = () => {
    persist((current) => {
      if (!current.activeFocus) {
        return current
      }
      return {
        ...current,
        focusSessions: [
          ...current.focusSessions,
          {
            id: current.activeFocus.sessionId,
            type: current.activeFocus.type,
            durationSeconds: current.activeFocus.durationSeconds - remainingSeconds(current.activeFocus),
            completed: false,
            startTime: current.activeFocus.startedAt,
            endTime: new Date().toISOString(),
          },
        ],
        activeFocus: null,
      }
    })
  }

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const today = localDateKey()
  const todaysSessions = sessions.filter((session) => localDateKey(new Date(session.startTime)) === today)
  const left = active ? remainingSeconds(active, now) : 0

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-sans flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Focus
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-primary">{todaysSessions.filter((session) => session.completed).length}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </Card>
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-blue-500">
                {Math.round(todaysSessions.filter((session) => session.completed).reduce((total, session) => total + session.durationSeconds, 0) / 60)}
              </div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </Card>
            <Card className="glass-card p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-green-500">{sessions.filter((session) => session.completed).length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </Card>
          </div>

          {active ? (
            <Card className="glass-card p-6 rounded-2xl text-center">
              <Badge className="mb-2 capitalize">{active.type.replace("-", " ")}</Badge>
              <div className="text-4xl font-bold mb-2">{formatClock(left)}</div>
              <Progress value={((active.durationSeconds - left) / active.durationSeconds) * 100} className="h-2" />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={active.isRunning ? pauseSession : resumeSession}>
                  {active.isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {active.isRunning ? "Pause" : "Resume"}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={stopSession}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {focusTypes.map((focus) => {
                  const Icon = focus.icon
                  return (
                    <Card
                      key={focus.type}
                      className={`glass-card p-4 rounded-xl cursor-pointer ${selectedType === focus.type ? "ring-2 ring-primary" : ""}`}
                      onClick={() => {
                        setSelectedType(focus.type)
                        setSelectedDuration(focus.duration)
                      }}
                    >
                      <div className="text-center space-y-2">
                        <div className={`w-10 h-10 rounded-xl ${focus.color} flex items-center justify-center mx-auto`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="font-semibold text-sm">{focus.name}</div>
                        <div className="text-xs text-muted-foreground">{focus.duration}min</div>
                      </div>
                    </Card>
                  )
                })}
              </div>
              {selectedType === "custom" && (
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedDuration(duration)}
                    >
                      {duration}
                    </Button>
                  ))}
                </div>
              )}
              <Button size="lg" className="w-full" onClick={() => startSession(selectedType, selectedDuration)}>
                <Play className="h-5 w-5 mr-2" />
                Start {selectedType.replace("-", " ")} ({selectedDuration}min)
              </Button>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent sessions
              </h3>
              {sessions
                .slice(-3)
                .reverse()
                .map((session) => (
                  <Card key={session.id} className="glass-card p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{session.type.replace("-", " ")}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(session.durationSeconds / 60)}min
                        {session.completed ? " ✓" : ""}
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

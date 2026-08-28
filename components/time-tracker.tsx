"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Timer, BarChart3, Calendar } from "lucide-react"
import { MobileSheet } from "@/components/mobile-sheet"
import type { TimeEntry, Workspace } from "@/lib/domain/types"
import { allocateEntityId } from "@/lib/store/workspace"
import { localDateKey } from "@/lib/dates/due-date"

interface TimeTrackerProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  persist: (mutator: (current: Workspace) => Workspace) => Workspace
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`
}

function runningDuration(entry: TimeEntry, now = Date.now()) {
  if (!entry.isRunning) {
    return entry.duration
  }
  return entry.duration + Math.max(0, now - new Date(entry.startTime).getTime())
}

export function TimeTracker({ isOpen, onClose, workspace, persist }: TimeTrackerProps) {
  const timeEntries = workspace.timeEntries
  const currentEntry = timeEntries.find((entry) => entry.isRunning) ?? timeEntries.find((entry) => !entry.endTime) ?? null
  const [newTaskName, setNewTaskName] = useState("")
  const [newProject, setNewProject] = useState("Personal")
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!currentEntry?.isRunning) {
      return
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [currentEntry?.isRunning, currentEntry?.id])

  const startTimer = () => {
    const taskName = newTaskName.trim()
    if (!taskName) {
      return
    }
    persist((current) => {
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        timeEntries: [
          {
            id: allocated.id,
            taskName,
            project: newProject,
            startTime: new Date().toISOString(),
            duration: 0,
            isRunning: true,
          },
          ...allocated.workspace.timeEntries.map((entry) =>
            entry.isRunning
              ? { ...entry, isRunning: false, endTime: new Date().toISOString(), duration: runningDuration(entry) }
              : entry,
          ),
        ],
      }
    })
    setNewTaskName("")
  }

  const pauseTimer = () => {
    if (!currentEntry) {
      return
    }
    persist((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) =>
        entry.id === currentEntry.id
          ? { ...entry, isRunning: false, duration: runningDuration(entry) }
          : entry,
      ),
    }))
  }

  const resumeTimer = () => {
    if (!currentEntry) {
      return
    }
    persist((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) =>
        entry.id === currentEntry.id
          ? { ...entry, isRunning: true, startTime: new Date().toISOString() }
          : entry,
      ),
    }))
  }

  const stopTimer = () => {
    if (!currentEntry) {
      return
    }
    persist((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) =>
        entry.id === currentEntry.id
          ? {
              ...entry,
              isRunning: false,
              endTime: new Date().toISOString(),
              duration: runningDuration(entry),
            }
          : entry,
      ),
    }))
  }

  const getTotalTimeToday = () => {
    const today = localDateKey()
    return timeEntries
      .filter((entry) => localDateKey(new Date(entry.startTime)) === today)
      .reduce((total, entry) => total + (entry.id === currentEntry?.id ? runningDuration(entry, now) : entry.duration), 0)
  }

  const getProjectStats = () => {
    const projects = timeEntries.reduce(
      (acc, entry) => {
        acc[entry.project] = (acc[entry.project] || 0) + (entry.id === currentEntry?.id ? runningDuration(entry, now) : entry.duration)
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(projects)
      .map(([project, time]) => ({ project, time }))
      .sort((a, b) => b.time - a.time)
  }

  return (
    <MobileSheet open={isOpen} onClose={onClose} title="Time tracker" wide>
        <div className="space-y-6">
          <Card className="mk-editorial-card p-6">
            <div className="text-center space-y-4">
              <div className="mk-timer-clock text-primary">
                {formatTime(currentEntry ? runningDuration(currentEntry, now) : 0)}
              </div>

              {currentEntry && !currentEntry.endTime ? (
                <div className="space-y-2">
                  <h3 className="truncate text-lg font-semibold">{currentEntry.taskName}</h3>
                  <Badge variant="outline">{currentEntry.project}</Badge>
                  <div className="mk-sheet-footer-actions justify-center">
                    {currentEntry.isRunning ? (
                      <Button onClick={pauseTimer} variant="outline" size="sm" className="mk-touch">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer} size="sm" className="mk-touch">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={stopTimer} variant="destructive" size="sm" className="mk-touch">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mk-form-grid gap-4 text-left">
                    <div className="space-y-1">
                      <Label className="text-sm">Task name</Label>
                      <Input
                        value={newTaskName}
                        onChange={(event) => setNewTaskName(event.target.value)}
                        placeholder="What are you working on?"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Project</Label>
                      <Select value={newProject} onValueChange={setNewProject}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Health">Health</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={startTimer} disabled={!newTaskName.trim()} className="mk-touch w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start timer
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="mk-metric-grid">
            <Card className="mk-editorial-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{formatTime(getTotalTimeToday())}</p>
                  <p className="text-sm text-muted-foreground">Today&apos;s total</p>
                </div>
              </div>
            </Card>
            <Card className="mk-editorial-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{timeEntries.filter((entry) => entry.endTime).length}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </Card>
            <Card className="mk-editorial-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{getProjectStats().length}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mk-editorial-card p-6">
            <h3 className="text-lg font-semibold font-sans mb-4">Recent entries</h3>
            <div className="space-y-3">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 p-3 bg-accent/20 rounded-xl">
                  <div className="mk-entity-copy">
                    <p className="font-medium">{entry.taskName}</p>
                    <p className="text-sm text-muted-foreground">{entry.project}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm">{formatTime(entry.id === currentEntry?.id ? runningDuration(entry, now) : entry.duration)}</p>
                </div>
              ))}
              {timeEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No time entries yet. Start a timer and it will survive closing this panel.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
    </MobileSheet>
  )
}

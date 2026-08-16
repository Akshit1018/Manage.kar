"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Play, Pause, Square, Timer, BarChart3, Calendar } from "lucide-react"

interface TimeEntry {
  id: number
  taskName: string
  project: string
  startTime: Date
  endTime?: Date
  duration: number
  isRunning: boolean
}

interface TimeTrackerProps {
  isOpen: boolean
  onClose: () => void
}

export function TimeTracker({ isOpen, onClose }: TimeTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [newTaskName, setNewTaskName] = useState("")
  const [newProject, setNewProject] = useState("Personal")
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentEntry?.isRunning) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - currentEntry.startTime.getTime())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentEntry])

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  const startTimer = () => {
    if (!newTaskName.trim()) return

    const entry: TimeEntry = {
      id: Date.now(),
      taskName: newTaskName,
      project: newProject,
      startTime: new Date(),
      duration: 0,
      isRunning: true,
    }

    setCurrentEntry(entry)
    setCurrentTime(0)
    setNewTaskName("")
  }

  const pauseTimer = () => {
    if (currentEntry) {
      const updatedEntry = {
        ...currentEntry,
        isRunning: false,
        duration: currentTime,
      }
      setCurrentEntry(updatedEntry)
    }
  }

  const resumeTimer = () => {
    if (currentEntry) {
      const updatedEntry = {
        ...currentEntry,
        isRunning: true,
        startTime: new Date(Date.now() - currentEntry.duration),
      }
      setCurrentEntry(updatedEntry)
    }
  }

  const stopTimer = () => {
    if (currentEntry) {
      const finalEntry = {
        ...currentEntry,
        endTime: new Date(),
        duration: currentTime,
        isRunning: false,
      }
      setTimeEntries([finalEntry, ...timeEntries])
      setCurrentEntry(null)
      setCurrentTime(0)
    }
  }

  const getTotalTimeToday = () => {
    const today = new Date().toDateString()
    return timeEntries
      .filter((entry) => entry.endTime && entry.endTime.toDateString() === today)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const getProjectStats = () => {
    const projects = timeEntries.reduce(
      (acc, entry) => {
        if (!entry.endTime) return acc
        acc[entry.project] = (acc[entry.project] || 0) + entry.duration
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(projects)
      .map(([project, time]) => ({ project, time }))
      .sort((a, b) => b.time - a.time)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-sans flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Time Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Timer */}
          <Card className="glass-card p-6 rounded-2xl">
            <div className="text-center space-y-4">
              <div className="text-6xl font-mono font-bold text-primary">{formatTime(currentTime)}</div>

              {currentEntry ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{currentEntry.taskName}</h3>
                  <Badge variant="outline">{currentEntry.project}</Badge>
                  <div className="flex justify-center gap-2">
                    {currentEntry.isRunning ? (
                      <Button onClick={pauseTimer} variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer} size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={stopTimer} variant="destructive" size="sm">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm">Task Name</Label>
                      <Input
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
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
                  <Button onClick={startTimer} disabled={!newTaskName.trim()} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{formatTime(getTotalTimeToday())}</p>
                  <p className="text-sm text-muted-foreground">Today's Total</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-sans">{timeEntries.filter((e) => e.endTime).length}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl">
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

          {/* Project Breakdown */}
          <Card className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold font-sans mb-4">Project Breakdown</h3>
            <div className="space-y-3">
              {getProjectStats().map(({ project, time }) => (
                <div key={project} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="font-medium">{project}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm">{formatTime(time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Entries */}
          <Card className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold font-sans mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-xl">
                  <div>
                    <p className="font-medium">{entry.taskName}</p>
                    <p className="text-sm text-muted-foreground">{entry.project}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatTime(entry.duration)}</p>
                    {entry.endTime && (
                      <p className="text-xs text-muted-foreground">{entry.endTime.toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              ))}
              {timeEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No time entries yet. Start your first timer!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Repeat, Bell, Plus, X, Trash2, ChevronDown, ChevronUp, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RecurringRule, Task } from "@/lib/domain/types"
import { localDateKey, normalizeDueDate } from "@/lib/dates/due-date"
import { MobileSheet } from "@/components/mobile-sheet"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, "id"> | Task) => void
  onDelete?: (taskId: number) => void
  task?: Task
  mode: "create" | "edit"
}

export function TaskModal({ isOpen, onClose, onSave, onDelete, task, mode }: TaskModalProps) {
  const [formData, setFormData] = useState<Omit<Task, "id">>({
    title: "",
    completed: false,
    priority: "medium",
    dueDate: localDateKey(),
    description: "",
    recurring: "none",
    reminders: false,
    checklist: [],
  })
  const [titleError, setTitleError] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (task && mode === "edit") {
      setFormData({
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        dueDate: normalizeDueDate(task.dueDate),
        description: task.description || "",
        recurring: task.recurring || "none",
        reminders: task.reminders || false,
        checklist: task.checklist || [],
      })
    } else {
      setFormData({
        title: "",
        completed: false,
        priority: "medium",
        dueDate: localDateKey(),
        description: "",
        recurring: "none",
        reminders: false,
        checklist: [],
      })
    }
    setTitleError("")
  }, [task, mode, isOpen])

  const handleSave = () => {
    const title = formData.title.trim()
    if (!title) {
      setTitleError("Add a title before saving.")
      return
    }

    const payload = {
      ...formData,
      title,
      dueDate: normalizeDueDate(formData.dueDate),
    }

    if (mode === "edit" && task) {
      onSave({ ...task, ...payload })
    } else {
      onSave(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (!task || !onDelete) {
      return
    }
    if (!window.confirm("Delete this task? You can undo from the toast for a few seconds.")) {
      return
    }
    onDelete(task.id)
    onClose()
  }

  const addChecklistItem = () => {
    const text = newChecklistItem.trim()
    if (!text) {
      return
    }
    const nextId =
      formData.checklist && formData.checklist.length > 0
        ? Math.max(...formData.checklist.map((item) => item.id)) + 1
        : 1
    setFormData({
      ...formData,
      checklist: [...(formData.checklist ?? []), { id: nextId, text, completed: false }],
    })
    setNewChecklistItem("")
  }

  const toggleChecklistItem = (id: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist?.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    })
  }

  const removeChecklistItem = (id: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist?.filter((item) => item.id !== id),
    })
  }

  return (
    <MobileSheet
      open={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create task" : "Edit task"}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          {mode === "edit" && onDelete ? (
            <Button variant="destructive" onClick={handleDelete} className="mk-touch rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete task
            </Button>
          ) : null}
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" onClick={onClose} className="mk-touch rounded-xl bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="mk-touch rounded-xl">
              {mode === "create" ? "Create task" : "Save changes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="task-title" className="responsive-text-sm font-medium text-readable">
                Title
              </Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(event) => {
                  setFormData({ ...formData, title: event.target.value })
                  if (titleError) {
                    setTitleError("")
                  }
                }}
                placeholder="What needs doing?"
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable"
                aria-invalid={Boolean(titleError)}
              />
              {titleError ? <p className="text-sm text-destructive">{titleError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description" className="responsive-text-sm font-medium text-readable">
                Notes
              </Label>
              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Optional details"
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task["priority"]) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-due" className="responsive-text-sm font-medium text-readable">
                  Due date
                </Label>
                <Input
                  id="task-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })}
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-accent/10 border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="responsive-text-sm font-medium text-readable">Reminders and repeat</span>
                </div>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      <Label className="responsive-text-sm text-readable">Repeat</Label>
                    </div>
                    <Select
                      value={formData.recurring}
                      onValueChange={(value: RecurringRule) => setFormData({ ...formData, recurring: value })}
                    >
                      <SelectTrigger className="w-28 sm:w-32 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-readable">
                    Completing a repeating task creates the next copy with a new due date.
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <Label className="responsive-text-sm text-readable">Remind me when due</Label>
                    </div>
                    <Switch
                      checked={formData.reminders}
                      onCheckedChange={(checked) => setFormData({ ...formData, reminders: checked })}
                    />
                  </div>
                  <p className="text-xs text-muted-readable">
                    Requires notification permission. The tab must be open.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="responsive-text-sm font-medium text-readable font-sans">Checklist</h3>
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(event) => setNewChecklistItem(event.target.value)}
                  placeholder="Add checklist item..."
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addChecklistItem()
                    }
                  }}
                />
                <Button onClick={addChecklistItem} size="icon" className="rounded-xl" aria-label="Add checklist item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.checklist && formData.checklist.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-border/30">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        aria-label={item.text}
                      />
                      <span className={cn("flex-1 responsive-text-sm", item.completed && "line-through text-muted-readable")}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChecklistItem(item.id)}
                        className="h-6 w-6"
                        aria-label={`Remove ${item.text}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </div>
    </MobileSheet>
  )
}

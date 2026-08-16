"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Repeat, Bell, Plus, X, Trash2, Users, ChevronDown, ChevronUp, Settings } from "lucide-react"
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
  assignedTo?: string[] // Added assigned users array
  mentions?: string[] // Added mentions array
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, "id"> | Task) => void
  onDelete?: (taskId: number) => void
  task?: Task
  mode: "create" | "edit"
}

const TEAM_MEMBERS = [
  { id: 1, name: "John Doe", username: "john", avatar: "👨‍💼" },
  { id: 2, name: "Sarah Wilson", username: "sarah", avatar: "👩‍💻" },
  { id: 3, name: "Mike Johnson", username: "mike", avatar: "👨‍🎨" },
  { id: 4, name: "Emily Chen", username: "emily", avatar: "👩‍🔬" },
  { id: 5, name: "David Brown", username: "david", avatar: "👨‍🚀" },
]

export function TaskModal({ isOpen, onClose, onSave, onDelete, task, mode }: TaskModalProps) {
  const [formData, setFormData] = useState<Omit<Task, "id">>({
    title: "",
    completed: false,
    priority: "medium",
    dueDate: "Today",
    description: "",
    recurring: "none",
    reminders: false,
    checklist: [],
    assignedTo: [], // Initialize assigned users
    mentions: [], // Initialize mentions
  })

  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false) // Toggle for advanced settings
  const [showMentions, setShowMentions] = useState(false) // Toggle for mention dropdown
  const [mentionQuery, setMentionQuery] = useState("") // Search query for mentions
  const [cursorPosition, setCursorPosition] = useState(0) // Track cursor position
  const descriptionRef = useRef<HTMLTextAreaElement>(null) // Ref for description textarea

  useEffect(() => {
    if (task && mode === "edit") {
      setFormData({
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        dueDate: task.dueDate,
        description: task.description || "",
        recurring: task.recurring || "none",
        reminders: task.reminders || false,
        checklist: task.checklist || [],
        assignedTo: task.assignedTo || [], // Load assigned users
        mentions: task.mentions || [], // Load mentions
      })
    } else {
      setFormData({
        title: "",
        completed: false,
        priority: "medium",
        dueDate: "Today",
        description: "",
        recurring: "none",
        reminders: false,
        checklist: [],
        assignedTo: [], // Reset assigned users
        mentions: [], // Reset mentions
      })
    }
  }, [task, mode, isOpen])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart

    setFormData({ ...formData, description: value })
    setCursorPosition(position)

    // Check if user typed @ and show mention dropdown
    const textBeforeCursor = value.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt)
        setShowMentions(true)
        return
      }
    }

    setShowMentions(false)
    setMentionQuery("")
  }

  const handleMentionSelect = (member: (typeof TEAM_MEMBERS)[0]) => {
    if (!descriptionRef.current) return

    const description = formData.description || ""
    const textBeforeCursor = description.substring(0, cursorPosition)
    const textAfterCursor = description.substring(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const beforeAt = description.substring(0, lastAtIndex)
      const newDescription = `${beforeAt}@${member.username} ${textAfterCursor}`

      setFormData({
        ...formData,
        description: newDescription,
        assignedTo: [...(formData.assignedTo || []), member.username],
        mentions: [...(formData.mentions || []), member.username],
      })

      setShowMentions(false)
      setMentionQuery("")

      // Focus back to textarea
      setTimeout(() => {
        if (descriptionRef.current) {
          const newPosition = lastAtIndex + member.username.length + 2
          descriptionRef.current.focus()
          descriptionRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    }
  }

  const filteredMembers = TEAM_MEMBERS.filter(
    (member) =>
      member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(mentionQuery.toLowerCase()),
  )

  const handleSave = () => {
    if (!formData.title.trim()) return

    if (mode === "edit" && task) {
      onSave({ ...task, ...formData })
    } else {
      onSave(formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
      onClose()
    }
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return

    const newItem = {
      id: Date.now(),
      text: newChecklistItem,
      completed: false,
    }

    setFormData({
      ...formData,
      checklist: [...(formData.checklist || []), newItem],
    })
    setNewChecklistItem("")
  }

  const toggleChecklistItem = (itemId: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist?.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    })
  }

  const removeChecklistItem = (itemId: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist?.filter((item) => item.id !== itemId),
    })
  }

  const removeAssignedUser = (username: string) => {
    setFormData({
      ...formData,
      assignedTo: formData.assignedTo?.filter((user) => user !== username),
      mentions: formData.mentions?.filter((mention) => mention !== username),
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-mobile bg-black/50 backdrop-blur-sm">
      <div className="modal-content-mobile bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-t-3xl sm:rounded-3xl max-w-2xl mx-auto overflow-hidden">
        <div className="responsive-container">
          <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-border/50 pb-4">
            <h2 className="responsive-text-xl font-semibold text-readable font-sans">
              {mode === "create" ? "Create New Task" : "Edit Task"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-accent/50 mobile-touch-target"
            >
              <X className="h-5 w-5 text-readable" />
            </Button>
          </div>

          <div className="space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title" className="responsive-text-sm font-medium text-readable">
                Task Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title..."
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable placeholder:text-muted-readable mobile-touch-target"
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="description" className="responsive-text-sm font-medium text-readable">
                Description (Use @ to mention team members)
              </Label>
              <Textarea
                ref={descriptionRef}
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Add task description... Use @ to mention team members"
                className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl min-h-[100px] text-readable placeholder:text-muted-readable resize-none mobile-touch-target"
              />

              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleMentionSelect(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      <span className="text-lg">{member.avatar}</span>
                      <div>
                        <div className="responsive-text-sm font-medium text-readable">{member.name}</div>
                        <div className="responsive-text-xs text-muted-readable">@{member.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.assignedTo && formData.assignedTo.length > 0 && (
              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned To
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.assignedTo.map((username) => {
                    const member = TEAM_MEMBERS.find((m) => m.username === username)
                    return (
                      <div
                        key={username}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full responsive-text-sm"
                      >
                        <span>{member?.avatar || "👤"}</span>
                        <span>@{username}</span>
                        <button
                          onClick={() => removeAssignedUser(username)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "high" | "medium" | "low") => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable mobile-touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl">
                    <SelectItem value="high" className="text-readable hover:bg-accent/50">
                      High Priority
                    </SelectItem>
                    <SelectItem value="medium" className="text-readable hover:bg-accent/50">
                      Medium Priority
                    </SelectItem>
                    <SelectItem value="low" className="text-readable hover:bg-accent/50">
                      Low Priority
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Due Date</Label>
                <Select
                  value={formData.dueDate}
                  onValueChange={(value) => setFormData({ ...formData, dueDate: value })}
                >
                  <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable mobile-touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl">
                    <SelectItem value="Today" className="text-readable hover:bg-accent/50">
                      Today
                    </SelectItem>
                    <SelectItem value="Tomorrow" className="text-readable hover:bg-accent/50">
                      Tomorrow
                    </SelectItem>
                    <SelectItem value="This week" className="text-readable hover:bg-accent/50">
                      This week
                    </SelectItem>
                    <SelectItem value="Next week" className="text-readable hover:bg-accent/50">
                      Next week
                    </SelectItem>
                    <SelectItem value="This month" className="text-readable hover:bg-accent/50">
                      This month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="responsive-text-sm font-medium text-readable">Advanced Settings</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-readable" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-readable" />
                )}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      <Label className="responsive-text-sm text-readable">Recurring</Label>
                    </div>
                    <Select
                      value={formData.recurring}
                      onValueChange={(value: "none" | "daily" | "weekly" | "monthly") =>
                        setFormData({ ...formData, recurring: value })
                      }
                    >
                      <SelectTrigger className="w-28 sm:w-32 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable mobile-touch-target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl">
                        <SelectItem value="none" className="text-readable hover:bg-accent/50">
                          None
                        </SelectItem>
                        <SelectItem value="daily" className="text-readable hover:bg-accent/50">
                          Daily
                        </SelectItem>
                        <SelectItem value="weekly" className="text-readable hover:bg-accent/50">
                          Weekly
                        </SelectItem>
                        <SelectItem value="monthly" className="text-readable hover:bg-accent/50">
                          Monthly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <Label className="responsive-text-sm text-readable">Reminders</Label>
                    </div>
                    <Switch
                      checked={formData.reminders}
                      onCheckedChange={(checked) => setFormData({ ...formData, reminders: checked })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="responsive-text-sm font-medium text-readable font-sans">Checklist</h3>

              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item..."
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl text-readable placeholder:text-muted-readable mobile-touch-target"
                  onKeyPress={(e) => e.key === "Enter" && addChecklistItem()}
                />
                <Button
                  onClick={addChecklistItem}
                  size="icon"
                  className="rounded-xl bg-primary hover:bg-primary/90 mobile-touch-target"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.checklist && formData.checklist.length > 0 && (
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {formData.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="rounded border-border accent-primary mobile-touch-target"
                      />
                      <span
                        className={cn(
                          "flex-1 responsive-text-sm font-serif",
                          item.completed ? "line-through text-muted-readable" : "text-readable",
                        )}
                      >
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChecklistItem(item.id)}
                        className="h-6 w-6 rounded-full hover:bg-destructive/20 mobile-touch-target"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 pt-4 border-t border-border/50">
            {mode === "edit" && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-xl order-last sm:order-first responsive-button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 text-readable hover:bg-accent/50 responsive-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground responsive-button"
              >
                {mode === "create" ? "Create Task" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskModal

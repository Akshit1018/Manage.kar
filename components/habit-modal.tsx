"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Bell } from "lucide-react"
import type { Habit, HabitCategory } from "@/lib/domain/types"
import { weekdayOrder } from "@/lib/dates/week"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { MobileSheet } from "@/components/mobile-sheet"

interface HabitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    habit: Omit<Habit, "id" | "streak" | "completed" | "completedToday" | "createdAt" | "history"> | Habit,
  ) => void
  onDelete?: (habitId: number) => void
  habit?: Habit
  mode: "create" | "edit"
  weekStartsOn?: "sunday" | "monday"
}

export function HabitModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  habit,
  mode,
  weekStartsOn = "monday",
}: HabitModalProps) {
  const [formData, setFormData] = useState<
    Omit<Habit, "id" | "streak" | "completed" | "completedToday" | "createdAt" | "history">
  >({
    name: "",
    description: "",
    category: "health",
    frequency: "daily",
    customDays: [],
    goal: 1,
    unit: "times",
    reminders: false,
    reminderTime: "09:00",
  })
  const [nameError, setNameError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categoryOptions = [
    { value: "health", label: "Health", icon: "🏥" },
    { value: "fitness", label: "Fitness", icon: "💪" },
    { value: "mindfulness", label: "Mindfulness", icon: "🧘" },
    { value: "productivity", label: "Productivity", icon: "⚡" },
    { value: "learning", label: "Learning", icon: "📚" },
    { value: "lifestyle", label: "Lifestyle", icon: "🌟" },
  ]

  const weekDays = weekdayOrder(weekStartsOn)

  useEffect(() => {
    if (habit && mode === "edit") {
      setFormData({
        name: habit.name,
        description: habit.description || "",
        category: habit.category,
        frequency: habit.frequency,
        customDays: habit.customDays || [],
        goal: habit.goal || 1,
        unit: habit.unit || "times",
        reminders: habit.reminders,
        reminderTime: habit.reminderTime || "09:00",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        category: "health",
        frequency: "daily",
        customDays: [],
        goal: 1,
        unit: "times",
        reminders: false,
        reminderTime: "09:00",
      })
    }
    setNameError("")
    setConfirmDelete(false)
  }, [habit, mode, isOpen])

  const handleSave = () => {
    const name = formData.name.trim()
    if (!name) {
      setNameError("Add a habit name before saving.")
      return
    }

    const payload = { ...formData, name }
    if (mode === "edit" && habit) {
      onSave({ ...habit, ...payload })
    } else {
      onSave(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (!habit || !onDelete) {
      return
    }
    setConfirmDelete(true)
  }

  const confirmDeleteHabit = () => {
    if (!habit || !onDelete) {
      return
    }
    onDelete(habit.id)
    setConfirmDelete(false)
    onClose()
  }

  const toggleCustomDay = (day: string) => {
    const currentDays = formData.customDays || []
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        customDays: currentDays.filter((d) => d !== day),
      })
    } else {
      setFormData({
        ...formData,
        customDays: [...currentDays, day],
      })
    }
  }

  return (
    <>
    <MobileSheet
      open={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create habit" : "Edit habit"}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          {mode === "edit" && onDelete ? (
            <Button variant="destructive" onClick={handleDelete} className="mk-touch rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          ) : null}
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" onClick={onClose} className="mk-touch rounded-xl bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="mk-touch rounded-xl">
              {mode === "create" ? "Create habit" : "Save changes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="habit-name" className="text-sm font-medium">
                Habit Name
              </Label>
              <Input
                id="habit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (nameError) {
                    setNameError("")
                  }
                }}
                placeholder="e.g., Morning Exercise, Read 30 minutes..."
                className="glass rounded-xl"
                aria-invalid={Boolean(nameError)}
              />
              {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="habit-description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="habit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about your habit..."
                className="glass rounded-xl min-h-[80px]"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: HabitCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="glass rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: "daily" | "weekly" | "custom") => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger className="glass rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Days Selection */}
              {(formData.frequency === "custom" || formData.frequency === "weekly") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {formData.frequency === "weekly" ? "Day of the week" : "Select days"}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {weekDays.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={formData.customDays?.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCustomDay(day)}
                        className="rounded-xl glass bg-transparent"
                      >
                        {day.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Goal & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Goal</Label>
                <Input
                  type="number"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: Number.parseInt(e.target.value) || 1 })}
                  min="1"
                  className="glass rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger className="glass rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="times">times</SelectItem>
                    <SelectItem value="minutes">minutes</SelectItem>
                    <SelectItem value="hours">hours</SelectItem>
                    <SelectItem value="pages">pages</SelectItem>
                    <SelectItem value="glasses">glasses</SelectItem>
                    <SelectItem value="steps">steps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Reminders</Label>
                </div>
                <Switch
                  checked={formData.reminders}
                  onCheckedChange={(checked) => setFormData({ ...formData, reminders: checked })}
                />
              </div>

              {formData.reminders && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reminder Time</Label>
                  <Input
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    className="glass rounded-xl"
                  />
                </div>
              )}
            </div>
      </div>
    </MobileSheet>
    <ConfirmSheet
      request={
        confirmDelete
          ? {
              title: "Delete this habit?",
              message: "You can undo from the toast for a few seconds.",
              confirmLabel: "Delete",
              tone: "danger",
            }
          : null
      }
      onCancel={() => setConfirmDelete(false)}
      onConfirm={confirmDeleteHabit}
    />
    </>
  )
}

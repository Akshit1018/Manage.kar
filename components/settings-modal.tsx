"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Bell, Shield, Database, Palette, Globe, Download, Upload, Trash2, Link2 } from "lucide-react"
import { GoogleIntegration } from "./google-integration"
import type { AppSettings } from "@/lib/domain/types"
import { applyThemePreference } from "@/lib/theme/apply-theme"
import {
  browserStorage,
  clearWorkspace,
  defaultSettings,
  loadWorkspace,
  notifyWorkspaceChanged,
  parseBackup,
  replaceWorkspace,
  serializeBackup,
} from "@/lib/store/workspace"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  const [permissionStatus, setPermissionStatus] = useState({
    notifications: "default" as NotificationPermission,
    location: "prompt" as PermissionState,
  })

  const [activeSection, setActiveSection] = useState<string>("notifications")

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const workspace = loadWorkspace(browserStorage())
    setSettings(workspace.settings)
    applyThemePreference(workspace.settings.appearance.theme)

    if ("Notification" in window) {
      setPermissionStatus((prev) => ({ ...prev, notifications: Notification.permission }))
    }

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus((prev) => ({ ...prev, location: result.state }))
      })
    }
  }, [isOpen])

  const updateSettings = (section: keyof AppSettings, key: string, value: unknown) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    }
    setSettings(newSettings)
    const storage = browserStorage()
    const workspace = loadWorkspace(storage)
    replaceWorkspace(storage, { ...workspace, settings: newSettings })
    if (section === "appearance" && key === "theme") {
      applyThemePreference(newSettings.appearance.theme)
    }
    notifyWorkspaceChanged()
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setPermissionStatus((prev) => ({ ...prev, notifications: permission }))
      if (permission === "granted") {
        updateSettings("notifications", "enabled", true)
      }
    }
  }

  const exportData = () => {
    const workspace = loadWorkspace(browserStorage())
    const blob = new Blob([serializeBackup({ ...workspace, settings })], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `manage-kar-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const parsed = parseBackup(String(reader.result ?? ""))
        if (!parsed.ok) {
          alert(parsed.error)
          return
        }
        if (confirm("This will replace all your current Manage.kar data. Are you sure?")) {
          const storage = browserStorage()
          replaceWorkspace(storage, parsed.workspace)
          setSettings(parsed.workspace.settings)
          applyThemePreference(parsed.workspace.settings.appearance.theme)
          notifyWorkspaceChanged()
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const clearAllData = () => {
    if (confirm("This will permanently delete all your Manage.kar data. This action cannot be undone. Are you sure?")) {
      if (confirm("Are you absolutely sure? This will delete all tasks, notes, habits, and settings from Manage.kar.")) {
        const empty = clearWorkspace(browserStorage())
        setSettings(empty.settings)
        applyThemePreference(empty.settings.appearance.theme)
        notifyWorkspaceChanged()
      }
    }
  }

  if (!isOpen) return null

  const sections = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "integrations", label: "Integrations", icon: Link2 },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "data", label: "Data", icon: Database },
    { id: "general", label: "General", icon: Globe },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-mobile">
        <div className="modal-content-mobile bg-card/95 backdrop-blur-xl border border-border/50 rounded-t-3xl sm:rounded-3xl max-w-4xl mx-auto overflow-hidden">
          <DialogHeader className="responsive-container border-b border-border/50">
            <DialogTitle className="responsive-text-2xl font-bold font-sans flex items-center gap-2 text-readable">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Settings
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 h-[70vh] sm:h-[60vh]">
            <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0">
              <div className="flex sm:flex-col gap-2 sm:gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl text-left transition-colors whitespace-nowrap mobile-touch-target ${
                        activeSection === section.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-readable hover:text-readable hover:bg-accent/20"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="responsive-text-sm font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 responsive-container">
              {activeSection === "notifications" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label className="responsive-text-sm font-medium text-readable">Enable Notifications</Label>
                        {permissionStatus.notifications === "denied" && (
                          <p className="responsive-text-xs text-destructive mt-1">Permission denied</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {permissionStatus.notifications === "default" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={requestNotificationPermission}
                            className="responsive-button bg-transparent"
                          >
                            Allow
                          </Button>
                        )}
                        <Switch
                          checked={settings.notifications.enabled && permissionStatus.notifications === "granted"}
                          onCheckedChange={(checked) => updateSettings("notifications", "enabled", checked)}
                          disabled={permissionStatus.notifications !== "granted"}
                        />
                      </div>
                    </div>

                    {settings.notifications.enabled && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Task Reminders</Label>
                          <Switch
                            checked={settings.notifications.taskReminders}
                            onCheckedChange={(checked) => updateSettings("notifications", "taskReminders", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Habit Reminders</Label>
                          <Switch
                            checked={settings.notifications.habitReminders}
                            onCheckedChange={(checked) => updateSettings("notifications", "habitReminders", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Focus Break Alerts</Label>
                          <Switch
                            checked={settings.notifications.focusBreaks}
                            onCheckedChange={(checked) => updateSettings("notifications", "focusBreaks", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Daily Summary</Label>
                          <Switch
                            checked={settings.notifications.dailySummary}
                            onCheckedChange={(checked) => updateSettings("notifications", "dailySummary", checked)}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <Label className="responsive-text-sm text-readable">Sound</Label>
                            <Switch
                              checked={settings.notifications.soundEnabled}
                              onCheckedChange={(checked) => updateSettings("notifications", "soundEnabled", checked)}
                            />
                          </div>
                          {settings.notifications.soundEnabled && (
                            <div className="space-y-2">
                              <Label className="responsive-text-xs text-muted-readable">Volume</Label>
                              <Slider
                                value={[settings.notifications.volume]}
                                onValueChange={([value]) => updateSettings("notifications", "volume", value)}
                                max={100}
                                step={10}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}

              {activeSection === "appearance" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Palette className="h-4 w-4" />
                    Appearance
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Theme</Label>
                      <Select
                        value={settings.appearance.theme}
                        onValueChange={(value: "light" | "dark" | "system") =>
                          updateSettings("appearance", "theme", value)
                        }
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Font Size</Label>
                      <Select
                        value={settings.appearance.fontSize}
                        onValueChange={(value: "small" | "medium" | "large") =>
                          updateSettings("appearance", "fontSize", value)
                        }
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Label className="responsive-text-sm text-readable">Animations</Label>
                      <Switch
                        checked={settings.appearance.animations}
                        onCheckedChange={(checked) => updateSettings("appearance", "animations", checked)}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "integrations" && (
                <div className="space-y-3">
                  <h3 className="responsive-text-lg font-semibold font-sans mb-2 flex items-center gap-2 text-readable">
                    <Link2 className="h-5 w-5" />
                    Integrations
                  </h3>
                  <p className="responsive-text-sm text-muted-readable">
                    Google Workspace is not connected. Nothing leaves this device. The form below is a preview of a
                    future optional backup adapter.
                  </p>
                  <GoogleIntegration />
                </div>
              )}

              {activeSection === "privacy" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Shield className="h-4 w-4" />
                    Privacy & Security
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <p className="responsive-text-sm text-muted-readable">
                      Manage.kar is local-first. Tasks, notes, and habits stay in this browser unless you export them.
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="responsive-text-sm text-readable">Clipboard suggestions</Label>
                        <p className="responsive-text-xs text-muted-readable mt-1">
                          Off by default. When on, the app may read clipboard text to offer a task or note.
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.clipboardMonitor}
                        onCheckedChange={(checked) => updateSettings("privacy", "clipboardMonitor", checked)}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "data" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Database className="h-4 w-4" />
                    Data Management
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="responsive-text-sm text-readable">Auto Backup</Label>
                      <Switch
                        checked={settings.data.autoBackup}
                        onCheckedChange={(checked) => updateSettings("data", "autoBackup", checked)}
                      />
                    </div>

                    {settings.data.autoBackup && (
                      <div className="space-y-2">
                        <Label className="responsive-text-sm text-readable">Backup Frequency</Label>
                        <Select
                          value={settings.data.backupFrequency}
                          onValueChange={(value: "daily" | "weekly" | "monthly") =>
                            updateSettings("data", "backupFrequency", value)
                          }
                        >
                          <SelectTrigger className="mobile-touch-target">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <p className="responsive-text-xs text-muted-readable">
                      Export downloads the same workspace the dashboard uses. Import replaces it after confirmation.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent responsive-button"
                        onClick={exportData}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent responsive-button"
                        onClick={importData}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>

                    <Button variant="destructive" size="sm" className="w-full responsive-button" onClick={clearAllData}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                </Card>
              )}

              {activeSection === "general" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Globe className="h-4 w-4" />
                    General
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Language</Label>
                      <Select
                        value={settings.general.language}
                        onValueChange={(value) => updateSettings("general", "language", value)}
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Español</SelectItem>
                          <SelectItem value="French">Français</SelectItem>
                          <SelectItem value="German">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Week Starts On</Label>
                      <Select
                        value={settings.general.weekStartsOn}
                        onValueChange={(value: "sunday" | "monday") => updateSettings("general", "weekStartsOn", value)}
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Date Format</Label>
                      <Select
                        value={settings.general.dateFormat}
                        onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") =>
                          updateSettings("general", "dateFormat", value)
                        }
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-primary-foreground font-bold responsive-text-sm">M</span>
                    </div>
                    <h4 className="font-bold font-sans responsive-text-lg text-readable">Manage.kar</h4>
                  </div>
                  <p className="responsive-text-sm text-muted-readable">Smart Task & Life Management</p>
                  <p className="responsive-text-sm text-muted-readable">Version 1.0.0</p>
                  <p className="responsive-text-xs text-muted-readable">Built for productivity enthusiasts</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

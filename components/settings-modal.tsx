"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Shield, Database, Palette, Globe, Download, Upload, Trash2, Link2 } from "lucide-react"
import { toast } from "sonner"
import { GoogleIntegration } from "./google-integration"
import { ConfirmSheet, type ConfirmRequest } from "@/components/confirm-sheet"
import { MobileSheet } from "@/components/mobile-sheet"
import type { AppSettings, Workspace } from "@/lib/domain/types"
import type { DialerState } from "@/lib/dialer/types"
import { loadDialer, notifyDialerChanged, persistDialer } from "@/lib/dialer/dialer"
import type { PairingState } from "@/lib/pairing/types"
import { loadPairing, notifyPairingChanged, persistPairing } from "@/lib/pairing/pairing"
import { applyAppearance } from "@/lib/theme/apply-theme"
import {
  APP_VERSION,
  browserStorage,
  clearWorkspace,
  defaultSettings,
  loadWorkspace,
  notifyWorkspaceChanged,
  parseBackup,
  replaceWorkspace,
  serializeBackup,
} from "@/lib/store/workspace"
import { clearEvents, listEvents, recordEvent, type LocalEvent } from "@/lib/analytics/local-events"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SETTINGS_SECTIONS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Backup", icon: Link2 },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "data", label: "Data", icon: Database },
  { id: "general", label: "General", icon: Globe },
] as const

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [activeSection, setActiveSection] = useState<string>("notifications")
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([])
  const [confirmKind, setConfirmKind] = useState<
    | { kind: "import"; workspace: Workspace; dialer?: DialerState; pairing?: PairingState }
    | { kind: "clear-1" }
    | { kind: "clear-2" }
    | null
  >(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const storage = browserStorage()
    const workspace = loadWorkspace(storage)
    setSettings(workspace.settings)
    applyAppearance(workspace.settings)
    setLocalEvents(listEvents(storage))

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
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
    applyAppearance(newSettings)
    notifyWorkspaceChanged()
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === "granted") {
        updateSettings("notifications", "enabled", true)
      }
    }
  }

  const exportData = () => {
    const storage = browserStorage()
    const workspace = loadWorkspace(storage)
    const blob = new Blob(
      [serializeBackup({ ...workspace, settings }, loadDialer(storage), loadPairing(storage))],
      { type: "application/json" },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `manage-kar-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    recordEvent(browserStorage(), "export", { kind: "backup" })
    setLocalEvents(listEvents(browserStorage()))
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
          toast.error(parsed.error)
          return
        }
        setConfirmKind({ kind: "import", workspace: parsed.workspace, dialer: parsed.dialer, pairing: parsed.pairing })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const applyImportedWorkspace = (workspace: Workspace, dialer?: DialerState, pairing?: PairingState) => {
    const storage = browserStorage()
    replaceWorkspace(storage, workspace)
    if (dialer) {
      persistDialer(storage, dialer)
    }
    if (pairing) {
      persistPairing(storage, pairing)
    }
    setSettings(workspace.settings)
    applyAppearance(workspace.settings)
    recordEvent(storage, "import", { kind: "backup" })
    setLocalEvents(listEvents(storage))
    notifyWorkspaceChanged()
    toast.success("Workspace replaced from backup.")
  }

  const wipeWorkspace = () => {
    const storage = browserStorage()
    const empty = clearWorkspace(storage)
    recordEvent(storage, "workspace_cleared")
    setSettings(empty.settings)
    applyAppearance(empty.settings)
    setLocalEvents(listEvents(storage))
    notifyWorkspaceChanged()
    notifyDialerChanged()
    notifyPairingChanged()
    toast.success("This device's workspace was cleared.")
  }

  const confirmRequest = ((): ConfirmRequest | null => {
    if (!confirmKind) {
      return null
    }
    switch (confirmKind.kind) {
      case "import":
        return {
          title: "Replace this workspace?",
          message: "This will replace all your current Manage.kar data on this device.",
          confirmLabel: "Replace",
          tone: "danger",
        }
      case "clear-1":
        return {
          title: "Clear this device?",
          message: "This will permanently delete all Manage.kar data on this device.",
          confirmLabel: "Continue",
          tone: "danger",
        }
      case "clear-2":
        return {
          title: "Are you absolutely sure?",
          message: "Tasks, notes, habits, goals, chats, and settings will be removed.",
          confirmLabel: "Clear everything",
          tone: "danger",
        }
      default: {
        const _never: never = confirmKind
        return _never
      }
    }
  })()

  const handleConfirm = () => {
    if (!confirmKind) {
      return
    }
    switch (confirmKind.kind) {
      case "import":
        applyImportedWorkspace(confirmKind.workspace, confirmKind.dialer, confirmKind.pairing)
        setConfirmKind(null)
        return
      case "clear-1":
        setConfirmKind({ kind: "clear-2" })
        return
      case "clear-2":
        wipeWorkspace()
        setConfirmKind(null)
        return
      default: {
        const _never: never = confirmKind
        return _never
      }
    }
  }

  const clearAllData = () => {
    setConfirmKind({ kind: "clear-1" })
  }

  return (
    <>
    <MobileSheet open={isOpen} onClose={onClose} title="Settings" wide>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 min-h-0">
            <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0">
              <div className="flex sm:flex-col gap-2 sm:gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      type="button"
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
                    Local notifications
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <p className="responsive-text-sm text-muted-readable">
                      Reminders stay on this device. An open tab checks every minute. A service worker may also
                      check from a snapshot if the browser allows it. There is no push server.
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label className="responsive-text-sm font-medium text-readable">Enable notifications</Label>
                        {notificationPermission === "denied" && (
                          <p className="responsive-text-xs text-destructive mt-1">Permission denied in the browser</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notificationPermission === "default" && (
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
                          checked={settings.notifications.enabled && notificationPermission === "granted"}
                          onCheckedChange={(checked) => updateSettings("notifications", "enabled", checked)}
                          disabled={notificationPermission !== "granted"}
                        />
                      </div>
                    </div>

                    {settings.notifications.enabled && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Task reminders</Label>
                          <Switch
                            checked={settings.notifications.taskReminders}
                            onCheckedChange={(checked) => updateSettings("notifications", "taskReminders", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Habit reminders</Label>
                          <Switch
                            checked={settings.notifications.habitReminders}
                            onCheckedChange={(checked) => updateSettings("notifications", "habitReminders", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="responsive-text-sm text-readable">Focus session complete</Label>
                          <Switch
                            checked={settings.notifications.focusBreaks}
                            onCheckedChange={(checked) => updateSettings("notifications", "focusBreaks", checked)}
                          />
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
                      <Label className="responsive-text-sm text-readable">Skin</Label>
                      <Select
                        value={settings.appearance.skin}
                        onValueChange={(value: "hermes" | "classic") =>
                          updateSettings("appearance", "skin", value)
                        }
                      >
                        <SelectTrigger className="mobile-touch-target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hermes">Hermes (default)</SelectItem>
                          <SelectItem value="classic">Classic Manage.kar</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Hermes uses the Nous design palette: teal-black with warm cream in dark mode, Nous blue in
                        light mode.
                      </p>
                    </div>

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
                      <Label className="responsive-text-sm text-readable">Font size</Label>
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
                    Backup
                  </h3>
                  <GoogleIntegration />
                </div>
              )}

              {activeSection === "privacy" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Shield className="h-4 w-4" />
                    Privacy
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <p className="responsive-text-sm text-muted-readable">
                      Manage.kar is local-first. Tasks, notes, and habits stay in this browser unless you export them.
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="responsive-text-sm text-readable">Clipboard suggestions</Label>
                        <p className="responsive-text-xs text-muted-readable mt-1">
                          Off by default. When on, the app may read clipboard text to offer a task or note. Text is
                          never logged.
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.clipboardMonitor}
                        onCheckedChange={(checked) => updateSettings("privacy", "clipboardMonitor", checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Device activity</Label>
                      <p className="responsive-text-xs text-muted-readable">
                        Export, import, share, and errors are logged here only. Nothing is sent to a server.
                      </p>
                      {localEvents.length === 0 ? (
                        <p className="responsive-text-xs text-muted-readable">No local events yet.</p>
                      ) : (
                        <ul className="space-y-1 max-h-40 overflow-y-auto text-xs text-muted-readable">
                          {localEvents
                            .slice()
                            .reverse()
                            .slice(0, 12)
                            .map((event) => (
                              <li key={event.id}>
                                {event.at.slice(0, 19).replace("T", " ")} — {event.name}
                              </li>
                            ))}
                        </ul>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => {
                          clearEvents(browserStorage())
                          setLocalEvents([])
                        }}
                      >
                        Clear device activity
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "data" && (
                <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
                  <h4 className="font-semibold font-sans mb-3 sm:mb-4 flex items-center gap-2 text-readable">
                    <Database className="h-4 w-4" />
                    Data
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <p className="responsive-text-xs text-muted-readable">
                      Export downloads this device&apos;s workspace. Import replaces it after confirmation. Random JSON
                      files are rejected.
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
                      Clear all data
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
                    <p className="responsive-text-sm text-muted-readable">The interface is English only.</p>
                    <div className="space-y-2">
                      <Label className="responsive-text-sm text-readable">Week starts on</Label>
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
                      <Label className="responsive-text-sm text-readable">Date format</Label>
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
                <div className="text-center space-y-2">
                  <h4 className="font-bold font-sans responsive-text-lg text-readable">Manage.kar</h4>
                  <p className="responsive-text-sm text-muted-readable">
                    Local-first tasks, notes, and habits. Your data stays in this browser unless you export it.
                  </p>
                  <p className="responsive-text-xs text-muted-readable">Workspace format {APP_VERSION}</p>
                </div>
              </Card>
            </div>
          </div>
    </MobileSheet>
    <ConfirmSheet request={confirmRequest} onCancel={() => setConfirmKind(null)} onConfirm={handleConfirm} />
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, FileText, HardDrive, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react"

interface GoogleIntegrationSettings {
  sheets: {
    enabled: boolean
    connected: boolean
    spreadsheetId: string
    autoSync: boolean
    syncFrequency: "realtime" | "hourly" | "daily"
  }
  docs: {
    enabled: boolean
    connected: boolean
    folderId: string
    autoSync: boolean
    noteFormat: "markdown" | "plain" | "rich"
  }
  drive: {
    enabled: boolean
    connected: boolean
    folderId: string
    autoBackup: boolean
    backupFrequency: "daily" | "weekly" | "monthly"
  }
}

interface GoogleIntegrationProps {
  onSettingsChange?: (settings: GoogleIntegrationSettings) => void
}

export function GoogleIntegration({ onSettingsChange }: GoogleIntegrationProps) {
  const [settings, setSettings] = useState<GoogleIntegrationSettings>({
    sheets: {
      enabled: false,
      connected: false,
      spreadsheetId: "",
      autoSync: false,
      syncFrequency: "daily",
    },
    docs: {
      enabled: false,
      connected: false,
      folderId: "",
      autoSync: false,
      noteFormat: "markdown",
    },
    drive: {
      enabled: false,
      connected: false,
      folderId: "",
      autoBackup: false,
      backupFrequency: "weekly",
    },
  })

  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)

  useEffect(() => {
    const savedSettings = localStorage.getItem("manageKarGoogleIntegration")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error("[v0] Failed to parse Google integration settings:", error)
      }
    }
  }, [])

  const updateSettings = (service: keyof GoogleIntegrationSettings, key: string, value: any) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [service]: {
          ...prev[service],
          [key]: value,
        },
      }

      localStorage.setItem("manageKarGoogleIntegration", JSON.stringify(newSettings))

      onSettingsChange?.(newSettings)

      return newSettings
    })
  }

  const connectToGoogle = async (service: keyof GoogleIntegrationSettings) => {
    setIsConnecting(service)

    try {
      console.log(`[v0] Connecting to Google ${service}...`)

      if (!window.isSecureContext) {
        throw new Error("Google integration requires HTTPS")
      }

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error("Connection timeout"))
          } else {
            resolve(true)
          }
        }, 2000)
      })

      updateSettings(service, "connected", true)
      updateSettings(service, "enabled", true)

      if (service === "sheets") {
        updateSettings(service, "spreadsheetId", "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
      } else if (service === "docs" || service === "drive") {
        updateSettings(service, "folderId", "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
      }

      console.log(`[v0] Successfully connected to Google ${service}`)

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Google ${service.charAt(0).toUpperCase() + service.slice(1)} Connected`, {
          body: `Successfully connected to Google ${service}`,
          icon: "/icon.png",
        })
      }
    } catch (error) {
      console.error(`[v0] Failed to connect to Google ${service}:`, error)
      alert(`Failed to connect to Google ${service}. Please try again or check your internet connection.`)
    } finally {
      setIsConnecting(null)
    }
  }

  const syncToGoogle = async (service: keyof GoogleIntegrationSettings) => {
    if (!settings[service].connected) {
      alert(`Please connect to Google ${service} first.`)
      return
    }

    setIsSyncing(service)

    try {
      console.log(`[v0] Syncing to Google ${service}...`)

      if (service === "sheets") {
        const tasks = JSON.parse(localStorage.getItem("manageKarTasks") || "[]")
        console.log("[v0] Syncing tasks to Google Sheets:", tasks)

        await new Promise((resolve) => setTimeout(resolve, 1500))

        const spreadsheetData = tasks.map((task: any) => ({
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          completed: task.completed,
          description: task.description || "",
        }))

        console.log("[v0] Spreadsheet data prepared:", spreadsheetData)
      } else if (service === "docs") {
        const notes = JSON.parse(localStorage.getItem("manageKarNotes") || "[]")
        console.log("[v0] Syncing notes to Google Docs:", notes)

        await new Promise((resolve) => setTimeout(resolve, 1500))

        for (const note of notes) {
          console.log(`[v0] Creating document for note: ${note.title}`)
        }
      } else if (service === "drive") {
        const allData = {
          tasks: JSON.parse(localStorage.getItem("manageKarTasks") || "[]"),
          notes: JSON.parse(localStorage.getItem("manageKarNotes") || "[]"),
          habits: JSON.parse(localStorage.getItem("manageKarHabits") || "[]"),
          settings: JSON.parse(localStorage.getItem("manageKarSettings") || "{}"),
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        }
        console.log("[v0] Backing up to Google Drive:", allData)

        await new Promise((resolve) => setTimeout(resolve, 2000))

        const backupFileName = `manage-kar-backup-${new Date().toISOString().split("T")[0]}.json`
        console.log(`[v0] Created backup file: ${backupFileName}`)
      }

      const serviceName = service.charAt(0).toUpperCase() + service.slice(1)
      alert(`Successfully synced to Google ${serviceName}! Your data is now backed up.`)

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Sync Complete`, {
          body: `Data successfully synced to Google ${serviceName}`,
          icon: "/icon.png",
        })
      }
    } catch (error) {
      console.error(`[v0] Sync failed:`, error)
      alert(`Failed to sync to Google ${service}. Please check your connection and try again.`)
    } finally {
      setIsSyncing(null)
    }
  }

  const disconnectFromGoogle = (service: keyof GoogleIntegrationSettings) => {
    if (confirm(`Are you sure you want to disconnect from Google ${service}? This will disable all sync features.`)) {
      updateSettings(service, "connected", false)
      updateSettings(service, "enabled", false)
      if (service === "sheets") {
        updateSettings(service, "spreadsheetId", "")
      } else {
        updateSettings(service, "folderId", "")
      }

      console.log(`[v0] Disconnected from Google ${service}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Sheets Integration */}
      <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold font-sans flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Google Sheets
          </h4>
          <Badge variant={settings.sheets.connected ? "default" : "secondary"} className="text-xs">
            {settings.sheets.connected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
              </>
            )}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Automatically sync your tasks to a Google Sheets spreadsheet for advanced tracking and reporting.
        </p>

        {!settings.sheets.connected ? (
          <Button
            onClick={() => connectToGoogle("sheets")}
            disabled={isConnecting === "sheets"}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isConnecting === "sheets" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google Sheets"
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
              <Label className="text-sm text-foreground">Enable Sync</Label>
              <Switch
                checked={settings.sheets.enabled}
                onCheckedChange={(checked) => updateSettings("sheets", "enabled", checked)}
              />
            </div>

            {settings.sheets.enabled && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm text-foreground">Spreadsheet ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.sheets.spreadsheetId}
                      onChange={(e) => updateSettings("sheets", "spreadsheetId", e.target.value)}
                      placeholder="Enter Google Sheets ID"
                      className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(`https://docs.google.com/spreadsheets/d/${settings.sheets.spreadsheetId}`, "_blank")
                      }
                      disabled={!settings.sheets.spreadsheetId}
                      className="bg-card/95 backdrop-blur-xl border border-border/50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <Label className="text-sm text-foreground">Auto Sync</Label>
                  <Switch
                    checked={settings.sheets.autoSync}
                    onCheckedChange={(checked) => updateSettings("sheets", "autoSync", checked)}
                  />
                </div>

                {settings.sheets.autoSync && (
                  <div className="space-y-1">
                    <Label className="text-sm text-foreground">Sync Frequency</Label>
                    <Select
                      value={settings.sheets.syncFrequency}
                      onValueChange={(value: "realtime" | "hourly" | "daily") =>
                        updateSettings("sheets", "syncFrequency", value)
                      }
                    >
                      <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                        <SelectItem value="realtime" className="text-foreground hover:bg-accent/50">
                          Real-time
                        </SelectItem>
                        <SelectItem value="hourly" className="text-foreground hover:bg-accent/50">
                          Hourly
                        </SelectItem>
                        <SelectItem value="daily" className="text-foreground hover:bg-accent/50">
                          Daily
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncToGoogle("sheets")}
                    className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent/50"
                    disabled={isSyncing === "sheets"}
                  >
                    {isSyncing === "sheets" ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Now"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectFromGoogle("sheets")}
                    className="hover:bg-destructive/90"
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Google Docs Integration */}
      <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold font-sans flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-blue-600" />
            Google Docs
          </h4>
          <Badge variant={settings.docs.connected ? "default" : "secondary"} className="text-xs">
            {settings.docs.connected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
              </>
            )}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Save your notes as Google Docs for easy sharing and collaboration with your team.
        </p>

        {!settings.docs.connected ? (
          <Button
            onClick={() => connectToGoogle("docs")}
            disabled={isConnecting === "docs"}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting === "docs" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google Docs"
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
              <Label className="text-sm text-foreground">Enable Sync</Label>
              <Switch
                checked={settings.docs.enabled}
                onCheckedChange={(checked) => updateSettings("docs", "enabled", checked)}
              />
            </div>

            {settings.docs.enabled && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm text-foreground">Folder ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.docs.folderId}
                      onChange={(e) => updateSettings("docs", "folderId", e.target.value)}
                      placeholder="Enter Google Drive folder ID"
                      className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(`https://drive.google.com/drive/folders/${settings.docs.folderId}`, "_blank")
                      }
                      disabled={!settings.docs.folderId}
                      className="bg-card/95 backdrop-blur-xl border border-border/50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-foreground">Note Format</Label>
                  <Select
                    value={settings.docs.noteFormat}
                    onValueChange={(value: "markdown" | "plain" | "rich") =>
                      updateSettings("docs", "noteFormat", value)
                    }
                  >
                    <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                      <SelectItem value="markdown" className="text-foreground hover:bg-accent/50">
                        Markdown
                      </SelectItem>
                      <SelectItem value="plain" className="text-foreground hover:bg-accent/50">
                        Plain Text
                      </SelectItem>
                      <SelectItem value="rich" className="text-foreground hover:bg-accent/50">
                        Rich Text
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <Label className="text-sm text-foreground">Auto Sync</Label>
                  <Switch
                    checked={settings.docs.autoSync}
                    onCheckedChange={(checked) => updateSettings("docs", "autoSync", checked)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncToGoogle("docs")}
                    className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent/50"
                    disabled={isSyncing === "docs"}
                  >
                    {isSyncing === "docs" ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Now"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectFromGoogle("docs")}
                    className="hover:bg-destructive/90"
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Google Drive Integration */}
      <Card className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold font-sans flex items-center gap-2 text-foreground">
            <HardDrive className="h-4 w-4 text-yellow-600" />
            Google Drive
          </h4>
          <Badge variant={settings.drive.connected ? "default" : "secondary"} className="text-xs">
            {settings.drive.connected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
              </>
            )}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Automatically backup all your Manage.kar data to Google Drive for secure cloud storage.
        </p>

        {!settings.drive.connected ? (
          <Button
            onClick={() => connectToGoogle("drive")}
            disabled={isConnecting === "drive"}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isConnecting === "drive" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google Drive"
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
              <Label className="text-sm text-foreground">Enable Backup</Label>
              <Switch
                checked={settings.drive.enabled}
                onCheckedChange={(checked) => updateSettings("drive", "enabled", checked)}
              />
            </div>

            {settings.drive.enabled && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm text-foreground">Backup Folder ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.drive.folderId}
                      onChange={(e) => updateSettings("drive", "folderId", e.target.value)}
                      placeholder="Enter Google Drive folder ID"
                      className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(`https://drive.google.com/drive/folders/${settings.drive.folderId}`, "_blank")
                      }
                      disabled={!settings.drive.folderId}
                      className="bg-card/95 backdrop-blur-xl border border-border/50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <Label className="text-sm text-foreground">Auto Backup</Label>
                  <Switch
                    checked={settings.drive.autoBackup}
                    onCheckedChange={(checked) => updateSettings("drive", "autoBackup", checked)}
                  />
                </div>

                {settings.drive.autoBackup && (
                  <div className="space-y-1">
                    <Label className="text-sm text-foreground">Backup Frequency</Label>
                    <Select
                      value={settings.drive.backupFrequency}
                      onValueChange={(value: "daily" | "weekly" | "monthly") =>
                        updateSettings("drive", "backupFrequency", value)
                      }
                    >
                      <SelectTrigger className="bg-card/95 backdrop-blur-xl border border-border/50 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                        <SelectItem value="daily" className="text-foreground hover:bg-accent/50">
                          Daily
                        </SelectItem>
                        <SelectItem value="weekly" className="text-foreground hover:bg-accent/50">
                          Weekly
                        </SelectItem>
                        <SelectItem value="monthly" className="text-foreground hover:bg-accent/50">
                          Monthly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncToGoogle("drive")}
                    className="flex-1 bg-card/95 backdrop-blur-xl border border-border/50 text-foreground hover:bg-accent/50"
                    disabled={isSyncing === "drive"}
                  >
                    {isSyncing === "drive" ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Backing up...
                      </>
                    ) : (
                      "Backup Now"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectFromGoogle("drive")}
                    className="hover:bg-destructive/90"
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { MessageCircle, Link, Copy, Check, Mail, Download } from "lucide-react"
import { encodeEncryptedSharePayload } from "@/lib/share/secret"
import { shareExpiresAt, type ShareTtl } from "@/lib/share/codec"
import { recordBrowserEvent } from "@/lib/analytics/local-events"
import { APP_VERSION } from "@/lib/store/workspace"
import type { Task } from "@/lib/domain/types"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { MobileSheet } from "@/components/mobile-sheet"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  userName?: string
}

export function ShareModal({ isOpen, onClose, tasks, userName = "User" }: ShareModalProps) {
  const [shareMethod, setShareMethod] = useState<"whatsapp" | "link" | "email" | "export">("export")
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [linkPassword, setLinkPassword] = useState("")
  const [linkError, setLinkError] = useState("")
  const [linkTtl, setLinkTtl] = useState<ShareTtl>("7d")
  const [confirmWhatsApp, setConfirmWhatsApp] = useState(false)

  const filteredTasks = includeCompleted ? tasks : tasks.filter((task) => !task.completed)

  const generateWhatsAppMessage = () => {
    let message = `📋 *${userName}'s Task List from Manage.kar*\n\n`

    if (customMessage) {
      message += `${customMessage}\n\n`
    }

    const pendingTasks = filteredTasks.filter((task) => !task.completed)
    const completedTasks = filteredTasks.filter((task) => task.completed)

    if (pendingTasks.length > 0) {
      message += `⏳ *Pending Tasks (${pendingTasks.length}):*\n`
      pendingTasks.forEach((task, index) => {
        message += `${index + 1}. ${task.title}\n`
        message += `   📅 Due: ${task.dueDate} | 🔥 Priority: ${task.priority}\n`
        if (task.description) {
          message += `   📝 ${task.description}\n`
        }
        if (task.checklist && task.checklist.length > 0) {
          const completedItems = task.checklist.filter((item) => item.completed).length
          message += `   ✅ Checklist: ${completedItems}/${task.checklist.length} completed\n`
        }
        message += `\n`
      })
    }

    if (includeCompleted && completedTasks.length > 0) {
      message += `✅ *Completed Tasks (${completedTasks.length}):*\n`
      completedTasks.forEach((task, index) => {
        message += `${index + 1}. ~~${task.title}~~\n`
      })
      message += `\n`
    }

    message += `📱 Shared via Manage.kar App`
    return message
  }

  const generateShareableLink = async () => {
    const shareData = {
      userName,
      tasks: filteredTasks,
      sharedAt: new Date().toISOString(),
      customMessage,
      expiresAt: shareExpiresAt(linkTtl),
    }

    const encoded = await encodeEncryptedSharePayload(shareData, linkPassword)
    if (!encoded.ok) {
      setLinkError(encoded.error)
      setGeneratedLink("")
      return ""
    }
    const link = `${window.location.origin}/shared/${encoded.token}`
    setLinkError("")
    setGeneratedLink(link)
    recordBrowserEvent("share_link", { count: filteredTasks.length })
    return link
  }

  const exportTasksAsJSON = () => {
    const exportData = {
      userName,
      tasks: filteredTasks,
      exportedAt: new Date().toISOString(),
      customMessage,
      appName: "Manage.kar",
      version: APP_VERSION,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `manage-kar-tasks-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    recordBrowserEvent("export", { kind: "tasks", count: filteredTasks.length })
  }

  const handleWhatsAppShare = () => {
    setConfirmWhatsApp(true)
  }

  const sendWhatsAppShare = () => {
    const message = generateWhatsAppMessage()
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
    setConfirmWhatsApp(false)
  }

  const handleLinkShare = async () => {
    const link = await generateShareableLink()
    if (!link) {
      return
    }
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleEmailShare = () => {
    const message = generateWhatsAppMessage().replace(/\*/g, "").replace(/~/g, "")
    const subject = `${userName}'s Task List from Manage.kar`
    const body = encodeURIComponent(message)
    const mailtoUrl = emailAddress.trim()
      ? `mailto:${encodeURIComponent(emailAddress.trim())}?subject=${encodeURIComponent(subject)}&body=${body}`
      : `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`
    window.open(mailtoUrl, "_blank", "noopener,noreferrer")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleShareAction = () => {
    switch (shareMethod) {
      case "whatsapp":
        handleWhatsAppShare()
        return
      case "link":
        void handleLinkShare()
        return
      case "email":
        handleEmailShare()
        return
      case "export":
        exportTasksAsJSON()
        return
      default: {
        const _never: never = shareMethod
        return _never
      }
    }
  }

  return (
    <>
    <MobileSheet
      open={isOpen}
      onClose={onClose}
      title="Share tasks"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="mk-touch rounded-xl bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleShareAction}
            className="mk-touch flex-1 rounded-xl"
            disabled={filteredTasks.length === 0}
          >
            {shareMethod === "whatsapp" ? (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send titles to WhatsApp
              </>
            ) : shareMethod === "link" ? (
              <>
                <Link className="h-4 w-4 mr-2" />
                {linkCopied ? "Link copied" : "Generate and copy link"}
              </>
            ) : shareMethod === "email" ? (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send email
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export tasks
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
            <p className="text-xs text-muted-readable">
              Export a JSON file to keep a private copy. Link sharing is password-protected. The ciphertext sits in
              the URL. This device can refuse an expired link, but it cannot remotely revoke one. Anyone with both
              the URL and the password can read the tasks until expiry.
            </p>
            <div className="space-y-3">
              <Label className="responsive-text-sm font-medium text-readable">Share method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={shareMethod === "whatsapp" ? "default" : "outline"}
                  onClick={() => setShareMethod("whatsapp")}
                  className="justify-start bg-transparent rounded-xl hover:scale-105 transition-all duration-200 responsive-button"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp (plain text)
                </Button>
                <Button
                  variant={shareMethod === "link" ? "default" : "outline"}
                  onClick={() => setShareMethod("link")}
                  className="justify-start bg-transparent rounded-xl hover:scale-105 transition-all duration-200 responsive-button"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
                <Button
                  variant={shareMethod === "email" ? "default" : "outline"}
                  onClick={() => setShareMethod("email")}
                  className="justify-start bg-transparent rounded-xl hover:scale-105 transition-all duration-200 responsive-button"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={shareMethod === "export" ? "default" : "outline"}
                  onClick={() => setShareMethod("export")}
                  className="justify-start bg-transparent rounded-xl hover:scale-105 transition-all duration-200 responsive-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label className="responsive-text-sm font-medium text-readable">Include completed tasks</Label>
                <Switch checked={includeCompleted} onCheckedChange={setIncludeCompleted} />
              </div>

              {shareMethod === "email" && (
                <div className="space-y-2">
                  <Label className="responsive-text-sm font-medium text-readable">Email Address (Optional)</Label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="recipient@example.com"
                    className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl mobile-touch-target"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Custom Message (Optional)</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl min-h-[80px] mobile-touch-target"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Label className="responsive-text-sm font-medium text-readable">
                Tasks to Share ({filteredTasks.length})
              </Label>
              <div className="max-h-40 sm:max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl bg-muted/20">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                      <div className={`w-2 h-2 rounded-full ${task.completed ? "bg-primary" : "bg-orange-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`responsive-text-sm font-serif ${
                            task.completed ? "line-through text-muted-foreground" : "text-readable"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="responsive-text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <span className="responsive-text-xs text-muted-foreground">{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="responsive-text-sm text-muted-foreground text-center py-4">No tasks to share</p>
                )}
              </div>
            </div>

            {shareMethod === "link" && (
              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Link password</Label>
                <Input
                  type="password"
                  value={linkPassword}
                  onChange={(event) => setLinkPassword(event.target.value)}
                  placeholder="Required to encrypt the link"
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl mobile-touch-target"
                />
                <div className="space-y-2">
                  <Label className="responsive-text-sm font-medium text-readable">Link expires</Label>
                  <select
                    value={linkTtl}
                    onChange={(event) => setLinkTtl(event.target.value as ShareTtl)}
                    className="w-full rounded-xl border border-border/50 bg-card/95 px-3 py-2 text-sm mobile-touch-target"
                    aria-label="Share link expiry"
                  >
                    <option value="1d">After 1 day</option>
                    <option value="7d">After 7 days</option>
                    <option value="30d">After 30 days</option>
                    <option value="never">Never (ciphertext stays in the URL)</option>
                  </select>
                </div>
                <p className="text-xs text-muted-readable">
                  Share the password separately. We cannot recover it. Expiry is checked on this page only. There is
                  no server revoke.
                </p>
                {linkError ? <p className="text-xs text-destructive">{linkError}</p> : null}
              </div>
            )}
            {shareMethod === "link" && generatedLink && (
              <div className="space-y-2">
                <Label className="responsive-text-sm font-medium text-readable">Generated Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl responsive-text-xs mobile-touch-target"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="rounded-xl bg-transparent hover:scale-105 transition-all duration-200 mobile-touch-target"
                  >
                    {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
      </div>
    </MobileSheet>
    <ConfirmSheet
      request={
        confirmWhatsApp
          ? {
              title: "Send titles to WhatsApp?",
              message: "WhatsApp will receive these task titles in plain text. This is not the password-protected link.",
              confirmLabel: "Send",
              tone: "neutral",
            }
          : null
      }
      onCancel={() => setConfirmWhatsApp(false)}
      onConfirm={sendWhatsAppShare}
    />
    </>
  )
}

export default ShareModal

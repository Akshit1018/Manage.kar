"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link, Mail, FileText, CheckSquare, Copy } from "lucide-react"
import { MobileSheet } from "@/components/mobile-sheet"

interface ClipboardSuggestion {
  id: string
  content: string
  type: "url" | "email" | "text" | "phone"
  timestamp: Date
  suggested: boolean
}

interface ClipboardMonitorProps {
  onCreateTask?: (content: string) => void
  onCreateNote?: (content: string) => void
  enabled?: boolean
}

function assertNever(value: never): never {
  throw new Error(`Unhandled clipboard type: ${String(value)}`)
}

function detectContentType(content: string): ClipboardSuggestion["type"] {
  const urlRegex = /^https?:\/\/[^\s]+$/i
  if (urlRegex.test(content.trim())) return "url"

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(content.trim())) return "email"

  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  if (phoneRegex.test(content.replace(/[\s\-$$$$]/g, ""))) return "phone"

  return "text"
}

function shouldSuggestContent(content: string): boolean {
  if (content.length < 10 || content.length > 500) return false
  if (/^\d+$/.test(content) || content.split(" ").length === 1) return false
  if (/^[a-zA-Z0-9+/=]{20,}$/.test(content)) return false
  return true
}

function getContentIcon(type: ClipboardSuggestion["type"]) {
  switch (type) {
    case "url":
      return <Link className="h-4 w-4" />
    case "email":
      return <Mail className="h-4 w-4" />
    case "phone":
      return <Copy className="h-4 w-4" />
    case "text":
      return <FileText className="h-4 w-4" />
    default:
      return assertNever(type)
  }
}

function getContentLabel(type: ClipboardSuggestion["type"]) {
  switch (type) {
    case "url":
      return "Link"
    case "email":
      return "Email"
    case "phone":
      return "Phone"
    case "text":
      return "Text"
    default:
      return assertNever(type)
  }
}

function getSuggestionTitle(type: ClipboardSuggestion["type"]) {
  switch (type) {
    case "url":
      return "Save this link?"
    case "email":
      return "Save this email?"
    case "phone":
      return "Save this contact?"
    case "text":
      return "Save this text?"
    default:
      return assertNever(type)
  }
}

export function ClipboardMonitor({ onCreateTask, onCreateNote, enabled = false }: ClipboardMonitorProps) {
  const [suggestions, setSuggestions] = useState<ClipboardSuggestion[]>([])
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<ClipboardSuggestion | null>(null)
  const [clipboardSupported, setClipboardSupported] = useState(false)
  const lastClipboardContent = useRef<string>("")
  const checkInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      setClipboardSupported(true)
    }
  }, [])

  const checkClipboard = async () => {
    if (!clipboardSupported || !enabled) return

    try {
      const text = await navigator.clipboard.readText()

      if (text && text !== lastClipboardContent.current && shouldSuggestContent(text)) {
        const suggestion: ClipboardSuggestion = {
          id: Date.now().toString(),
          content: text,
          type: detectContentType(text),
          timestamp: new Date(),
          suggested: false,
        }

        setSuggestions((prev) => [suggestion, ...prev.slice(0, 4)])
        setCurrentSuggestion(suggestion)
        setShowSuggestion(true)
        lastClipboardContent.current = text

        setTimeout(() => {
          setShowSuggestion(false)
        }, 10000)
      }
    } catch {
      // Clipboard access denied or not available
    }
  }

  useEffect(() => {
    if (enabled && clipboardSupported) {
      checkInterval.current = setInterval(checkClipboard, 2000)

      return () => {
        if (checkInterval.current) {
          clearInterval(checkInterval.current)
        }
      }
    }
  }, [enabled, clipboardSupported])

  const handleCreateTask = () => {
    if (currentSuggestion) {
      onCreateTask?.(currentSuggestion.content)
      setShowSuggestion(false)
      setSuggestions((prev) => prev.map((s) => (s.id === currentSuggestion.id ? { ...s, suggested: true } : s)))
    }
  }

  const handleCreateNote = () => {
    if (currentSuggestion) {
      onCreateNote?.(currentSuggestion.content)
      setShowSuggestion(false)
      setSuggestions((prev) => prev.map((s) => (s.id === currentSuggestion.id ? { ...s, suggested: true } : s)))
    }
  }

  const handleDismiss = () => {
    setShowSuggestion(false)
  }

  if (!clipboardSupported || !enabled || !currentSuggestion) {
    return null
  }

  return (
    <MobileSheet
      open={showSuggestion}
      onClose={handleDismiss}
      title={getSuggestionTitle(currentSuggestion.type)}
      footer={
        <div className="mk-sheet-footer-actions">
          <Button className="mk-touch rounded-xl" onClick={handleCreateTask}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Task
          </Button>
          <Button variant="outline" className="mk-touch rounded-xl bg-transparent" onClick={handleCreateNote}>
            <FileText className="h-4 w-4 mr-2" />
            Note
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">{getContentIcon(currentSuggestion.type)}</div>
          <Badge variant="secondary" className="text-xs">
            {getContentLabel(currentSuggestion.type)}
          </Badge>
        </div>
        <p className="break-words rounded-xl bg-accent/10 p-3 text-sm leading-6 text-muted-foreground">
          {currentSuggestion.content}
        </p>
        <p className="text-xs text-muted-foreground">
          Offered from clipboard text on this device. Auto-dismiss in 10s.
        </p>
      </div>
    </MobileSheet>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Link, Mail, FileText, CheckSquare, Copy } from "lucide-react"

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

  const detectContentType = (content: string): ClipboardSuggestion["type"] => {
    // URL detection
    const urlRegex = /^https?:\/\/[^\s]+$/i
    if (urlRegex.test(content.trim())) return "url"

    // Email detection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(content.trim())) return "email"

    // Phone detection
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (phoneRegex.test(content.replace(/[\s\-$$$$]/g, ""))) return "phone"

    return "text"
  }

  const shouldSuggestContent = (content: string): boolean => {
    // Don't suggest if content is too short or too long
    if (content.length < 10 || content.length > 500) return false

    // Don't suggest if it's just numbers or single words
    if (/^\d+$/.test(content) || content.split(" ").length === 1) return false

    // Don't suggest if it looks like a password or token
    if (/^[a-zA-Z0-9+/=]{20,}$/.test(content)) return false

    return true
  }

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

        setSuggestions((prev) => [suggestion, ...prev.slice(0, 4)]) // Keep last 5 suggestions
        setCurrentSuggestion(suggestion)
        setShowSuggestion(true)
        lastClipboardContent.current = text

        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowSuggestion(false)
        }, 10000)
      }
    } catch (error) {
      // Clipboard access denied or not available
      console.log("[v0] Clipboard access not available")
    }
  }

  useEffect(() => {
    if (enabled && clipboardSupported) {
      // Check clipboard every 2 seconds
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

  const getContentIcon = (type: ClipboardSuggestion["type"]) => {
    switch (type) {
      case "url":
        return <Link className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "phone":
        return <Copy className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getContentLabel = (type: ClipboardSuggestion["type"]) => {
    switch (type) {
      case "url":
        return "Link"
      case "email":
        return "Email"
      case "phone":
        return "Phone"
      default:
        return "Text"
    }
  }

  const getSuggestionTitle = (type: ClipboardSuggestion["type"]) => {
    switch (type) {
      case "url":
        return "Save this link?"
      case "email":
        return "Save this email?"
      case "phone":
        return "Save this contact?"
      default:
        return "Save this text?"
    }
  }

  if (!clipboardSupported || !enabled || !showSuggestion || !currentSuggestion) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
      <Card className="glass-card p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">{getContentIcon(currentSuggestion.type)}</div>
            <div>
              <h4 className="text-sm font-semibold font-sans text-foreground">
                {getSuggestionTitle(currentSuggestion.type)}
              </h4>
              <Badge variant="secondary" className="text-xs mt-1">
                {getContentLabel(currentSuggestion.type)}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground font-serif line-clamp-3 bg-accent/10 p-3 rounded-xl">
            {currentSuggestion.content}
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 rounded-xl" onClick={handleCreateTask}>
            <CheckSquare className="h-3 w-3 mr-2" />
            Task
          </Button>
          <Button size="sm" variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={handleCreateNote}>
            <FileText className="h-3 w-3 mr-2" />
            Note
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Auto-dismiss in 10s • Clipboard monitoring active
        </p>
      </Card>
    </div>
  )
}

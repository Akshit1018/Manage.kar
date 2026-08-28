"use client"

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { backdropPointerDown, installGhostEventShield } from "@/lib/ui/overlay-pointer"
import { popOverlay, pushOverlay, shouldHandleOverlayEscape, type OverlayId } from "@/lib/ui/overlay-stack"
import { useBodyScrollLock } from "@/lib/ui/use-body-scroll-lock"
import { useVisualViewportInset } from "@/lib/ui/use-visual-viewport"

interface MobileSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  footer?: ReactNode
  children: ReactNode
  variant?: "sheet" | "full"
  wide?: boolean
  hideHeader?: boolean
}

export function MobileSheet({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  variant = "sheet",
  wide = false,
  hideHeader = false,
}: MobileSheetProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [mounted, setMounted] = useState(false)
  const overlayId = useRef<OverlayId | null>(null)
  const pointerGuard = useRef<(() => void) | null>(null)
  useBodyScrollLock(open)
  useVisualViewportInset(open)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    return () => {
      pointerGuard.current?.()
      pointerGuard.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }
    const id = pushOverlay()
    overlayId.current = id
    return () => {
      popOverlay(id)
      overlayId.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      const id = overlayId.current
      if (!id) {
        return
      }
      if (
        !shouldHandleOverlayEscape({
          overlayId: id,
          key: event.key,
          selectOrListboxOpen: Boolean(document.querySelector('[data-slot="select-content"], [role="listbox"]')),
        })
      ) {
        return
      }
      onClose()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open, onClose])

  const dismissFromBackdrop = (event: PointerEvent<HTMLButtonElement>) => {
    if (backdropPointerDown(event) !== "dismiss") {
      return
    }
    pointerGuard.current?.()
    pointerGuard.current = installGhostEventShield(document, {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    })
    onClose()
  }

  if (!open || !mounted) {
    return null
  }

  return createPortal(
    <div className={cn("mk-overlay", variant === "full" && "mk-overlay-full")} data-testid="mobile-sheet">
      <button
        type="button"
        className="mk-overlay-backdrop"
        data-testid="overlay-backdrop"
        aria-label="Close"
        onPointerDown={dismissFromBackdrop}
        onClick={(event) => {
          if (event.detail === 0) {
            onClose()
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn("mk-sheet", variant === "full" && "mk-sheet-full", wide && "mk-sheet-wide")}
      >
        {hideHeader ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <header className="mk-sheet-header">
            <div className="min-w-0">
              <h2 id={titleId} className="mk-sheet-title truncate">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="mk-touch rounded-full shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>
        )}
        <div className="mk-sheet-body" data-testid="sheet-body">
          {children}
        </div>
        {footer ? <footer className="mk-sheet-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}

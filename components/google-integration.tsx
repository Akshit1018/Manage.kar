"use client"

import { Card } from "@/components/ui/card"
import { HardDrive } from "lucide-react"

export function GoogleIntegration() {
  return (
    <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-muted rounded-xl">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold font-sans text-readable">No cloud backup yet</h4>
          <p className="responsive-text-sm text-muted-readable">
            Manage.kar does not connect to Google Sheets, Docs, or Drive. Nothing is uploaded from this browser.
            Use <strong>Data → Export</strong> to download a JSON backup you control.
          </p>
        </div>
      </div>
    </Card>
  )
}

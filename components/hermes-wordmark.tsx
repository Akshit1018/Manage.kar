import { COMPANION_WORDMARK, HERMES_WORDMARK, companionWordmarkLabel } from "@/lib/theme/hermes-tokens"
import { cn } from "@/lib/utils"

interface HermesWordmarkProps {
  className?: string
}

export function HermesWordmark({ className }: HermesWordmarkProps) {
  return (
    <p className={cn("mk-wordmark", className)} aria-label={companionWordmarkLabel()}>
      <span className="mk-wordmark-hermes">{HERMES_WORDMARK}</span>
      <span className="mk-wordmark-companion">{COMPANION_WORDMARK}</span>
    </p>
  )
}

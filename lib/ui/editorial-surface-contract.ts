import { readFileSync } from "node:fs"
import path from "node:path"

export const GLOBALS_CSS_PATH = path.join(process.cwd(), "app/globals.css")

const LAYER_NAMES = ["base", "components", "utilities"] as const

export function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, "utf8")
}

export function findMatchingBrace(content: string, openBraceIndex: number): number {
  let depth = 0
  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index]
    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }
  return -1
}

export function extractLayerBlock(css: string, layerName: string): string | null {
  const marker = `@layer ${layerName}`
  const start = css.indexOf(marker)
  if (start === -1) {
    return null
  }

  const braceStart = css.indexOf("{", start)
  if (braceStart === -1) {
    return null
  }

  const braceEnd = findMatchingBrace(css, braceStart)
  if (braceEnd === -1) {
    return null
  }

  return css.slice(braceStart + 1, braceEnd)
}

export function stripLayerBlocks(css: string): string {
  let result = css

  for (const layerName of LAYER_NAMES) {
    let markerIndex = result.indexOf(`@layer ${layerName}`)
    while (markerIndex !== -1) {
      const braceStart = result.indexOf("{", markerIndex)
      if (braceStart === -1) {
        break
      }

      const braceEnd = findMatchingBrace(result, braceStart)
      if (braceEnd === -1) {
        break
      }

      result = result.slice(0, markerIndex) + result.slice(braceEnd + 1)
      markerIndex = result.indexOf(`@layer ${layerName}`)
    }
  }

  return result
}

const NARROW_VIEWPORT_MEDIA = /@media\s*\(\s*max-width:\s*767px\s*\)/

const IOS_ZOOM_GUARD_TARGETS =
  /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)[\s\S]*?\[data-slot="select-trigger"\]/

export function narrowViewportZoomGuard(css: string): string | null {
  const match = css.match(
    /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\}\s*(?=@media|\[(?!data)|\.[a-z]|html|$)/i,
  )
  return match?.[0] ?? null
}

export function usesMax16px1emFontSize(ruleBlock: string): boolean {
  return /font-size:\s*max\(\s*16px\s*,\s*1em\s*\)/.test(ruleBlock)
}

export function iosZoomGuardIsUnlayered(css: string): boolean {
  const unlayered = stripLayerBlocks(css)
  const guard = narrowViewportZoomGuard(unlayered)
  if (!guard || !IOS_ZOOM_GUARD_TARGETS.test(guard)) {
    return false
  }
  return usesMax16px1emFontSize(guard)
}

export function iosZoomGuardLivesInBaseLayer(css: string): boolean {
  const base = extractLayerBlock(css, "base")
  if (!base) {
    return false
  }
  const guard = narrowViewportZoomGuard(base)
  return Boolean(guard && IOS_ZOOM_GUARD_TARGETS.test(guard))
}

export function touchTargetFloorBlock(css: string): string | null {
  const match = css.match(
    /\[data-slot="button"\][\s\S]*?\.mk-touch\s*\{[\s\S]*?\}/,
  )
  return match?.[0] ?? null
}

export function touchTargetFloorIsUnlayered(css: string): boolean {
  const unlayered = stripLayerBlocks(css)
  const block = touchTargetFloorBlock(unlayered)
  if (!block) {
    return false
  }
  return /min-height:\s*44px/.test(block) && /min-width:\s*44px/.test(block)
}

export function touchTargetFloorLivesInBaseLayer(css: string): boolean {
  const base = extractLayerBlock(css, "base")
  if (!base) {
    return false
  }
  return Boolean(touchTargetFloorBlock(base))
}

export function countMkTouchMinSizeRules(css: string): number {
  return (css.match(/\.mk-touch\s*\{[^}]*min-height:\s*44px[^}]*min-width:\s*44px[^}]*\}/g) ?? [])
    .length
}

export interface SwitchPrimitiveContract {
  rootHitArea44: boolean
  hasCompactTrack: boolean
  focusVisibleOnRoot: boolean
}

export function switchPrimitiveContract(source: string): SwitchPrimitiveContract {
  const rootBlock = source.slice(source.indexOf("data-slot=\"switch\""), source.indexOf("SwitchPrimitive.Thumb"))
  return {
    rootHitArea44: /size-11|h-11 w-11|min-h-11 min-w-11/.test(rootBlock),
    hasCompactTrack: /data-slot="switch-track"/.test(source) && /h-\[1\.15rem\] w-8/.test(source),
    focusVisibleOnRoot: /focus-visible:ring-\[3px\]/.test(rootBlock),
  }
}

export function switchInTouchFloor(css: string): boolean {
  const block = touchTargetFloorBlock(stripLayerBlocks(css))
  return Boolean(block && /\[data-slot="switch"\]/.test(block))
}

export type Srgb = { r: number; g: number; b: number }

export const FEATURED_LIGHT_ACCENT = "#e85d2a"
export const FEATURED_LIGHT_CANVAS = "#e8f2fd"
export const FEATURED_LIGHT_MIX = 0.78
export const FEATURED_LIGHT_FOREGROUND = "#170d02"

function srgbChannel(value: number): number {
  const channel = value / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function parseCssColor(input: string): Srgb | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(input.trim())
  if (hex) {
    const value = Number.parseInt(hex[1], 16)
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(input)
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) }
  }
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(input)
  if (srgb) {
    return { r: Number(srgb[1]) * 255, g: Number(srgb[2]) * 255, b: Number(srgb[3]) * 255 }
  }
  return null
}

export function mixSrgb(accent: Srgb, canvas: Srgb, amount: number): Srgb {
  const rest = 1 - amount
  return {
    r: accent.r * amount + canvas.r * rest,
    g: accent.g * amount + canvas.g * rest,
    b: accent.b * amount + canvas.b * rest,
  }
}

export function relativeLuminance(color: Srgb): number {
  return 0.2126 * srgbChannel(color.r) + 0.7152 * srgbChannel(color.g) + 0.0722 * srgbChannel(color.b)
}

export function contrastRatio(first: Srgb, second: Srgb): number {
  const left = relativeLuminance(first)
  const right = relativeLuminance(second)
  const lighter = Math.max(left, right)
  const darker = Math.min(left, right)
  return (lighter + 0.05) / (darker + 0.05)
}

export function featuredLightSupportContrast(): number {
  const accent = parseCssColor(FEATURED_LIGHT_ACCENT)
  const canvas = parseCssColor(FEATURED_LIGHT_CANVAS)
  const foreground = parseCssColor(FEATURED_LIGHT_FOREGROUND)
  if (!accent || !canvas || !foreground) {
    return 0
  }
  return contrastRatio(foreground, mixSrgb(accent, canvas, FEATURED_LIGHT_MIX))
}

export function rectFitsViewport(
  rect: { x: number; width: number },
  viewport: { width: number },
  slop = 0.5,
): boolean {
  return rect.x >= -slop && rect.x + rect.width <= viewport.width + slop
}

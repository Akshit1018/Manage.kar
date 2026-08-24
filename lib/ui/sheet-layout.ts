export const IPHONE_VIEWPORTS = {
  iphone14Class: { width: 390, height: 844 },
  iphone17: { width: 402, height: 874 },
  iphone17Pro: { width: 402, height: 874 },
  iphoneAir: { width: 420, height: 912 },
  iphone17ProMax: { width: 440, height: 956 },
} as const

export const PHONE_FULL_MAX_WIDTH = 480
export const DESKTOP_DIALOG_MIN_WIDTH = 640

export type OverlayPlacement = "viewport-full" | "centered-dialog"

export interface OverlayPositioning {
  position: "fixed"
  inset: 0 | "auto"
  top: "0" | "50%"
  transform: "none" | "translate(-50%, -50%)"
  height: "100dvh" | "auto"
}

export function overlayPlacement(width: number): OverlayPlacement {
  return width < DESKTOP_DIALOG_MIN_WIDTH ? "viewport-full" : "centered-dialog"
}

export function overlayPositioning(width: number): OverlayPositioning {
  if (overlayPlacement(width) === "viewport-full") {
    return {
      position: "fixed",
      inset: 0,
      top: "0",
      transform: "none",
      height: "100dvh",
    }
  }
  return {
    position: "fixed",
    inset: "auto",
    top: "50%",
    transform: "translate(-50%, -50%)",
    height: "auto",
  }
}

export function overlayContainingBlockIsSafe(styles: {
  backdropFilter?: string
  filter?: string
  transform?: string
}): boolean {
  const backdrop = styles.backdropFilter?.trim() ?? "none"
  const filter = styles.filter?.trim() ?? "none"
  const transform = styles.transform?.trim() ?? "none"
  return backdrop === "none" && filter === "none" && transform === "none"
}

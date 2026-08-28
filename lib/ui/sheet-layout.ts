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

export const NARROW_FORM_MAX_WIDTH = 360

export function mobileBackdropIsDismissible(pointerEvents: string): boolean {
  return pointerEvents.trim() !== "none"
}

export function overlayBlocksWorkspace(pointerEvents: string): boolean {
  return pointerEvents.trim() !== "none"
}

export function sectionTabsShouldWrap(width: number): boolean {
  return width < DESKTOP_DIALOG_MIN_WIDTH
}

export function formGridColumns(width: number): 1 | 2 {
  return width < NARROW_FORM_MAX_WIDTH ? 1 : 2
}

export function sheetFooterOrientation(width: number): "stack" | "row" {
  return width < NARROW_FORM_MAX_WIDTH ? "stack" : "row"
}

export interface OverlayCssContract {
  mobileBackdropPointerNone: boolean
  overlayCapturesPointer: boolean
  singleScrollBody: boolean
  safeAreaAware: boolean
  keyboardAware: boolean
  hasSheetTabs: boolean
  hasSwitchRow: boolean
  hasFormGrid: boolean
  hasStackedFooter: boolean
  noDuplicateBottomSafeArea: boolean
}

export function overlayCssContract(css: string): OverlayCssContract {
  const mobileBackdrop = css.match(
    /@media\s*\(\s*max-width:\s*639px\s*\)\s*\{[\s\S]*?\.mk-overlay-backdrop\s*\{([^}]*)\}/,
  )
  return {
    mobileBackdropPointerNone: Boolean(mobileBackdrop?.[1] && /pointer-events:\s*none/.test(mobileBackdrop[1])),
    overlayCapturesPointer: /\.mk-overlay\s*\{[^}]*pointer-events:\s*auto/.test(css),
    singleScrollBody: /\.mk-sheet-body\s*\{[^}]*overflow-y:\s*auto/.test(css),
    safeAreaAware:
      /\.mk-overlay\s*\{[^}]*safe-area-inset-top/.test(css) || /\.mk-sheet\s*\{[^}]*safe-area-inset-top/.test(css),
    keyboardAware:
      /--mk-keyboard:\s*0px/.test(css) && /\.mk-overlay\s*\{[^}]*bottom:\s*calc\(0px \+ var\(--mk-keyboard\)/.test(css),
    hasSheetTabs: /\.mk-sheet-tabs\s*\{/.test(css),
    hasSwitchRow: /\.mk-switch-row\s*\{/.test(css),
    hasFormGrid: /\.mk-form-grid\s*\{/.test(css),
    hasStackedFooter: /\.mk-sheet-footer-actions\s*\{/.test(css),
    noDuplicateBottomSafeArea:
      /\.mk-sheet:not\(:has\(\.mk-sheet-footer\)\)/.test(css) &&
      !/\.mk-sheet\s*\{[^}]*padding-bottom:\s*env\(safe-area-inset-bottom/.test(css),
  }
}

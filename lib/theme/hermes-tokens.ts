/**
 * Live-site brand tokens from https://hermes-agent.nousresearch.com/ (.hermes-web)
 * plus dashboard surfaces from NousResearch/hermes-agent web/src/themes/presets.ts
 * (MIT License, Copyright (c) 2025 Nous Research).
 *
 * Manage.kar stays a companion: surfaces stay Nous Blue / Hermes Teal.
 * Site electric blue and chartreuse are brand marks only — not a third skin.
 */

export const SITE_BG = "#0000f2"
export const SITE_FG = "#f5f5f5"
export const SITE_ACCENT = "#edff45"
export const SITE_PAPER = "#ffffff"

export const DASHBOARD_LIGHT_CANVAS = "#e8f2fd"
export const DASHBOARD_LIGHT_MID = "#0053fd"
export const DASHBOARD_LIGHT_INK = "#170d02"
export const DASHBOARD_DARK_CANVAS = "#041c1c"
export const DASHBOARD_DARK_MID = "#ffe6cb"
export const DASHBOARD_DARK_BLUE = "#4a86ff"

export const DASHBOARD_ROOT_SIZE = "15px"
export const DASHBOARD_LINE_HEIGHT = "1.55"
export const DASHBOARD_LETTER_SPACING = "0"
export const DASHBOARD_RADIUS = "0.5rem"
export const DASHBOARD_DENSITY = "comfortable"

export const DASHBOARD_FONT_SANS =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
export const DASHBOARD_FONT_MONO =
  '"JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace'

export const HERMES_WORDMARK = "HERMES"
export const COMPANION_WORDMARK = "Manage.kar"

export function companionWordmarkLabel(): string {
  return `${HERMES_WORDMARK} · ${COMPANION_WORDMARK}`
}

/** First-run must stay usable. A mark may pulse; it must not hide the workspace. */
export function preloaderBlocksWorkspace(): boolean {
  return false
}

export interface HermesCssContract {
  hasSiteBg: boolean
  hasSiteFg: boolean
  hasSiteAccent: boolean
  hasSitePaper: boolean
  hermesLightUsesDashboardCanvas: boolean
  hermesDarkUsesTealCanvas: boolean
  hermesRadiusIsDashboard: boolean
  hasThemeTypeTokens: boolean
  hasWordmark: boolean
  hasPreloader: boolean
  hasApprovalChrome: boolean
  hasDesktopNav: boolean
  desktopNavHiddenOnPhone: boolean
  keepsFiveTabPill: boolean
  desktopChromeWinsOverBase: boolean
  editorialUsesDashboardRadius: boolean
}

export function hermesCssContract(css: string): HermesCssContract {
  const rootBlock = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? ""
  const darkBlock = css.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? ""
  return {
    hasSiteBg: /--mk-site-bg:\s*#0000f2/i.test(css),
    hasSiteFg: /--mk-site-fg:\s*#f5f5f5/i.test(css),
    hasSiteAccent: /--mk-site-accent:\s*#edff45/i.test(css),
    hasSitePaper: /--mk-site-paper:\s*#ffffff/i.test(css),
    hermesLightUsesDashboardCanvas: /--mk-canvas:\s*#e8f2fd/i.test(rootBlock),
    hermesDarkUsesTealCanvas: /--mk-canvas:\s*#041c1c/i.test(darkBlock),
    hermesRadiusIsDashboard: /--radius:\s*0\.5rem/.test(rootBlock),
    hasThemeTypeTokens:
      /--theme-base-size:\s*15px/.test(css) && /--theme-line-height:\s*1\.55/.test(css),
    hasWordmark: /\.mk-wordmark\s*\{/.test(css),
    hasPreloader: /\.mk-preloader\s*\{/.test(css),
    hasApprovalChrome: /\.mk-approval-card\s*\{/.test(css) && /\.mk-approval-command\s*\{/.test(css),
    hasDesktopNav: /\.mk-desktop-nav\s*\{/.test(css),
    desktopNavHiddenOnPhone:
      /\.mk-desktop-nav\s*\{[^}]*display:\s*none/.test(css) &&
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*\.mk-desktop-nav\s*\{[^}]*display:\s*flex/.test(css),
    keepsFiveTabPill: /\.mk-pill-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,/.test(css),
    desktopChromeWinsOverBase: desktopChromeWinsOverBase(css),
    editorialUsesDashboardRadius:
      /\.mk-editorial-card\s*\{[^}]*border-radius:\s*var\(--radius\)/.test(css) &&
      !/\.mk-editorial-card\s*\{[^}]*border-radius:\s*calc\(var\(--radius\) \+ 4px\)/.test(css),
  }
}

export function desktopChromeWinsOverBase(css: string): boolean {
  const baseWorkspace = css.indexOf(".mk-workspace {\n    min-height: 100dvh")
  const baseBottom = css.indexOf(".mk-bottom-chrome {\n    position: fixed")
  const lastMedia = css.lastIndexOf("@media (min-width: 1024px)")
  if (lastMedia < 0 || baseWorkspace < 0 || baseBottom < 0) {
    return false
  }
  const tail = css.slice(lastMedia)
  return (
    lastMedia > baseWorkspace &&
    lastMedia > baseBottom &&
    /\.mk-workspace\s*\{[^}]*padding-left/.test(tail) &&
    /\.mk-bottom-chrome\s*\{[^}]*display:\s*none/.test(tail)
  )
}

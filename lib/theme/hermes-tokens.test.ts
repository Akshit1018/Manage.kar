import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { readGlobalsCss } from "@/lib/ui/editorial-surface-contract"
import {
  COMPANION_WORDMARK,
  DASHBOARD_DARK_BLUE,
  DASHBOARD_DARK_CANVAS,
  DASHBOARD_DARK_MID,
  DASHBOARD_DENSITY,
  DASHBOARD_FONT_MONO,
  DASHBOARD_FONT_SANS,
  DASHBOARD_LETTER_SPACING,
  DASHBOARD_LIGHT_CANVAS,
  DASHBOARD_LIGHT_INK,
  DASHBOARD_LIGHT_MID,
  DASHBOARD_LINE_HEIGHT,
  DASHBOARD_RADIUS,
  DASHBOARD_ROOT_SIZE,
  HERMES_WORDMARK,
  SITE_ACCENT,
  SITE_BG,
  SITE_FG,
  SITE_PAPER,
  companionWordmarkLabel,
  hermesCssContract,
  preloaderBlocksWorkspace,
} from "./hermes-tokens"

function readLayout(): string {
  return readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8")
}

describe("Hermes live-site + dashboard tokens", () => {
  it("records the live marketing site brand quartet", () => {
    expect(SITE_BG).toBe("#0000f2")
    expect(SITE_FG).toBe("#f5f5f5")
    expect(SITE_ACCENT).toBe("#edff45")
    expect(SITE_PAPER).toBe("#ffffff")
  })

  it("keeps the MIT dashboard Nous Blue / Hermes Teal surfaces", () => {
    expect(DASHBOARD_LIGHT_CANVAS).toBe("#e8f2fd")
    expect(DASHBOARD_LIGHT_MID).toBe("#0053fd")
    expect(DASHBOARD_LIGHT_INK).toBe("#170d02")
    expect(DASHBOARD_DARK_CANVAS).toBe("#041c1c")
    expect(DASHBOARD_DARK_MID).toBe("#ffe6cb")
    expect(DASHBOARD_DARK_BLUE).toBe("#4a86ff")
  })

  it("matches dashboard type and density, not a third product face", () => {
    expect(DASHBOARD_ROOT_SIZE).toBe("15px")
    expect(DASHBOARD_LINE_HEIGHT).toBe("1.55")
    expect(DASHBOARD_LETTER_SPACING).toBe("0")
    expect(DASHBOARD_RADIUS).toBe("0.5rem")
    expect(DASHBOARD_DENSITY).toBe("comfortable")
    expect(DASHBOARD_FONT_SANS).toMatch(/Inter/)
    expect(DASHBOARD_FONT_MONO).toMatch(/JetBrains Mono/)
  })

  it("uses the Hermes wordmark as a companion mark, not a desktop clone", () => {
    expect(HERMES_WORDMARK).toBe("HERMES")
    expect(COMPANION_WORDMARK).toBe("Manage.kar")
    expect(companionWordmarkLabel()).toBe("HERMES · Manage.kar")
    expect(preloaderBlocksWorkspace()).toBe(false)
  })
})

describe("Hermes theme CSS contract", () => {
  it("emits live-site tokens and dashboard type on the Hermes skin", () => {
    const contract = hermesCssContract(readGlobalsCss())
    expect(contract.hasSiteBg).toBe(true)
    expect(contract.hasSiteFg).toBe(true)
    expect(contract.hasSiteAccent).toBe(true)
    expect(contract.hasSitePaper).toBe(true)
    expect(contract.hermesLightUsesDashboardCanvas).toBe(true)
    expect(contract.hermesDarkUsesTealCanvas).toBe(true)
    expect(contract.hermesRadiusIsDashboard).toBe(true)
    expect(contract.hasThemeTypeTokens).toBe(true)
    expect(contract.hasWordmark).toBe(true)
    expect(contract.hasPreloader).toBe(true)
    expect(contract.hasApprovalChrome).toBe(true)
    expect(contract.hasDesktopNav).toBe(true)
    expect(contract.desktopNavHiddenOnPhone).toBe(true)
    expect(contract.keepsFiveTabPill).toBe(true)
  })

  it("loads Inter and JetBrains Mono instead of inventing a display face", () => {
    const layout = readLayout()
    expect(layout).toMatch(/Inter/)
    expect(layout).toMatch(/JetBrains_Mono/)
    expect(layout).not.toMatch(/Sigurd/)
    expect(layout).not.toMatch(/from "next\/font\/google"[\s\S]*Geist/)
  })

  it("surfaces companion chrome without a plugins store or blocking splash", () => {
    const dashboard = readFileSync(path.join(process.cwd(), "components/workspace/dashboard.tsx"), "utf8")
    const chats = readFileSync(path.join(process.cwd(), "components/workspace/chats-view.tsx"), "utf8")
    const pairing = readFileSync(path.join(process.cwd(), "components/pairing-sheet.tsx"), "utf8")
    const approval = readFileSync(path.join(process.cwd(), "components/approval-card.tsx"), "utf8")
    expect(dashboard).toContain("HermesWordmark")
    expect(dashboard).toContain("mk-desktop-nav")
    expect(dashboard).toContain("showDesktopSidebar")
    expect(dashboard).toContain("showMobileTabBar")
    expect(dashboard).not.toMatch(/Plugins tab|Plugin store|Install skill/i)
    expect(chats).toContain("chatIdentityLabel")
    expect(chats).toContain("SkillsOnMachine")
    expect(pairing).toContain("SkillsOnMachine")
    expect(approval).toContain("approvalChrome")
    expect(approval).toContain("approvalToolName")
  })
})

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { readGlobalsCss } from "./editorial-surface-contract"
import { NARROW_FORM_MAX_WIDTH } from "./sheet-layout"
import {
  COMPOSER_ORB_GUTTER_PX,
  PAIRING_QR_MAX_PX,
  auxiliaryFooterOrientation,
  chatHeaderOrientation,
  chromeRectsOverlap,
  composerBottomOffset,
  composerLeavesOrbGutter,
  honestCopyContract,
  shareHeaderOrientation,
  workspaceSectionsCssContract,
  workspaceSectionsSourceContract,
} from "./workspace-sections-layout"

function readComponent(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

function sectionSources() {
  return {
    chatsView: readComponent("components/workspace/chats-view.tsx"),
    composer: readComponent("components/chat-composer.tsx"),
    pairingSheet: readComponent("components/pairing-sheet.tsx"),
    habitList: readComponent("components/workspace/habit-list.tsx"),
    habitModal: readComponent("components/habit-modal.tsx"),
    habitDashboard: readComponent("components/habit-dashboard.tsx"),
    focusModal: readComponent("components/focus-modal.tsx"),
    goalManager: readComponent("components/goal-manager.tsx"),
    timeTracker: readComponent("components/time-tracker.tsx"),
    analyticsDashboard: readComponent("components/analytics-dashboard.tsx"),
    clipboardMonitor: readComponent("components/clipboard-monitor.tsx"),
    sharedPage: readComponent("app/shared/[data]/page.tsx"),
  }
}

describe("workspace section layout decisions", () => {
  it("stacks chat headers below 360 and keeps them in a row from 360 up", () => {
    expect(NARROW_FORM_MAX_WIDTH).toBe(360)
    expect(chatHeaderOrientation(320)).toBe("stack")
    expect(chatHeaderOrientation(359)).toBe("stack")
    expect(chatHeaderOrientation(360)).toBe("row")
    expect(chatHeaderOrientation(390)).toBe("row")
  })

  it("stacks the shared-import header below 640", () => {
    expect(shareHeaderOrientation(320)).toBe("stack")
    expect(shareHeaderOrientation(390)).toBe("stack")
    expect(shareHeaderOrientation(639)).toBe("stack")
    expect(shareHeaderOrientation(640)).toBe("row")
    expect(shareHeaderOrientation(1280)).toBe("row")
  })

  it("reuses the shared footer stack contract for auxiliary sheets", () => {
    expect(auxiliaryFooterOrientation(320)).toBe("stack")
    expect(auxiliaryFooterOrientation(360)).toBe("row")
  })

  it("keeps composer above nav and keyboard without colliding with the orb gutter", () => {
    expect(composerBottomOffset(76, 0)).toBe(76)
    expect(composerBottomOffset(76, 248)).toBe(324)
    expect(composerLeavesOrbGutter(320, COMPOSER_ORB_GUTTER_PX)).toBe(true)
    expect(PAIRING_QR_MAX_PX).toBeLessThanOrEqual(220)

    const viewport = 568
    const nav = { top: viewport - 76, bottom: viewport }
    const composerCollapsed = { top: viewport - composerBottomOffset(76, 0) - 44, bottom: viewport - 76 }
    const composerKeyboard = {
      top: viewport - composerBottomOffset(76, 248) - 44,
      bottom: viewport - composerBottomOffset(76, 248),
    }
    const orb = { top: 380, bottom: 436 }

    expect(chromeRectsOverlap(composerCollapsed, nav)).toBe(false)
    expect(chromeRectsOverlap(composerKeyboard, nav)).toBe(false)
    expect(chromeRectsOverlap(orb, composerCollapsed)).toBe(false)
    expect(chromeRectsOverlap(orb, nav)).toBe(false)
  })
})

describe("workspace section CSS contract", () => {
  it("defines stacked chat/share headers, composer chrome, pairing constraints, and auxiliary rails", () => {
    const contract = workspaceSectionsCssContract(readGlobalsCss())
    expect(contract.hasChatHeader).toBe(true)
    expect(contract.chatHeaderStacksBelow360).toBe(true)
    expect(contract.hasComposerBar).toBe(true)
    expect(contract.composerBarAllowsShrink).toBe(true)
    expect(contract.composerKeepsOrbGutter).toBe(true)
    expect(contract.composerSitsOnNavPlusKeyboard).toBe(true)
    expect(contract.hasPairingCode).toBe(true)
    expect(contract.pairingCodeConstrained).toBe(true)
    expect(contract.hasPairingQr).toBe(true)
    expect(contract.pairingQrConstrained).toBe(true)
    expect(contract.hasMetricGrid).toBe(true)
    expect(contract.hasAuxToolbar).toBe(true)
    expect(contract.auxToolbarWraps).toBe(true)
    expect(contract.hasShareHeader).toBe(true)
    expect(contract.shareHeaderStacksBelow640).toBe(true)
    expect(contract.hasDurationRail).toBe(true)
    expect(contract.durationRailWraps).toBe(true)
    expect(contract.hasTimerClock).toBe(true)
  })
})

describe("workspace section source contract", () => {
  it("wires shared surfaces without nested scroll traps or shrunk targets", () => {
    const contract = workspaceSectionsSourceContract(sectionSources())
    expect(contract.chatsUsesChatHeader).toBe(true)
    expect(contract.chatsUsesEditorialCard).toBe(true)
    expect(contract.chatsDropsCardOnClick).toBe(true)
    expect(contract.chatsKeepsAccessibleActions).toBe(true)
    expect(contract.composerUsesComposerBar).toBe(true)
    expect(contract.composerDropsShrunkTargets).toBe(true)
    expect(contract.pairingUsesFormGrid).toBe(true)
    expect(contract.pairingUsesPairingCode).toBe(true)
    expect(contract.pairingUsesPairingQr).toBe(true)
    expect(contract.habitListUsesEditorialCard).toBe(true)
    expect(contract.habitListDropsShrunkTargets).toBe(true)
    expect(contract.habitModalUsesSharedFooter).toBe(true)
    expect(contract.habitModalUsesFormGrid).toBe(true)
    expect(contract.habitModalUsesSwitchRow).toBe(true)
    expect(contract.habitDashboardUsesSheetTabs).toBe(true)
    expect(contract.habitDashboardDropsNestedScrollTrap).toBe(true)
    expect(contract.habitDashboardDropsShrunkTargets).toBe(true)
    expect(contract.focusUsesEditorialCard).toBe(true)
    expect(contract.focusUsesDurationRail).toBe(true)
    expect(contract.focusDropsCardOnClick).toBe(true)
    expect(contract.goalUsesEditorialCard).toBe(true)
    expect(contract.goalUsesFormGrid).toBe(true)
    expect(contract.goalDropsShrunkTargets).toBe(true)
    expect(contract.timeUsesEditorialCard).toBe(true)
    expect(contract.timeUsesFormGrid).toBe(true)
    expect(contract.timeUsesTimerClock).toBe(true)
    expect(contract.analyticsUsesEditorialCard).toBe(true)
    expect(contract.analyticsUsesMetricGrid).toBe(true)
    expect(contract.clipboardUsesSharedFooter).toBe(true)
    expect(contract.sharedUsesShareHeader).toBe(true)
    expect(contract.sharedUsesEditorialCard).toBe(true)
  })

  it("preserves honest outbox, pairing, analytics, clipboard, and import copy", () => {
    const sources = sectionSources()
    const contract = honestCopyContract(sources)
    expect(contract.chatsStayLocal).toBe(true)
    expect(contract.pairingIsScaffold).toBe(true)
    expect(contract.pairingSimulationLabeled).toBe(true)
    expect(contract.pairingQrIsPlaceholder).toBe(true)
    expect(contract.analyticsAreHeuristics).toBe(true)
    expect(contract.habitConsistencyIsToday).toBe(true)
    expect(contract.sharedImportCopiesLocally).toBe(true)
    expect(contract.clipboardIsLocal).toBe(true)
    expect(contract.timeEntriesSurviveClose).toBe(true)
    expect(sources.chatsView).toContain("queueCopy")
    expect(sources.composer).toContain("queueCopy")
    expect(sources.composer).toContain("queueMessage")
    expect(sources.pairingSheet).toContain("completeSimulatedPairing")
    expect(sources.sharedPage).toContain("importSharedTasks")
  })
})

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { readGlobalsCss } from "./editorial-surface-contract"
import { NARROW_FORM_MAX_WIDTH } from "./sheet-layout"
import {
  COMPOSER_ORB_GUTTER_PX,
  PAIRING_QR_MAX_PX,
  applyComposerExpandedChange,
  applyComposerExpandedChangeLocksNotifyFirst,
  auxiliaryFooterOrientation,
  chatHeaderOrientation,
  chatRowAccessibleName,
  chromeRectsOverlap,
  composerBottomOffset,
  composerLeavesOrbGutter,
  composerNotifiesExpandedBeforeSetState,
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
    expect(contract.composerCollapsedKeepsOrbGutter).toBe(true)
    expect(contract.composerExpandedDropsOrbGutter).toBe(true)
    expect(contract.composerSitsOnNavPlusKeyboard).toBe(true)
    expect(contract.entityCopyParagraphsDoNotNowrap).toBe(true)
    expect(contract.entityTitleTruncates).toBe(true)
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
    expect(contract.chatsRowHasNoHeadingInButton).toBe(true)
    expect(contract.chatsPreviewUsesLineClamp).toBe(true)
    expect(contract.chatsTitleUsesEntityTitle).toBe(true)
    expect(contract.chatsThreadHasNoHeaderMessage).toBe(true)
    expect(contract.chatsEmptyHasNoMessageCta).toBe(true)
    expect(contract.chatsLoadingUsesSkeletons).toBe(true)
    expect(contract.chatsMountsApprovalCard).toBe(true)
    expect(contract.habitDescriptionWraps).toBe(true)
    expect(contract.composerNotifiesExpandedBeforeSetState).toBe(true)
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
    expect(composerNotifiesExpandedBeforeSetState(sources.composer)).toBe(true)
    expect(applyComposerExpandedChangeLocksNotifyFirst(readComponent("lib/ui/workspace-sections-layout.ts"))).toBe(
      true,
    )
    expect(sources.pairingSheet).toContain("completeSimulatedPairing")
    expect(sources.sharedPage).toContain("importSharedTasks")
  })
})

describe("chat row accessible name", () => {
  it("announces title, Demo, queued count, and honest preview without repeating the title", () => {
    expect(
      chatRowAccessibleName({
        title: "Hermes · local",
        source: "paired",
        queuedCount: 0,
        preview: "Start a conversation",
      }),
    ).toBe("Hermes · local. Start a conversation")
    expect(
      chatRowAccessibleName({
        title: "Hermes · local",
        source: "demo",
        queuedCount: 2,
        preview: "Queued note",
      }),
    ).toBe("Hermes · local, Demo, 2 queued. Queued note")
    expect(
      chatRowAccessibleName({
        title: "Hermes · local",
        source: "demo",
        statusWord: "not paired",
        queuedCount: 0,
        preview: "No messages yet",
      }),
    ).toBe("Hermes · local, Demo, not paired. No messages yet")
    expect(
      chatRowAccessibleName({
        title: "Same title",
        source: "paired",
        queuedCount: 0,
        preview: "Same title",
      }),
    ).toBe("Same title")
    expect(
      chatRowAccessibleName({
        title: "New chat",
        queuedCount: 0,
        preview: "   ",
      }),
    ).toBe("New chat")
  })
})

describe("composer expanded notify order", () => {
  it("notifies onExpandedChange before committing expanded state", () => {
    const order: string[] = []
    applyComposerExpandedChange(
      true,
      (next) => {
        order.push(`notify:${next}`)
      },
      (next) => {
        order.push(`set:${next}`)
      },
    )
    expect(order).toEqual(["notify:true", "set:true"])
  })

  it("rejects a same-tick useEffect notify and a setter that commits before notifying", () => {
    expect(
      composerNotifiesExpandedBeforeSetState(`
  const setExpandedAndNotify = (next: boolean) => {
    setExpanded(next)
    onExpandedChangeRef.current?.(next)
  }
`),
    ).toBe(false)
    expect(
      composerNotifiesExpandedBeforeSetState(`
  const setExpandedAndNotify = (next: boolean) => {
    setExpanded(next)
  }
  useEffect(() => { onExpandedChange?.(expanded) }, [expanded])
`),
    ).toBe(false)
  })
})

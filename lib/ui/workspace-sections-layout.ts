import { NARROW_FORM_MAX_WIDTH, sheetFooterOrientation } from "./sheet-layout"

export const CHAT_HEADER_STACK_MAX_WIDTH = NARROW_FORM_MAX_WIDTH
export const SHARE_HEADER_STACK_MAX_WIDTH = 640
export const COMPOSER_ORB_GUTTER_PX = 64
export const PAIRING_QR_MAX_PX = 220

export type StackOrRow = "stack" | "row"

export function chatHeaderOrientation(width: number): StackOrRow {
  return width < CHAT_HEADER_STACK_MAX_WIDTH ? "stack" : "row"
}

export function shareHeaderOrientation(width: number): StackOrRow {
  return width < SHARE_HEADER_STACK_MAX_WIDTH ? "stack" : "row"
}

export function auxiliaryFooterOrientation(width: number): StackOrRow {
  return sheetFooterOrientation(width)
}

export function composerBottomOffset(navPx: number, keyboardPx: number): number {
  return Math.max(0, navPx) + Math.max(0, keyboardPx)
}

export function chromeRectsOverlap(
  a: { top: number; bottom: number },
  b: { top: number; bottom: number },
): boolean {
  return a.top < b.bottom && b.top < a.bottom
}

export function composerLeavesOrbGutter(viewportWidth: number, composerRightInsetPx: number): boolean {
  return composerRightInsetPx >= COMPOSER_ORB_GUTTER_PX && composerRightInsetPx < viewportWidth
}

export interface ChatRowNameInput {
  title: string
  source?: "demo" | "paired"
  statusWord?: string
  queuedCount: number
  preview: string
}

export function chatRowAccessibleName(item: ChatRowNameInput): string {
  const parts = [item.title]
  switch (item.source) {
    case "demo":
      parts.push("Demo")
      break
    case "paired":
    case undefined:
      break
    default: {
      const _exhaustive: never = item.source
      return _exhaustive
    }
  }
  if (item.statusWord) {
    parts.push(item.statusWord)
  }
  if (item.queuedCount > 0) {
    parts.push(`${item.queuedCount} queued`)
  }
  const head = parts.join(", ")
  const preview = item.preview.trim()
  if (preview && preview !== item.title) {
    return `${head}. ${preview}`
  }
  return head
}

export function applyComposerExpandedChange(
  next: boolean,
  notify: (expanded: boolean) => void,
  commit: (expanded: boolean) => void,
): void {
  notify(next)
  commit(next)
}

export function composerNotifiesExpandedBeforeSetState(source: string): boolean {
  const setter = source.match(/const setExpandedAndNotify[\s\S]*?\n  \}/)
  if (!setter) {
    return false
  }
  const body = setter[0]
  if (!body.includes("applyComposerExpandedChange")) {
    return false
  }
  const notifyCall = body.indexOf("onExpandedChangeRef.current")
  const setCall = body.lastIndexOf("setExpanded")
  return (
    notifyCall >= 0 &&
    setCall >= 0 &&
    notifyCall < setCall &&
    !/useEffect\(\s*\(\)\s*=>\s*\{\s*onExpandedChange/.test(source)
  )
}

export function applyComposerExpandedChangeLocksNotifyFirst(source: string): boolean {
  const helper = source.match(/export function applyComposerExpandedChange[\s\S]*?\n\}/)
  if (!helper) {
    return false
  }
  const notifyIdx = helper[0].indexOf("notify(next)")
  const commitIdx = helper[0].indexOf("commit(next)")
  return notifyIdx >= 0 && commitIdx >= 0 && notifyIdx < commitIdx
}

export function chatsButtonContainsHeading(source: string): boolean {
  const buttons = source.match(/<button[\s\S]*?<\/button>/g) ?? []
  return buttons.some((block) => /<h[1-6][\s>]/.test(block))
}

export function habitDescriptionAllowsWrap(source: string): boolean {
  const match = source.match(/habit\.description[\s\S]{0,240}<p className="([^"]*)"/)
  if (!match) {
    return false
  }
  return !/(?:truncate|whitespace-nowrap|line-clamp)/.test(match[1])
}

function ruleBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  return match?.[1] ?? null
}

export interface WorkspaceSectionsCssContract {
  hasChatHeader: boolean
  chatHeaderStacksBelow360: boolean
  hasComposerBar: boolean
  composerBarAllowsShrink: boolean
  composerCollapsedKeepsOrbGutter: boolean
  composerExpandedDropsOrbGutter: boolean
  composerSitsOnNavPlusKeyboard: boolean
  entityCopyParagraphsDoNotNowrap: boolean
  entityTitleTruncates: boolean
  hasPairingCode: boolean
  pairingCodeConstrained: boolean
  hasPairingQr: boolean
  pairingQrConstrained: boolean
  hasMetricGrid: boolean
  hasAuxToolbar: boolean
  auxToolbarWraps: boolean
  hasShareHeader: boolean
  shareHeaderStacksBelow640: boolean
  hasDurationRail: boolean
  durationRailWraps: boolean
  hasTimerClock: boolean
}

export function workspaceSectionsCssContract(css: string): WorkspaceSectionsCssContract {
  const chatHeader = ruleBlock(css, ".mk-chat-header")
  const chatHeaderStack = css.match(
    /@media\s*\(\s*max-width:\s*359px\s*\)\s*\{\s*\.mk-chat-header\s*\{([^}]*)\}/,
  )
  const composerBar = ruleBlock(css, ".mk-composer-bar")
  const composerCollapsed = ruleBlock(css, ".mk-composer-collapsed")
  const composerExpanded = ruleBlock(css, ".mk-composer-expanded")
  const composer = ruleBlock(css, ".mk-composer")
  const entityCopyParagraph = ruleBlock(css, ".mk-entity-copy p")
  const entityTitle = ruleBlock(css, ".mk-entity-title")
  const pairingCode = ruleBlock(css, ".mk-pairing-code")
  const pairingQr = ruleBlock(css, ".mk-pairing-qr")
  const metricGrid = ruleBlock(css, ".mk-metric-grid")
  const auxToolbar = ruleBlock(css, ".mk-aux-toolbar")
  const shareHeader = ruleBlock(css, ".mk-share-header")
  const shareHeaderStack = css.match(
    /@media\s*\(\s*max-width:\s*639px\s*\)\s*\{[\s\S]*?\.mk-share-header\s*\{([^}]*)\}/,
  )
  const durationRail = ruleBlock(css, ".mk-duration-rail")
  const timerClock = ruleBlock(css, ".mk-timer-clock")

  return {
    hasChatHeader: Boolean(chatHeader),
    chatHeaderStacksBelow360: Boolean(chatHeaderStack?.[1] && /flex-direction:\s*column/.test(chatHeaderStack[1])),
    hasComposerBar: Boolean(composerBar),
    composerBarAllowsShrink: Boolean(composerBar && /min-width:\s*0/.test(composerBar)),
    composerCollapsedKeepsOrbGutter: Boolean(composerCollapsed && /right:\s*5rem/.test(composerCollapsed)),
    composerExpandedDropsOrbGutter: Boolean(
      composerExpanded &&
        !/right:\s*4rem/.test(composerExpanded) &&
        !/right:\s*5rem/.test(composerExpanded) &&
        /right:\s*0\.5rem/.test(composerExpanded),
    ),
    composerSitsOnNavPlusKeyboard: Boolean(
      composer && /var\(--mk-bottom-nav\)/.test(composer) && /var\(--mk-keyboard/.test(composer),
    ),
    entityCopyParagraphsDoNotNowrap: !entityCopyParagraph || !/white-space:\s*nowrap/.test(entityCopyParagraph),
    entityTitleTruncates: Boolean(
      entityTitle &&
        /overflow:\s*hidden/.test(entityTitle) &&
        /text-overflow:\s*ellipsis/.test(entityTitle) &&
        /white-space:\s*nowrap/.test(entityTitle),
    ),
    hasPairingCode: Boolean(pairingCode),
    pairingCodeConstrained: Boolean(
      pairingCode && /overflow-wrap:\s*anywhere/.test(pairingCode) && /max-width:\s*100%/.test(pairingCode),
    ),
    hasPairingQr: Boolean(pairingQr),
    pairingQrConstrained: Boolean(
      pairingQr && /max-width:\s*100%/.test(pairingQr) && /overflow:\s*hidden/.test(pairingQr),
    ),
    hasMetricGrid: Boolean(metricGrid),
    hasAuxToolbar: Boolean(auxToolbar),
    auxToolbarWraps: Boolean(auxToolbar && /flex-wrap:\s*wrap/.test(auxToolbar)),
    hasShareHeader: Boolean(shareHeader),
    shareHeaderStacksBelow640: Boolean(
      shareHeaderStack?.[1] && /flex-direction:\s*column/.test(shareHeaderStack[1]),
    ),
    hasDurationRail: Boolean(durationRail),
    durationRailWraps: Boolean(durationRail && /flex-wrap:\s*wrap/.test(durationRail)),
    hasTimerClock: Boolean(timerClock && /clamp\(/.test(timerClock)),
  }
}

export interface WorkspaceSectionsSourceContract {
  chatsUsesChatHeader: boolean
  chatsUsesEditorialCard: boolean
  chatsDropsCardOnClick: boolean
  chatsKeepsAccessibleActions: boolean
  chatsRowHasNoHeadingInButton: boolean
  chatsPreviewUsesLineClamp: boolean
  chatsTitleUsesEntityTitle: boolean
  chatsThreadHasNoHeaderMessage: boolean
  chatsEmptyHasNoMessageCta: boolean
  chatsLoadingUsesSkeletons: boolean
  chatsMountsApprovalCard: boolean
  habitDescriptionWraps: boolean
  composerNotifiesExpandedBeforeSetState: boolean
  composerUsesComposerBar: boolean
  composerDropsShrunkTargets: boolean
  pairingUsesFormGrid: boolean
  pairingUsesPairingCode: boolean
  pairingUsesPairingQr: boolean
  habitListUsesEditorialCard: boolean
  habitListDropsShrunkTargets: boolean
  habitModalUsesSharedFooter: boolean
  habitModalUsesFormGrid: boolean
  habitModalUsesSwitchRow: boolean
  habitDashboardUsesSheetTabs: boolean
  habitDashboardDropsNestedScrollTrap: boolean
  habitDashboardDropsShrunkTargets: boolean
  focusUsesEditorialCard: boolean
  focusUsesDurationRail: boolean
  focusDropsCardOnClick: boolean
  goalUsesEditorialCard: boolean
  goalUsesFormGrid: boolean
  goalDropsShrunkTargets: boolean
  timeUsesEditorialCard: boolean
  timeUsesFormGrid: boolean
  timeUsesTimerClock: boolean
  analyticsUsesEditorialCard: boolean
  analyticsUsesMetricGrid: boolean
  clipboardUsesSharedFooter: boolean
  sharedUsesShareHeader: boolean
  sharedUsesEditorialCard: boolean
}

export function workspaceSectionsSourceContract(sources: {
  chatsView: string
  composer: string
  pairingSheet: string
  habitList: string
  habitModal: string
  habitDashboard: string
  focusModal: string
  goalManager: string
  timeTracker: string
  analyticsDashboard: string
  clipboardMonitor: string
  sharedPage: string
}): WorkspaceSectionsSourceContract {
  return {
    chatsUsesChatHeader: sources.chatsView.includes("mk-chat-header"),
    chatsUsesEditorialCard: sources.chatsView.includes("mk-editorial-card"),
    chatsDropsCardOnClick: !/Card[^>]*onClick/.test(sources.chatsView) && !/cursor-pointer[^>]*onClick/.test(sources.chatsView),
    chatsKeepsAccessibleActions:
      sources.chatsView.includes('aria-label="Machines"') &&
      sources.chatsView.includes('aria-label="New chat"') &&
      sources.chatsView.includes('aria-label="Back to chats"') &&
      /aria-label=\{chatRowAccessibleName\(/.test(sources.chatsView),
    chatsRowHasNoHeadingInButton: !chatsButtonContainsHeading(sources.chatsView),
    chatsPreviewUsesLineClamp: sources.chatsView.includes("line-clamp-2"),
    chatsTitleUsesEntityTitle: sources.chatsView.includes("mk-entity-title"),
    chatsThreadHasNoHeaderMessage:
      !sources.chatsView.includes("Message</Button>") && !sources.chatsView.includes(">Message<"),
    chatsEmptyHasNoMessageCta:
      !sources.chatsView.includes('actionLabel="Message"') && !sources.chatsView.includes("onAction={onCompose}"),
    chatsLoadingUsesSkeletons: sources.chatsView.includes("mk-chat-skeleton"),
    chatsMountsApprovalCard: sources.chatsView.includes("ApprovalCard"),
    habitDescriptionWraps: habitDescriptionAllowsWrap(sources.habitDashboard),
    composerNotifiesExpandedBeforeSetState: composerNotifiesExpandedBeforeSetState(sources.composer),
    composerUsesComposerBar: sources.composer.includes("mk-composer-bar"),
    composerDropsShrunkTargets: !sources.composer.includes("h-9 w-9"),
    pairingUsesFormGrid: sources.pairingSheet.includes("mk-form-grid"),
    pairingUsesPairingCode: sources.pairingSheet.includes("mk-pairing-code"),
    pairingUsesPairingQr: sources.pairingSheet.includes("mk-pairing-qr"),
    habitListUsesEditorialCard: sources.habitList.includes("mk-editorial-card"),
    habitListDropsShrunkTargets: !sources.habitList.includes("h-8 w-8") && !sources.habitList.includes("h-6 w-6"),
    habitModalUsesSharedFooter: sources.habitModal.includes("mk-sheet-footer-actions"),
    habitModalUsesFormGrid: sources.habitModal.includes("mk-form-grid"),
    habitModalUsesSwitchRow: sources.habitModal.includes("mk-switch-row"),
    habitDashboardUsesSheetTabs: sources.habitDashboard.includes("mk-sheet-tabs"),
    habitDashboardDropsNestedScrollTrap:
      !sources.habitDashboard.includes("max-h-96") && !sources.habitDashboard.includes("overflow-y-auto"),
    habitDashboardDropsShrunkTargets:
      !sources.habitDashboard.includes("h-6 w-6") && !sources.habitDashboard.includes("h-8 w-8"),
    focusUsesEditorialCard: sources.focusModal.includes("mk-editorial-card"),
    focusUsesDurationRail: sources.focusModal.includes("mk-duration-rail"),
    focusDropsCardOnClick:
      !/<Card[\s\S]{0,120}onClick/.test(sources.focusModal) && !/cursor-pointer/.test(sources.focusModal),
    goalUsesEditorialCard: sources.goalManager.includes("mk-editorial-card"),
    goalUsesFormGrid: sources.goalManager.includes("mk-form-grid"),
    goalDropsShrunkTargets: !sources.goalManager.includes("h-6 w-6") && !sources.goalManager.includes("h-8 w-8"),
    timeUsesEditorialCard: sources.timeTracker.includes("mk-editorial-card"),
    timeUsesFormGrid: sources.timeTracker.includes("mk-form-grid"),
    timeUsesTimerClock: sources.timeTracker.includes("mk-timer-clock"),
    analyticsUsesEditorialCard: sources.analyticsDashboard.includes("mk-editorial-card"),
    analyticsUsesMetricGrid: sources.analyticsDashboard.includes("mk-metric-grid"),
    clipboardUsesSharedFooter: sources.clipboardMonitor.includes("mk-sheet-footer-actions"),
    sharedUsesShareHeader: sources.sharedPage.includes("mk-share-header"),
    sharedUsesEditorialCard: sources.sharedPage.includes("mk-editorial-card"),
  }
}

export interface HonestCopyContract {
  chatsStayLocal: boolean
  pairingIsScaffold: boolean
  pairingSimulationLabeled: boolean
  pairingQrIsPlaceholder: boolean
  analyticsAreHeuristics: boolean
  habitConsistencyIsToday: boolean
  sharedImportCopiesLocally: boolean
  clipboardIsLocal: boolean
  timeEntriesSurviveClose: boolean
}

export function honestCopyContract(sources: {
  chatsView: string
  pairingSheet: string
  analyticsDashboard: string
  sharedPage: string
  clipboardMonitor: string
  timeTracker: string
}): HonestCopyContract {
  return {
    chatsStayLocal: sources.chatsView.includes("Messages stay on this device until you pair a Hermes machine."),
    pairingIsScaffold: sources.pairingSheet.includes("This phone waits for a Hermes helper"),
    pairingSimulationLabeled:
      sources.pairingSheet.includes("Simulate pairing (dev)") &&
      sources.pairingSheet.includes("paired (simulation)"),
    pairingQrIsPlaceholder: sources.pairingSheet.includes("QR placeholder"),
    analyticsAreHeuristics: sources.analyticsDashboard.includes(
      "Recommendations are heuristics, not a model.",
    ),
    habitConsistencyIsToday: sources.analyticsDashboard.includes("Habit consistency is today only."),
    sharedImportCopiesLocally: sources.sharedPage.includes("Importing copies them onto this device."),
    clipboardIsLocal: sources.clipboardMonitor.includes("Offered from clipboard text on this device."),
    timeEntriesSurviveClose: sources.timeTracker.includes("will survive closing this panel"),
  }
}

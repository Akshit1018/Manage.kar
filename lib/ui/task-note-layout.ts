import { NARROW_FORM_MAX_WIDTH, sheetFooterOrientation } from "./sheet-layout"

export const TASK_BOARD_GRID_MIN_WIDTH = 1024
export const FILTER_WRAP_MIN_WIDTH = 640
export const BOARD_COLUMN_FRACTION = 0.82

export type TaskBoardLayout = "snap-columns" | "grid"
export type FilterRailLayout = "scroll" | "wrap"

export function taskBoardLayout(width: number): TaskBoardLayout {
  return width < TASK_BOARD_GRID_MIN_WIDTH ? "snap-columns" : "grid"
}

export function filterRailLayout(width: number): FilterRailLayout {
  return width < FILTER_WRAP_MIN_WIDTH ? "scroll" : "wrap"
}

export function boardColumnWidth(viewportWidth: number): { column: number; peek: number } {
  if (taskBoardLayout(viewportWidth) === "grid") {
    return { column: viewportWidth / 3, peek: 0 }
  }
  const column = Math.round(viewportWidth * BOARD_COLUMN_FRACTION)
  return { column, peek: viewportWidth - column }
}

export function voiceActionsOrientation(width: number): "stack" | "row" {
  return sheetFooterOrientation(width)
}

export function modalFooterOrientation(width: number): "stack" | "row" {
  return sheetFooterOrientation(width)
}

export function stacksBelowNarrowForm(width: number): boolean {
  return width < NARROW_FORM_MAX_WIDTH
}

export interface TaskNoteCssContract {
  hasFilterRail: boolean
  filterRailScrolls: boolean
  hasBoardSnap: boolean
  boardSnapMandatory: boolean
  boardColumnPeeks: boolean
  boardBecomesGridAtLg: boolean
  hasMetaTruncate: boolean
  voiceActionsStackBelow360: boolean
  voiceSafeArea: boolean
  chipActionTouchFloor: boolean
}

function ruleBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  return match?.[1] ?? null
}

export function taskNoteCssContract(css: string): TaskNoteCssContract {
  const filterRail = ruleBlock(css, ".mk-filter-rail")
  const boardSnap = ruleBlock(css, ".mk-board-snap")
  const boardColumn = ruleBlock(css, ".mk-board-column")
  const metaRow = ruleBlock(css, ".mk-meta-row")
  const chipAction = ruleBlock(css, ".mk-chip-action")
  const voiceActions = ruleBlock(css, ".mk-voice-actions")
  const voiceStack = css.match(
    /@media\s*\(\s*max-width:\s*359px\s*\)\s*\{[\s\S]*?\.mk-voice-action-row\s*\{([^}]*)\}/,
  )

  return {
    hasFilterRail: Boolean(filterRail),
    filterRailScrolls: Boolean(
      filterRail && /overflow-x:\s*auto/.test(filterRail) && /flex-wrap:\s*nowrap/.test(filterRail),
    ),
    hasBoardSnap: Boolean(boardSnap),
    boardSnapMandatory: Boolean(boardSnap && /scroll-snap-type:\s*x\s+mandatory/.test(boardSnap)),
    boardColumnPeeks: Boolean(
      boardColumn &&
        /scroll-snap-align:\s*start/.test(boardColumn) &&
        /flex:\s*0\s+0\s+82%/.test(boardColumn),
    ),
    boardBecomesGridAtLg:
      /@media\s*\(\s*min-width:\s*1024px\s*\)\s*\{[\s\S]*?\.mk-board-snap\s*\{[^}]*display:\s*grid/.test(css),
    hasMetaTruncate: Boolean(metaRow && /min-width:\s*0/.test(metaRow)),
    voiceActionsStackBelow360: Boolean(voiceStack?.[1] && /flex-direction:\s*column/.test(voiceStack[1])),
    voiceSafeArea: Boolean(voiceActions && /safe-area-inset-bottom/.test(voiceActions)),
    chipActionTouchFloor: Boolean(
      chipAction && /min-height:\s*44px/.test(chipAction) && /min-width:\s*44px/.test(chipAction),
    ),
  }
}

export interface TaskNoteSourceContract {
  taskListUsesFilterRail: boolean
  taskListUsesSnapBoard: boolean
  taskListUsesEditorialCard: boolean
  taskListDropsStackedGrid: boolean
  todayUsesSectionTitle: boolean
  todayDropsShrunkTargets: boolean
  followUpUsesSectionTitle: boolean
  followUpDropsShrunkTargets: boolean
  noteListUsesFilterRail: boolean
  noteListUsesEditorialCard: boolean
  noteListDropsShrunkTargets: boolean
  taskModalUsesSharedFooter: boolean
  taskModalUsesFormGrid: boolean
  noteModalUsesSharedFooter: boolean
  labelPickerUsesChipActions: boolean
  labelChipsUseRail: boolean
  voiceUsesActionRow: boolean
}

export function taskNoteSourceContract(sources: {
  taskList: string
  todaySection: string
  followUpSection: string
  noteList: string
  taskModal: string
  noteModal: string
  labelPicker: string
  labelChips: string
  voiceRecorder: string
}): TaskNoteSourceContract {
  return {
    taskListUsesFilterRail: sources.taskList.includes("mk-filter-rail"),
    taskListUsesSnapBoard:
      sources.taskList.includes("mk-board-snap") && sources.taskList.includes("mk-board-column"),
    taskListUsesEditorialCard: sources.taskList.includes("mk-editorial-card"),
    taskListDropsStackedGrid: !sources.taskList.includes("lg:grid-cols-3"),
    todayUsesSectionTitle: sources.todaySection.includes("mk-section-title"),
    todayDropsShrunkTargets: !sources.todaySection.includes("h-8 w-8"),
    followUpUsesSectionTitle: sources.followUpSection.includes("mk-section-title"),
    followUpDropsShrunkTargets: !sources.followUpSection.includes("h-8 w-8"),
    noteListUsesFilterRail: sources.noteList.includes("mk-filter-rail"),
    noteListUsesEditorialCard: sources.noteList.includes("mk-editorial-card"),
    noteListDropsShrunkTargets: !sources.noteList.includes("h-8 w-8"),
    taskModalUsesSharedFooter: sources.taskModal.includes("mk-sheet-footer-actions"),
    taskModalUsesFormGrid: sources.taskModal.includes("mk-form-grid"),
    noteModalUsesSharedFooter: sources.noteModal.includes("mk-sheet-footer-actions"),
    labelPickerUsesChipActions: sources.labelPicker.includes("mk-chip-action"),
    labelChipsUseRail: sources.labelChips.includes("mk-label-chips"),
    voiceUsesActionRow: sources.voiceRecorder.includes("mk-voice-action-row"),
  }
}

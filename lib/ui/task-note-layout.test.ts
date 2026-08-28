import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { readGlobalsCss } from "./editorial-surface-contract"
import { NARROW_FORM_MAX_WIDTH } from "./sheet-layout"
import {
  boardColumnWidth,
  filterRailLayout,
  modalFooterOrientation,
  stacksBelowNarrowForm,
  taskBoardLayout,
  taskNoteCssContract,
  taskNoteSourceContract,
  voiceActionsOrientation,
} from "./task-note-layout"

function readComponent(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("task and note layout decisions", () => {
  it("uses horizontal snap columns below the desktop grid, with a peek of the next column at 320", () => {
    expect(taskBoardLayout(320)).toBe("snap-columns")
    expect(taskBoardLayout(390)).toBe("snap-columns")
    expect(taskBoardLayout(768)).toBe("snap-columns")
    expect(taskBoardLayout(1024)).toBe("grid")

    const narrow = boardColumnWidth(320)
    expect(narrow.column).toBe(262)
    expect(narrow.peek).toBe(58)
    expect(narrow.peek).toBeGreaterThan(32)
    expect(narrow.column + narrow.peek).toBe(320)
  })

  it("scrolls filters on phone widths and wraps from tablet up", () => {
    expect(filterRailLayout(320)).toBe("scroll")
    expect(filterRailLayout(390)).toBe("scroll")
    expect(filterRailLayout(639)).toBe("scroll")
    expect(filterRailLayout(640)).toBe("wrap")
  })

  it("stacks modal footers and voice actions below 360", () => {
    expect(NARROW_FORM_MAX_WIDTH).toBe(360)
    expect(stacksBelowNarrowForm(320)).toBe(true)
    expect(stacksBelowNarrowForm(359)).toBe(true)
    expect(stacksBelowNarrowForm(360)).toBe(false)
    expect(modalFooterOrientation(320)).toBe("stack")
    expect(modalFooterOrientation(360)).toBe("row")
    expect(voiceActionsOrientation(320)).toBe("stack")
    expect(voiceActionsOrientation(360)).toBe("row")
  })
})

describe("task and note CSS contract", () => {
  it("defines a scrolling filter rail, snap board, truncated metadata, 44px chip actions, and stacked voice controls", () => {
    const contract = taskNoteCssContract(readGlobalsCss())
    expect(contract.hasFilterRail).toBe(true)
    expect(contract.filterRailScrolls).toBe(true)
    expect(contract.hasBoardSnap).toBe(true)
    expect(contract.boardSnapMandatory).toBe(true)
    expect(contract.boardColumnPeeks).toBe(true)
    expect(contract.boardBecomesGridAtLg).toBe(true)
    expect(contract.hasMetaTruncate).toBe(true)
    expect(contract.voiceActionsStackBelow360).toBe(true)
    expect(contract.voiceSafeArea).toBe(true)
    expect(contract.chipActionTouchFloor).toBe(true)
  })
})

describe("task and note source contract", () => {
  it("wires editorial surfaces and shared rails without changing the listed files' control flow", () => {
    const contract = taskNoteSourceContract({
      taskList: readComponent("components/workspace/task-list.tsx"),
      todaySection: readComponent("components/workspace/today-section.tsx"),
      followUpSection: readComponent("components/workspace/follow-up-section.tsx"),
      noteList: readComponent("components/workspace/note-list.tsx"),
      taskModal: readComponent("components/task-modal.tsx"),
      noteModal: readComponent("components/note-modal.tsx"),
      labelPicker: readComponent("components/label-picker.tsx"),
      labelChips: readComponent("components/label-chips.tsx"),
      voiceRecorder: readComponent("components/voice-recorder.tsx"),
    })

    expect(contract.taskListUsesFilterRail).toBe(true)
    expect(contract.taskListUsesSnapBoard).toBe(true)
    expect(contract.taskListUsesEditorialCard).toBe(true)
    expect(contract.taskListDropsStackedGrid).toBe(true)
    expect(contract.todayUsesSectionTitle).toBe(true)
    expect(contract.todayDropsShrunkTargets).toBe(true)
    expect(contract.followUpUsesSectionTitle).toBe(true)
    expect(contract.followUpDropsShrunkTargets).toBe(true)
    expect(contract.noteListUsesFilterRail).toBe(true)
    expect(contract.noteListUsesEditorialCard).toBe(true)
    expect(contract.noteListDropsShrunkTargets).toBe(true)
    expect(contract.taskModalUsesSharedFooter).toBe(true)
    expect(contract.taskModalUsesFormGrid).toBe(true)
    expect(contract.noteModalUsesSharedFooter).toBe(true)
    expect(contract.labelPickerUsesChipActions).toBe(true)
    expect(contract.labelChipsUseRail).toBe(true)
    expect(contract.voiceUsesActionRow).toBe(true)
  })
})

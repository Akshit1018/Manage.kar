import { describe, expect, it } from "vitest"
import { insertAtToken, matchesLabelSearch, parseAtQuery, suggestLabels } from "./query"
import type { WorkspaceLabel } from "@/lib/domain/types"

const labels: WorkspaceLabel[] = [
  { id: 1, name: "home", kind: "place" },
  { id: 2, name: "office", kind: "place" },
  { id: 3, name: "kitchen", kind: "tag" },
  { id: 4, name: "akshit", kind: "person" },
]

describe("parseAtQuery", () => {
  it("returns the token after the last @ before the cursor", () => {
    expect(parseAtQuery("Meet @ho", 8)).toEqual({ start: 5, query: "ho" })
  })

  it("returns null when @ is closed by a space", () => {
    expect(parseAtQuery("Meet @home later", 16)).toBeNull()
  })
})

describe("insertAtToken", () => {
  it("replaces the open @ token with the chosen name", () => {
    expect(insertAtToken("Meet @ho", 8, "home")).toEqual({ text: "Meet @home ", cursor: 11 })
  })
})

describe("suggestLabels", () => {
  it("filters by name prefix", () => {
    expect(suggestLabels(labels, "ho").map((label) => label.name)).toEqual(["home"])
  })

  it("returns every label for an empty query", () => {
    expect(suggestLabels(labels, "").map((label) => label.name)).toEqual(["home", "office", "kitchen", "akshit"])
  })
})

describe("matchesLabelSearch", () => {
  it("matches @office or office against attached labels", () => {
    expect(matchesLabelSearch("@office", labels, [2])).toBe(true)
    expect(matchesLabelSearch("office", labels, [2])).toBe(true)
    expect(matchesLabelSearch("kitchen", labels, [2])).toBe(false)
  })
})

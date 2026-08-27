import { describe, expect, it } from "vitest"
import {
  attachUnknownTokensAsTags,
  ensureSeededPlaces,
  migrateLegacyMentions,
  normalizeLabelName,
  parseAtTokens,
  upsertLabel,
} from "./book"

function allocator(start = 1) {
  let next = start
  return () => next++
}

describe("normalizeLabelName", () => {
  it("strips @, trims, and lowercases", () => {
    expect(normalizeLabelName(" @Home ")).toBe("home")
  })

  it("turns spaces into hyphens", () => {
    expect(normalizeLabelName("Client X")).toBe("client-x")
  })

  it("returns empty for only @ or whitespace", () => {
    expect(normalizeLabelName("@")).toBe("")
    expect(normalizeLabelName("   ")).toBe("")
  })
})

describe("ensureSeededPlaces", () => {
  it("adds home, office, errand, and phone as places", () => {
    const allocate = allocator()
    const labels = ensureSeededPlaces([], allocate)

    expect(labels.map((label) => `${label.kind}:${label.name}`)).toEqual([
      "place:home",
      "place:office",
      "place:errand",
      "place:phone",
    ])
  })

  it("does not duplicate a place that already exists", () => {
    const allocate = allocator(10)
    const labels = ensureSeededPlaces([{ id: 3, name: "home", kind: "place" }], allocate)

    expect(labels.filter((label) => label.name === "home")).toHaveLength(1)
    expect(labels).toHaveLength(4)
  })
})

describe("upsertLabel", () => {
  it("creates a new label with the requested kind", () => {
    const allocate = allocator()
    const result = upsertLabel([], "kitchen", "tag", allocate)

    expect(result.label).toEqual({ id: 1, name: "kitchen", kind: "tag" })
    expect(result.labels).toEqual([result.label])
  })

  it("returns the existing label and keeps its kind", () => {
    const allocate = allocator(2)
    const existing = { id: 1, name: "home", kind: "place" as const }
    const result = upsertLabel([existing], "@HOME", "person", allocate)

    expect(result.label).toEqual(existing)
    expect(result.labels).toEqual([existing])
  })
})

describe("migrateLegacyMentions", () => {
  it("turns mentions and assignedTo into person labels on the task", () => {
    const allocate = allocator()
    const result = migrateLegacyMentions(
      [],
      [
        {
          mentions: ["john"],
          assignedTo: ["sarah"],
          labelIds: [],
        },
      ],
      allocate,
    )

    expect(result.labels.map((label) => `${label.kind}:${label.name}`)).toEqual(["person:john", "person:sarah"])
    expect(result.labelIdsByIndex[0]?.sort()).toEqual([1, 2])
  })

  it("does not invent people when those fields are empty", () => {
    const result = migrateLegacyMentions([], [{ mentions: [], assignedTo: [] }], allocator())
    expect(result.labels).toEqual([])
    expect(result.labelIdsByIndex[0]).toEqual([])
  })
})

describe("parseAtTokens", () => {
  it("collects @words from a string", () => {
    expect(parseAtTokens("Buy milk @home and ping @Sarah")).toEqual(["home", "sarah"])
  })
})

describe("attachUnknownTokensAsTags", () => {
  it("creates missing @tokens as tags and returns their ids", () => {
    const allocate = allocator(5)
    const places = ensureSeededPlaces([], allocator())
    const result = attachUnknownTokensAsTags(places, ["home", "kitchen"], allocator(5))

    expect(result.ids).toContain(places.find((label) => label.name === "home")?.id)
    expect(result.labels.some((label) => label.name === "kitchen" && label.kind === "tag")).toBe(true)
  })
})

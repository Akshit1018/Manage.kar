import { describe, expect, it } from "vitest"
import {
  assertQaDatabaseUrl,
  assertReadOnlySql,
  databaseUserFromUrl,
  isOwnerDatabaseUrl,
  isQaDatabaseUrl,
  isReadOnlySql,
} from "./readonly-guard"

describe("QA read-only guard", () => {
  it("accepts only the qa_agent role and refuses the owner URL", () => {
    const owner = "postgresql://managekar:managekar@127.0.0.1:5432/managekar"
    const qa = "postgresql://qa_agent:secret@127.0.0.1:5432/managekar"
    expect(databaseUserFromUrl(owner)).toBe("managekar")
    expect(isOwnerDatabaseUrl(owner)).toBe(true)
    expect(isQaDatabaseUrl(owner)).toBe(false)
    expect(isQaDatabaseUrl(qa)).toBe(true)
    expect(() => assertQaDatabaseUrl(owner)).toThrow(/refused owner database URL/)
    expect(assertQaDatabaseUrl(qa)).toBe(qa)
  })

  it("allows SELECT and refuses DELETE/INSERT/UPDATE", () => {
    expect(isReadOnlySql("SELECT id, title FROM \"Task\" WHERE title LIKE 'qa-%'")).toBe(true)
    expect(isReadOnlySql("-- comment\nEXPLAIN SELECT 1")).toBe(true)
    expect(isReadOnlySql("DELETE FROM \"Task\"")).toBe(false)
    expect(isReadOnlySql("SELECT 1; DELETE FROM \"Task\"")).toBe(false)
    expect(() => assertReadOnlySql("INSERT INTO \"Task\" (title) VALUES ('x')")).toThrow(/refused mutating SQL/)
  })
})

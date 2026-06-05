import { describe, it, expect } from "bun:test"
import { checkRangerWrite } from "./ranger-md-only"

describe("checkRangerWrite", () => {
  describe("allows non-ranger agents", () => {
    it("allows bard to write .ts files", () => {
      const result = checkRangerWrite("bard", "write", "/proj/src/foo.ts")
      expect(result.allowed).toBe(true)
    })

    it("allows fighter to edit source code", () => {
      const result = checkRangerWrite("fighter", "edit", "/proj/src/bar.ts")
      expect(result.allowed).toBe(true)
    })
  })

  describe("allows non-write tools for ranger", () => {
    it("allows ranger to read any file", () => {
      const result = checkRangerWrite("ranger", "read", "/proj/src/foo.ts")
      expect(result.allowed).toBe(true)
    })

    it("allows ranger to use grep", () => {
      const result = checkRangerWrite("ranger", "grep", "/proj/src/")
      expect(result.allowed).toBe(true)
    })
  })

  describe("allows ranger to write .md in .guild/", () => {
    it("allows writing plan files", () => {
      const result = checkRangerWrite("ranger", "write", "/proj/.guild/plans/my-plan.md")
      expect(result.allowed).toBe(true)
    })

    it("allows editing plan files", () => {
      const result = checkRangerWrite("ranger", "edit", "/proj/.guild/plans/feature.md")
      expect(result.allowed).toBe(true)
    })

    it("allows writing draft files", () => {
      const result = checkRangerWrite("ranger", "write", "/proj/.guild/drafts/notes.md")
      expect(result.allowed).toBe(true)
    })
  })

  describe("blocks ranger from writing code files", () => {
    it("blocks .ts files in src/", () => {
      const result = checkRangerWrite("ranger", "write", "/proj/src/foo.ts")
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("only write to .guild/ directory")
    })

    it("blocks .js files anywhere", () => {
      const result = checkRangerWrite("ranger", "edit", "/proj/index.js")
      expect(result.allowed).toBe(false)
    })
  })

  describe("blocks ranger from writing non-.md in .guild/", () => {
    it("blocks .ts files inside .guild/", () => {
      const result = checkRangerWrite("ranger", "write", "/proj/.guild/plans/foo.ts")
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("only write .md files")
    })

    it("blocks .json files inside .guild/", () => {
      const result = checkRangerWrite("ranger", "write", "/proj/.guild/state.json")
      expect(result.allowed).toBe(false)
    })
  })

  describe("handles Windows paths", () => {
    it("allows .md in .guild with backslashes", () => {
      const result = checkRangerWrite("ranger", "write", "C:\\proj\\.guild\\plans\\plan.md")
      expect(result.allowed).toBe(true)
    })

    it("blocks .ts with backslashes", () => {
      const result = checkRangerWrite("ranger", "write", "C:\\proj\\src\\foo.ts")
      expect(result.allowed).toBe(false)
    })
  })
})

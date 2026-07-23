import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createArchivePlanTool } from "./archive-plan"
import { PLANS_DIR } from "../features/work-state/constants"

let testDir: string

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), "guild-archive-plan-test-"))
})

afterEach(() => {
	try {
		rmSync(testDir, { recursive: true, force: true })
	} catch {
		// ignore cleanup errors
	}
})

function createPlanDir(slug: string): string {
	const dir = join(testDir, PLANS_DIR, slug)
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, "spec.md"), "# Plan", "utf-8")
	return dir
}

describe("createArchivePlanTool", () => {
	it("archives a slug directory into archive/<slug>", async () => {
		createPlanDir("scope-x")
		const sourceDir = join(testDir, PLANS_DIR, "scope-x")
		const archiveDest = join(testDir, PLANS_DIR, "archive", "scope-x")

		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "scope-x" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(true)
		expect(parsed.warnings).toEqual([])
		expect(existsSync(sourceDir)).toBe(false)
		expect(existsSync(archiveDest)).toBe(true)
	})

	it("returns ok:false with warning when slug directory is missing", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "nonexistent" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings.length).toBeGreaterThan(0)
		expect(parsed.warnings[0]).toContain("not found")
	})

	it("rejects slug containing /", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "foo/bar" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings[0]).toContain("Invalid slug")
	})

	it("rejects slug containing ..", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: ".." })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings[0]).toContain("Invalid slug")
	})

	it("rejects slug with uppercase characters", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "ScopeX" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings[0]).toContain("Invalid slug")
	})

	it("rejects slug with spaces", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "scope x" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings[0]).toContain("Invalid slug")
	})

	it("rejects slug with special chars", async () => {
		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "scope@x" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(false)
		expect(parsed.warnings[0]).toContain("Invalid slug")
	})

	it("accepts valid kebab-case slugs", async () => {
		createPlanDir("my-plan-v2")
		const sourceDir = join(testDir, PLANS_DIR, "my-plan-v2")
		const archiveDest = join(testDir, PLANS_DIR, "archive", "my-plan-v2")

		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "my-plan-v2" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(true)
		expect(existsSync(sourceDir)).toBe(false)
		expect(existsSync(archiveDest)).toBe(true)
	})

	it("creates archive directory if it does not exist", async () => {
		createPlanDir("scope-y")
		const archiveDir = join(testDir, PLANS_DIR, "archive")

		expect(existsSync(archiveDir)).toBe(false)

		const tool = createArchivePlanTool({ directory: testDir })
		const result = await tool.execute({ slug: "scope-y" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(true)
		expect(existsSync(archiveDir)).toBe(true)
		expect(existsSync(join(archiveDir, "scope-y"))).toBe(true)
	})

	it("uses rename seam for testability", async () => {
		createPlanDir("scope-z")
		const moved: { from: string; to: string }[] = []

		const tool = createArchivePlanTool({
			directory: testDir,
			rename: (from, to) => {
				moved.push({ from, to })
				renameSync(from, to)
			},
		})
		const result = await tool.execute({ slug: "scope-z" })
		const parsed = JSON.parse(result as string)

		expect(parsed.ok).toBe(true)
		expect(moved.length).toBe(1)
		expect(moved[0].from).toContain("scope-z")
		expect(moved[0].to).toContain(join("archive", "scope-z"))
	})
})

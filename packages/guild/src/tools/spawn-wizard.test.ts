import { describe, it, expect } from "bun:test"
import { createSpawnWizardTool } from "./spawn-wizard"
import type { SpawnWizardOutput } from "./spawn-wizard"

function makeToolContext(overrides?: Partial<{ sessionID: string }>) {
	return {
		sessionID: overrides?.sessionID ?? "ses_test_001",
		messageID: "msg_test",
		agent: "bard",
		directory: "/test/dir",
		worktree: "/test/dir",
		abort: new AbortController().signal,
		metadata: () => {},
		ask: () => {
			throw new Error("not implemented")
		},
	}
}

describe("createSpawnWizardTool", () => {
	it("returns ok:true with correct effect when given a goal", async () => {
		const tool = createSpawnWizardTool()
		const result = await tool.execute({ goal: "Build a REST API" }, makeToolContext())

		const parsed = JSON.parse(result as string) as SpawnWizardOutput
		expect(parsed.ok).toBe(true)
		expect(parsed.warnings).toEqual([])
		expect(parsed.effect).not.toBeNull()
		expect(parsed.effect!.type).toBe("spawnWizardSession")
		expect(parsed.effect!.sessionId).toBe("ses_test_001")
		expect(parsed.effect!.title).toBe("Build a REST API")
		expect(parsed.effect!.contextInjection).toContain("Build a REST API")
		expect(parsed.effect!.contextInjection).toContain("Planning Handoff")
	})

	it("trims whitespace from goal", async () => {
		const tool = createSpawnWizardTool()
		const result = await tool.execute({ goal: "  Trim me  " }, makeToolContext())

		const parsed = JSON.parse(result as string) as SpawnWizardOutput
		expect(parsed.ok).toBe(true)
		expect(parsed.effect!.title).toBe("Trim me")
	})

	it("returns ok:false when goal is empty string", async () => {
		const tool = createSpawnWizardTool()
		const result = await tool.execute({ goal: "" }, makeToolContext())

		const parsed = JSON.parse(result as string) as SpawnWizardOutput
		expect(parsed.ok).toBe(false)
		expect(parsed.effect).toBeNull()
		expect(parsed.warnings.length).toBeGreaterThan(0)
		expect(parsed.warnings[0]).toContain("non-empty")
	})

	it("returns ok:false when goal is whitespace only", async () => {
		const tool = createSpawnWizardTool()
		const result = await tool.execute({ goal: "   " }, makeToolContext())

		const parsed = JSON.parse(result as string) as SpawnWizardOutput
		expect(parsed.ok).toBe(false)
		expect(parsed.effect).toBeNull()
	})

	it("returns ok:false when sessionID is missing", async () => {
		const tool = createSpawnWizardTool()
		const result = await tool.execute({ goal: "Some goal" }, makeToolContext({ sessionID: "" }))

		const parsed = JSON.parse(result as string) as SpawnWizardOutput
		expect(parsed.ok).toBe(false)
		expect(parsed.effect).toBeNull()
		expect(parsed.warnings.length).toBeGreaterThan(0)
	})
})

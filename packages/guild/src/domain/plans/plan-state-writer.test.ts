import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { writePlanState, refreshPlanState } from "./plan-state-writer"
import type { PlanRepository } from "./plan-repository"
import type { WorkState } from "../../features/work-state/types"

describe("plan-state-writer", () => {
	let testDir: string
	let mockRepository: PlanRepository

	beforeEach(() => {
		testDir = join(tmpdir(), `guild-test-${Date.now()}`)
		mockRepository = {
			readWorkState: () => null,
			writeWorkState: () => true,
			clearWorkState: () => true,
			appendSessionId: () => null,
			createWorkState: () => ({
				active_plan: "",
				started_at: new Date().toISOString(),
				session_ids: [],
				plan_name: "",
			}),
			findPlans: () => [],
			getPlanProgress: () => ({ total: 5, completed: 2, isComplete: false }),
			getPlanName: (path: string) => path.split("/").pop()?.replace(".md", "") || "test",
			getHeadSha: () => undefined,
			pauseWork: () => true,
			resumeWork: () => true,
		}
	})

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true })
		}
	})

	it("writes plan state markdown with correct format", () => {
		const planPath = join(testDir, ".guild", "plans", "test-plan", "tasks.md")
		const workState: WorkState = {
			active_plan: planPath,
			started_at: new Date().toISOString(),
			session_ids: ["session-1"],
			plan_name: "test-plan",
		}

		const result = writePlanState({
			planRepository: mockRepository,
			directory: testDir,
			workState,
			status: "in-progress",
			blocker: null,
			nextAction: "Continue to next unchecked task",
		})

		expect(result).toBe(true)

		const statePath = join(testDir, ".guild", "plans", "test-plan", "state.md")
		expect(existsSync(statePath)).toBe(true)

		const content = readFileSync(statePath, "utf-8")
		expect(content).toContain("# Status: tasks")
		expect(content).toContain("- **Status**: in-progress")
		expect(content).toContain("- **Blocker**: None")
		expect(content).toContain("- **Next Action**: Continue to next unchecked task")
		expect(content).toContain("- **Progress**: 2/5 tasks completed")
	})

	it("includes blocker when provided", () => {
		const planPath = join(testDir, ".guild", "plans", "test-plan", "tasks.md")
		const workState: WorkState = {
			active_plan: planPath,
			started_at: new Date().toISOString(),
			session_ids: ["session-1"],
			plan_name: "test-plan",
		}

		writePlanState({
			planRepository: mockRepository,
			directory: testDir,
			workState,
			status: "blocked",
			blocker: "Waiting for API response",
			nextAction: "Resume after API is available",
		})

		const statePath = join(testDir, ".guild", "plans", "test-plan", "state.md")
		const content = readFileSync(statePath, "utf-8")
		expect(content).toContain("# Status: tasks")
		expect(content).toContain("- **Status**: blocked")
		expect(content).toContain("- **Blocker**: Waiting for API response")
		expect(content).toContain("- **Next Action**: Resume after API is available")
	})

	it("refreshPlanState uses default in-progress status", () => {
		const planPath = join(testDir, ".guild", "plans", "test-plan", "tasks.md")
		const workState: WorkState = {
			active_plan: planPath,
			started_at: new Date().toISOString(),
			session_ids: ["session-1"],
			plan_name: "test-plan",
		}

		const result = refreshPlanState(mockRepository, testDir, workState)
		expect(result).toBe(true)

		const statePath = join(testDir, ".guild", "plans", "test-plan", "state.md")
		const content = readFileSync(statePath, "utf-8")
		expect(content).toContain("- **Status**: in-progress")
		expect(content).toContain("- **Blocker**: None")
	})

	it("creates parent directories if they don't exist", () => {
		const planPath = join(testDir, ".guild", "plans", "nested", "deep", "plan", "tasks.md")
		const workState: WorkState = {
			active_plan: planPath,
			started_at: new Date().toISOString(),
			session_ids: ["session-1"],
			plan_name: "plan",
		}

		const result = writePlanState({
			planRepository: mockRepository,
			directory: testDir,
			workState,
			status: "planned",
		})

		expect(result).toBe(true)

		const statePath = join(testDir, ".guild", "plans", "nested", "deep", "plan", "state.md")
		expect(existsSync(statePath)).toBe(true)
	})

	it("includes today's date in Last Updated field", () => {
		const planPath = join(testDir, ".guild", "plans", "test-plan", "tasks.md")
		const workState: WorkState = {
			active_plan: planPath,
			started_at: new Date().toISOString(),
			session_ids: ["session-1"],
			plan_name: "test-plan",
		}

		writePlanState({
			planRepository: mockRepository,
			directory: testDir,
			workState,
			status: "in-progress",
		})

		const statePath = join(testDir, ".guild", "plans", "test-plan", "state.md")
		const content = readFileSync(statePath, "utf-8")
		const today = new Date().toISOString().split("T")[0]
		expect(content).toContain(`- **Last Updated**: ${today}`)
	})
})

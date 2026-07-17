import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { createFreshPlanExecution, resumePlanExecution } from "./plan-execution"
import type { PlanRepository } from "./plan-repository"
import type { WorkState } from "../../features/work-state/types"

describe("plan-execution lifecycle", () => {
	let testDir: string
	let mockRepository: PlanRepository

	beforeEach(() => {
		testDir = join(tmpdir(), `guild-plan-exec-test-${Date.now()}`)
		mkdirSync(testDir, { recursive: true })

		mockRepository = {
			readWorkState: () => {
				const statePath = join(testDir, ".guild", "state.json")
				if (existsSync(statePath)) {
					return JSON.parse(readFileSync(statePath, "utf-8"))
				}
				return null
			},
			writeWorkState: (dir: string, state: WorkState) => {
				const stateDir = join(dir, ".guild")
				mkdirSync(stateDir, { recursive: true })
				writeFileSync(join(stateDir, "state.json"), JSON.stringify(state), "utf-8")
				return true
			},
			clearWorkState: (dir: string) => {
				const statePath = join(dir, ".guild", "state.json")
				if (existsSync(statePath)) {
					rmSync(statePath)
				}
				return true
			},
			appendSessionId: (dir: string, sessionId: string) => {
				const state = mockRepository.readWorkState(dir)
				if (!state) return null
				if (!state.session_ids.includes(sessionId)) {
					state.session_ids.push(sessionId)
				}
				mockRepository.writeWorkState(dir, state)
				return state
			},
			createWorkState: (planPath: string, sessionId: string, agent: string, dir: string) => ({
				active_plan: planPath,
				started_at: new Date().toISOString(),
				session_ids: [sessionId],
				plan_name: mockRepository.getPlanName(planPath),
				agent,
			}),
			findPlans: () => [],
			getPlanProgress: (path: string) => {
				// Count checkboxes in the file
				if (existsSync(path)) {
					const content = readFileSync(path, "utf-8")
					const allCheckboxes = (content.match(/^[-*]\s*\[[\sx]\]/gm) || []).length
					const completedCheckboxes = (content.match(/^[-*]\s*\[x\]/gm) || []).length
					return { total: allCheckboxes, completed: completedCheckboxes, isComplete: allCheckboxes > 0 && completedCheckboxes === allCheckboxes }
				}
				return { total: 0, completed: 0, isComplete: true }
			},
			getPlanName: (path: string) => {
				// Extract plan name from path like .guild/plans/test-plan/tasks.md
				// Should return "test-plan" not "tasks"
				const parts = path.split("/")
				const filename = parts.pop()?.replace(".md", "") || "test"
				// If filename is tasks.md, spec.md, etc., get the parent directory
				if (["tasks", "spec", "design", "state"].includes(filename)) {
					return parts.pop() || filename
				}
				return filename
			},
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

	describe("createFreshPlanExecution", () => {
		it("creates work state and refreshes plan state on fresh execution", () => {
			const planPath = join(testDir, ".guild", "plans", "test-plan", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "test-plan"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2\n", "utf-8")

			const state = createFreshPlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				planPath,
				sessionId: "sess_1",
				agent: "fighter",
			})

			expect(state.plan_name).toBe("test-plan")
			expect(state.session_ids).toEqual(["sess_1"])
			expect(state.agent).toBe("fighter")

			// Verify state.md was created
			const stateMdPath = join(testDir, ".guild", "plans", "test-plan", "state.md")
			expect(existsSync(stateMdPath)).toBe(true)

			const stateContent = readFileSync(stateMdPath, "utf-8")
			expect(stateContent).toContain("# Status: test-plan")
			expect(stateContent).toContain("- **Status**: in-progress")
		})

		it("clears previous work state before creating fresh execution", () => {
			const oldPlanPath = join(testDir, ".guild", "plans", "old-plan", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "old-plan"), { recursive: true })
			writeFileSync(oldPlanPath, "# Old\n- [x] Done\n", "utf-8")

			// Create initial state
			const oldState = mockRepository.createWorkState(oldPlanPath, "sess_old", "fighter", testDir)
			mockRepository.writeWorkState(testDir, oldState)

			// Verify old state exists
			expect(mockRepository.readWorkState(testDir)).not.toBeNull()

			// Create fresh execution with new plan
			const newPlanPath = join(testDir, ".guild", "plans", "new-plan", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "new-plan"), { recursive: true })
			writeFileSync(newPlanPath, "# New\n- [ ] Task 1\n", "utf-8")

			const newState = createFreshPlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				planPath: newPlanPath,
				sessionId: "sess_new",
				agent: "fighter",
			})

			// Verify new state replaced old state
			expect(newState.plan_name).toBe("new-plan")
			const currentState = mockRepository.readWorkState(testDir)
			expect(currentState!.plan_name).toBe("new-plan")
		})

		it("creates state.md with correct format at plan creation boundary", () => {
			const planPath = join(testDir, ".guild", "plans", "boundary-test", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "boundary-test"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n", "utf-8")

			createFreshPlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				planPath,
				sessionId: "sess_boundary",
				agent: "fighter",
			})

			const stateMdPath = join(testDir, ".guild", "plans", "boundary-test", "state.md")
			const content = readFileSync(stateMdPath, "utf-8")

			// Verify all required fields
			expect(content).toContain("# Status: boundary-test")
			expect(content).toContain("- **Status**: in-progress")
			expect(content).toContain("- **Blocker**: None")
			expect(content).toContain("- **Next Action**: Continue to next unchecked task")
			expect(content).toContain("- **Last Updated**:")
			expect(content).toContain("- **Progress**: 0/3 tasks completed")
		})
	})

	describe("resumePlanExecution", () => {
		it("appends session ID and refreshes plan state on resume", () => {
			const planPath = join(testDir, ".guild", "plans", "resume-plan", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "resume-plan"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3\n", "utf-8")

			// Create initial state
			const initialState = mockRepository.createWorkState(planPath, "sess_1", "fighter", testDir)
			mockRepository.writeWorkState(testDir, initialState)

			// Resume with new session
			const resumedState = resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_2",
			})

			expect(resumedState).not.toBeNull()
			expect(resumedState!.session_ids).toContain("sess_1")
			expect(resumedState!.session_ids).toContain("sess_2")
			expect(resumedState!.plan_name).toBe("resume-plan")

			// Verify state.md was refreshed
			const stateMdPath = join(testDir, ".guild", "plans", "resume-plan", "state.md")
			expect(existsSync(stateMdPath)).toBe(true)

			const stateContent = readFileSync(stateMdPath, "utf-8")
			expect(stateContent).toContain("- **Status**: in-progress")
		})

		it("returns null when no work state exists", () => {
			const result = resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_new",
			})

			expect(result).toBeNull()
		})

		it("refreshes plan state at resume boundary", () => {
			const planPath = join(testDir, ".guild", "plans", "resume-boundary", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "resume-boundary"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [x] Task 1\n- [x] Task 2\n- [ ] Task 3\n", "utf-8")

			// Create initial state
			const initialState = mockRepository.createWorkState(planPath, "sess_1", "fighter", testDir)
			mockRepository.writeWorkState(testDir, initialState)

			// Create initial state.md
			const stateMdPath = join(testDir, ".guild", "plans", "resume-boundary", "state.md")
			writeFileSync(stateMdPath, "# Old state\n", "utf-8")

			// Resume
			resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_2",
			})

			// Verify state.md was refreshed with new content
			const newContent = readFileSync(stateMdPath, "utf-8")
			expect(newContent).toContain("# Status: resume-boundary")
			expect(newContent).not.toContain("# Old state")
			expect(newContent).toContain("- **Status**: in-progress")
		})

		it("accumulates multiple session IDs across resume boundaries", () => {
			const planPath = join(testDir, ".guild", "plans", "multi-session", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "multi-session"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [ ] Task 1\n", "utf-8")

			// Create initial state
			const initialState = mockRepository.createWorkState(planPath, "sess_1", "fighter", testDir)
			mockRepository.writeWorkState(testDir, initialState)

			// Resume with sess_2
			let resumedState = resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_2",
			})
			expect(resumedState!.session_ids).toEqual(["sess_1", "sess_2"])

			// Resume with sess_3
			resumedState = resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_3",
			})
			expect(resumedState!.session_ids).toEqual(["sess_1", "sess_2", "sess_3"])

			// Resume with sess_2 again — should not duplicate
			resumedState = resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_2",
			})
			expect(resumedState!.session_ids).toEqual(["sess_1", "sess_2", "sess_3"])
		})
	})

	describe("plan-state lifecycle boundaries", () => {
		it("state.md is created at plan creation boundary", () => {
			const planPath = join(testDir, ".guild", "plans", "creation-boundary", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "creation-boundary"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [ ] Task 1\n", "utf-8")

			const stateMdPath = join(testDir, ".guild", "plans", "creation-boundary", "state.md")
			expect(existsSync(stateMdPath)).toBe(false)

			createFreshPlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				planPath,
				sessionId: "sess_1",
				agent: "fighter",
			})

			expect(existsSync(stateMdPath)).toBe(true)
		})

		it("state.md is refreshed at resume boundary", () => {
			const planPath = join(testDir, ".guild", "plans", "resume-refresh", "tasks.md")
			mkdirSync(join(testDir, ".guild", "plans", "resume-refresh"), { recursive: true })
			writeFileSync(planPath, "# Plan\n- [ ] Task 1\n", "utf-8")

			// Create initial state
			const initialState = mockRepository.createWorkState(planPath, "sess_1", "fighter", testDir)
			mockRepository.writeWorkState(testDir, initialState)

			const stateMdPath = join(testDir, ".guild", "plans", "resume-refresh", "state.md")
			const oldTimestamp = "2025-01-01"
			writeFileSync(stateMdPath, `# Status: resume-refresh\n- **Last Updated**: ${oldTimestamp}\n`, "utf-8")

			// Resume
			resumePlanExecution({
				planRepository: mockRepository,
				directory: testDir,
				sessionId: "sess_2",
			})

			// Verify state.md was refreshed with today's date
			const newContent = readFileSync(stateMdPath, "utf-8")
			const today = new Date().toISOString().split("T")[0]
			expect(newContent).toContain(`- **Last Updated**: ${today}`)
			expect(newContent).not.toContain(oldTimestamp)
		})
	})
})

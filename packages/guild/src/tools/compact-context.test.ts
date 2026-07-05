import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { createCompactContextTool } from "./compact-context"
import { createExecutionLeaseFsStore } from "../infrastructure/fs/execution-lease-fs-store"
import {
	createExecutionLeaseState,
	createSessionRuntimeState,
} from "../domain/session/execution-lease"
import type { ExecutionLeaseRepository } from "../domain/session/execution-lease"
import { PLANS_DIR } from "../features/work-state/constants"
import { writeWorkState, createWorkState } from "../features/work-state"
import type { PluginContext } from "../plugin/types"

const LeaseRepo = createExecutionLeaseFsStore()

let testDir: string

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), "guild-compact-test-"))
})

afterEach(() => {
	try {
		rmSync(testDir, { recursive: true, force: true })
	} catch {
		// ignore cleanup errors
	}
})

const SESSION_ID = "ses_test_001"

function makeMockClient(todoOverride?: () => Promise<{ data: unknown[] }>): PluginContext["client"] {
	return {
		session: {
			todo: todoOverride ?? (async () => ({ data: [{ content: "Task 1", status: "pending", priority: "high" }] })),
		},
	} as unknown as PluginContext["client"]
}

function makeToolContext() {
	return {
		sessionID: SESSION_ID,
		messageID: "msg_test",
		agent: "fighter",
		directory: testDir,
		worktree: testDir,
		abort: new AbortController().signal,
		metadata: () => {},
		ask: () => { throw new Error("not implemented") },
	}
}

function createPlanFile(name: string, content: string): string {
	const plansDir = join(testDir, PLANS_DIR)
	mkdirSync(plansDir, { recursive: true })
	const filePath = join(plansDir, `${name}.md`)
	writeFileSync(filePath, content, "utf-8")
	return filePath
}

function writeLease(executorAgent: string): void {
	const lease = createExecutionLeaseState({
		ownerKind: "plan",
		ownerRef: "test-plan",
		status: "running",
		sessionId: SESSION_ID,
		executorAgent,
	})
	LeaseRepo.writeExecutionLease(testDir, lease)
}

function writeRuntime(foregroundAgent: string): void {
	const runtime = createSessionRuntimeState({
		sessionId: SESSION_ID,
		foregroundAgent,
		mode: "plan",
		status: "running",
	})
	LeaseRepo.writeSessionRuntime(testDir, runtime)
}

describe("createCompactContextTool", () => {
	// Test case 1: lease and runtime both exist → ok:true with correct agent and active_plan
	it("returns ok:true with correct agent and active_plan when lease and runtime both exist", async () => {
		const planPath = createPlanFile("test-plan", "- [ ] Task 1\n- [x] Task 2\n")
		writeWorkState(testDir, createWorkState(planPath, SESSION_ID, "fighter"))
		writeLease("fighter")
		writeRuntime("fighter")

		const tool = createCompactContextTool({ directory: testDir, client: makeMockClient() })
		const result = await tool.execute({ session_id: SESSION_ID, include_todos: true }, makeToolContext())

		const parsed = JSON.parse(result as string)
		expect(parsed.ok).toBe(true)
		expect(parsed.checkpoint.agent).toBe("fighter")
		expect(parsed.checkpoint.active_plan).toBe(planPath)
		expect(parsed.checkpoint.progress).not.toBeNull()
		expect(parsed.checkpoint.progress.total).toBe(2)
		expect(parsed.checkpoint.progress.completed).toBe(1)
		expect(parsed.warnings).toEqual([])
	})

	// Test case 2: no lease exists → ok:true, active_plan: null
	it("returns ok:true with active_plan:null when no lease exists", async () => {
		const tool = createCompactContextTool({ directory: testDir, client: makeMockClient() })
		const result = await tool.execute({ session_id: SESSION_ID, include_todos: false }, makeToolContext())

		const parsed = JSON.parse(result as string)
		expect(parsed.ok).toBe(true)
		expect(parsed.checkpoint.active_plan).toBeNull()
		expect(parsed.checkpoint.agent).toBeNull()
		expect(parsed.warnings).toEqual([])
	})

	// Test case 3: client.session.todo() throws → ok:true with warning (graceful degradation)
	it("returns ok:true with warning when client.session.todo() throws", async () => {
		const planPath = createPlanFile("test-plan-2", "- [ ] Only task\n")
		writeWorkState(testDir, createWorkState(planPath, SESSION_ID, "fighter"))
		writeLease("fighter")

		const failingClient = makeMockClient(async () => {
			throw new Error("todo API unavailable")
		})
		const tool = createCompactContextTool({ directory: testDir, client: failingClient })
		const result = await tool.execute({ session_id: SESSION_ID, include_todos: true }, makeToolContext())

		const parsed = JSON.parse(result as string)
		expect(parsed.ok).toBe(true)
		expect(parsed.checkpoint.todos_captured).toBe(0)
		expect(parsed.warnings.length).toBeGreaterThan(0)
		expect(parsed.warnings[0]).toContain("todo API unavailable")
	})

	// Test case 4: lease write throws → ok:false with warning
	it("returns ok:false with warning when lease repository read throws", async () => {
		const throwingRepo: ExecutionLeaseRepository = {
			readExecutionLease: () => { throw new Error("disk failure: cannot read lease") },
			writeExecutionLease: () => false,
			clearExecutionLease: () => false,
			readSessionRuntime: () => { throw new Error("disk failure: cannot read runtime") },
			writeSessionRuntime: () => false,
			clearSessionRuntime: () => false,
			getExecutionSnapshot: () => { throw new Error("disk failure: cannot get snapshot") },
		}

		const tool = createCompactContextTool({
			directory: testDir,
			client: makeMockClient(),
			leaseRepository: throwingRepo,
		})
		const result = await tool.execute({ session_id: SESSION_ID, include_todos: false }, makeToolContext())

		const parsed = JSON.parse(result as string)
		expect(parsed.ok).toBe(false)
		expect(parsed.warnings.length).toBeGreaterThan(0)
		expect(parsed.warnings[0]).toContain("disk failure")
		expect(parsed.checkpoint.active_plan).toBeNull()
		expect(parsed.checkpoint.agent).toBeNull()
	})
})

import { tool } from "@opencode-ai/plugin"
import type { ToolDefinition } from "@opencode-ai/plugin"
import { z } from "zod"
import type { PluginContext } from "../plugin/types"
import { createExecutionLeaseFsStore } from "../infrastructure/fs/execution-lease-fs-store"
import type { ExecutionLeaseRepository } from "../domain/session/execution-lease"
import { readWorkState, getPlanProgress } from "../features/work-state"
import { debug, warn } from "../shared/log"

export interface CompactContextDeps {
	directory: string
	client: PluginContext["client"]
	leaseRepository?: ExecutionLeaseRepository
}

export interface CheckpointResult {
	rune_id: string | null
	active_plan: string | null
	progress: { completed: number; total: number } | null
	agent: string | null
	todos_captured: number
	reason: string | null
}

export interface CompactContextOutput {
	ok: boolean
	checkpoint: CheckpointResult
	warnings: string[]
}

const nullCheckpoint: CheckpointResult = {
	rune_id: null,
	active_plan: null,
	progress: null,
	agent: null,
	todos_captured: 0,
	reason: null,
}

// Use the plugin's bundled Zod schema builder to avoid version mismatch in ToolDefinition args type
const s = tool.schema

export function createCompactContextTool(deps: CompactContextDeps): ToolDefinition {
	const { directory, client } = deps
	const leaseRepo = deps.leaseRepository ?? createExecutionLeaseFsStore()

	return tool({
		description:
			"Call before context fills to checkpoint ownership state. Ensures compaction-recovery restores the correct agent and plan on resume.",
		args: {
			session_id: s.string(),
			reason: s.string().optional(),
			include_todos: s.boolean().default(true),
		},
		async execute(args) {
			const warnings: string[] = []

			try {
				const lease = leaseRepo.readExecutionLease(directory)
				const sessionRuntime = leaseRepo.readSessionRuntime(directory, args.session_id)

				// Ensure execution lease is written (idempotent heal if missing)
				if (lease && !leaseRepo.writeExecutionLease(directory, lease)) {
					warnings.push("Failed to re-write execution lease (non-fatal)")
				}

				// Ensure session runtime is written (idempotent heal if missing)
				if (sessionRuntime && !leaseRepo.writeSessionRuntime(directory, sessionRuntime)) {
					warnings.push("Failed to re-write session runtime (non-fatal)")
				}

				// Determine active plan and progress from work state
				const workState = readWorkState(directory)
				const activePlan = workState?.active_plan ?? null
				const progress = activePlan ? getPlanProgress(activePlan) : null

				// Capture agent from lease or session runtime
				const agent = lease?.executor_agent ?? sessionRuntime?.foreground_agent ?? null

				// Snapshot todos if requested
				let todosCaptured = 0
				if (args.include_todos) {
					try {
						const response = await client.session.todo({ path: { id: args.session_id } })
						const todos = (response.data ?? []) as unknown[]
						todosCaptured = todos.length
						debug("[compact-context] Captured todo snapshot", {
							sessionId: args.session_id,
							count: todosCaptured,
						})
					} catch (err) {
						const msg = `Failed to capture todos (non-fatal): ${String(err)}`
						warnings.push(msg)
						warn("[compact-context] " + msg, { sessionId: args.session_id })
					}
				}

			const checkpoint: CheckpointResult = {
				rune_id: null,
				active_plan: activePlan,
				progress: progress ? { completed: progress.completed, total: progress.total } : null,
				agent,
				todos_captured: todosCaptured,
				reason: args.reason ?? null,
			}

				debug("[compact-context] Checkpoint written", {
					sessionId: args.session_id,
					agent,
					activePlan,
					warnings: warnings.length,
				})

				const output: CompactContextOutput = { ok: true, checkpoint, warnings }
				return JSON.stringify(output)
			} catch (err) {
				warn("[compact-context] Fatal error during checkpoint", { error: String(err) })
				const output: CompactContextOutput = {
					ok: false,
					checkpoint: nullCheckpoint,
					warnings: [String(err)],
				}
				return JSON.stringify(output)
			}
		},
	})
}

// Validate args schema using guild's own Zod for test use
export const CompactContextArgsSchema = z.object({
	session_id: z.string(),
	reason: z.string().optional(),
	include_todos: z.boolean().default(true),
})

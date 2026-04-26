/**
 * tmux-delegate — Pi extension
 *
 * Registers a `delegate` tool that Herald (the orchestrator) uses to
 * spawn specialized agents in isolated pi processes running in tmux panes.
 *
 * Layout adapts based on number of active panes:
 *   1 agent  → vertical split, 30% right
 *   2 agents → + horizontal split below the first
 *   3+ agents → + new vertical column to the right
 *
 * Panes close automatically after the agent finishes (3s grace period).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { discoverAgents, type AgentConfig } from "./agents.js";
import {
	generateId,
	buildHandoffFile,
	buildSystemPromptFile,
	buildRunScript,
	waitForResult,
	readResult,
	cleanup,
} from "./handoff.js";
import { TmuxLayout } from "./tmux.js";

// ─── Shared layout state (persists across delegate calls) ─────────────────────
const layout = new TmuxLayout();

// ─── Single task input type ────────────────────────────────────────────────────
const TaskSchema = Type.Object({
	agent: Type.String({ description: "Agent name: scout, sage, forge, arbiter, ward, explore, review, verify" }),
	task: Type.String({ description: "Task description for the agent" }),
	context: Type.Optional(Type.String({ description: "Minimal context the agent needs (no full history)" })),
});

// ─── Extension entry point ─────────────────────────────────────────────────────
export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "delegate",
		label: "Delegate to Agent",
		description:
			"Delegate a task to a specialized agent running in an isolated pi process with its own context window. " +
			"Spawns a tmux pane so you can see what the agent is doing. " +
			"For parallel tasks, pass a `tasks` array — but ALWAYS present the plan to the user first and wait for confirmation.",

		promptSnippet: "Spawn scout, sage, forge, arbiter, ward, explore, review, or verify in isolated context",

		promptGuidelines: [
			"Use delegate whenever you need to run a specialized agent (scout, sage, forge, arbiter, ward, explore, review, verify).",
			"For parallel execution, pass delegate.tasks as an array. Always show the user what will run in parallel and wait for explicit confirmation before calling.",
			"delegate mode 'await' (default) blocks until the agent finishes and returns the result. Use 'fire' only for background tasks where you don't need the output.",
			"Always pass only minimal context — never dump the full conversation history into the context field.",
		],

		parameters: Type.Object({
			// ── Single-agent mode ────────────────────────────────────────────
			agent: Type.Optional(
				Type.String({
					description: "Agent to spawn (single mode). One of: scout, sage, forge, arbiter, ward, explore, review, verify",
				}),
			),
			task: Type.Optional(
				Type.String({ description: "Task for the agent (single mode)" }),
			),
			context: Type.Optional(
				Type.String({ description: "Minimal context the agent needs — no history" }),
			),
			mode: Type.Optional(
				Type.String({ description: "'await' (default, wait for result) or 'fire' (background, no result)" }),
			),
			// ── Parallel mode ────────────────────────────────────────────────
			tasks: Type.Optional(
				Type.Array(TaskSchema, {
					description: "Array of tasks to run in parallel. Present plan to user before calling.",
				}),
			),
		}),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const cwd = ctx.cwd;
			const agents = discoverAgents(cwd);

			// ── Build task list ──────────────────────────────────────────────
			const taskList: Array<{ agent: string; task: string; context: string }> =
				params.tasks && params.tasks.length > 0
					? params.tasks.map((t) => ({
							agent: t.agent,
							task: t.task,
							context: t.context ?? "",
						}))
					: params.agent && params.task
						? [{ agent: params.agent, task: params.task, context: params.context ?? "" }]
						: [];

			if (taskList.length === 0) {
				return {
					content: [{ type: "text", text: "Error: specify `agent` + `task` or a `tasks` array." }],
				};
			}

			const mode = params.mode === "fire" ? "fire" : "await";
			const isParallel = taskList.length > 1;

			// ── Validate all agents exist before spawning any ────────────────
			const resolved: Array<{ config: AgentConfig; task: string; context: string }> = [];
			for (const item of taskList) {
				const config = agents.find((a) => a.name === item.agent);
				if (!config) {
					return {
						content: [
							{
								type: "text",
								text: `Error: agent "${item.agent}" not found. Available: ${agents.map((a) => a.name).join(", ")}`,
							},
						],
					};
				}
				resolved.push({ config, task: item.task, context: item.context });
			}

			// ── Notify ───────────────────────────────────────────────────────
			const names = resolved.map((r) => r.config.name).join(", ");
			onUpdate?.({
				content: [
					{
						type: "text",
						text: `[tmux-delegate] Spawning: ${names}${isParallel ? " (parallel)" : ""}`,
					},
				],
			});

			// ── Spawn jobs ───────────────────────────────────────────────────
			const jobs = resolved.map(({ config, task, context }) =>
				runAgent(config, task, context, cwd, signal, onUpdate),
			);

			if (mode === "fire") {
				// Fire and forget — don't await
				Promise.all(jobs).catch(() => {});
				return {
					content: [
						{
							type: "text",
							text: `Spawned ${taskList.length} agent(s) in background (fire mode). No result returned.`,
						},
					],
				};
			}

			// ── Await all ────────────────────────────────────────────────────
			let results: string[];
			try {
				results = await Promise.all(jobs);
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Delegate error: ${err?.message ?? err}` }],
					isError: true,
				};
			}

			// ── Format output ────────────────────────────────────────────────
			const output =
				results.length === 1
					? results[0]
					: results
							.map((r, i) => `### ${resolved[i].config.name}\n\n${r}`)
							.join("\n\n---\n\n");

			return { content: [{ type: "text", text: output }] };
		},
	});
}

// ─── Core: run one agent ───────────────────────────────────────────────────────
async function runAgent(
	agent: AgentConfig,
	task: string,
	context: string,
	cwd: string,
	signal: AbortSignal | undefined,
	onUpdate?: (partial: any) => void,
): Promise<string> {
	const id = generateId();
	const resultPath = path.join(os.tmpdir(), `pi-result-${id}.md`);
	const donePath = path.join(os.tmpdir(), `pi-result-${id}.done`);

	const handoffPath = buildHandoffFile(id, "herald", agent.name, context, task);
	const syspromptPath = buildSystemPromptFile(id, agent.name, agent.systemPrompt);
	const runScriptPath = buildRunScript(
		id,
		agent.model,
		syspromptPath,
		agent.tools,
		handoffPath,
		resultPath,
		donePath,
	);

	onUpdate?.({
		content: [{ type: "text", text: `  → [${agent.name}] spawning pane (model: ${agent.model ?? "default"})` }],
	});

	const paneId = layout.createPane(agent.name, runScriptPath);

	try {
		// Wait for agent to finish (5 min timeout per agent)
		await waitForResult(donePath, 5 * 60 * 1000, signal);

		const result = readResult(resultPath);

		onUpdate?.({
			content: [{ type: "text", text: `  ✓ [${agent.name}] done` }],
		});

		return result;
	} catch (err) {
		const partial = readResult(resultPath);
		return partial
			? `(incomplete — ${(err as Error).message})\n\n${partial}`
			: `(error — ${(err as Error).message})`;
	} finally {
		// Give user 3s to see agent output before pane auto-closes
		// (the run script also has sleep 3 — whichever finishes last wins)
		await sleep(3000);
		layout.removePane(paneId);
		cleanup([handoffPath, syspromptPath, runScriptPath, donePath]);
		// Keep resultPath — Herald may want to re-read it
		// It gets cleaned up on next delegate call or session end
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

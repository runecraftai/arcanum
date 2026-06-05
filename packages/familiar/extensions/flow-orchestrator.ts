/**
 * Flow Orchestrator — Auto-scope, gates, and spec-driven integration
 *
 * Adds `/flow` command that:
 * 1. Detects scope (Quick/Medium/Large) from user input
 * 2. Auto-selects appropriate chain from agent-chain.yaml
 * 3. Intercepts GATE_G1 and GATE_G6 for TUI approval dialogs
 * 4. Injects spec-driven skill into Sage agent
 *
 * Commands:
 *   /flow <task>           — Start workflow with auto-scope
 *   /flow --scope=quick    — Force scope
 *   /flow --skip-gates     — Bypass approval gates
 *
 * Usage: pi -e extensions/flow-orchestrator.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn } from "child_process";
import { readFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from "fs";
import * as os from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { parseChainYaml, type ChainStep, type ChainDef } from "./lib/parse-chain-yaml.ts";
import { loadAgentModelsConfig, resolveAgentModelString, type AgentModelsConfig } from "./lib/agent-defs.ts";
import { resolveToolkitWorkerModel } from "./lib/toolkit-cli.ts";
import { DEFAULT_SUBAGENT_MODEL } from "./lib/defaults.ts";
import { applyExtensionDefaults } from "./lib/themeMap.ts";

// ── Types ────────────────────────────────────────

interface AgentDef {
	name: string;
	description: string;
	tools: string;
	model: string;
	systemPrompt: string;
}

interface StepState {
	agent: string;
	status: "pending" | "running" | "done" | "error" | "g1_pending" | "g6_pending";
	elapsed: number;
	lastWork: string;
}

interface FlowState {
	status: "idle" | "detecting" | "running" | "g1_pending" | "g6_pending" | "done" | "error";
	chain: string;
	scope: "quick" | "medium" | "large";
	currentStep: number;
	totalSteps: number;
	specPath?: string;
	skipGates: boolean;
}

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Frontmatter Parser ───────────────────────────

function parseAgentFile(filePath: string, modelsConfig?: AgentModelsConfig): AgentDef | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const frontmatter: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!frontmatter.name) return null;

		let model = "";
		if (modelsConfig) {
			const key = frontmatter.name.toLowerCase();
			const entry = modelsConfig.agents[key];
			if (entry) {
				model = resolveAgentModelString(frontmatter.name, modelsConfig);
			}
		}
		if (!model && frontmatter.model) {
			model = frontmatter.model;
		}

		return {
			name: frontmatter.name,
			description: frontmatter.description || "",
			tools: frontmatter.tools || "read,grep,find,ls",
			model,
			systemPrompt: match[2].trim(),
		};
	} catch {
		return null;
	}
}

function scanAgentDirs(cwd: string, extProjectDir?: string, modelsConfig?: AgentModelsConfig): Map<string, AgentDef> {
	const dirs = [
		join(cwd, "agents"),
		join(cwd, ".claude", "agents"),
		join(cwd, ".pi", "agents"),
		...(extProjectDir ? [join(extProjectDir, ".pi", "agents"), join(extProjectDir, "agents")] : []),
	];

	const agents = new Map<string, AgentDef>();

	for (const dir of dirs) {
		if (!existsSync(dir)) continue;
		try {
			const scan = (d: string) => {
				for (const file of readdirSync(d, { withFileTypes: true })) {
					const fullPath = resolve(d, file.name);
					if (file.isDirectory()) {
						scan(fullPath);
					} else if (file.name.endsWith(".md")) {
						const def = parseAgentFile(fullPath, modelsConfig);
						if (def && !agents.has(def.name.toLowerCase())) {
							agents.set(def.name.toLowerCase(), def);
						}
					}
				}
			};
			scan(dir);
		} catch {}
	}

	return agents;
}

// ── Scope Detection ──────────────────────────────

function detectScope(input: string): "quick" | "medium" | "large" {
	const lower = input.toLowerCase();

	// Large signals
	if (/\b(architecture|redesign|migrate|overhaul|platform|system|restructure)\b/.test(lower))
		return "large";

	// Medium signals
	if (/\b(add|implement|create|feature|support|enable|build|integrate)\b/.test(lower))
		return "medium";

	// Quick signals
	if (/\b(fix|bug|typo|rename|delete|remove|update|change|tweak|adjust|correct)\b/.test(lower))
		return "quick";

	// Default conservative
	return "medium";
}

function scopeToChain(scope: string): string {
	const mapping: Record<string, string> = {
		quick: "flow-quick",
		medium: "flow-medium",
		large: "flow-large",
	};
	return mapping[scope] || "flow-medium";
}

// ── Spec-Driven Skill Loader ─────────────────────

function loadSpecDrivenSkill(): string | null {
	try {
		const skillPath = join(os.homedir(), ".agents", "skills", "spec-driven", "SKILL.md");
		if (existsSync(skillPath)) {
			return readFileSync(skillPath, "utf-8");
		}
	} catch {}
	return null;
}

// ── Extension ────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let allAgents: Map<string, AgentDef> = new Map();
	let chains: ChainDef[] = [];
	let widgetCtx: any;
	let sessionDir = "";
	const agentSessions: Map<string, string | null> = new Map();

	// Flow state
	let flowState: FlowState = {
		status: "idle",
		chain: "",
		scope: "medium",
		currentStep: 0,
		totalSteps: 0,
		skipGates: false,
	};

	// Step states for widget
	let stepStates: StepState[] = [];

	function loadChainsAndAgents(cwd: string) {
		const extDir = dirname(fileURLToPath(import.meta.url));
		const extProjectDir = resolve(extDir, "..");

		sessionDir = join(cwd, ".pi", "agent-sessions");
		if (!existsSync(sessionDir)) {
			mkdirSync(sessionDir, { recursive: true });
		}

		const modelsConfig = loadAgentModelsConfig(cwd, extProjectDir);
		allAgents = scanAgentDirs(cwd, extProjectDir, modelsConfig);

		agentSessions.clear();
		for (const [key] of allAgents) {
			const sessionFile = join(sessionDir, `chain-${key}.json`);
			agentSessions.set(key, existsSync(sessionFile) ? sessionFile : null);
		}

		let chainPath = join(cwd, ".pi", "agents", "agent-chain.yaml");
		if (!existsSync(chainPath)) {
			chainPath = join(extProjectDir, ".pi", "agents", "agent-chain.yaml");
		}
		if (!existsSync(chainPath)) {
			chainPath = join(extProjectDir, "agents", "agent-chain.yaml");
		}
		if (existsSync(chainPath)) {
			try {
				chains = parseChainYaml(readFileSync(chainPath, "utf-8"));
			} catch {
				chains = [];
			}
		} else {
			chains = [];
		}
	}

	// ── Gate Interception ───────────────────────

	function extractGateFromOutput(output: string): { type: string; content: string } | null {
		const g1Match = output.match(/GATE_G1:\s*Approve Plan\n([\s\S]*?)(?=\n\(yes\/no\)|$)/i);
		if (g1Match) {
			return { type: "G1", content: g1Match[1].trim() };
		}

		const g6Match = output.match(/GATE_G6:\s*Approve Commit\n([\s\S]*?)(?=\n\(yes\/no\)|$)/i);
		if (g6Match) {
			return { type: "G6", content: g6Match[1].trim() };
		}

		return null;
	}

	async function showGateDialog(
		gateType: string,
		content: string,
		ctx: any
	): Promise<boolean> {
		const title = gateType === "G1" ? "🔍 Gate G1: Approve Plan" : "🔒 Gate G6: Approve Commit";
		return await ctx.ui.confirm(title, content, { timeout: 60000 });
	}

	// ── Run Agent (subprocess) ──────────────────

	function runAgent(
		agentDef: AgentDef,
		task: string,
		stepIndex: number,
		ctx: any,
	): Promise<{ output: string; exitCode: number; elapsed: number }> {
		const model = resolveToolkitWorkerModel(agentDef.name, agentDef.model || DEFAULT_SUBAGENT_MODEL);
		const agentKey = agentDef.name.toLowerCase().replace(/\s+/g, "-");
		const agentSessionFile = join(sessionDir, `chain-${agentKey}.json`);
		const hasSession = agentSessions.get(agentKey);

		const extDir = dirname(fileURLToPath(import.meta.url));
		const args = [
			"--mode", "json",
			"-p",
			"--no-extensions",
			"--model", model,
			"--tools", agentDef.tools,
			"--thinking", "off",
			"--append-system-prompt", agentDef.systemPrompt,
			"--session", agentSessionFile,
		];

		if (hasSession) {
			args.push("-c");
		}

		args.push(task);

		const textChunks: string[] = [];
		const startTime = Date.now();
		const state = stepStates[stepIndex];

		return new Promise((resolve) => {
			const proc = spawn("pi", args, {
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env, PI_SUBAGENT: "1" },
				cwd: ctx.cwd,
			});

			const timer = setInterval(() => {
				state.elapsed = Date.now() - startTime;
			}, 1000);

			let buffer = "";

			proc.stdout!.setEncoding("utf-8");
			proc.stdout!.on("data", (chunk: string) => {
				buffer += chunk;
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";
				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const event = JSON.parse(line);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") {
								textChunks.push(delta.delta || "");
								const full = textChunks.join("");
								const last = full.split("\n").filter((l: string) => l.trim()).pop() || "";
								state.lastWork = last;
							}
						}
					} catch {}
				}
			});

			proc.stderr!.setEncoding("utf-8");
			proc.stderr!.on("data", () => {});

			proc.on("close", (code) => {
				if (buffer.trim()) {
					try {
						const event = JSON.parse(buffer);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") textChunks.push(delta.delta || "");
						}
					} catch {}
				}

				clearInterval(timer);
				const elapsed = Date.now() - startTime;
				state.elapsed = elapsed;
				const output = textChunks.join("");
				state.lastWork = output.split("\n").filter((l: string) => l.trim()).pop() || "";

				if (code === 0) {
					agentSessions.set(agentKey, agentSessionFile);
				}

				resolve({ output, exitCode: code ?? 1, elapsed });
			});

			proc.on("error", (err) => {
				clearInterval(timer);
				resolve({
					output: `Error spawning agent: ${err.message}`,
					exitCode: 1,
					elapsed: Date.now() - startTime,
				});
			});
		});
	}

	// ── Run Chain With Gates ────────────────────

	async function runChainWithGates(
		chain: ChainDef,
		task: string,
		ctx: any,
	): Promise<{ output: string; success: boolean; elapsed: number }> {
		const chainStart = Date.now();

		// Reset step states
		stepStates = chain.steps.map(s => ({
			agent: s.agent,
			status: "pending" as const,
			elapsed: 0,
			lastWork: "",
		}));

		flowState.status = "running";
		flowState.chain = chain.name;
		flowState.totalSteps = chain.steps.length;
		flowState.currentStep = 0;

		let input = task;
		const originalPrompt = task;
		const stepOutputs: string[] = [];

		for (let i = 0; i < chain.steps.length; i++) {
			const step = chain.steps[i];
			flowState.currentStep = i;
			stepStates[i].status = "running";

			// Resolve prompt variables
			let resolvedPrompt = step.prompt
				.replace(/\$ORIGINAL/g, originalPrompt)
				.replace(/\$INPUT/g, input);

			// Replace $INPUT_N with stepOutputs[N-1]
			resolvedPrompt = resolvedPrompt.replace(/\$INPUT_(\d+)/g, (_, n) => {
				const stepIndex = parseInt(n, 10) - 1;
				return stepIndex >= 0 && stepIndex < stepOutputs.length ? stepOutputs[stepIndex] : "";
			});

			const agentDef = allAgents.get(step.agent.toLowerCase());
			if (!agentDef) {
				stepStates[i].status = "error";
				return {
					output: `Error at step ${i + 1}: Agent "${step.agent}" not found`,
					success: false,
					elapsed: Date.now() - chainStart,
				};
			}

			let result = await runAgent(agentDef, resolvedPrompt, i, ctx);

			if (result.exitCode !== 0) {
				stepStates[i].status = "error";
				return {
					output: `Error at step ${i + 1} (${step.agent}): ${result.output}`,
					success: false,
					elapsed: Date.now() - chainStart,
				};
			}

			stepStates[i].status = "done";

			// Check for gates in output
			if (!flowState.skipGates) {
				const gate = extractGateFromOutput(result.output);
				if (gate) {
					if (gate.type === "G1") {
						stepStates[i].status = "g1_pending";
						flowState.status = "g1_pending";

						const approved = await showGateDialog("G1", gate.content, ctx);

						if (!approved) {
							// User rejected plan — send feedback back to Sage
							const feedback = await ctx.ui.input("Feedback for planner:", "Revise plan with...");
							if (feedback) {
								// Re-run Sage with feedback
								const feedbackPrompt = `${resolvedPrompt}\n\nUSER FEEDBACK: ${feedback}\n\nPlease revise the plan based on this feedback.`;
								const revisedResult = await runAgent(agentDef, feedbackPrompt, i, ctx);
								if (revisedResult.exitCode === 0) {
									stepStates[i].status = "done";
									result = revisedResult;
								} else {
									return {
										output: `Sage revision failed: ${revisedResult.output}`,
										success: false,
										elapsed: Date.now() - chainStart,
									};
								}
							} else {
								return {
									output: "Plan rejected by user without feedback.",
									success: false,
									elapsed: Date.now() - chainStart,
								};
							}
						}
						stepStates[i].status = "done";
						flowState.status = "running";
					} else if (gate.type === "G6") {
						stepStates[i].status = "g6_pending";
						flowState.status = "g6_pending";

						const approved = await showGateDialog("G6", gate.content, ctx);

						if (approved) {
							// Execute commit
							try {
								await ctx.tools.bash("git add -A && git commit -m 'feat: implementation'");
								ctx.ui.notify("✅ Changes committed successfully", "success");
							} catch {
								ctx.ui.notify("⚠️ Commit failed — changes remain staged", "warning");
							}
						} else {
							ctx.ui.notify("⏸️ Changes left unstaged for manual review", "info");
						}

						stepStates[i].status = "done";
						flowState.status = "running";
					}
				}
			}

			stepOutputs.push(result.output);
			input = result.output;
		}

		flowState.status = "done";
		return { output: input, success: true, elapsed: Date.now() - chainStart };
	}

	// ── /flow Command ───────────────────────────

	pi.registerCommand("flow", {
		description: "Start a gated workflow with auto-scope detection: /flow [options] <task>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;

			if (!args || !args.trim()) {
				ctx.ui.notify("Usage: /flow <task>  or  /flow --scope=quick <task>", "error");
				return;
			}

			// Parse options
			let scopeOverride: string | null = null;
			let skipGates = false;
			let task = args.trim();

			const scopeMatch = task.match(/--scope=(quick|medium|large)/);
			if (scopeMatch) {
				scopeOverride = scopeMatch[1];
				task = task.replace(scopeMatch[0], "").trim();
			}

			if (task.includes("--skip-gates")) {
				skipGates = true;
				task = task.replace("--skip-gates", "").trim();
			}

			if (!task) {
				ctx.ui.notify("Usage: /flow <task>", "error");
				return;
			}

			// Detect scope
			const scope = scopeOverride || detectScope(task);
			const chainName = scopeToChain(scope);

			// Find chain
			const chain = chains.find(c => c.name === chainName);
			if (!chain) {
				ctx.ui.notify(`Chain "${chainName}" not found. Available: ${chains.map(c => c.name).join(", ")}`, "error");
				return;
			}

			// Update flow state
			flowState = {
				status: "detecting",
				chain: chainName,
				scope: scope as "quick" | "medium" | "large",
				currentStep: 0,
				totalSteps: chain.steps.length,
				skipGates,
			};

			ctx.ui.notify(
				`🚀 Flow started\nScope: ${scope} → Chain: ${chainName}\nSteps: ${chain.steps.map(s => displayName(s.agent)).join(" → ")}`,
				"info",
			);
			ctx.ui.setStatus("familiar-flow", `${chainName} (${scope})`);

			// Run chain with gates
			const result = await runChainWithGates(chain, task, ctx);

			if (result.success) {
				ctx.ui.setStatus("familiar-flow", `${chainName} ✅`);
				ctx.ui.notify(`✅ Flow complete in ${Math.round(result.elapsed / 1000)}s`, "success");
			} else {
				ctx.ui.setStatus("familiar-flow", `${chainName} ❌`);
				ctx.ui.notify(`❌ Flow failed: ${result.output.slice(0, 200)}`, "error");
			}
		},
	});

	// ── Spec-Driven Injection ───────────────────

	pi.on("before_agent_start", async (event, ctx) => {
		// Inject spec-driven skill into Sage
		const agentName = event.agentName?.toLowerCase() || "";
		if (agentName.includes("sage")) {
			const specDriven = loadSpecDrivenSkill();
			if (specDriven) {
				return {
					systemPrompt: `\n\n## Skill: spec-driven\n\n${specDriven}`,
				};
			} else {
				ctx.ui.notify("⚠️ Spec-driven skill not found at ~/.agents/skills/spec-driven/SKILL.md", "warning");
			}
		}
		return {};
	});

	// ── Session Start ───────────────────────────

	pi.on("session_start", async (_event, _ctx) => {
		applyExtensionDefaults(import.meta.url, _ctx);
		widgetCtx = _ctx;

		// Reset flow state
		flowState = {
			status: "idle",
			chain: "",
			scope: "medium",
			currentStep: 0,
			totalSteps: 0,
			skipGates: false,
		};
		stepStates = [];

		// Load chains and agents
		loadChainsAndAgents(_ctx.cwd);

		if (chains.length === 0) {
			_ctx.ui.notify("⚠️ No chains found. Add flow-* chains to .pi/agents/agent-chain.yaml", "warning");
		}

		_ctx.ui.setStatus("familiar-flow", "Ready");
	});
}

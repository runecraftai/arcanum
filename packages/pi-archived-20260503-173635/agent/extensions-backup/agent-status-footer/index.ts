/**
 * Agent Status Footer - Shows agent + model below tokens in footer
 *
 * Features:
 * - Displays 🤖 agent | 🧠 model in footer
 * - Updates on agent/model changes
 * - Custom render with proper layout
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getAgentDir, parseFrontmatter } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentConfig {
	name: string;
	description: string;
	tools?: string[];
	model?: string;
	source: "user" | "project";
}

interface AgentStatus {
	agent: string;
	model: string;
	agentSource: "user" | "project" | "main";
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let currentStatus: AgentStatus = {
	agent: "main",
	model: "",
	agentSource: "main",
};

let footerEnabled = true;

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

function discoverAgents(cwd: string): { agents: AgentConfig[]; projectDir: string | null } {
	const userDir = path.join(getAgentDir(), "agents");
	let projectDir: string | null = null;

	let currentDir = cwd;
	while (currentDir !== path.dirname(currentDir)) {
		const candidate = path.join(currentDir, ".pi", "agents");
		if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
			projectDir = candidate;
			break;
		}
		currentDir = path.dirname(currentDir);
	}

	const loadAgents = (dir: string, source: "user" | "project"): AgentConfig[] => {
		if (!fs.existsSync(dir)) return [];

		const agents: AgentConfig[] = [];
		try {
			const files = fs.readdirSync(dir);
			for (const file of files) {
				if (!file.endsWith(".md")) continue;

				const filePath = path.join(dir, file);
				const content = fs.readFileSync(filePath, "utf-8");
				const { frontmatter } = parseFrontmatter<Record<string, string>>(content);

				if (!frontmatter.name || !frontmatter.description) continue;

				agents.push({
					name: frontmatter.name,
					description: frontmatter.description,
					tools: frontmatter.tools?.split(",").map((t: string) => t.trim()).filter(Boolean),
					model: frontmatter.model,
					source,
				});
			}
		} catch { /* ignore */ }

		return agents;
	};

	const userAgents = loadAgents(userDir, "user");
	const projectAgents = projectDir ? loadAgents(projectDir, "project") : [];

	const agentMap = new Map<string, AgentConfig>();
	for (const a of [...userAgents, ...projectAgents]) {
		agentMap.set(a.name, a);
	}

	return { agents: Array.from(agentMap.values()), projectDir };
}

function setStatus(status: Partial<AgentStatus>) {
	currentStatus = { ...currentStatus, ...status };
}

function getStatus(): AgentStatus {
	return currentStatus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

function getFooterRenderer(pi: ExtensionAPI) {
	return (tui: any, theme: any, footerData: any) => {
		const unsub = footerData.onBranchChange(() => tui.requestRender());

		return {
			dispose: unsub,
			invalidate() {},
			render(width: number): string[] {
				if (!footerEnabled) return [];

				const status = getStatus();

				// Agent part
				const agentIcon = theme.fg("accent", "🤖");
				const agentLabel = status.agent === "main"
					? theme.fg("accent", "main")
					: theme.fg("accent", status.agent);

				// Source badge
				let sourceBadge = "";
				if (status.agent !== "main") {
					if (status.agentSource === "project") {
						sourceBadge = " " + theme.fg("warning", "[P]");
					} else if (status.agentSource === "user") {
						sourceBadge = " " + theme.fg("dim", "[U]");
					}
				}

				// Model part
				const modelIcon = theme.fg("muted", "🧠");
				const modelLabel = status.model
					? theme.fg("muted", status.model.split("/").pop() || status.model)
					: theme.fg("dim", "no-model");

				// Separator
				const sep = theme.fg("dim", " │ ");

				// Build the line
				let left = `${agentIcon} ${agentLabel}${sourceBadge}`;
				let right = `${modelIcon} ${modelLabel}`;

				// Align to edges
				const leftWidth = visibleWidth(left);
				const rightWidth = visibleWidth(right);
				const centerWidth = width - leftWidth - rightWidth - 2;
				const pad = centerWidth > 0 ? " ".repeat(Math.max(1, Math.floor(centerWidth))) : " ";

				const line = truncateToWidth(left + pad + right, width);
				return [line];
			},
		};
	};
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {
	// ─────────────────────────────────────────────────────────────────────────────
	// AGENT CYCLE
	// ─────────────────────────────────────────────────────────────────────────────

	function cycleAgent(ctx: any) {
		const { agents } = discoverAgents(ctx.cwd);
		if (agents.length === 0) {
			ctx.ui.notify("No agents configured", "info");
			return;
		}

		const status = getStatus();
		const currentIndex = agents.findIndex((a) => a.name === status.agent);

		// Cycle forward (skip "main" if first)
		let nextIndex: number;
		if (status.agent === "main") {
			nextIndex = 0;
		} else {
			nextIndex = (currentIndex + 1) % agents.length;
		}

		const nextAgent = agents[nextIndex];
		setStatus({
			agent: nextAgent.name,
			model: nextAgent.model || getStatus().model,
			agentSource: nextAgent.source,
		});

		ctx.ui.setFooter(getFooterRenderer(pi));
		ctx.ui.notify(`🤖 ${nextAgent.name}`, "info");
	}

	// Register Tab shortcut for cycling agents
	pi.registerShortcut("alt+tab", {
		description: "Cycle to next agent",
		handler: async (ctx) => {
			cycleAgent(ctx);
		},
	});

	// ─────────────────────────────────────────────────────────────────────────────
	// INITIALIZATION
	// ─────────────────────────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		// Restore status from session if available
		const entries = ctx.sessionManager.getEntries();
		for (const entry of entries) {
			if (entry.type === "custom" && entry.customType === "agent-status") {
				setStatus(entry.data as AgentStatus);
				break;
			}
		}

		// Get current model
		if (ctx.model) {
			setStatus({ model: `${ctx.model.provider}/${ctx.model.id}` });
		}

		// Set up custom footer
		if (ctx.hasUI) {
			ctx.ui.setFooter(getFooterRenderer(pi));
		}
	});

	pi.on("model_select", async (event, ctx) => {
		setStatus({ model: `${event.model.provider}/${event.model.id}` });

		if (ctx.hasUI && footerEnabled) {
			ctx.ui.setFooter(getFooterRenderer(pi));
		}
	});

	// Track subagent execution
	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "subagent") return;

		try {
			const details = (event as any).details;
			if (details?.results?.length > 0) {
				const result = details.results[0];
				setStatus({
					agent: result.agent,
					model: result.model || getStatus().model,
					agentSource: result.agentSource || "user",
				});

				if (ctx.hasUI && footerEnabled) {
					ctx.ui.setFooter(getFooterRenderer(pi));
				}
			}
		} catch { /* ignore */ }
	});

	// ─────────────────────────────────────────────────────────────────────────────
	// COMMANDS
	// ─────────────────────────────────────────────────────────────────────────────

	// Toggle footer visibility
	pi.registerCommand("agentfooter", {
		description: "Toggle agent status footer",
		handler: async (_args, ctx) => {
			footerEnabled = !footerEnabled;

			if (footerEnabled) {
				ctx.ui.setFooter(getFooterRenderer(pi));
				ctx.ui.notify("Agent footer enabled", "info");
			} else {
				ctx.ui.setFooter(undefined);
				ctx.ui.notify("Agent footer hidden", "info");
			}
		},
	});

	// Show current agent
	pi.registerCommand("agent", {
		description: "Show or switch current agent",
		handler: async (args, ctx) => {
			const status = getStatus();

			if (!args.trim()) {
				ctx.ui.notify(`🤖 ${status.agent} │ 🧠 ${status.model || "default"}`, "info");
				return;
			}

			// Switch agent
			const { agents } = discoverAgents(ctx.cwd);
			const agent = agents.find((a) => a.name === args.trim());

			if (!agent) {
				const available = agents.map((a) => a.name).join(", ") || "none";
				ctx.ui.notify(`Unknown. Available: ${available}`, "error");
				return;
			}

			setStatus({
				agent: agent.name,
				model: agent.model || getStatus().model,
				agentSource: agent.source,
			});

			ctx.ui.setFooter(getFooterRenderer(pi));
			ctx.ui.notify(`Switched to: 🤖 ${agent.name}`, "info");
		},
	});

	// List agents
	pi.registerCommand("agents", {
		description: "List available agents",
		handler: async (_args, ctx) => {
			const { agents, projectDir } = discoverAgents(ctx.cwd);
			const status = getStatus();

			if (agents.length === 0) {
				ctx.ui.notify("No agents. See ~/.pi/agent/agents/", "info");
				return;
			}

			const lines: string[] = [];
			lines.push(`Current: 🤖 ${status.agent}`);
			lines.push("");
			lines.push("Available:");
			lines.push("");

			for (const agent of agents) {
				const marker = agent.name === status.agent ? "→ " : "  ";
				const source = agent.source === "project" ? " [P]" : "";
				const model = agent.model ? ` (${agent.model.split("/").pop()})` : "";
				lines.push(`${marker}${agent.name}${source}${model}`);
				lines.push(`    ${agent.description}`);
				lines.push("");
			}

			if (projectDir) {
				lines.push(`Project: ${projectDir}`);
			}

			ctx.ui.setWidget("agents-list", lines);
		},
	});

	// ─────────────────────────────────────────────────────────────────────────────
	// TOOLS
	// ─────────────────────────────────────────────────────────────────────────────

	pi.registerTool({
		name: "get_agent_status",
		label: "Get Agent Status",
		description: "Get current agent and model",
		parameters: { type: "object", properties: {} },
		async execute() {
			const s = getStatus();
			return {
				content: [{
					type: "text",
					text: `Agent: ${s.agent} (${s.agentSource})\nModel: ${s.model || "default"}`,
				}],
				details: s,
			};
		},
	});

	pi.registerTool({
		name: "set_agent",
		label: "Set Agent",
		description: "Switch to a different agent",
		parameters: {
			type: "object",
			properties: { agent: { type: "string", description: "Agent name" } },
			required: ["agent"],
		},
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const { agents } = discoverAgents(ctx.cwd);
			const agent = agents.find((a) => a.name === params.agent);

			if (!agent) {
				return {
					content: [{ type: "text", text: `Agent "${params.agent}" not found` }],
					isError: true,
				};
			}

			setStatus({
				agent: agent.name,
				model: agent.model || getStatus().model,
				agentSource: agent.source,
			});

			ctx.ui.setFooter(getFooterRenderer(pi));

			return {
				content: [{ type: "text", text: `Switched to: ${agent.name}` }],
				details: getStatus(),
			};
		},
	});
}
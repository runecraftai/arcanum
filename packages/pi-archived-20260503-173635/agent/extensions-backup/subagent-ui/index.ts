/**
 * Subagent Interface - UI commands for delegating to subagents
 *
 * Provides:
 * - /delegate [agent:name] [task:text] - Select agent and delegate task
 * - /agents                           - List available agents
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getAgentDir, parseFrontmatter } from "@mariozechner/pi-coding-agent";

interface AgentConfig {
	name: string;
	description: string;
	tools?: string[];
	model?: string;
	source: "user" | "project";
}

function discoverAgents(cwd: string, scope: "user" | "project" | "both"): { agents: AgentConfig[]; projectDir: string | null } {
	const userDir = path.join(getAgentDir(), "agents");
	let projectDir: string | null = null;

	// Find project agents dir
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
				const { frontmatter, body: _body } = parseFrontmatter<Record<string, string>>(content);

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

	const userAgents = scope === "project" ? [] : loadAgents(userDir, "user");
	const projectAgents = scope === "user" || !projectDir ? [] : loadAgents(projectDir, "project");

	const agentMap = new Map<string, AgentConfig>();
	for (const a of [...userAgents, ...projectAgents]) {
		agentMap.set(a.name, a);
	}

	return { agents: Array.from(agentMap.values()), projectDir };
}

export default function (pi: ExtensionAPI) {
	// List all available agents
	pi.registerCommand("agents", {
		description: "List available subagents",
		handler: async (_args, ctx) => {
			const { agents, projectDir } = discoverAgents(ctx.cwd, "both");

			if (agents.length === 0) {
				ctx.ui.notify("No agents configured. See ~/.pi/agent/agents/", "info");
				return;
			}

			const userAgents = agents.filter((a) => a.source === "user");
			const projAgents = agents.filter((a) => a.source === "project");

			const lines: string[] = [];

			if (userAgents.length > 0) {
				lines.push("═══ User Agents ═══");
				for (const agent of userAgents) {
					const tools = agent.tools?.join(", ") || "default";
					lines.push(`${agent.name}`);
					lines.push(`  ${agent.description}`);
					if (agent.model) lines.push(`  model: ${agent.model}`);
					lines.push(`  tools: ${tools}`);
					lines.push("");
				}
			}

			if (projAgents.length > 0) {
				lines.push("═══ Project Agents ═══");
				for (const agent of projAgents) {
					const tools = agent.tools?.join(", ") || "default";
					lines.push(`${agent.name}`);
					lines.push(`  ${agent.description}`);
					if (agent.model) lines.push(`  model: ${agent.model}`);
					lines.push(`  tools: ${tools}`);
					lines.push("");
				}
			}

			if (projectDir) {
				lines.push(`Project agents from: ${projectDir}`);
			}

			ctx.ui.setWidget("agents-list", lines);
		},
	});

	// Delegate task to agent
	pi.registerCommand("delegate", {
		description: "Delegate task to a subagent",
		handler: async (args, ctx) => {
			const { agents } = discoverAgents(ctx.cwd, "both");

			if (agents.length === 0) {
				ctx.ui.notify("No agents configured. See ~/.pi/agent/agents/", "error");
				return;
			}

			// Parse args: "agent:name task:text" or just "task"
			let selectedAgent = "";
			let task = args.trim();

			const agentMatch = args.match(/^(?:agent:)?(\S+?)(?:\s+(.+))?$/s);
			if (agentMatch) {
				const potentialAgent = agentMatch[1];
				// Check if it's a valid agent name
				const found = agents.find((a) => a.name === potentialAgent);
				if (found) {
					selectedAgent = potentialAgent;
					task = agentMatch[2]?.trim() || "";
				}
			}

			// Interactive agent selection if not specified
			if (!selectedAgent) {
				const choice = await ctx.ui.select("Select Agent:", agents.map((a) => ({
					label: a.name,
					description: a.description,
					value: a.name,
				})));

				if (!choice) {
					ctx.ui.notify("Cancelled", "info");
					return;
				}

				selectedAgent = choice;
			}

			// Interactive task input if not specified
			if (!task) {
				const result = await ctx.ui.input("Task", "What should the agent do?");
				if (!result) {
					ctx.ui.notify("Cancelled", "info");
					return;
				}
				task = result;
			}

			// Confirm
			const ok = await ctx.ui.confirm(
				"Confirm",
				`Delegate to "${selectedAgent}"?\n\n${task.slice(0, 100)}${task.length > 100 ? "..." : ""}`,
			);

			if (!ok) {
				ctx.ui.notify("Cancelled", "info");
				return;
			}

			// Check if subagent tool exists
			const tools = pi.getAllTools?.() || [];
			const hasSubagent = tools.some((t: any) => t.name === "subagent");

			if (hasSubagent) {
				// Use subagent tool directly
				pi.sendUserMessage(`Use subagent to execute:\n\`\`\`json\n${JSON.stringify({ agent: selectedAgent, task }, null, 2)}\n\`\`\``, {
					deliverAs: "followUp",
				});
			} else {
				// Fallback: open agent file for review
				const agentDir = path.join(getAgentDir(), "agents");
				const agentFile = path.join(agentDir, `${selectedAgent}.md`);

				if (fs.existsSync(agentFile)) {
					ctx.ui.setEditorText(`Task: ${task}\n\n---\n\n${fs.readFileSync(agentFile, "utf-8")}`);
					ctx.ui.notify(`Opened ${selectedAgent}.md - use /fork to start subagent session`, "info");
				} else {
					ctx.ui.notify(`Agent "${selectedAgent}" file not found`, "error");
				}
			}
		},
	});
}
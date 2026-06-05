/**
 * Agent discovery — reads ~/.pi/agents/*.md and .pi/agents/*.md
 * Adapted from pi's official subagent example
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface AgentConfig {
	name: string;
	description: string;
	tools?: string[];
	model?: string;
	systemPrompt: string;
	source: "user" | "project";
	filePath: string;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
	const lines = content.split("\n");
	if (lines[0]?.trim() !== "---") {
		return { frontmatter: {}, body: content };
	}

	const endIdx = lines.indexOf("---", 1);
	if (endIdx === -1) {
		return { frontmatter: {}, body: content };
	}

	const frontmatter: Record<string, string> = {};
	for (const line of lines.slice(1, endIdx)) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trim();
		if (key) frontmatter[key] = value;
	}

	const body = lines.slice(endIdx + 1).join("\n").trim();
	return { frontmatter, body };
}

function loadAgentsFromDir(dir: string, source: "user" | "project"): AgentConfig[] {
	const agents: AgentConfig[] = [];
	if (!fs.existsSync(dir)) return agents;

	function walkDir(currentDir: string) {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				walkDir(fullPath);
				continue;
			}
			if (!entry.name.endsWith(".md")) continue;

			let content: string;
			try {
				content = fs.readFileSync(fullPath, "utf-8");
			} catch {
				continue;
			}

			const { frontmatter, body } = parseFrontmatter(content);
			if (!frontmatter.name || !frontmatter.description) continue;

			const tools = frontmatter.tools
				?.split(",")
				.map((t: string) => t.trim())
				.filter(Boolean);

			agents.push({
				name: frontmatter.name,
				description: frontmatter.description,
				tools: tools && tools.length > 0 ? tools : undefined,
				model: frontmatter.model,
				systemPrompt: body,
				source,
				filePath: fullPath,
			});
		}
	}

	walkDir(dir);
	return agents;
}

function findProjectAgentsDir(cwd: string): string | null {
	let currentDir = cwd;
	while (true) {
		const candidate = path.join(currentDir, ".pi", "agents");
		try {
			if (fs.statSync(candidate).isDirectory()) return candidate;
		} catch {}
		const parent = path.dirname(currentDir);
		if (parent === currentDir) return null;
		currentDir = parent;
	}
}

export function discoverAgents(cwd: string): AgentConfig[] {
	const userDir = path.join(os.homedir(), ".pi", "agents");
	const projectDir = findProjectAgentsDir(cwd);

	const agentMap = new Map<string, AgentConfig>();

	for (const agent of loadAgentsFromDir(userDir, "user")) {
		agentMap.set(agent.name, agent);
	}
	if (projectDir) {
		for (const agent of loadAgentsFromDir(projectDir, "project")) {
			agentMap.set(agent.name, agent);
		}
	}

	return Array.from(agentMap.values());
}

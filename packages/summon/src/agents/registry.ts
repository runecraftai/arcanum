import type { AgentScope } from "../utils/paths";

export interface AgentConfig {
  id: string;
  name: string;
  detectPaths: string[]; // Paths to check for detection
  installDir: string; // Relative path where skills are installed
  scope: AgentScope; // "global" or "project"
}

export const AGENTS: AgentConfig[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    detectPaths: ["~/.claude/"],
    installDir: "~/.claude/skills/",
    scope: "global",
  },
  {
    id: "cursor",
    name: "Cursor",
    detectPaths: [".cursor/rules/"],
    installDir: ".cursor/rules/",
    scope: "project",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    detectPaths: [".windsurf/rules/"],
    installDir: ".windsurf/rules/",
    scope: "project",
  },
  {
    id: "cline",
    name: "Cline",
    detectPaths: [".clinerules/"],
    installDir: ".clinerules/",
    scope: "project",
  },
  {
    id: "opencode",
    name: "OpenCode",
    detectPaths: ["~/.config/opencode/"],
    installDir: "~/.config/opencode/skills/",
    scope: "global",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    detectPaths: [".github/copilot-instructions.md"],
    installDir: ".github/copilot-instructions/",
    scope: "project",
  },
  {
    id: "roo-code",
    name: "Roo Code",
    detectPaths: [".roo/"],
    installDir: ".roo/skills/",
    scope: "project",
  },
  {
    id: "aider",
    name: "Aider",
    detectPaths: [".aider/"],
    installDir: ".aider/skills/",
    scope: "project",
  },
  {
    id: "kiro",
    name: "Kiro",
    detectPaths: [".kiro/"],
    installDir: ".kiro/skills/",
    scope: "project",
  },
];

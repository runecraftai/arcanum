import type { SupportedRuntime } from "./generator";
import { PROMPTS } from "./prompts";

export interface CommandMapping {
  name: string;
  skill?: string;
  description: string;
  builtinNames?: Partial<Record<SupportedRuntime, string>>;
  bodyExtras?: string;
  body?: string;
}

export const COMMANDS: CommandMapping[] = [
  {
    name: "plan",
    skill: "idea-refine",
    description: "Plan a feature with idea-refine and interview-me",
    bodyExtras:
      "Default behavior: divergent/convergent thinking to shape a proposal. If the user responds with ambiguity, chain into interview-me for one-question-at-a-time extraction.",
  },
  {
    name: "review",
    skill: "code-review-and-quality",
    description: "Review changes with five-axis critique",
    builtinNames: {
      "claude-code": "review",
    },
  },
  {
    name: "test",
    skill: "test-driven-development",
    description: "Run or generate tests with TDD pyramid",
  },
  {
    name: "simplify",
    skill: "code-simplification",
    description: "Simplify code with Chesterton's Fence and Rule of 500",
  },
  {
    name: "ship",
    skill: "shipping-and-launch",
    description: "Pre-launch checklist and feature flag rollout",
    bodyExtras: "OpenCode also injects `git log --oneline -10` for recent context.",
  },
  {
    name: "security",
    skill: "security-and-hardening",
    description: "Security audit with OWASP and three-tier boundaries",
  },
  {
    name: "debug",
    skill: "debugging-and-error-recovery",
    description: "Five-step debugging triage",
  },
  {
    name: "harden",
    skill: "doubt-driven-development",
    description: "Adversarial review: CLAIM → EXTRACT → DOUBT → RECONCILE",
  },
  {
    name: "setup-graphify",
    description: "Install Graphify and build a knowledge graph of the current repository",
    body: PROMPTS.graphify,
  },
  {
    name: "setup-dynamic-context-pruning",
    description: "Install the OpenCode DCP plugin to auto-prune conversation context",
    body: PROMPTS.dcp,
  },
  {
    name: "setup-markitdown",
    description: "Install Microsoft markitdown to read PDFs and Office documents",
    body: PROMPTS.markitdown,
  },
  {
    name: "setup-context7",
    description: "Install Upstash Context7 for on-demand, version-specific library docs",
    body: PROMPTS.context7,
  },
  {
    name: "setup-exa",
    description: "Install the Exa MCP server for clean, ready-to-use web search",
    body: PROMPTS.exa,
  },
  {
    name: "setup-grep-app",
    description: "Install the grep.app MCP server to search real-world code on GitHub",
    body: PROMPTS.grepApp,
  },
  {
    name: "setup-agents-md",
    description: "Bootstrap a repo-root AGENTS.md from the operating-principles template",
    body: PROMPTS.agentsMd,
  },
];

export function isStandaloneCommand(mapping: CommandMapping): boolean {
  return typeof mapping.body === "string" && mapping.body.length > 0;
}

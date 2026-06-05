/**
 * Agent Switcher - Cycle between specialized agents with keyboard shortcuts
 * 
 * Shortcuts:
 *   Ctrl+Shift+1 → Herald (orchestrator)
 *   Ctrl+Shift+2 → Plan (planner)  
 *   Ctrl+Shift+3 → Build (executor)
 *   Ctrl+Shift+0 → Clear agent override
 *   Ctrl+Shift+Tab → Cycle forward
 *   Ctrl+Shift+Shift+Tab → Cycle backward
 * 
 * Shows current agent in footer status.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const STATUS_KEY = "agent-switcher";

interface AgentDefinition {
  id: string;
  name: string;
  shortcut: string;
  systemPrompt: string;
  description: string;
}

const AGENTS: AgentDefinition[] = [
  {
    id: "herald",
    name: "HERALD",
    shortcut: "ctrl+shift+1",
    description: "Orchestrator - coordinates explore → plan → execute → review",
    systemPrompt: `You are operating in HERALD mode - the orchestrator coordinator.

Your role:
- Receive user requests and assess scope (quick/medium/large)
- Delegate to specialized agents via subagent tool
- Route: Scout (explore) → Sage/Plan (plan) → Forge/Build (execute) → Ward/Arbiter (review)
- Present gates to user and wait for approval before proceeding
- NEVER write code or read files directly - delegate everything

Key behaviors:
- Use /agent switch to change modes
- Use subagent tool to delegate tasks
- Always use question tool for user confirmations
- Report findings and wait for approval before next step`,
  },
  {
    id: "plan",
    name: "PLAN",
    shortcut: "ctrl+shift+2",
    description: "Strategic planner using spec-driven methodology",
    systemPrompt: `You are operating in PLAN mode - the strategic planner.

Your role:
- Load spec-driven skill for structured planning
- Produce spec, design, and tasks artifacts
- Consume learnings from Scout exploration
- NEVER write code - only planning

Key behaviors:
- Use /agent switch to change modes
- Load spec-driven skill for methodology
- Return artifact content in JSON envelope
- Ask Herald to route to Forge when ready to execute`,
  },
  {
    id: "build",
    name: "BUILD",
    shortcut: "ctrl+shift+3",
    description: "Executor - the only agent that writes code",
    systemPrompt: `You are operating in BUILD mode - the executor.

Your role:
- Read tasks from .specs/ and write code
- Execute one task at a time, emit progress after each
- Mark tasks complete in tasks.md
- NEVER re-explore - the plan has all research

Key behaviors:
- Use /agent switch to change modes
- Execute tasks from tasks.md sequentially
- Mark checkboxes as done: - [ ] → - [x]
- Run tests/lint before marking task complete
- Propose commit message when done`,
  },
];

// Active agent (null = no override)
let activeAgentId: string | null = null;

function getActiveAgent(): AgentDefinition | null {
  if (!activeAgentId) return null;
  return AGENTS.find((a) => a.id === activeAgentId) || null;
}

function formatStatus(): string {
  const agent = getActiveAgent();
  if (!agent) return "";
  return `[${agent.name}]`;
}

function switchToAgent(agentId: string | null, ctx: any) {
  activeAgentId = agentId;
  
  const agent = getActiveAgent();
  if (agent) {
    ctx.ui.setStatus(STATUS_KEY, formatStatus());
    ctx.ui.notify(`Agent: ${agent.name} - ${agent.description}`, "info");
  } else {
    ctx.ui.setStatus(STATUS_KEY, "");
    ctx.ui.notify("Agent override cleared", "info");
  }
}

export default function (pi: ExtensionAPI) {
  // Register keyboard shortcuts for each agent
  AGENTS.forEach((agent, index) => {
    pi.registerShortcut(agent.shortcut, {
      description: `Switch to ${agent.name} (${agent.description})`,
      handler: (ctx) => switchToAgent(agent.id, ctx),
    });
  });

  // Clear override
  pi.registerShortcut("ctrl+shift+0", {
    description: "Clear agent override",
    handler: (ctx) => switchToAgent(null, ctx),
  });

  // Cycle forward (skip the "none" state)
  pi.registerShortcut("ctrl+shift+tab", {
    description: "Cycle to next agent",
    handler: (ctx) => {
      const agent = getActiveAgent();
      const currentIndex = agent ? AGENTS.findIndex((a) => a.id === agent.id) : -1;
      const nextIndex = (currentIndex + 1) % AGENTS.length;
      switchToAgent(AGENTS[nextIndex].id, ctx);
    },
  });

  // Cycle backward
  pi.registerShortcut("ctrl+shift+shift+tab", {
    description: "Cycle to previous agent",
    handler: (ctx) => {
      const agent = getActiveAgent();
      const currentIndex = agent ? AGENTS.findIndex((a) => a.id === agent.id) : 0;
      const prevIndex = (currentIndex - 1 + AGENTS.length) % AGENTS.length;
      switchToAgent(AGENTS[prevIndex].id, ctx);
    },
  });

  // Commands for explicit switching
  pi.registerCommand("herald", {
    description: "Switch to Herald (orchestrator)",
    handler: async (_args, ctx) => switchToAgent("herald", ctx),
  });

  pi.registerCommand("plan", {
    description: "Switch to Plan (planner)",
    handler: async (_args, ctx) => switchToAgent("plan", ctx),
  });

  pi.registerCommand("build", {
    description: "Switch to Build (executor)",
    handler: async (_args, ctx) => switchToAgent("build", ctx),
  });

  pi.registerCommand("agent-clear", {
    description: "Clear agent override",
    handler: async (_args, ctx) => switchToAgent(null, ctx),
  });

  // Show current agent on session start
  pi.on("session_start", async (_event, ctx) => {
    const agent = getActiveAgent();
    if (agent) {
      ctx.ui.setStatus(STATUS_KEY, formatStatus());
    }
  });

  // Inject agent system prompt on each turn
  pi.on("before_agent_start", async (event, ctx) => {
    const agent = getActiveAgent();
    if (!agent) return;

    return {
      systemPrompt: event.systemPrompt + "\n\n" + agent.systemPrompt,
    };
  });
}
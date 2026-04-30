/**
 * Custom tools for @runecraft/guild
 */

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { PluginInput } from "@opencode-ai/plugin";
import type { AgentStatusResult, DiscoveredSkill } from "./types.js";
import type { GuildConfig } from "./schema.js";
import type { WorkflowEngine } from "./workflows/engine.js";
import { resolveAgentConfig } from "./agents/resolver.js";
import type { CustomAgentsConfig } from "./agents/resolver.js";

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build tools map for the plugin
 */
export function buildTools(
  config: GuildConfig,
  ctx: PluginInput,
  discoveredSkills: DiscoveredSkill[] = [],
  workflowEngine?: WorkflowEngine
): Record<string, ReturnType<typeof tool>> {
  const tools: Record<string, ReturnType<typeof tool>> = {
    agent_status: tool({
      description:
        "Shows which agents are enabled/disabled and their assigned models",
      args: {},
      async execute(): Promise<string> {
        // Validate ctx.directory is within workspace bounds (MEDIUM-6)
        const normalizedDir = resolve(ctx.directory);
        const cwd = resolve(process.cwd());
        if (!normalizedDir.startsWith(cwd)) {
          return JSON.stringify({
            error: "Context directory is outside workspace bounds",
          }, null, 2);
        }

        let fileFound = false;
        const variantsPath = join(ctx.directory, ".agents/agent-variants.json");

        // Try to read agent-variants.json and extract only needed fields (LOW-4 quality fix)
        if (await fileExists(variantsPath)) {
          try {
            const content = await fs.readFile(variantsPath, "utf-8");
            const parsed = JSON.parse(content);
            fileFound = !!parsed; // Mark file as found
          } catch (error) {
            console.warn(
              "[guild] Failed to parse agent-variants.json:",
              error instanceof Error ? error.message : error
            );
          }
        }

        // Merge with guild config agent settings
        const result: AgentStatusResult = {
          agents: {
            herald: config?.agents?.herald || { enabled: true },
            scout: config?.agents?.scout || { enabled: true },
            sage: config?.agents?.sage || { enabled: true },
            forge: config?.agents?.forge || { enabled: true },
            ward: config?.agents?.ward || { enabled: false },
            arbiter: config?.agents?.arbiter || { enabled: false },
          },
        };

        // Add warning only if file was not found (MEDIUM-5 quality fix)
        if (!fileFound) {
          result.warning =
            "agent-variants.json not found; using config defaults";
        }

        return JSON.stringify(result, null, 2);
      },
    }),

    // V2: skills_status tool
    skills_status: tool({
      description:
        "List all discovered skills with metadata and validation status",
      args: {},
      async execute(): Promise<string> {
        // Resolve discovery paths
        const discoveryPaths = {
          global: "~/.config/opencode/skills/",
          legacy: "~/.config/opencode/.agents/skills/",
          project: ".agents/skills/",
        };

        return JSON.stringify(
          {
            skills: discoveredSkills,
            discovery_paths: discoveryPaths,
            errors: [],
          },
          null,
          2
        );
      },
    }),

    // V2: agent_config tool
    agent_config: tool({
      description: "Get resolved configuration for a named agent",
      args: {
        agent_name: z.string().describe("Name of the agent"),
       } as any, // Type assertion needed: Zod v4 minor version mismatch between project (v4.3.x) and @opencode-ai/plugin (v4.1.x) — internal _zod types differ
       async execute(input: { agent_name: string }): Promise<string> {
        const result = await resolveAgentConfig(
          input.agent_name,
          config.custom_agents as CustomAgentsConfig | undefined,
          discoveredSkills,
          ctx.directory
        );

        return JSON.stringify(result, null, 2);
      },
    }),
  };

  // V2: run_workflow tool (only if workflows configured)
  if (workflowEngine && config.workflows && Object.keys(config.workflows).length > 0) {
    tools.run_workflow = tool({
      description: "Execute or resume a declarative multi-agent workflow",
      args: {
        workflow: z.string().describe("Name of the workflow to execute"),
        goal: z.string().describe("High-level goal for the workflow"),
        resume_token: z
          .string()
          .optional()
          .describe("Token to resume paused workflow"),
        step_output: z
          .string()
          .optional()
          .describe("Output from previous step"),
        gate_decision: z
          .enum(["approve", "reject"])
          .optional()
           .describe("Decision for gate step"),
       } as any, // Type assertion needed: Zod v4 minor version mismatch between project (v4.3.x) and @opencode-ai/plugin (v4.1.x) — internal _zod types differ
       async execute(input: {
        workflow: string;
        goal: string;
        resume_token?: string;
        step_output?: string;
        gate_decision?: "approve" | "reject";
      }): Promise<string> {
        let response;

        if (input.resume_token) {
          response = await workflowEngine.resume(
            input.resume_token,
            input.step_output,
            input.gate_decision
          );
        } else {
          response = await workflowEngine.start(input.workflow, input.goal);
        }

        return JSON.stringify(response, null, 2);
      },
    });
  }

  return tools;
}

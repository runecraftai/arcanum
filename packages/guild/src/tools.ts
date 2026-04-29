/**
 * Custom tools for @runecraft/guild
 */

import { promises as fs } from "fs";
import { join } from "path";
import { tool } from "@opencode-ai/plugin";
import type { PluginInput } from "@opencode-ai/plugin";
import type { AgentStatusResult } from "./types.js";
import type { GuildConfig } from "./schema.js";

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
  ctx: PluginInput
): Record<string, ReturnType<typeof tool>> {
  return {
    agent_status: tool({
      description:
        "Shows which agents are enabled/disabled and their assigned models",
      args: {},
      async execute(): Promise<string> {
        let fileFound = false;
        const variantsPath = join(ctx.directory, ".agents/agent-variants.json");

        // Try to read agent-variants.json and extract only needed fields (LOW-4 quality fix)
        if (await fileExists(variantsPath)) {
          try {
            const content = await fs.readFile(variantsPath, "utf-8");
            const parsed = JSON.parse(content);
            fileFound = !!parsed; // Mark file as found
          } catch (error) {
            // Fall through to config-only data
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
  };
}

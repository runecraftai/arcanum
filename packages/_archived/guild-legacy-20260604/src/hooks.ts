/**
 * OpenCode hooks for @runecraft/guild
 */

import { promises as fs } from "fs";
import { join, resolve, relative } from "path";
import pc from "picocolors";
import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import type { GuildConfig } from "./schema.js";

/**
 * Graphify context reminder for tool execution
 */
const GRAPHIFY_REMINDER = `[graphify] Knowledge graph available. Consider reading graphify-out/GRAPH_REPORT.md for architecture context and god nodes before tool execution.`;

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
 * Build hooks object for the plugin
 */
export function buildHooks(
  config: GuildConfig,
  ctx: PluginInput,
  skillsReloader?: () => Promise<void>
): Partial<Hooks> {
  return {
    "tool.execute.before": async (input, output) => {
      if (!config.graphify || !config.graphify.enabled) return;

      // Validate reportPath doesn't escape worktree (HIGH-1 security fix)
      const reportPath = config.graphify.reportPath;
      const resolvedPath = resolve(ctx.worktree, reportPath);
      const relPath = relative(ctx.worktree, resolvedPath);
      
      // Skip if path escapes worktree (starts with ..) or is absolute
      if (relPath.startsWith("..")) return;

      try {
        const exists = await fileExists(resolvedPath);
        if (exists) {
          // Add graphify reminder to the output parts
          if (!output.args) output.args = {};
          output.args._graphify_context = GRAPHIFY_REMINDER;
        }
      } catch (error) {
        console.warn(
          "[guild] Failed to check graphify report:",
          error instanceof Error ? error.message : error
        );
      }
    },

    /**
     * Validate agent system on plugin init and re-discover skills
     */
    event: async (input) => {
      // Only validate on session start events (LOW-6 type safety fix)
      const event = input.event;
      if (
        typeof event !== "object" ||
        event === null ||
        !("type" in event) ||
        (event as Record<string, unknown>).type !== "session:start"
      ) {
        return;
      }

      const variantsPath = join(ctx.directory, ".agents/agent-variants.json");
      const exists = await fileExists(variantsPath);

      if (!exists) {
        console.warn(
          pc.yellow("[guild]"),
          "agent-variants.json not found at",
          variantsPath
        );
        console.warn(pc.dim("  → Agent routing may not work correctly."));
      } else {
        console.log(pc.dim("[guild] Agent system ready"));
      }

      // Re-discover skills on session start if auto_discover enabled
      if (
        skillsReloader &&
        config.skills?.auto_discover !== false
      ) {
        try {
          await skillsReloader();
        } catch (error) {
          console.warn(
            pc.yellow("[guild]"),
            "Failed to re-discover skills on session start:",
            error instanceof Error ? error.message : error
          );
        }
      }
    },
  };
}

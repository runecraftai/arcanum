/**
 * @runecraft/guild — OpenCode plugin for multi-agent coordination
 * Entry point: loads config, builds hooks and tools
 */

import type { Plugin } from "@opencode-ai/plugin";
import { loadConfig } from "./config.js";
import { buildHooks } from "./hooks.js";
import { buildTools } from "./tools.js";

// Re-export types
export type { GuildConfig } from "./schema.js";
export type { AgentName, AgentVariant, AgentStatusResult } from "./types.js";
export { GuildConfigSchema, generateJsonSchema } from "./schema.js";

/**
 * Guild plugin factory
 * Async initialization: loads config, returns hooks and tools
 */
export const GuildPlugin: Plugin = async (ctx) => {
  const config = await loadConfig(ctx.directory);

  return {
    ...buildHooks(config, ctx),
    tool: buildTools(config, ctx),
  };
};

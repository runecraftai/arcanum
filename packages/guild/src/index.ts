/**
 * @runecraft/guild — OpenCode plugin for multi-agent coordination
 * Entry point: loads config, builds hooks and tools, initializes V2 features
 */

import type { Plugin } from "@opencode-ai/plugin";
import { join } from "path";
import { loadConfig } from "./config.js";
import { buildHooks } from "./hooks.js";
import { buildTools } from "./tools.js";
import { discoverSkills } from "./skills/discovery.js";
import { WorkflowEngine } from "./workflows/engine.js";
import type { DiscoveredSkill } from "./types.js";

// Re-export types
export type { GuildConfig } from "./schema.js";
export type { AgentName, AgentVariant, AgentStatusResult } from "./types.js";
export type {
  DiscoveredSkill,
  SkillDiscoveryResult,
  ResolvedAgentConfig,
  WorkflowState,
  WorkflowResponse,
} from "./types.js";
export { GuildConfigSchema, generateJsonSchema } from "./schema.js";

/**
 * Guild plugin factory
 * Async initialization: loads config, initializes V2 features (skills, workflows),
 * builds hooks and tools
 */
export const GuildPlugin: Plugin = async (ctx) => {
  const config = await loadConfig(ctx.directory);

  // V2: Initialize skills discovery (cached in closure)
  let discoveredSkills: DiscoveredSkill[] = [];
  const skillsReloader = async () => {
    const result = await discoverSkills(
      config.skills || { auto_discover: true }
    );
    discoveredSkills = result.skills;

    // Log errors if any
    if (result.errors.length > 0) {
      console.warn("[guild] Skills discovery warnings:");
      result.errors.forEach((err) => console.warn(`  - ${err}`));
    }
  };

  // Initial skills discovery
  try {
    await skillsReloader();
  } catch (error) {
    console.warn("[guild] Failed to discover skills on init:", error);
  }

  // V2: Initialize workflow engine (if workflows configured)
  const sessionDir = join(ctx.directory, ".specs/sessions");
  const workflowEngine = new WorkflowEngine(
    config.workflows,
    sessionDir
  );

  return {
    ...buildHooks(config, ctx, skillsReloader),
    tool: buildTools(config, ctx, discoveredSkills, workflowEngine),
  };
};

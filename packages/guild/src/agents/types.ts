/**
 * Type definitions for agent configuration
 */

import type { DiscoveredSkill } from "../skills/types.js";

export interface ResolvedSkillRef {
  name: string;
  found: boolean;
  skill?: DiscoveredSkill;
}

export interface ResolvedAgentConfig {
  promptFile?: string;
  promptContent?: string;
  skills: ResolvedSkillRef[];
  model?: string;
}

export interface AgentConfigResult {
  found: boolean;
  config?: ResolvedAgentConfig;
  warnings: string[];
}

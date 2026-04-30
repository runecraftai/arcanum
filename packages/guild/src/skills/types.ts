/**
 * Type definitions for skill discovery
 */

export type SkillSource = "global" | "legacy" | "project";

export interface SkillFrontmatter {
  name: string;
  description?: string;
  category?: string;
  version?: string;
  tags?: string[];
  target_agents?: string[];
}

export interface DiscoveredSkill {
  name: string;
  description: string;
  category?: string;
  version?: string;
  tags: string[];
  filePath: string;
  source: SkillSource;
  targetAgents: string[];
  valid: boolean;
  validationErrors?: string[];
}

export interface SkillDiscoveryResult {
  skills: DiscoveredSkill[];
  errors: string[];
}

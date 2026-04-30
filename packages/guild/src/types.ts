/**
 * Type definitions for @runecraft/guild
 */

export type AgentName = "herald" | "scout" | "sage" | "forge" | "ward" | "arbiter";

export type AgentVariant = {
  enabled: boolean;
  model?: string;
};

export type AgentStatusResult = {
  agents: Record<AgentName, AgentVariant>;
  warning?: string;
};

// V2 type re-exports
export type {
  DiscoveredSkill,
  SkillDiscoveryResult,
  SkillFrontmatter,
  SkillSource,
} from "./skills/types.js";

export type {
  ResolvedAgentConfig,
  ResolvedSkillRef,
  AgentConfigResult,
} from "./agents/types.js";

export type {
  WorkflowState,
  WorkflowResponse,
  WorkflowStatus,
  StepResult,
  WorkflowStepDef,
} from "./workflows/types.js";

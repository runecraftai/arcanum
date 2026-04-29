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

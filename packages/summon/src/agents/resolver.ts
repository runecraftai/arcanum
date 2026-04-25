import { resolveAgentPath } from "../utils/paths";
import type { AgentConfig } from "./registry";

/**
 * Resolve the full install path for a given agent's skills
 */
export function resolveInstallPath(agent: AgentConfig): string {
  return resolveAgentPath(agent.installDir, agent.scope);
}

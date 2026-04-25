import { exists } from "../utils/fs";
import { resolveAgentPath } from "../utils/paths";
import { AGENTS } from "./registry";

export interface DetectedAgent {
  id: string;
  name: string;
  detected: boolean;
  installDir: string;
}

/**
 * Detect which agents are installed by checking their config paths
 */
export async function detectAgents(): Promise<DetectedAgent[]> {
  const results: DetectedAgent[] = [];

  for (const agent of AGENTS) {
    let detected = false;

    // Check all detection paths for this agent
    for (const detectPath of agent.detectPaths) {
      const resolvedPath = resolveAgentPath(detectPath, agent.scope);
      if (await exists(resolvedPath)) {
        detected = true;
        break;
      }
    }

    const installDir = resolveAgentPath(agent.installDir, agent.scope);

    results.push({
      id: agent.id,
      name: agent.name,
      detected,
      installDir,
    });
  }

  return results;
}

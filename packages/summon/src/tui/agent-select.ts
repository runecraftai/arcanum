import * as clack from "@clack/prompts";
import type { DetectedAgent } from "../agents/detector";

/**
 * Multi-select TUI for agent selection
 * Pre-selects detected agents, shows badges
 */
export async function selectAgents(
  detected: DetectedAgent[]
): Promise<DetectedAgent[]> {
  const options = detected.map((agent) => ({
    value: agent.id,
    label: agent.detected
      ? `✓ ${agent.name} (detected)`
      : `  ${agent.name}`,
    hint: agent.detected ? "Found" : "Not found",
  }));

  const selected = await clack.multiselect({
    message: "Select agents to install skills:",
    options,
    initialValues: detected.filter((a) => a.detected).map((a) => a.id),
  });

  if (clack.isCancel(selected)) {
    return [];
  }

  return detected.filter((agent) => selected.includes(agent.id));
}

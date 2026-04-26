import * as clack from "@clack/prompts";
import pc from "picocolors";
import { AGENTS } from "../agents/registry.js";
import type { DetectedAgent } from "../agents/detector.js";

/**
 * Multi-select TUI for agent selection
 * Shows all registered agents, pre-selects detected ones with visual indicator
 */
export async function selectAgents(
  detected: DetectedAgent[]
): Promise<string[] | symbol> {
  const detectedIds = detected.filter((a) => a.detected).map((a) => a.id);

  const options = AGENTS.map((agent) => ({
    value: agent.id,
    // Color detected agents for better visual distinction
    label: detectedIds.includes(agent.id)
      ? pc.green(agent.name)
      : agent.name,
    hint: detectedIds.includes(agent.id) ? "detected" : undefined,
  }));

  clack.note("↑↓ navigate   Space toggle   Enter confirm   Esc exit", "Keys");

  return clack.multiselect({
    message: "Where do you want to install skills?",
    options,
    initialValues: detectedIds,
    required: true,
  }) as Promise<string[] | symbol>;
}

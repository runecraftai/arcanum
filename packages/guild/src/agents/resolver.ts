/**
 * Agent configuration resolution and prompt file loading
 */

import { promises as fs } from "fs";
import { resolve } from "path";
import type { DiscoveredSkill } from "../skills/types.js";
import type { AgentConfigResult, ResolvedAgentConfig } from "./types.js";
import {
  validatePromptFilePath,
  validateSkillRefs,
} from "./validator.js";

export type CustomAgentsConfig = Record<
  string,
  {
    prompt_file?: string;
    skills?: string[];
    model?: string;
  }
>;

/**
 * Resolve agent configuration from custom_agents config section
 */
export async function resolveAgentConfig(
  agentName: string,
  customAgents: CustomAgentsConfig | undefined,
  discoveredSkills: DiscoveredSkill[],
  projectRoot: string
): Promise<AgentConfigResult> {
  if (!customAgents || !customAgents[agentName]) {
    return { found: false, warnings: [] };
  }

  const agentConfig = customAgents[agentName];
  const warnings: string[] = [];

  // Validate and load prompt_file
  let promptContent: string | undefined;
  let promptFile: string | undefined;

  if (agentConfig.prompt_file) {
    promptFile = agentConfig.prompt_file;
    const validation = validatePromptFilePath(promptFile, projectRoot);

    if (!validation.valid) {
      warnings.push(`prompt_file validation failed: ${validation.error}`);
    } else {
      try {
        const filePath = resolve(projectRoot, promptFile);
        promptContent = await fs.readFile(filePath, "utf-8");
      } catch (error) {
        warnings.push(
          `Failed to read prompt_file: ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }
  }

  // Validate skill references
  const { resolved: resolvedSkills, warnings: skillWarnings } = validateSkillRefs(
    agentConfig.skills,
    discoveredSkills
  );
  warnings.push(...skillWarnings);

  const config: ResolvedAgentConfig = {
    promptFile,
    promptContent,
    skills: resolvedSkills,
    model: agentConfig.model,
  };

  return {
    found: true,
    config,
    warnings,
  };
}

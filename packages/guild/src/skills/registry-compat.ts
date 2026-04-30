/**
 * Registry.json compatibility layer for legacy skill discovery
 * Only used in ~/.config/opencode/.agents/skills/ path
 */

import { promises as fs } from "fs";
import { join } from "path";
import { parse as parseJSONC } from "jsonc-parser";
import type { DiscoveredSkill, SkillFrontmatter } from "./types.js";

// Validate skill names to prevent path injection (MEDIUM-4)
const VALID_SKILL_NAME = /^[a-zA-Z0-9._-]{1,255}$/;

export interface RegistrySkillMeta {
  name?: string;
  description?: string;
  target_agents?: string[];
  [key: string]: any;
}

/**
 * Load registry.json from a directory if it exists
 */
export async function loadRegistry(
  dirPath: string
): Promise<Record<string, RegistrySkillMeta> | null> {
  const registryPath = join(dirPath, "registry.json");

  try {
    const content = await fs.readFile(registryPath, "utf-8");
    const parsed = parseJSONC(content);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(
        "[guild] Failed to parse registry.json at",
        registryPath,
        error instanceof Error ? error.message : error
      );
    }
    return null;
  }
}

/**
 * Merge registry metadata into legacy-scanned skills
 * Registry metadata takes precedence over frontmatter within the legacy source
 */
export async function mergeRegistryMetadata(
  legacySkills: DiscoveredSkill[],
  registry: Record<string, RegistrySkillMeta> | null,
  dirPath: string
): Promise<DiscoveredSkill[]> {
  if (!registry) return legacySkills;

  const merged = legacySkills.map((skill) => {
    const registryEntry = registry[skill.name];
    if (!registryEntry) return skill;

    // Registry metadata overwrites frontmatter within legacy source
    return {
      ...skill,
      name: registryEntry.name || skill.name,
      description: registryEntry.description || skill.description,
      targetAgents: registryEntry.target_agents || skill.targetAgents,
    };
  });

  // For skills only in registry (not already scanned):
  // Attempt to load file and create DiscoveredSkill
  const scannedNames = new Set(legacySkills.map((s) => s.name));
  for (const [registryName, registryMeta] of Object.entries(registry)) {
    if (scannedNames.has(registryName)) continue;

    // Validate registry skill name to prevent path injection (MEDIUM-4)
    if (!VALID_SKILL_NAME.test(registryName)) {
      // Silently skip invalid skill names
      continue;
    }

    // Try to find corresponding .md file
    const mdFile = join(dirPath, `${registryName}.md`);
    try {
      await fs.access(mdFile);
      merged.push({
        name: registryMeta.name || registryName,
        description: registryMeta.description || "",
        tags: [],
        filePath: mdFile,
        source: "legacy",
        targetAgents: registryMeta.target_agents || [],
        valid: true,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(
          "[guild] Failed to access skill file:",
          mdFile,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  return merged;
}

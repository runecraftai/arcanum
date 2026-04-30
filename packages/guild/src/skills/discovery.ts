/**
 * Skills discovery: scan filesystem for skill files and parse metadata
 */

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import type {
  DiscoveredSkill,
  SkillDiscoveryResult,
  SkillFrontmatter,
  SkillSource,
} from "./types.js";

/**
 * Strict tilde expansion with validation (HIGH-3)
 * Ensures ~ is only at the start of the path
 */
function expandTilde(dirPath: string): string {
  if (dirPath === "~") return homedir();
  if (dirPath.startsWith("~/")) return join(homedir(), dirPath.slice(2));
  if (dirPath.startsWith("~")) throw new Error(`Invalid tilde path: ${dirPath}`);
  return dirPath; // already absolute or relative
}

/**
 * Parse YAML-like frontmatter from markdown content
 * Expects format:
 * ---
 * name: skill-name
 * description: A description
 * tags: [tag1, tag2]
 * target_agents: [sage, forge]
 * ---
 */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  // Extract content between first pair of --- markers
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatterText = match[1];
  const result: Partial<SkillFrontmatter> = {};
  const lines = frontmatterText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse key: value pairs
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.substring(0, colonIdx).trim();
    const valueStr = trimmed.substring(colonIdx + 1).trim();

    // Handle arrays: [item1, item2]
    if (valueStr.startsWith("[") && valueStr.endsWith("]")) {
      const arrayContent = valueStr.slice(1, -1);
      const items = arrayContent
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (key === "tags") {
        result.tags = items;
      } else if (key === "target_agents") {
        result.target_agents = items;
      }
    } else {
      // Handle scalar values
      if (key === "name") result.name = valueStr;
      else if (key === "description") result.description = valueStr;
      else if (key === "category") result.category = valueStr;
      else if (key === "version") result.version = valueStr;
    }
  }

  // Validate required fields (name)
  if (!result.name) return null;

  return result as SkillFrontmatter;
}

/**
 * Scan a directory for .md skill files
 */
export async function scanDirectory(
  dirPath: string,
  source: SkillSource
): Promise<DiscoveredSkill[]> {
  // Resolve ~ to home directory with strict validation (HIGH-3)
  const resolvedPath = expandTilde(dirPath);

  try {
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    const skills: DiscoveredSkill[] = [];

    for (const entry of entries) {
      // Only process .md files
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      // Skip special files
      if (entry.name === "README.md" || entry.name === "registry.json") continue;

      const filePath = join(resolvedPath, entry.name);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const frontmatter = parseFrontmatter(content);

        if (!frontmatter) {
          skills.push({
            name: entry.name.replace(/\.md$/, ""),
            description: "",
            tags: [],
            filePath,
            source,
            targetAgents: [],
            valid: false,
            validationErrors: ["Missing or invalid frontmatter"],
          });
          continue;
        }

        skills.push({
          name: frontmatter.name,
          description: frontmatter.description || "",
          category: frontmatter.category,
          version: frontmatter.version,
          tags: frontmatter.tags || [],
          filePath,
          source,
          targetAgents: frontmatter.target_agents || [],
          valid: true,
        });
      } catch (error) {
        skills.push({
          name: entry.name.replace(/\.md$/, ""),
          description: "",
          tags: [],
          filePath,
          source,
          targetAgents: [],
          valid: false,
          validationErrors: [
            `Failed to read file: ${error instanceof Error ? error.message : "unknown error"}`,
          ],
        });
      }
    }

    return skills;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(
        "[guild] Failed to scan skills directory:",
        resolvedPath,
        error instanceof Error ? error.message : error
      );
    }
    return [];
  }
}

/**
 * Main skill discovery orchestrator
 */
export async function discoverSkills(config: {
  auto_discover?: boolean;
  paths?: {
    global?: string;
    legacy?: string;
    project?: string;
  };
}): Promise<SkillDiscoveryResult> {
  const { loadRegistry, mergeRegistryMetadata } = await import(
    "./registry-compat.js"
  );
  const errors: string[] = [];

  // Resolve default paths
  const paths = {
    global: config.paths?.global || "~/.config/opencode/skills/",
    legacy: config.paths?.legacy || "~/.config/opencode/.agents/skills/",
    project: config.paths?.project || ".agents/skills/",
  };

  // Resolve project path relative to cwd with strict validation (HIGH-3)
  const projectPath = expandTilde(paths.project);

  // Scan in order: global → legacy → project (priority: project > legacy > global)
  const globalSkills = await scanDirectory(paths.global, "global");
  let legacySkills = await scanDirectory(paths.legacy, "legacy");

  // Merge registry metadata for legacy path with strict validation (HIGH-3)
  const legacyDir = expandTilde(paths.legacy);
  const registry = await loadRegistry(legacyDir);
  legacySkills = await mergeRegistryMetadata(legacySkills, registry, legacyDir);

  const projectSkills = await scanDirectory(projectPath, "project");

  const allSkills = [...globalSkills, ...legacySkills, ...projectSkills];

  // Deduplicate by name: project > legacy > global
  const skillsByName = new Map<string, DiscoveredSkill>();

  for (const skill of allSkills) {
    const existing = skillsByName.get(skill.name);
    if (!existing) {
      skillsByName.set(skill.name, skill);
    } else {
      // Check priority: project (3) > legacy (2) > global (1)
      const sourceOrder = { project: 3, legacy: 2, global: 1 };
      if (sourceOrder[skill.source] > sourceOrder[existing.source]) {
        skillsByName.set(skill.name, skill);
      }
    }
  }

  const uniqueSkills = Array.from(skillsByName.values());

  // Collect validation errors
  for (const skill of uniqueSkills) {
    if (!skill.valid && skill.validationErrors) {
      errors.push(`Skill "${skill.name}": ${skill.validationErrors.join("; ")}`);
    }
  }

  return {
    skills: uniqueSkills,
    errors,
  };
}

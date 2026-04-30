/**
 * Validation for agent configuration paths and skill references
 */

import { promises as fs } from "fs";
import { resolve, relative } from "path";
import type { DiscoveredSkill, SkillSource } from "../skills/types.js";
import type { ResolvedSkillRef } from "./types.js";

/**
 * Validate prompt_file path for path traversal and security issues
 * Rules:
 * 1. Must be relative (no leading /)
 * 2. Must not contain .. segments
 * 3. Must not contain null bytes
 * 4. Resolved path must be within project root
 * 5. Must end in .md
 * 6. File must exist and be readable
 */
export function validatePromptFilePath(
  filePath: string,
  projectRoot: string
): { valid: boolean; error?: string } {
  // Rule 1: Must be relative
  if (filePath.startsWith("/")) {
    return { valid: false, error: "Path must be relative (no leading /)" };
  }

  // Rule 3: No null bytes
  if (filePath.includes("\0")) {
    return { valid: false, error: "Path contains null bytes" };
  }

  // Rule 2: No .. segments
  if (filePath.includes("..")) {
    return {
      valid: false,
      error: 'Path contains ".." segments (path traversal not allowed)',
    };
  }

  // Rule 5: Must end in .md
  if (!filePath.endsWith(".md")) {
    return { valid: false, error: "Path must end in .md" };
  }

  // Rule 4: Resolved path must be within project root
  const resolvedPath = resolve(projectRoot, filePath);
  const relFromRoot = relative(projectRoot, resolvedPath);

  if (relFromRoot.startsWith("..")) {
    return {
      valid: false,
      error: "Resolved path escapes project root",
    };
  }

  return { valid: true };
}

/**
 * Validate skill references against discovered skills
 */
export function validateSkillRefs(
  skillNames: string[] | undefined,
  discoveredSkills: DiscoveredSkill[]
): { resolved: ResolvedSkillRef[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!skillNames || skillNames.length === 0) {
    return { resolved: [], warnings };
  }

  const skillMap = new Map(discoveredSkills.map((s) => [s.name, s]));
  const resolved: ResolvedSkillRef[] = [];

  for (const skillName of skillNames) {
    const skill = skillMap.get(skillName);
    if (skill) {
      resolved.push({ name: skillName, found: true, skill });
    } else {
      resolved.push({ name: skillName, found: false });
      warnings.push(
        `Skill '${skillName}' referenced in custom_agents but not discovered`
      );
    }
  }

  return { resolved, warnings };
}

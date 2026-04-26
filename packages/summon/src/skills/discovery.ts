import path from "node:path";
import * as nodeFs from "node:fs/promises";
import { exists, isSymlink } from "../utils/fs";
import { detectAgents } from "../agents/detector";
import { sanitizeSkillName } from "./loader";
import type { SkillMeta } from "./loader";
import type { DetectedAgent } from "../agents/detector";

export type InstallMethod = "copy" | "symlink";

export interface InstalledSkill {
  skillName: string;
  agentId: string;
  filePath: string;
  method: InstallMethod;
}

/**
 * Discover installed skills by scanning agent directories
 * Scans for subdirectories containing SKILL.md (e.g., skills/spec-driven/SKILL.md)
 * Falls back to flat .md files for legacy compatibility
 * Returns detected skills with installation method (symlink vs copy)
 */
export async function discoverInstalledSkills(): Promise<InstalledSkill[]> {
  const installed: InstalledSkill[] = [];
  const detectedAgents = await detectAgents();

  for (const agent of detectedAgents) {
    if (!agent.detected) continue;

    try {
      // Scan agent's install directory for skill subdirectories
      let entries: string[] = [];

      try {
        entries = await nodeFs.readdir(agent.installDir);
      } catch {
        // Directory might not exist yet
        continue;
      }

      for (const entry of entries) {
        const entryPath = path.join(agent.installDir, entry);

        try {
          const entryStat = await nodeFs.lstat(entryPath);

          if (entryStat.isDirectory()) {
            // Check for SKILL.md in subdirectory (new structure)
            const skillFilePath = path.join(entryPath, "SKILL.md");
            try {
              const skillStat = await nodeFs.lstat(skillFilePath);
              const rawName = entry;
              const skillName = sanitizeSkillName(rawName);
              if (!skillName) continue;

              const method: "copy" | "symlink" = (await isSymlink(skillFilePath))
                ? "symlink"
                : "copy";

              installed.push({
                skillName,
                agentId: agent.id,
                filePath: skillFilePath,
                method,
              });
            } catch {
              // No SKILL.md in this subdirectory, skip
            }
          } else if (entry.endsWith(".md")) {
            // Legacy flat .md file structure
            const rawName = entry.replace(/\.md$/, "");
            const skillName = sanitizeSkillName(rawName);
            if (!skillName) continue;

            const method: "copy" | "symlink" = (await isSymlink(entryPath))
              ? "symlink"
              : "copy";

            installed.push({
              skillName,
              agentId: agent.id,
              filePath: entryPath,
              method,
            });
          }
        } catch {
          // Skip unreadable entries
        }
      }
    } catch (err) {
      // Skip agents with read errors
      console.warn(`Warning: Could not scan agent ${agent.id}: ${String(err)}`);
    }
  }

  return installed;
}

export async function getInstalledSkillNames(agents: DetectedAgent[]): Promise<string[]> {
  const installed = await discoverInstalledSkills();
  // Filter to only skills on the selected agents
  const relevantSkills = installed.filter(s => 
    agents.some(a => a.id === s.agentId)
  );
  const names = relevantSkills.map(s => s.skillName);
  return [...new Set(names)];
}

/**
 * Normalize skill name for comparison (lowercase, trim whitespace, hyphenate)
 * Ensures catalog names (e.g., "Spec-Driven Planning") match installed directory names (e.g., "spec-driven")
 */
function normalizeSkillName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

export function filterSkillsByInstallStatus(
  allSkills: SkillMeta[],
  installedNames: string[],
  action: 'install' | 'update' | 'remove'
): SkillMeta[] {
  // Normalize installed names once for efficient comparison
  const normalizedInstalled = installedNames.map(normalizeSkillName);

  if (action === 'install') {
    return allSkills.filter(s => !normalizedInstalled.includes(normalizeSkillName(s.name)));
  }
  // update or remove: only show installed skills
  return allSkills.filter(s => normalizedInstalled.includes(normalizeSkillName(s.name)));
}

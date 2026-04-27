import path from "node:path";
import * as nodeFs from "node:fs/promises";
import { exists, isSymlink } from "../utils/fs";
import { SKILLS_DIR, SKILL_MANIFEST } from "../constants";
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
  broken?: boolean; // true if symlink is broken (target doesn't exist)
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
      let entries: string[] = [];

      try {
        entries = await nodeFs.readdir(agent.installDir);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const entryPath = path.join(agent.installDir, entry);

        try {
          const entryStat = await nodeFs.lstat(entryPath);

          if (entryStat.isDirectory()) {
            const skillFilePath = path.join(entryPath, SKILL_MANIFEST);
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
            } catch {}
          } else if (entry.endsWith(".md")) {
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
        } catch {}
      }
    } catch (err) {
      console.warn(`Warning: Could not scan agent ${agent.id}: ${String(err)}`);
    }
  }

  return installed;
}

/**
 * Discover hub-managed skills by scanning .agents/skills/ directory
 * Returns array of hub-managed skill entries with metadata
 * Handles missing .agents/skills/ dir gracefully (returns empty array)
 * Detects broken symlinks
 */
export async function discoverHubSkills(
  projectRoot: string = process.cwd()
): Promise<InstalledSkill[]> {
  const hubSkills: InstalledSkill[] = [];
  const hubDir = path.join(projectRoot, SKILLS_DIR);

  if (!(await exists(hubDir))) {
    return hubSkills;
  }

  try {
    const entries = await nodeFs.readdir(hubDir);

    for (const entry of entries) {
      const entryPath = path.join(hubDir, entry);

      try {
        const entryStat = await nodeFs.lstat(entryPath);

        if (!entryStat.isDirectory()) continue;

        const skillFilePath = path.join(entryPath, SKILL_MANIFEST);
        const skillMetaPath = path.join(entryPath, ".skill-meta.json");

        const skillExists = await exists(skillFilePath);
        const skillIsSymlink = await isSymlink(skillFilePath);

        if (!skillExists && !skillIsSymlink) {
          continue;
        }

        const skillName = sanitizeSkillName(entry);
        if (!skillName) continue;

        let isBroken = false;
        if (skillIsSymlink) {
          try {
            const linkTarget = await nodeFs.readlink(skillFilePath);
            const resolvedTarget = path.resolve(entryPath, linkTarget);
            try {
              await nodeFs.stat(resolvedTarget);
            } catch {
              isBroken = true;
            }
          } catch {
            isBroken = true;
          }
        }

        hubSkills.push({
          skillName,
          agentId: "hub",
          filePath: skillFilePath,
          method: "symlink",
          broken: isBroken,
        });
      } catch {}
    }
  } catch (err) {
    console.warn(
      `Warning: Could not scan hub skills directory: ${String(err)}`
    );
  }

  return hubSkills;
}

export async function getInstalledSkillNames(agents: DetectedAgent[]): Promise<string[]> {
  const installed = await discoverInstalledSkills();
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
  const normalizedInstalled = installedNames.map(normalizeSkillName);

  if (action === 'install') {
    return allSkills.filter(s => !normalizedInstalled.includes(normalizeSkillName(s.name)));
  }
  return allSkills.filter(s => normalizedInstalled.includes(normalizeSkillName(s.name)));
}

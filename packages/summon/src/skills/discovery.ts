import path from "node:path";
import * as nodeFs from "node:fs/promises";
import { exists, isSymlink } from "../utils/fs";
import { detectAgents } from "../agents/detector";
import { sanitizeSkillName } from "./loader";
import type { SkillMeta } from "./loader";

export type InstallMethod = "copy" | "symlink";

export interface InstalledSkill {
  skillName: string;
  agentId: string;
  filePath: string;
  method: InstallMethod;
}

/**
 * Discover installed skills by scanning agent directories
 * Returns detected skills with installation method (symlink vs copy)
 */
export async function discoverInstalledSkills(): Promise<InstalledSkill[]> {
  const installed: InstalledSkill[] = [];
  const detectedAgents = await detectAgents();

  for (const agent of detectedAgents) {
    if (!agent.detected) continue;

     try {
       // Scan agent's install directory for .md files
       let files: string[] = [];

       try {
         files = await nodeFs.readdir(agent.installDir);
       } catch {
         // Directory might not exist yet
         continue;
       }

      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const filePath = path.join(agent.installDir, file);
        const rawName = file.replace(/\.md$/, "");
        const skillName = sanitizeSkillName(rawName);
        if (!skillName) continue;

        let method: "copy" | "symlink" = "copy";
        try {
          method = (await isSymlink(filePath)) ? "symlink" : "copy";
        } catch {
          // file changed between readdir and stat — skip
          continue;
        }

        installed.push({
          skillName,
          agentId: agent.id,
          filePath,
          method,
        });
      }
    } catch (err) {
      // Skip agents with read errors
      console.warn(`Warning: Could not scan agent ${agent.id}: ${String(err)}`);
    }
  }

  return installed;
}

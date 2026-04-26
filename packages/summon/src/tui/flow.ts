import path from "node:path";
import * as clack from "@clack/prompts";
import { showBanner } from "./banner.js";
import { selectAgents } from "./agent-select.js";
import { selectAction } from "./action-menu.js";
import { browseSkills } from "./skill-browse.js";
import { selectMethod } from "./method-select.js";
import { selectScope } from "./scope-select.js";
import { showConfirmation } from "./confirmation.js";
import { showProgress, withSpinner } from "./progress.js";
import { detectAgents } from "../agents/detector.js";
import { AGENTS } from "../agents/registry.js";
import { loadSkillCatalog } from "../skills/loader.js";
import {
  discoverInstalledSkills,
  getInstalledSkillNames,
  filterSkillsByInstallStatus,
} from "../skills/discovery.js";
import { installSkill, updateSkill, removeSkill } from "../skills/installer.js";
import { resolveSpellsDir } from "../utils/paths.js";
import type { InstallResult } from "../skills/installer.js";
import type { SkillMeta } from "../skills/loader.js";
import type { DetectedAgent } from "../agents/detector.js";



export async function runInteractiveFlow(): Promise<void> {
  showBanner();

  // Detect agents once up front
  const spinner = clack.spinner();
  spinner.start("Detecting agents...");
  const detected = await detectAgents();
  const detectedCount = detected.filter((a) => a.detected).length;
  spinner.stop(
    `${detectedCount} agent${detectedCount !== 1 ? "s" : ""} detected`
  );

  // Load spells dir once up front
  const spellsDir = await resolveSpellsDir();

  // State
  let step = 1;
  let selectedAgentIds: string[] | undefined;
  let selectedAgents: DetectedAgent[] = [];
  let action: string | undefined;
  let allSkills: SkillMeta[] = [];
  let installedNames: string[] = [];
  let filteredSkills: SkillMeta[] = [];
  let selectedSkillNames: string[] | undefined;
  let selectedSkills: SkillMeta[] = [];
  let method: string | undefined;
  let scope: string | undefined;

  while (true) {
    // ── Step 1: Agent selection ──────────────────────────────────────────
    if (step === 1) {
      const result = await selectAgents(detected);
      if (clack.isCancel(result)) {
        clack.outro("Cancelled.");
        return;
      }
      selectedAgentIds = result as string[];
      selectedAgents = detected.filter((a) => selectedAgentIds!.includes(a.id));
      step = 2;
    }

    // ── Step 2: Action ───────────────────────────────────────────────────
     else if (step === 2) {
       const result = await selectAction();
       if (clack.isCancel(result)) {
         step = 1;
         continue;
       }
       action = result;
       step = 3;
     }

    // ── Step 3: Skill browse ─────────────────────────────────────────────
     else if (step === 3) {
       // Load/refresh skills for the current agent selection
       const spinner2 = clack.spinner();
       spinner2.start("Loading skills...");
       allSkills = await loadSkillCatalog(spellsDir);
       installedNames = await getInstalledSkillNames(selectedAgents);
       spinner2.stop("Skills loaded");

       filteredSkills = filterSkillsByInstallStatus(
         allSkills,
         installedNames,
         action as "install" | "update" | "remove"
       );

       const result = await browseSkills(
         filteredSkills,
         action as "install" | "update" | "remove",
         installedNames
       );

       if (clack.isCancel(result)) {
         step = 2;
         continue;
       }
       if (!Array.isArray(result) || result.length === 0) {
         clack.outro("Nothing to do.");
         return;
       }
       selectedSkillNames = result;
       selectedSkills = filteredSkills.filter((s) =>
         selectedSkillNames!.includes(s.name)
       );
       step = action === "install" ? 4 : 6;
     }

     // ── Step 4: Method (install only) ────────────────────────────────────
      else if (step === 4) {
        const result = await selectMethod();
        if (clack.isCancel(result)) {
          step = 3;
          continue;
        }
        method = result;
        step = method === "copy" ? 5 : 6;
      }

     // ── Step 5: Scope (install + copy only) ──────────────────────────────
      else if (step === 5) {
        const result = await selectScope();
        if (clack.isCancel(result)) {
          step = 4;
          continue;
        }
        scope = result as string;
        step = 6;
      }

    // ── Step 6: Confirmation ─────────────────────────────────────────────
     else if (step === 6) {
       const result = await showConfirmation({
         agents: selectedAgents.map((a) => a.name),
         skills: selectedSkills.map((s) => s.name),
         action: action as string,
         method,
         scope,
       });

       if (clack.isCancel(result) || result === "back") {
         // back from confirmation goes to last applicable step
         if (action === "install" && method === "copy") step = 5;
         else if (action === "install") step = 4;
         else step = 3;
         continue;
       }
       if (result === "cancel") {
         clack.outro("Aborted.");
         return;
       }

      // ── Execute ──────────────────────────────────────────────────────────
      const results: InstallResult[] = [];

      // Pre-discover installed skills for update/remove actions
      const installed =
        action === "update" || action === "remove"
          ? await discoverInstalledSkills()
          : [];

      for (const agent of selectedAgents) {
        for (const skill of selectedSkills) {
          try {
            if (action === "install") {
              const skillSourcePath = path.join(spellsDir, skill.name, "SKILL.md");
              const res = await installSkill(
                skill,
                skillSourcePath,
                agent.installDir,
                method as "copy" | "symlink",
                agent.id
              );
              results.push(res);
            } else if (action === "update") {
              const installedSkill = installed.find(
                (s) => s.skillName === skill.name && s.agentId === agent.id
              );
              if (installedSkill) {
                const skillSourcePath = path.join(spellsDir, skill.name, "SKILL.md");
                const res = await updateSkill(
                  skill,
                  skillSourcePath,
                  installedSkill.filePath,
                  installedSkill.method,
                  installedSkill.agentId
                );
                results.push(res);
              }
            } else if (action === "remove") {
              const installedSkill = installed.find(
                (s) => s.skillName === skill.name && s.agentId === agent.id
              );
              if (installedSkill) {
                const res = await removeSkill(
                  installedSkill.skillName,
                  installedSkill.filePath,
                  installedSkill.agentId
                );
                results.push(res);
              }
            }
          } catch (err) {
            results.push({
              skillName: skill.name,
              agentId: agent.id,
              success: false,
              method: method as "copy" | "symlink" | undefined,
              error:
                err instanceof Error
                  ? err.message
                  : String(err || "Unknown error"),
            });
          }
        }
      }

      await showProgress(results);
      clack.outro("Done!");
      return;
    }
  }
}

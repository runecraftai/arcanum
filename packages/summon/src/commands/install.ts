import path from "node:path";
import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import { showBanner } from "../tui/banner";
import { selectAgents } from "../tui/agent-select";
import { selectAction, type Action } from "../tui/action-menu";
import { browseSkills } from "../tui/skill-browse";
import { selectMethod } from "../tui/method-select";
import { showProgress, withSpinner } from "../tui/progress";
import { detectAgents } from "../agents/detector";
import { loadSkillCatalog } from "../skills/loader";
import { installSkill, removeSkill, updateSkill } from "../skills/installer";
import { discoverInstalledSkills } from "../skills/discovery";
import { resolveSpellsDir } from "../utils/paths";
import { AGENTS } from "../agents/registry";
import type { InstallResult } from "../skills/installer";

export default defineCommand({
  meta: {
    name: "install",
    description: "Install agent skills interactively",
  },
  async run() {
    showBanner();

    try {
      // Step 1: Detect agents
      const detected = await withSpinner("Detecting agents...", () =>
        detectAgents()
      );

      const detectedCount = detected.filter((a) => a.detected).length;
      if (detectedCount === 0) {
        clack.log.warn("No agents detected on this system.");
        clack.log.info("");
        clack.log.info("Supported agents:");
        for (const agent of AGENTS) {
          clack.log.info(`  • ${agent.name}`);
        }
        clack.log.info("");
        clack.log.info(
          "Install one and try again, or proceed to set up skills anyway."
        );
        clack.log.info("");

        const proceed = await clack.confirm({
          message: "Continue anyway?",
          initialValue: false,
        });

        if (clack.isCancel(proceed) || !proceed) {
          clack.outro("Cancelled.");
          return;
        }
      }

      // Step 2: Select agents
      const selectedAgents = await selectAgents(detected);
      if (selectedAgents.length === 0) {
        clack.outro("Cancelled.");
        return;
      }

      // Step 3: Action menu
      const action = await selectAction();
      if (!action) {
        clack.outro("Cancelled.");
        return;
      }

      const spellsDir = await resolveSpellsDir();

      if (action === "install") {
        // Install flow
        const catalog = await withSpinner("Loading skill catalog...", () =>
          loadSkillCatalog(spellsDir)
        );

        if (catalog.length === 0) {
          clack.log.error(`No skills found in ${spellsDir}`);
          clack.outro("Failed.");
          return;
        }

        // Browse and select skills
        const selectedSkills = await browseSkills(catalog);
        if (selectedSkills.length === 0) {
          clack.outro("Cancelled.");
          return;
        }

        // Select method
        const method = await selectMethod();
        if (!method) {
          clack.outro("Cancelled.");
          return;
        }

        // Execute installations
        const results: InstallResult[] = [];

        for (const agent of selectedAgents) {
           for (const skill of selectedSkills) {
             const skillSourcePath = path.join(
               spellsDir,
               skill.name,
               "SKILL.md"
             );
             const result = await installSkill(
               skill,
               skillSourcePath,
               agent.installDir,
               method,
               agent.id
             );
             results.push(result);
           }
         }

        await showProgress(results);

        const successCount = results.filter((r) => r.success).length;
        if (successCount === results.length) {
          clack.outro("✓ All skills installed!");
        } else {
          clack.outro(
            `⚠ ${successCount}/${results.length} skills installed.`
          );
        }
      } else if (action === "update") {
        // Update flow
        const installed = await withSpinner(
          "Discovering installed skills...",
          () => discoverInstalledSkills()
        );

        if (installed.length === 0) {
          clack.log.info("No skills installed.");
          clack.outro("Nothing to update.");
          return;
        }

        const confirm = await clack.confirm({
          message: `Update ${installed.length} installed skill(s)?`,
          initialValue: true,
        });

        if (clack.isCancel(confirm) || !confirm) {
          clack.outro("Cancelled.");
          return;
        }

        // Load catalog to get skill metadata
        const catalog = await loadSkillCatalog(spellsDir);
        const results: InstallResult[] = [];

         for (const installedSkill of installed) {
           const skill = catalog.find((s) => s.name === installedSkill.skillName);
           if (!skill) {
             clack.log.warn(`Skill "${installedSkill.skillName}" not found in catalog — skipping`);
             continue;
           }

           const skillSourcePath = path.join(
             spellsDir,
             skill.name,
             "SKILL.md"
           );
           const result = await updateSkill(
             skill,
             skillSourcePath,
             installedSkill.filePath,
             installedSkill.method,
             installedSkill.agentId
           );
           results.push(result);
         }

        await showProgress(results);

        const successCount = results.filter((r) => r.success).length;
        if (successCount === results.length) {
          clack.outro("✓ All skills updated!");
        } else {
          clack.outro(
            `⚠ ${successCount}/${results.length} skills updated.`
          );
        }
      } else if (action === "remove") {
        // Remove flow
        const installed = await withSpinner(
          "Discovering installed skills...",
          () => discoverInstalledSkills()
        );

        if (installed.length === 0) {
          clack.log.info("No skills installed.");
          clack.outro("Nothing to remove.");
          return;
        }

        // Multi-select which skills to remove
        const skillsToRemove = await clack.multiselect({
          message: "Select skills to remove:",
          options: installed.map((s) => ({
            value: s.skillName,
            label: `${s.skillName} (from ${s.agentId})`,
          })),
        });

        if (clack.isCancel(skillsToRemove) || skillsToRemove.length === 0) {
          clack.outro("Cancelled.");
          return;
        }

        const confirm = await clack.confirm({
          message: `Remove ${skillsToRemove.length} skill(s)?`,
          initialValue: true,
        });

        if (clack.isCancel(confirm) || !confirm) {
          clack.outro("Cancelled.");
          return;
        }

        const results: InstallResult[] = [];

         for (const installedSkill of installed) {
           if (skillsToRemove.includes(installedSkill.skillName)) {
             const result = await removeSkill(
               installedSkill.skillName,
               installedSkill.filePath,
               installedSkill.agentId
             );
             results.push(result);
           }
         }

        await showProgress(results);

        const successCount = results.filter((r) => r.success).length;
        if (successCount === results.length) {
          clack.outro("✓ All skills removed!");
        } else {
          clack.outro(
            `⚠ ${successCount}/${results.length} skills removed.`
          );
        }
      }
    } catch (error) {
      clack.log.error(`Error: ${String(error)}`);
      clack.outro("Failed.");
    }
  },
});

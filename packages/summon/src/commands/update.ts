import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import path from "node:path";
import { showProgress, withSpinner } from "../tui/progress";
import { loadSkillCatalog } from "../skills/loader";
import { discoverInstalledSkills } from "../skills/discovery";
import { updateSkill } from "../skills/installer";
import { resolveSpellsDir } from "../utils/paths";
import type { InstallResult } from "../skills/installer";

export default defineCommand({
  meta: {
    name: "update",
    description: "Update all installed agent skills",
  },
  async run() {
    try {
      clack.intro("Updating skills...");

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

      const spellsDir = await resolveSpellsDir();
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
        clack.outro(`⚠ ${successCount}/${results.length} skills updated.`);
      }
    } catch (error) {
      clack.log.error(`Error: ${String(error)}`);
      clack.outro("Failed.");
    }
  },
});

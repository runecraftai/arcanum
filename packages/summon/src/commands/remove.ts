import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import { showProgress, withSpinner } from "../tui/progress";
import { discoverInstalledSkills } from "../skills/discovery";
import { removeSkill } from "../skills/installer";
import type { InstallResult } from "../skills/installer";

export default defineCommand({
  meta: {
    name: "remove",
    description: "Remove installed agent skills",
  },
  async run() {
    try {
      clack.intro("Removing skills...");

      const installed = await withSpinner(
        "Discovering installed skills...",
        () => discoverInstalledSkills()
      );

      if (installed.length === 0) {
        clack.log.info("No skills installed.");
        clack.outro("Nothing to remove.");
        return;
      }

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
        clack.outro(`⚠ ${successCount}/${results.length} skills removed.`);
      }
    } catch (error) {
      clack.log.error(`Error: ${String(error)}`);
      clack.outro("Failed.");
    }
  },
});

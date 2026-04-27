import * as clack from "@clack/prompts";
import type { SkillMeta } from "../skills/loader.js";

/**
 * Browse and select skills with action-based filtering
 * Install: shows uninstalled skills grouped by category
 * Update/Remove: shows installed skills in flat list
 */

async function browseInstall(
  skills: SkillMeta[],
  installedNames: string[]
): Promise<string[] | symbol> {
  const groups: Record<string, Array<{ value: string; label: string; hint?: string }>> = {};
  for (const skill of skills) {
    const cat = skill.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({
      value: skill.name,
      label: skill.name,
      hint: skill.description,
    });
  }

  if (installedNames.length > 0) {
    clack.log.info(`Already installed: ${installedNames.join(", ")}`);
  }

  clack.note("↑↓ navigate   Space toggle   a select all   Enter confirm   Esc back", "Keys");

  return clack.groupMultiselect({
    message: "Select skills to install:",
    options: groups,
    required: true,
  }) as Promise<string[] | symbol>;
}

async function browseUpdateRemove(
  skills: SkillMeta[],
  action: "update" | "remove"
): Promise<string[] | symbol> {
  const options = skills.map((s) => ({
    value: s.name,
    label: s.name,
    hint: s.description,
  }));

  const verb = action === "update" ? "update" : "remove";
  clack.note("↑↓ navigate   Space toggle   Enter confirm   Esc back", "Keys");

  return clack.multiselect({
    message: `Select skills to ${verb}:`,
    options,
    required: true,
  }) as Promise<string[] | symbol>;
}

const actionBrowsers: Record<"install" | "update" | "remove", (skills: SkillMeta[], installedNames: string[]) => Promise<string[] | symbol>> = {
  install: browseInstall,
  update: (skills, installedNames) => browseUpdateRemove(skills, "update"),
  remove: (skills, installedNames) => browseUpdateRemove(skills, "remove"),
};

export async function browseSkills(
  skills: SkillMeta[],
  action: "install" | "update" | "remove",
  installedNames: string[] = []
): Promise<string[] | symbol> {
  if (skills.length === 0) {
    if (action === "install") {
      clack.log.warn("All available skills are already installed.");
    } else {
      clack.log.warn("No installed skills found for the selected agents.");
    }
    return [];
  }

  const browser = actionBrowsers[action];
  return browser(skills, installedNames);
}

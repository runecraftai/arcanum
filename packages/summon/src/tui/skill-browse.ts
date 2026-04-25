import * as clack from "@clack/prompts";
import type { SkillMeta } from "../skills/loader";

/**
 * Browse skills grouped by category
 * Returns selected skills
 */
export async function browseSkills(
  catalog: SkillMeta[]
): Promise<SkillMeta[]> {
  // Group skills by category
  const grouped: Record<string, SkillMeta[]> = {};

  for (const skill of catalog) {
    const category = skill.category || "Uncategorized";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(skill);
  }

  // Create options grouped by category
  const options: Record<string, Array<{ value: string; label: string }>> = {};

  for (const [category, skills] of Object.entries(grouped)) {
    options[category] = skills.map((skill) => ({
      value: skill.name,
      label: `${skill.name} — ${skill.description || "No description"}`,
    }));
  }

  const selected = await clack.groupMultiselect({
    message: "Select skills to install:",
    options,
  });

  if (clack.isCancel(selected)) {
    return [];
  }

  // Map selected names back to full skill objects
  return catalog.filter((skill) => selected.includes(skill.name));
}

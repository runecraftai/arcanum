import * as clack from "@clack/prompts";
import { showBanner } from "./banner.js";
import { selectCategory, type Category } from "./category-menu.js";
import { runSkillsFlow } from "./skills.js";
import { runCommandsFlow } from "./commands.js";
import { runSetupFlow } from "./setup.js";

/**
 * Top-level TUI: pick a category, then dispatch to the sub-flow.
 *
 * - Skills   → runSkillsFlow
 * - Commands → runCommandsFlow
 * - Setup    → runSetupFlow
 */
export async function runInteractiveFlow(): Promise<void> {
  showBanner();

  const category = await selectCategory();
  if (clack.isCancel(category)) {
    clack.outro("Cancelled.");
    return;
  }

  switch (category as Category) {
    case "skills":
      await runSkillsFlow();
      return;
    case "commands":
      await runCommandsFlow();
      return;
    case "setup":
      await runSetupFlow();
      return;
  }
}

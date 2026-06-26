import path from "node:path";
import fs from "node:fs/promises";
import type { CommandMapping } from "../registry";
import type { CommandGenerator } from "../generator";
import { ensureDir, exists } from "../../utils/fs";
import { resolveAgentPath } from "../../utils/paths";

async function projectPathExists(relPath: string, projectRoot: string): Promise<boolean> {
  return exists(path.join(projectRoot, relPath));
}

export const cursorGenerator: CommandGenerator = {
  runtime: "cursor",
  displayName: "Cursor",
  async detect(projectRoot: string): Promise<boolean> {
    return (
      (await projectPathExists(".cursor", projectRoot)) ||
      (await projectPathExists(".cursorrules", projectRoot)) ||
      (await exists(resolveAgentPath(".cursor/rules/", "project")))
    );
  },
  async generate(mapping: CommandMapping, projectRoot: string): Promise<string> {
    const dir = path.join(projectRoot, ".cursor", "rules");
    await ensureDir(dir);
    const filePath = path.join(dir, `${mapping.name}.mdc`);
    const body = [
      "---",
      `description: ${mapping.description}`,
      "globs:",
      "alwaysApply: false",
      "---",
      "",
      `When the user types \`/${mapping.name}\`, load the \`${mapping.skill}\` skill and execute its process. If the user provides arguments, treat them as $ARGUMENTS.`,
    ];
    await fs.writeFile(filePath, body.join("\n") + "\n", "utf8");
    return filePath;
  },
};

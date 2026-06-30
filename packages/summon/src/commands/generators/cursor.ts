import path from "node:path";
import fs from "node:fs/promises";
import type { CommandMapping } from "../registry";
import type { CommandGenerator, InstallLocation } from "../generator";
import { ensureDir, exists } from "../../utils/fs";

async function projectPathExists(relPath: string, projectRoot: string): Promise<boolean> {
  return exists(path.join(projectRoot, relPath));
}

export const cursorGenerator: CommandGenerator = {
  runtime: "cursor",
  displayName: "Cursor",
  supportedLocations: ["local"],
  async detectLocal(projectRoot: string): Promise<boolean> {
    return (
      (await projectPathExists(".cursor", projectRoot)) ||
      (await projectPathExists(".cursorrules", projectRoot))
    );
  },
  async detectGlobal(): Promise<boolean> {
    return false;
  },
  async generate(
    mapping: CommandMapping,
    projectRoot: string,
    _location: InstallLocation
  ): Promise<string> {
    const dir = path.join(projectRoot, ".cursor", "rules");
    await ensureDir(dir);
    const filePath = path.join(dir, `${mapping.name}.mdc`);
    const body: string[] = [
      "---",
      `description: ${mapping.description}`,
      "globs:",
      "alwaysApply: false",
      "---",
      "",
    ];
    body.push(
      `When the user types \`/${mapping.name}\`, load the \`${mapping.skill}\` skill and execute its process. If the skill is unavailable, install it first with: \`npx @runecraft/summon install\`. If the user provides arguments, treat them as $ARGUMENTS.`
    );
    await fs.writeFile(filePath, body.join("\n") + "\n", "utf8");
    return filePath;
  },
};

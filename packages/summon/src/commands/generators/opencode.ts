import path from "node:path";
import fs from "node:fs/promises";
import type { CommandMapping } from "../registry";
import type { CommandGenerator, InstallLocation } from "../generator";
import { ensureDir, exists } from "../../utils/fs";
import { resolveAgentPath } from "../../utils/paths";

async function projectPathExists(relPath: string, projectRoot: string): Promise<boolean> {
  return exists(path.join(projectRoot, relPath));
}

function renderBody(mapping: CommandMapping): string {
  const lines: string[] = [];
  if (mapping.name === "review") {
    lines.push("Current staged diff:");
    lines.push("");
    lines.push("!`git diff --staged`");
    lines.push("");
  }
  if (mapping.name === "ship") {
    lines.push("Recent commits:");
    lines.push("");
    lines.push("!`git log --oneline -10`");
    lines.push("");
  }
  lines.push(`Load the \`${mapping.skill}\` skill and execute its process.`);
  lines.push("");
  lines.push("$ARGUMENTS");
  return lines.join("\n");
}

export const opencodeGenerator: CommandGenerator = {
  runtime: "opencode",
  displayName: "OpenCode",
  supportedLocations: ["local", "global"],
  async detectLocal(projectRoot: string): Promise<boolean> {
    return (
      (await projectPathExists(".opencode", projectRoot)) ||
      (await projectPathExists("opencode.json", projectRoot)) ||
      (await projectPathExists("opencode.jsonc", projectRoot))
    );
  },
  async detectGlobal(): Promise<boolean> {
    return exists(resolveAgentPath("~/.config/opencode/", "global"));
  },
  async generate(
    mapping: CommandMapping,
    projectRoot: string,
    location: InstallLocation
  ): Promise<string> {
    const dir =
      location === "global"
        ? path.join(resolveAgentPath("~/.config/opencode/", "global"), "commands")
        : path.join(projectRoot, ".opencode", "commands");
    await ensureDir(dir);
    const filePath = path.join(dir, `${mapping.name}.md`);
    const frontmatter = ["---", `description: ${mapping.description}`, "---", ""].join("\n");
    await fs.writeFile(filePath, `${frontmatter}\n${renderBody(mapping)}\n`, "utf8");
    return filePath;
  },
};

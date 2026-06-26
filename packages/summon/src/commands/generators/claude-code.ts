import path from "node:path";
import fs from "node:fs/promises";
import type { CommandMapping } from "../registry";
import type { CommandGenerator } from "../generator";
import { ensureDir, exists } from "../../utils/fs";
import { resolveAgentPath } from "../../utils/paths";

async function projectPathExists(relPath: string, projectRoot: string): Promise<boolean> {
  return exists(path.join(projectRoot, relPath));
}

export const claudeCodeGenerator: CommandGenerator = {
  runtime: "claude-code",
  displayName: "Claude Code",
  async detect(projectRoot: string): Promise<boolean> {
    return (
      (await projectPathExists(".claude", projectRoot)) ||
      (await projectPathExists("CLAUDE.md", projectRoot)) ||
      (await exists(resolveAgentPath("~/.claude/", "global")))
    );
  },
  async generate(mapping: CommandMapping, projectRoot: string): Promise<string> {
    const dir = path.join(projectRoot, ".claude", "commands");
    await ensureDir(dir);
    const filePath = path.join(dir, `${mapping.name}.md`);
    const body = [
      "---",
      `description: ${mapping.description}`,
      "---",
      "",
      `Load the \`${mapping.skill}\` skill and execute its process.`,
    ];
    if (mapping.bodyExtras) {
      body.push("");
      body.push(`> ${mapping.bodyExtras}`);
    }
    await fs.writeFile(filePath, body.join("\n") + "\n", "utf8");
    return filePath;
  },
};

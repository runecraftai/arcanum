import os from "node:os";
import path from "node:path";
import { exists } from "./fs";

/**
 * Resolve home directory path (~) to absolute path
 * Works on macOS, Linux, and Windows
 */
export function resolveHome(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Resolve spells directory with validation
 * Checks ARCANUM_SPELLS_DIR env var first, then falls back to default
 */
export async function resolveSpellsDir(): Promise<string> {
  if (process.env.ARCANUM_SPELLS_DIR) {
    const customDir = path.resolve(process.env.ARCANUM_SPELLS_DIR);
    if (await exists(customDir)) {
      return customDir;
    }
  }
  // Default: packages/summon/src/utils → ../../../spells/skills
  return path.resolve(import.meta.dir, "../../../spells/skills");
}

export type AgentScope = "global" | "project";

/**
 * Resolve agent config path based on scope
 * - global: home-relative (e.g., ~/.claude/agents.json)
 * - project: cwd-relative (e.g., .arcanum/agents.json)
 */
export function resolveAgentPath(
  filePath: string,
  scope: AgentScope = "global"
): string {
  if (scope === "global") {
    return resolveHome(filePath);
  }
  return path.resolve(process.cwd(), filePath);
}

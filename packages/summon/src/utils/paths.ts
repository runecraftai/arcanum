import { createRequire } from "node:module";
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
 * Checks ARCANUM_SPELLS_DIR env var first, then falls back to default.
 *
 * Uses createRequire to locate @runecraft/spells via Node module resolution.
 * This works correctly with both Node.js (npx) and Bun (bunx) runtimes,
 * and survives Bun's bundler without being transformed into import.meta.dir
 * (which is Bun-only and undefined in Node.js).
 */
export async function resolveSpellsDir(): Promise<string> {
  if (process.env.ARCANUM_SPELLS_DIR) {
    const customDir = path.resolve(process.env.ARCANUM_SPELLS_DIR);
    if (await exists(customDir)) {
      return customDir;
    }
  }

  // Use createRequire for portable module resolution across Node.js and Bun.
  // createRequire(import.meta.url) survives Bun's bundler intact (unlike
  // bare import.meta.url which gets transformed to import.meta.dir).
  try {
    const require = createRequire(import.meta.url);
    const spellsPkg = require.resolve("@runecraft/spells/package.json");
    return path.resolve(path.dirname(spellsPkg), "skills");
  } catch {
    // Fallback: resolve from cwd node_modules (e.g., local development)
    return path.resolve(process.cwd(), "node_modules/@runecraft/spells/skills");
  }
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

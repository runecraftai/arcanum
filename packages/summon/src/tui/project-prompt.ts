import * as clack from "@clack/prompts";
import path from "node:path";
import { exists } from "../utils/fs";

function resolveAndValidate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const resolved = path.resolve(trimmed);
  return resolved;
}

async function filterExisting(paths: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const p of paths) {
    if (await exists(p)) out.push(p);
  }
  return out;
}

function dedupe(paths: string[]): string[] {
  return Array.from(new Set(paths));
}

/**
 * Ask the user which project roots to install slash commands into.
 *
 * Default: [process.cwd()]. The user can confirm with Enter or type extra
 * paths (comma-separated) to apply the install to multiple projects at once.
 *
 * Paths that don't exist on disk are filtered out with a warning.
 */
export async function promptProjectRoots(): Promise<string[] | symbol> {
  const cwd = process.cwd();

  clack.note(
    "Enter to accept the current directory. Type extra paths to target multiple projects (comma-separated).",
    "Project roots"
  );

  const raw = await clack.text({
    message: "Project roots to install slash commands into:",
    placeholder: cwd,
    initialValue: cwd,
    defaultValue: cwd,
  });

  if (clack.isCancel(raw)) return raw;

  const tokens = String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const resolved = tokens
    .map(resolveAndValidate)
    .filter((p): p is string => p !== null);

  const unique = dedupe(resolved);
  const existing = await filterExisting(unique);

  if (existing.length === 0) {
    clack.log.error("None of the provided paths exist on disk.");
    return [];
  }

  const missing = unique.filter((p) => !existing.includes(p));
  if (missing.length > 0) {
    clack.log.warn(`Skipping non-existent paths: ${missing.join(", ")}`);
  }

  clack.log.info(`Will install into: ${existing.join(", ")}`);

  return existing;
}

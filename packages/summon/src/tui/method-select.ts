import * as clack from "@clack/prompts";
import type { InstallMethod } from "../skills/installer";

/**
 * Select installation method: Copy or Symlink
 */
export async function selectMethod(): Promise<InstallMethod | symbol> {
  clack.note("↑↓ navigate   Enter confirm   Esc back", "Keys");

  const method = await clack.select({
    message: "Choose installation method:",
    options: [
      {
        value: "copy" as const,
        label: "Copy (recommended) — Self-contained, works everywhere",
        hint: "Best for isolated installations and reproducibility",
      },
      {
        value: "symlink" as const,
        label: "Symlink — Updates automatically from source",
        hint: "Best for development, changes reflected immediately",
      },
    ],
    initialValue: "copy",
  });

  if (clack.isCancel(method)) {
    return method;
  }

  return method as InstallMethod | symbol;
}

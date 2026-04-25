import * as clack from "@clack/prompts";
import type { InstallMethod } from "../skills/installer";

/**
 * Select installation method: Copy or Symlink
 */
export async function selectMethod(): Promise<InstallMethod | null> {
  const method = await clack.select({
    message: "Choose installation method:",
    options: [
      {
        value: "copy" as const,
        label: "Copy (recommended) — Self-contained, works everywhere",
      },
      {
        value: "symlink" as const,
        label: "Symlink — Updates automatically from source",
      },
    ],
    initialValue: "copy",
  });

  if (clack.isCancel(method)) {
    return null;
  }

  return method as InstallMethod;
}

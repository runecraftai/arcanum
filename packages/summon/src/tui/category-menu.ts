import * as clack from "@clack/prompts";

export type Category = "skills" | "commands" | "setup";

/**
 * Top-level TUI menu: pick a sub-flow.
 *
 * - Skills   → install / update / remove Arcanum skills
 * - Commands → generate /plan, /review, etc. for detected runtimes
 * - Setup    → install external tools (Graphify, markitdown, MCP servers)
 */
export async function selectCategory(): Promise<Category | symbol> {
  clack.note("↑↓ navigate   Enter confirm   Esc exit", "Keys");

  return clack.select({
    message: "What do you want to do?",
    options: [
      {
        value: "skills" as const,
        label: "Skills",
        hint: "Install, update, or remove Arcanum skills",
      },
      {
        value: "commands" as const,
        label: "Commands",
        hint: "Generate /plan, /review, /test, etc. for your runtime",
      },
      {
        value: "setup" as const,
        label: "Setup",
        hint: "Install external tools (Graphify, markitdown, MCP servers)",
      },
    ],
    initialValue: "skills" as const,
  }) as Promise<Category | symbol>;
}

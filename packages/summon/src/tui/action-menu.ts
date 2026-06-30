import * as clack from "@clack/prompts";

export type Action = "install" | "update" | "remove";

/**
 * Select action for the Skills sub-flow: Install, Update, or Remove
 */
export async function selectAction(): Promise<Action | symbol> {
  clack.note("↑↓ navigate   Enter confirm   Esc back", "Keys");

  const action = await clack.select({
    message: "What would you like to do?",
    options: [
      { value: "install" as const, label: "Install skills", hint: "Add new skills from the catalog" },
      { value: "update" as const, label: "Update installed skills", hint: "Refresh installed skills to latest versions" },
      { value: "remove" as const, label: "Remove skills", hint: "Uninstall skills from your agents" },
    ],
  });

  if (clack.isCancel(action)) {
    return action;
  }

  return action as Action | symbol;
}

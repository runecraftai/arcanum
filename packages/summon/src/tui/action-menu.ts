import * as clack from "@clack/prompts";

export type Action = "install" | "update" | "remove";

/**
 * Select action: Install, Update, or Remove
 */
export async function selectAction(): Promise<Action | null> {
  const action = await clack.select({
    message: "What would you like to do?",
    options: [
      { value: "install" as const, label: "Install skills" },
      { value: "update" as const, label: "Update installed skills" },
      { value: "remove" as const, label: "Remove skills" },
    ],
  });

  if (clack.isCancel(action)) {
    return null;
  }

  return action as Action;
}

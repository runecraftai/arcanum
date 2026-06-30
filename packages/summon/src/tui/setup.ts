import * as clack from "@clack/prompts";
import { runInteractive } from "../commands/tools-install-impl.js";

export async function runSetupFlow(): Promise<void> {
  await runInteractive();
}

import * as clack from "@clack/prompts";
import type { InstallResult } from "../skills/installer";

/**
 * Display progress and results of skill installation
 */
export async function showProgress(results: InstallResult[]): Promise<void> {
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  clack.log.info("");
  clack.log.info("Installation Summary:");
  clack.log.info(`  ✓ Successful: ${successful}`);
  if (failed > 0) {
    clack.log.error(`  ✗ Failed: ${failed}`);
  }

  // Show failed skills with errors
  if (failed > 0) {
    clack.log.info("");
    clack.log.info("Errors:");
    for (const result of results) {
      if (!result.success) {
        clack.log.error(
          `  [${result.agentId}] ${result.skillName}: ${result.error}`
        );
      }
    }
  }

  clack.log.info("");
}

/**
 * Show a spinner while performing async operations
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const spin = clack.spinner();
  spin.start(message);

  try {
    const result = await fn();
    spin.stop("Done!");
    return result;
  } catch (error) {
    spin.stop(`Failed: ${String(error)}`);
    throw error;
  }
}

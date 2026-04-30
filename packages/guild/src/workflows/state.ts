/**
 * Workflow state persistence and recovery
 */

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { randomUUID } from "crypto";
import type { WorkflowState } from "./types.js";

/**
 * Generate a unique resume token (UUID)
 */
export function generateResumeToken(): string {
  return randomUUID();
}

/**
 * Sanitize workflow name to prevent path traversal
 * Allow only alphanumeric characters and hyphens
 */
function sanitizeWorkflowName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "-");
}

/**
 * Persist workflow state to disk
 * Writes to .specs/sessions/<workflowName>-<resumeToken>.json
 */
export async function persistState(
  state: WorkflowState,
  sessionDir: string
): Promise<void> {
  // Ensure session directory exists
  try {
    await fs.mkdir(sessionDir, { recursive: true });
  } catch (error) {
    console.warn(
      "[guild] Failed to create session directory:",
      sessionDir,
      error instanceof Error ? error.message : error
    );
  }

  // Sanitize workflow name to prevent path traversal (CRITICAL-1)
  const sanitized = sanitizeWorkflowName(state.workflowName);
  const fileName = `${sanitized}-${state.resumeToken}.json`;
  const filePath = join(sessionDir, fileName);

  // Verify resolved path is within sessionDir (CRITICAL-1)
  const resolvedSessionDir = resolve(sessionDir);
  const resolvedFilePath = resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedSessionDir)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }

  const content = JSON.stringify(state, null, 2);
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Load workflow state from disk
 * Scans sessionDir for matching resume token with exact filename match
 */
export async function loadState(
  resumeToken: string,
  sessionDir: string
): Promise<WorkflowState | null> {
  try {
    const entries = await fs.readdir(sessionDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;

      // Use exact suffix match to prevent partial token matches (HIGH-2)
      if (entry.name.endsWith(`${resumeToken}.json`)) {
        const filePath = join(sessionDir, entry.name);
        
        // Verify resolved path is within sessionDir (CRITICAL-1)
        const resolvedSessionDir = resolve(sessionDir);
        const resolvedFilePath = resolve(filePath);
        if (!resolvedFilePath.startsWith(resolvedSessionDir)) {
          continue; // Skip this file
        }

        const content = await fs.readFile(filePath, "utf-8");
        return JSON.parse(content) as WorkflowState;
      }
    }

    return null;
  } catch (error) {
    console.warn(
      "[guild] Failed to load workflow state for token:",
      resumeToken,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

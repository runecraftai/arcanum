/**
 * Guard hook that prevents Ranger agent from writing non-.md files
 * or writing outside the .guild/ directory.
 */

export interface RangerWriteCheckResult {
  allowed: boolean
  reason?: string
}

const WRITE_TOOLS = new Set(["write", "edit"])
const GUILD_DIR_SEGMENT = ".guild"

/**
 * Check whether a write/edit operation should be allowed for the given agent.
 * Only blocks writes from the "ranger" agent to non-.md files or files outside .guild/.
 */
export function checkRangerWrite(
  agentName: string,
  toolName: string,
  filePath: string,
): RangerWriteCheckResult {
  // Only guard Ranger agent
  if (agentName !== "ranger") {
    return { allowed: true }
  }

  // Only guard write/edit tools
  if (!WRITE_TOOLS.has(toolName)) {
    return { allowed: true }
  }

  // Normalize path separators for cross-platform
  const normalizedPath = filePath.replace(/\\/g, "/")

  // Must be inside .guild/ directory
  if (!normalizedPath.includes(`${GUILD_DIR_SEGMENT}/`)) {
    return {
      allowed: false,
      reason: `Ranger agent can only write to .guild/ directory. Attempted: \`${filePath}\``,
    }
  }

  // Must be a .md file
  if (!normalizedPath.endsWith(".md")) {
    return {
      allowed: false,
      reason: `Ranger agent can only write .md files. Attempted: \`${filePath}\``,
    }
  }

  return { allowed: true }
}

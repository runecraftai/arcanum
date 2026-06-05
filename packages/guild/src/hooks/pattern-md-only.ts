/**
 * Guard hook that prevents Pattern agent from writing non-.md files
 * or writing outside the .guild/ directory.
 */

export interface PatternWriteCheckResult {
  allowed: boolean
  reason?: string
}

const WRITE_TOOLS = new Set(["write", "edit"])
const GUILD_DIR_SEGMENT = ".guild"

/**
 * Check whether a write/edit operation should be allowed for the given agent.
 * Only blocks writes from the "pattern" agent to non-.md files or files outside .guild/.
 */
export function checkPatternWrite(
  agentName: string,
  toolName: string,
  filePath: string,
): PatternWriteCheckResult {
  // Only guard Pattern agent
  if (agentName !== "pattern") {
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
      reason: `Pattern agent can only write to .guild/ directory. Attempted: \`${filePath}\``,
    }
  }

  // Must be a .md file
  if (!normalizedPath.endsWith(".md")) {
    return {
      allowed: false,
      reason: `Pattern agent can only write .md files. Attempted: \`${filePath}\``,
    }
  }

  return { allowed: true }
}

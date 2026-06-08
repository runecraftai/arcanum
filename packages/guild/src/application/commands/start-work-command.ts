import type { RuntimeEffect } from "../../runtime/opencode/effects"
import type { RuntimeChatMessageInput } from "../policy/runtime-policy"

export interface StartWorkResult {
  /** Whether the command was handled */
  handled: boolean
  /** Context to inject into the prompt (plan path, progress, instructions) */
  contextInjection: string | null
  /** Plan path for spawning a Fighter session (null means use fallback in-place switch) */
  planPath: string | null
  /** Plan name for display */
  planName: string | null
  /** Progress snapshot */
  progress: { total: number; completed: number } | null
}

export function executeStartWorkCommand(input: {
  hooks: RuntimeChatMessageInput["hooks"]
  promptText: string
  sessionId: string
  parsedEnvelope: RuntimeChatMessageInput["parsedEnvelope"]
  isWorkflowCommand: boolean
}): RuntimeEffect[] {
  if (
    !input.hooks.startWork
    || input.isWorkflowCommand
    || input.parsedEnvelope?.kind !== "builtin-command"
    || input.parsedEnvelope.command !== "start-work"
  ) {
    return []
  }

  const result = input.hooks.startWork(input.promptText, input.sessionId)
  return commandResultToEffects(result, input.sessionId)
}

function commandResultToEffects(
  result: { contextInjection: string | null; switchAgent: string | null },
  sessionId: string,
): RuntimeEffect[] {
  const effects: RuntimeEffect[] = []

  // If the hook returned switchAgent, we can potentially use windowed mode
  // The hook embeds plan info in contextInjection
  if (result.contextInjection) {
    // Try to extract plan info from the contextInjection for spawning
    const planInfo = extractPlanInfo(result.contextInjection)

    if (planInfo && result.switchAgent === "fighter") {
      // Use windowed mode: spawn a new Fighter session instead of in-place switch
      effects.push({
        type: "spawnFighterSession",
        sessionId,
        planPath: planInfo.planPath,
        planName: planInfo.planName,
        progress: planInfo.progress,
        contextInjection: result.contextInjection,
      })
    } else {
      // Fall back to in-place switch (e.g., for error messages without a valid plan)
      if (result.switchAgent) {
        effects.push({ type: "switchAgent", agent: result.switchAgent })
        effects.push({ type: "restoreAgent", sessionId, agent: result.switchAgent })
      }
      effects.push({ type: "appendPromptText", text: result.contextInjection })
    }
  } else if (result.switchAgent) {
    // No context injection but switching agent (edge case)
    effects.push({ type: "switchAgent", agent: result.switchAgent })
    effects.push({ type: "restoreAgent", sessionId, agent: result.switchAgent })
  }

  return effects
}

interface PlanInfo {
  planPath: string
  planName: string
  progress: { total: number; completed: number }
}

/**
 * Extract plan info from the context injection string.
 * The format is: "## Starting Plan: {name}\n**Plan file**: `{path}`\n**Progress**: {completed}/{total} ..."
 */
function extractPlanInfo(contextInjection: string): PlanInfo | null {
  // Match: ## Starting Plan: {name} or ## Resuming Plan: {name}
  const nameMatch = contextInjection.match(/^## (?:Starting|Resuming) Plan: (.+)$/m)
  if (!nameMatch) return null

  // Match: **Plan file**: `{path}`
  const pathMatch = contextInjection.match(/\*\*Plan file\*\*: `([^`]+)`/)
  if (!pathMatch) return null

  // Match: **Progress**: {completed}/{total}
  const progressMatch = contextInjection.match(/\*\*Progress\*\*: (\d+)\/(\d+)/)
  if (!progressMatch) return null

  return {
    planName: nameMatch[1].trim(),
    planPath: pathMatch[1],
    progress: {
      completed: parseInt(progressMatch[1], 10),
      total: parseInt(progressMatch[2], 10),
    },
  }
}

import type { AgentMode, GuildAgentName } from "./types"
import { debug, warn } from "../shared/log"

export type FallbackEntry = {
  providers: string[]
  model: string
  variant?: string
}

export type AgentModelRequirement = {
  fallbackChain: FallbackEntry[]
}

export const AGENT_MODEL_REQUIREMENTS: Record<GuildAgentName, AgentModelRequirement> = {
  bard: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-opus-4.6" },
      { providers: ["anthropic"], model: "claude-opus-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
  fighter: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-sonnet-4.6" },
      { providers: ["anthropic"], model: "claude-sonnet-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
  ranger: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-sonnet-4.6" },
      { providers: ["anthropic"], model: "claude-sonnet-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
  wizard: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-opus-4.6" },
      { providers: ["anthropic"], model: "claude-opus-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
  rogue: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-haiku-4.5" },
      { providers: ["anthropic"], model: "claude-haiku-4" },
      { providers: ["google"], model: "gemini-3-flash" },
    ],
  },
  warlock: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-haiku-4.5" },
      { providers: ["anthropic"], model: "claude-haiku-4" },
      { providers: ["google"], model: "gemini-3-flash" },
    ],
  },
  cleric: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-sonnet-4.6" },
      { providers: ["anthropic"], model: "claude-sonnet-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
  paladin: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-opus-4.6" },
      { providers: ["anthropic"], model: "claude-opus-4" },
      { providers: ["openai"], model: "gpt-5" },
    ],
  },
}

export type ResolveAgentModelOptions = {
  availableModels: Set<string>
  agentMode: AgentMode
  uiSelectedModel?: string
  categoryModel?: string
  overrideModel?: string
  systemDefaultModel?: string
  /** Custom fallback chain — takes precedence over built-in defaults when provided */
  customFallbackChain?: FallbackEntry[]
}

/**
 * Resolve the model for an agent. Accepts any string agent name.
 *
 * Precedence (after override/UI/category):
 *   1. customFallbackChain — explicit per-agent override chain (built-ins and custom agents)
 *   2. AGENT_MODEL_REQUIREMENTS[agent].fallbackChain — built-in default chain
 *   3. systemDefaultModel — late fallback
 *   4. Offline best-guess from the active fallback chain
 *   5. Hardcoded default ("anthropic/claude-opus-4.6")
 */
export function resolveAgentModel(agentName: string, options: ResolveAgentModelOptions): string {
  const { availableModels, agentMode, uiSelectedModel, categoryModel, overrideModel, systemDefaultModel, customFallbackChain } = options
  const requirement = AGENT_MODEL_REQUIREMENTS[agentName as GuildAgentName] as AgentModelRequirement | undefined

  // 1. Explicit override always wins
  if (overrideModel) {
    debug(`Model resolved for "${agentName}"`, { via: "override", model: overrideModel })
    return overrideModel
  }

  // 2. UI-selected model — only for primary or all agents
  if (uiSelectedModel && (agentMode === "primary" || agentMode === "all")) {
    debug(`Model resolved for "${agentName}"`, { via: "ui-selection", model: uiSelectedModel, agentMode })
    return uiSelectedModel
  }

  // 3. Category default model (only if available)
  if (categoryModel && availableModels.has(categoryModel)) {
    debug(`Model resolved for "${agentName}"`, { via: "category", model: categoryModel })
    return categoryModel
  }

  // 4. Fallback chain — custom override takes precedence over built-in defaults
  const fallbackChain = customFallbackChain ?? requirement?.fallbackChain
  if (fallbackChain) {
    for (const entry of fallbackChain) {
      for (const provider of entry.providers) {
        const qualified = `${provider}/${entry.model}`
        if (availableModels.has(qualified)) {
          debug(`Model resolved for "${agentName}"`, { via: "fallback-chain", model: qualified })
          return qualified
        }
        if (availableModels.has(entry.model)) {
          debug(`Model resolved for "${agentName}"`, { via: "fallback-chain", model: entry.model })
          return entry.model
        }
      }
    }
  }

  // 5. System default
  if (systemDefaultModel) {
    debug(`Model resolved for "${agentName}"`, { via: "system-default", model: systemDefaultModel })
    return systemDefaultModel
  }

  // 6. Best-guess offline: first entry in fallback chain
  if (fallbackChain && fallbackChain.length > 0) {
    const first = fallbackChain[0]
    if (first.providers.length > 0) {
      const guessed = `${first.providers[0]}/${first.model}`
      debug(`Model resolved for "${agentName}" (offline best-guess — no available models matched)`, { via: "offline-guess", model: guessed })
      return guessed
    }
    // Bare model name fallback if no providers listed
    debug(`Model resolved for "${agentName}" (offline best-guess — bare model)`, { via: "offline-guess", model: first.model })
    return first.model
  }

  warn(`No model resolved for agent "${agentName}" — falling back to default anthropic/claude-opus-4.6`, { agentName })
  return "anthropic/claude-opus-4.6"
}

/**
 * Given an agent name, the model that just failed, and the set of available
 * models, return the next eligible model from the agent's fallback chain.
 *
 * Returns null when there is no next model (end of chain, or agent has no
 * fallback chain).
 */
export function getNextFallbackModel(
  agentName: string,
  failedModel: string,
  availableModels: Set<string>,
): string | null {
  const requirement = AGENT_MODEL_REQUIREMENTS[agentName as GuildAgentName] as AgentModelRequirement | undefined
  const fallbackChain = requirement?.fallbackChain
  if (!fallbackChain) return null

  let foundFailed = false
  for (const entry of fallbackChain) {
    for (const provider of entry.providers) {
      const qualified = `${provider}/${entry.model}`
      // Skip until we pass the failed model
      if (!foundFailed) {
        if (qualified === failedModel || entry.model === failedModel) {
          foundFailed = true
        }
        continue
      }
      // Return the first available model after the failed one
      if (availableModels.has(qualified)) return qualified
      if (availableModels.has(entry.model)) return entry.model
    }
  }

  return null
}

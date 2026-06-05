import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import type { AvailableAgent } from "../dynamic-prompt-builder"
import type { ProjectFingerprint } from "../../features/analytics/types"
import type { CategoriesConfig } from "../../config/schema"
import type { ReviewModelVariant } from "../review-model-variants"
import { BARD_DEFAULTS } from "./default"
import { composeBardPrompt } from "./prompt-composer"

export { composeBardPrompt } from "./prompt-composer"
export type { BardPromptOptions } from "./prompt-composer"

/**
 * Create a Bard agent config with optional disabled agents, fingerprint, custom agents, and categories for prompt composition.
 */
export function createBardAgentWithOptions(
  model: string,
  disabledAgents?: Set<string>,
  fingerprint?: ProjectFingerprint | null,
  customAgents?: AvailableAgent[],
  categories?: CategoriesConfig,
  reviewModelVariants?: ReviewModelVariant[],
): AgentConfig {
  return {
    ...BARD_DEFAULTS,
    prompt: composeBardPrompt({ disabledAgents, fingerprint, customAgents, categories, reviewModelVariants }),
    model,
    mode: "primary",
  }
}

export const createBardAgent: AgentFactory = (model: string): AgentConfig => ({
  ...BARD_DEFAULTS,
  model,
  mode: "primary",
})
createBardAgent.mode = "primary"

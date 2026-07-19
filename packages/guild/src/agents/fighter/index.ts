import type { AgentConfig } from "@opencode-ai/sdk"
import type { ResolvedContinuationConfig } from "../../config/continuation"
import type { CategoriesConfig } from "../../config/schema"
import type { AgentFactory } from "../types"
import type { ReviewModelVariant } from "../review-model-variants"
import type { LoadedSkill } from "../../features/skill-loader/types"
import { FIGHTER_DEFAULTS } from "./default"
import { composeFighterPrompt } from "./prompt-composer"

export { composeFighterPrompt } from "./prompt-composer"
export type { FighterPromptOptions } from "./prompt-composer"

/**
 * Create a Fighter agent config with optional disabled agents for prompt composition.
 */
export function createFighterAgentWithOptions(
  model: string,
  disabledAgents?: Set<string>,
  continuation?: ResolvedContinuationConfig,
  categories?: CategoriesConfig,
  reviewModelVariants?: ReviewModelVariant[],
  availableSkills?: LoadedSkill[],
): AgentConfig {
  return {
    ...FIGHTER_DEFAULTS,
    tools: { ...FIGHTER_DEFAULTS.tools },
    prompt: composeFighterPrompt({ disabledAgents, continuation, categories, reviewModelVariants, availableSkills }),
    model,
    mode: "primary",
  }
}

export const createFighterAgent: AgentFactory = (model: string): AgentConfig => ({
  ...FIGHTER_DEFAULTS,
  tools: { ...FIGHTER_DEFAULTS.tools },
  model,
  mode: "primary",
})
createFighterAgent.mode = "primary"

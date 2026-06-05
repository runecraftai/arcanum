import { BARD_DEFAULTS } from "../../../agents/bard/default"
import { composeBardPrompt } from "../../../agents/bard/prompt-composer"
import { FIGHTER_DEFAULTS } from "../../../agents/fighter/default"
import { composeFighterPrompt } from "../../../agents/fighter/prompt-composer"
import { WIZARD_DEFAULTS } from "../../../agents/wizard/default"
import { ROGUE_DEFAULTS } from "../../../agents/rogue/default"
import { WARLOCK_DEFAULTS } from "../../../agents/warlock/default"
import { CLERIC_DEFAULTS } from "../../../agents/cleric/default"
import { PALADIN_DEFAULTS } from "../../../agents/paladin/default"
import { RANGER_DEFAULTS } from "../../../agents/ranger/default"
import { buildReviewModelVariants } from "../../../agents/review-model-variants"
import type { BuiltinAgentPromptTarget, ResolvedTarget } from "../types"

function cloneTools(tools: Record<string, boolean> | undefined): Record<string, boolean> {
  return tools ? { ...tools } : {}
}

export function resolveBuiltinAgentTarget(target: BuiltinAgentPromptTarget): ResolvedTarget {
  const disabledAgents = new Set(target.variant?.disabledAgents ?? [])
  const agentOverrides = target.variant?.agentOverrides
  const reviewModelVariants = buildReviewModelVariants(agentOverrides, disabledAgents)

  switch (target.agent) {
    case "bard": {
      const renderedPrompt = composeBardPrompt({
        disabledAgents,
        agentOverrides,
        reviewModelVariants,
      } as Parameters<typeof composeBardPrompt>[0])
      return {
        target,
        artifacts: {
          renderedPrompt,
          promptLength: renderedPrompt.length,
          toolPolicy: cloneTools(BARD_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "bard",
            description: BARD_DEFAULTS.description,
            sourceKind: "composer",
          },
        },
      }
    }
    case "fighter": {
      const renderedPrompt = composeFighterPrompt({
        disabledAgents,
        categories: target.variant?.categories,
        agentOverrides,
        reviewModelVariants,
      } as Parameters<typeof composeFighterPrompt>[0])
      return {
        target,
        artifacts: {
          renderedPrompt,
          promptLength: renderedPrompt.length,
          toolPolicy: cloneTools(FIGHTER_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "fighter",
            description: FIGHTER_DEFAULTS.description,
            sourceKind: "composer",
          },
        },
      }
    }
    case "wizard":
      return {
        target,
        artifacts: {
          renderedPrompt: WIZARD_DEFAULTS.prompt,
          promptLength: WIZARD_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(WIZARD_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "wizard",
            description: WIZARD_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
    case "rogue":
      return {
        target,
        artifacts: {
          renderedPrompt: ROGUE_DEFAULTS.prompt,
          promptLength: ROGUE_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(ROGUE_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "rogue",
            description: ROGUE_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
    case "warlock":
      return {
        target,
        artifacts: {
          renderedPrompt: WARLOCK_DEFAULTS.prompt,
          promptLength: WARLOCK_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(WARLOCK_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "warlock",
            description: WARLOCK_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
    case "cleric":
      return {
        target,
        artifacts: {
          renderedPrompt: CLERIC_DEFAULTS.prompt,
          promptLength: CLERIC_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(CLERIC_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "cleric",
            description: CLERIC_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
    case "paladin":
      return {
        target,
        artifacts: {
          renderedPrompt: PALADIN_DEFAULTS.prompt,
          promptLength: PALADIN_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(PALADIN_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "paladin",
            description: PALADIN_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
    case "ranger":
      return {
        target,
        artifacts: {
          renderedPrompt: RANGER_DEFAULTS.prompt,
          promptLength: RANGER_DEFAULTS.prompt?.length,
          toolPolicy: cloneTools(RANGER_DEFAULTS.tools as Record<string, boolean> | undefined),
          agentMetadata: {
            agent: "ranger",
            description: RANGER_DEFAULTS.description,
            sourceKind: "default",
          },
        },
      }
  }
}

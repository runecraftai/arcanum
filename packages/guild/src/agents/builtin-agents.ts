import type { AgentConfig } from "@opencode-ai/sdk"
import { createBardAgent, createBardAgentWithOptions } from "./bard"
import { createFighterAgent, createFighterAgentWithOptions } from "./fighter"
import { createRangerAgent } from "./ranger"
import { createWizardAgent } from "./wizard"
import { createRogueAgent } from "./rogue"
import { createWarlockAgent } from "./warlock"
import { createClericAgent } from "./cleric"
import { createPaladinAgent } from "./paladin"
import { resolveAgentModel, type FallbackEntry } from "./model-resolution"
import { buildAgent } from "./agent-builder"
import type { AgentFactory, AgentPromptMetadata, GuildAgentName } from "./types"
import type { CategoriesConfig, AgentOverrideConfig } from "../config/schema"
import type { ResolvedContinuationConfig } from "../config/continuation"
import type { ResolveSkillsFn } from "./agent-builder"
import type { ProjectFingerprint } from "../features/analytics/types"
import type { AvailableAgent } from "./dynamic-prompt-builder"
import { buildReviewModelVariantAgent, buildReviewModelVariants } from "./review-model-variants"
import { getAgentConfigKey } from "../shared/agent-display-names"
import { debug } from "../shared/log"

type AgentConfigWithOptions = AgentConfig & {
  options?: Record<string, unknown>
}

export interface CreateBuiltinAgentsOptions {
  disabledAgents?: string[]
  agentOverrides?: Record<string, AgentOverrideConfig>
  categories?: CategoriesConfig
  uiSelectedModel?: string
  systemDefaultModel?: string
  availableModels?: Set<string>
  disabledSkills?: Set<string>
  resolveSkills?: ResolveSkillsFn
  /** Project fingerprint for injecting project context into agent prompts */
  fingerprint?: ProjectFingerprint | null
  /** Custom agent metadata for Bard's dynamic delegation prompt */
  customAgentMetadata?: AvailableAgent[]
  /** Resolved continuation config for prompt-aware agents */
  continuation?: ResolvedContinuationConfig
}

const AGENT_FACTORIES: Record<GuildAgentName, AgentFactory> = {
  bard: createBardAgent,
  fighter: createFighterAgent,
  ranger: createRangerAgent,
  wizard: createWizardAgent,
  rogue: createRogueAgent,
  warlock: createWarlockAgent,
  cleric: createClericAgent,
  paladin: createPaladinAgent,
}

export const AGENT_METADATA: Record<GuildAgentName, AgentPromptMetadata> = {
  bard: {
    category: "specialist",
    cost: "EXPENSIVE",
    triggers: [
      { domain: "Orchestration", trigger: "Complex multi-step tasks needing full orchestration" },
      { domain: "Architecture", trigger: "System design and high-level planning" },
    ],
    keyTrigger: "**'ultrawork'** → Maximum effort, parallel agents, deep execution",
  },
  fighter: {
    category: "specialist",
    cost: "EXPENSIVE",
    triggers: [
      { domain: "Execution", trigger: "Implementation tasks requiring sequential orchestration" },
      { domain: "Integration", trigger: "Wiring multiple systems or modules together" },
    ],
  },
  ranger: {
    category: "specialist",
    cost: "CHEAP",
    triggers: [
      { domain: "Category Work", trigger: "Domain-specific tasks dispatched via category system" },
    ],
  },
  wizard: {
    category: "advisor",
    cost: "EXPENSIVE",
    triggers: [
      { domain: "Planning", trigger: "Detailed task breakdown and step-by-step planning via interactive planning loop" },
      { domain: "Strategy", trigger: "Approach selection for complex technical problems" },
      { domain: "Scoping", trigger: "Defining file scope, effort estimation, and task decomposition" },
    ],
    useWhen: [
      "User asks to plan a feature or refactor",
      "Multi-file changes requiring task breakdown",
      "User wants to understand scope before committing to implementation",
      "Complex work with multiple interdependent steps",
    ],
    avoidWhen: [
      "Quick single-file fixes",
      "Simple questions answerable without planning",
      "User explicitly says 'just do it'",
    ],
  },
  rogue: {
    category: "exploration",
    cost: "FREE",
    triggers: [
      { domain: "Codebase Search", trigger: "Finding patterns, usages, definitions across files" },
      { domain: "Context Gathering", trigger: "Understanding how existing code works" },
    ],
    useWhen: [
      "Wizard/usage is unknown — need to discover it",
      "Multi-file search required",
      "Need to understand code structure before editing",
    ],
    avoidWhen: [
      "File path is already known",
      "Single file, single location",
      "Simple grep would suffice",
    ],
  },
  warlock: {
    category: "exploration",
    cost: "FREE",
    triggers: [
      { domain: "External Research", trigger: "Documentation lookup, library usage, OSS examples" },
      { domain: "Reference Search", trigger: "Official API docs, best practices, external resources" },
    ],
    useWhen: [
      "official docs",
      "external library",
      "how does X work in library Y",
      "best practice for",
    ],
  },
  cleric: {
    category: "advisor",
    cost: "EXPENSIVE",
    triggers: [
      { domain: "Code Review", trigger: "After completing significant implementation work" },
      { domain: "Plan Review", trigger: "Validate plans before execution" },
    ],
    useWhen: [
      "After completing a multi-file implementation",
      "Before executing a complex plan",
      "When unsure if work meets acceptance criteria",
      "After 2+ revision attempts on the same task",
    ],
    avoidWhen: [
      "Simple single-file changes",
      "Trivial fixes (typos, formatting)",
      "When user explicitly wants to skip review",
    ],
  },
  paladin: {
    category: "advisor",
    cost: "EXPENSIVE",
    triggers: [
      { domain: "Security Review", trigger: "After changes touching auth, crypto, tokens, or input handling" },
      { domain: "Spec Compliance", trigger: "When implementing OAuth, OIDC, WebAuthn, JWT, or similar protocols" },
    ],
    useWhen: [
      "After implementing authentication or authorization logic",
      "When adding/modifying token handling, JWT, or session management",
      "After changes to cryptographic operations or key management",
      "When implementing OAuth2, OIDC, WebAuthn, or similar specs",
      "After modifying CORS, CSP, or security headers",
    ],
    avoidWhen: [
      "Pure documentation or README changes",
      "CSS/styling-only changes with no security implications",
      "Test-only changes that don't modify security test assertions",
    ],
  },
}

/**
 * Separate map for custom agent metadata — avoids unsafe mutation of the
 * strongly-typed AGENT_METADATA record.
 */
const CUSTOM_AGENT_METADATA: Record<string, AgentPromptMetadata> = {}

/**
 * Register metadata for a custom agent. Used by create-managers.ts
  * to integrate custom agents into Bard's dynamic prompt builder.
 */
export function registerCustomAgentMetadata(name: string, metadata: AgentPromptMetadata): void {
  CUSTOM_AGENT_METADATA[name] = metadata
}

/**
 * Get all agent metadata — builtins + registered custom agents.
 * Returns a new merged record on each call.
 */
export function getAllAgentMetadata(): Record<string, AgentPromptMetadata> {
  return { ...AGENT_METADATA, ...CUSTOM_AGENT_METADATA }
}

export function createBuiltinAgents(options: CreateBuiltinAgentsOptions = {}): Record<string, AgentConfig> {
  const {
    disabledAgents = [],
    agentOverrides = {},
    categories,
    uiSelectedModel,
    systemDefaultModel,
    availableModels = new Set<string>(),
    disabledSkills,
    resolveSkills,
    fingerprint,
    customAgentMetadata,
    continuation,
  } = options

  const disabledSet = new Set(disabledAgents.map((name) => getAgentConfigKey(name)))
  const normalizedAgentOverrides = Object.fromEntries(
    Object.entries(agentOverrides).map(([key, value]) => [getAgentConfigKey(key), value]),
  )
  const reviewModelVariants = buildReviewModelVariants(normalizedAgentOverrides, disabledSet)

  const result: Record<string, AgentConfig> = {}

  for (const [name, factory] of Object.entries(AGENT_FACTORIES) as [GuildAgentName, AgentFactory][]) {
    if (disabledSet.has(name)) {
      debug(`Builtin agent "${name}" is disabled — skipping`)
      continue
    }

    const override = normalizedAgentOverrides[name]
    const overrideModel = override?.model

    const customFallbackChain: FallbackEntry[] | undefined = override?.fallback_models?.length
      ? override.fallback_models.map((m) => {
          if (m.includes("/")) {
            const [provider, model] = m.split("/", 2)
            return { providers: [provider], model }
          }
          return { providers: [], model: m }
        })
      : undefined

    const resolvedModel = resolveAgentModel(name, {
      availableModels,
      agentMode: factory.mode,
      uiSelectedModel,
      systemDefaultModel,
      overrideModel,
      customFallbackChain,
    })

    if (overrideModel) {
      debug(`Builtin agent "${name}" model overridden via config`, { model: resolvedModel })
    }

    // Use prompt-composer-aware constructors for Bard and Fighter
    // so their prompts conditionally omit references to disabled agents
    let built: AgentConfigWithOptions
    if (name === "bard") {
      built = createBardAgentWithOptions(resolvedModel, disabledSet, fingerprint, customAgentMetadata, categories, reviewModelVariants)
    } else if (name === "fighter") {
      built = createFighterAgentWithOptions(resolvedModel, disabledSet, continuation, categories, reviewModelVariants)
    } else {
      built = buildAgent(factory, resolvedModel, {
        categories,
        disabledSkills,
        resolveSkills,
        disabledAgents: disabledSet,
      })
    }

    const builtinSkills = Array.isArray(built.skills) ? built.skills : undefined
    if ((name === "bard" || name === "fighter") && builtinSkills?.length && resolveSkills) {
      const skillContent = resolveSkills(builtinSkills, disabledSkills)
      if (skillContent) {
        built.prompt = skillContent + (built.prompt ? "\n\n" + built.prompt : "")
      }
    }

    if (override) {
      if (override.skills?.length && resolveSkills) {
        const skillContent = resolveSkills(override.skills, disabledSkills)
        if (skillContent) {
          built.prompt = skillContent + (built.prompt ? "\n\n" + built.prompt : "")
        }
      }
      if (override.prompt_append) {
        built.prompt = (built.prompt ? built.prompt + "\n\n" : "") + override.prompt_append
      }
      if (override.temperature !== undefined) {
        built.temperature = override.temperature
      }
      if (override.modelOptions !== undefined) {
        built.options = override.modelOptions
      }
    }

    result[name] = built
  }

  // Register category-specific Ranger agents for all configured categories.
  // Patterns affect Fighter's routing hints, not whether the agent exists.
  // The base `ranger` agent remains as the generic fallback.
  if (categories && result["ranger"]) {
    const baseRanger = result["ranger"]
    for (const [categoryName, categoryConfig] of Object.entries(categories)) {
      const categoryAgentName = `ranger-${categoryName}`
      if (disabledSet.has(categoryAgentName)) {
        debug(`Category ranger agent "${categoryAgentName}" is disabled — skipping`)
        continue
      }

      const categoryModel = categoryConfig.model
        ? resolveAgentModel(categoryAgentName, {
            availableModels,
            agentMode: "all",
            uiSelectedModel,
            systemDefaultModel,
            overrideModel: categoryConfig.model,
          })
        : baseRanger.model

      let categoryPrompt = baseRanger.prompt as string | undefined
      if (categoryConfig.prompt_append) {
        categoryPrompt = (categoryPrompt ? categoryPrompt + "\n\n" : "") + categoryConfig.prompt_append
      }

      const categoryToolOverrides = categoryConfig.tools
      const categoryRanger: AgentConfig = {
        ...baseRanger,
        description: `Ranger (${categoryName} specialist) — handles ${categoryName} domain tasks dispatched by Fighter`,
        model: categoryModel,
        prompt: categoryPrompt,
        mode: "subagent",
        ...(categoryConfig.temperature !== undefined && { temperature: categoryConfig.temperature }),
        // Categories always inherit Ranger's base tool policy. When `tools` is present,
        // even as `{}`, treat it as "merge no overrides" rather than "clear all tools" so
        // the category agent keeps the base permissions unless explicit boolean overrides are set.
        ...(categoryToolOverrides !== undefined && { tools: { ...baseRanger.tools, ...categoryToolOverrides } }),
      }

        result[categoryAgentName] = categoryRanger
      debug(`Registered category ranger agent "${categoryAgentName}"`, {
        model: categoryModel,
        patterns: categoryConfig.patterns,
      })
    }
  }

  for (const variant of reviewModelVariants) {
    const baseAgent = result[variant.baseAgent]
    if (!baseAgent) continue
    if (result[variant.key]) {
      debug(`Review model variant "${variant.key}" collides with an existing agent — skipping`, {
        baseAgent: variant.baseAgent,
        model: variant.model,
      })
      continue
    }

    result[variant.key] = buildReviewModelVariantAgent(baseAgent, variant)
    debug(`Registered visible review model variant "${variant.key}"`, {
      baseAgent: variant.baseAgent,
      model: variant.model,
    })
  }

  return result
}

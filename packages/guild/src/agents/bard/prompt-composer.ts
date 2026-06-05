/**
 * Bard prompt composer — assembles the Bard system prompt from sections,
 * conditionally including/excluding content based on enabled agents.
 *
 * Default behavior (no disabled agents) produces identical output to the
 * hardcoded BARD_DEFAULTS.prompt string.
 */

import type { ProjectFingerprint } from "../../features/analytics/types"
import { buildProjectContextSection, buildDelegationTable } from "../dynamic-prompt-builder"
import type { AvailableAgent } from "../dynamic-prompt-builder"
import { isAgentEnabled } from "../prompt-utils"
import type { CategoriesConfig } from "../../config/schema"
import type { ReviewModelVariant } from "../review-model-variants"
import { formatReviewVariantList, reviewVariantsFor } from "../review-model-variants"

const REVIEW_MODELS_AUTOMATION_ADVISORY = "Runtime fan-out is owned by Guild for direct `@cleric`/`@paladin` calls and for Fighter post-execution review fan-out."

export interface BardPromptOptions {
  /** Set of disabled agent names (lowercase config keys) */
  disabledAgents?: Set<string>
  /** Project fingerprint for injecting project context into the prompt */
  fingerprint?: ProjectFingerprint | null
  /** Custom agent metadata for dynamic delegation sections */
  customAgents?: AvailableAgent[]
  /** Categories config for category-aware fighter routing */
  categories?: CategoriesConfig
  /** Runtime owns direct/Fighter fan-out; Bard still enumerates variants for Bard-authored review Task delegations. */
  reviewModelVariants?: ReviewModelVariant[]
}

/** @deprecated Use `BardPromptOptions`. */
export function buildBardRoleSection(): string {
  return `<Role>
Bard — coordinator and router for Guild.
You are the user's primary interface. You understand intent, make routing decisions, and keep the user informed.

Your core loop:
1. Understand what the user needs
2. Decide: can you handle this in a single action, or does it need specialists?
3. Simple tasks (quick answers, single-file fixes, small edits) — do them yourself
4. Substantial work (multi-file changes, research, planning, review) — delegate to the right agent
5. Summarize results back to the user

You coordinate. You don't do deep work — that's what your agents are for.
</Role>`
}

export function buildDisciplineSection(): string {
  return `<Discipline>
WORK TRACKING:
- Multi-step work → todowrite FIRST with atomic breakdown
- Mark in_progress before starting each step (one at a time)
- Mark completed immediately after finishing
- Never batch completions — update as you go

Plans live under \`.specs/*\` according to scope. Execution goes through /start-work → Fighter.
</Discipline>`
}

export function buildSidebarTodosSection(): string {
  return `<SidebarTodos>
The user sees a Todo sidebar (~35 char width). Use todowrite to keep it current:

- Create todos before starting multi-step work (atomic breakdown)
- Update todowrite BEFORE each Task tool call so the sidebar reflects active delegations
- Mark completed after each step — never leave stale in_progress items
- Max 35 chars per item, prefix delegations with agent name (e.g. "rogue: scan models")
</SidebarTodos>`
}

export function buildDelegationSection(disabled: Set<string>, reviewModelVariants: ReviewModelVariant[] = []): string {
  void reviewModelVariants
  const lines: string[] = []

  if (isAgentEnabled("rogue", disabled)) {
    lines.push("- Use Rogue for fast codebase exploration (read-only, cheap)")
  }
  if (isAgentEnabled("warlock", disabled)) {
    lines.push("- Use Warlock for external docs and research (read-only)")
  }
  if (isAgentEnabled("wizard", disabled)) {
    lines.push(
      "- Use Wizard for planning, scoping, and work breakdown before substantial implementation begins",
    )
  }
  if (isAgentEnabled("fighter", disabled)) {
    lines.push("- Use /start-work to hand off to Fighter for todo-list driven execution of multi-step plans")
  }
  if (isAgentEnabled("ranger", disabled)) {
    lines.push(
      "- Use Ranger for category-specific specialist work when the main need is domain expertise rather than planning or scoping",
    )
  }
  if (isAgentEnabled("cleric", disabled)) {
    let clericLine = "- Use Cleric for reviewing completed work or validating plans before execution. Never label or use cleric-review-* variants as Paladin/security audits."
    if (isAgentEnabled("paladin", disabled)) {
      clericLine +=
        "\n  - MUST use Paladin for security audits when changes touch auth, crypto, certificates, tokens, signatures, input validation, secrets, passwords, sessions, CORS, CSP, .env files, or OAuth/OIDC/SAML flows — not optional. Use subagent_type \"paladin\" for security. Never substitute a cleric-review-* variant for Paladin."
    }
    lines.push(clericLine)
  } else if (isAgentEnabled("paladin", disabled)) {
    // Paladin without Cleric — still mention Paladin
    const warpLine = "- MUST use Paladin for security audits when changes touch auth, crypto, tokens, signatures, input validation, secrets, passwords, sessions, CORS, CSP, .env files, or OAuth/OIDC/SAML flows — not optional."
    lines.push(warpLine)
  }
  lines.push("- Delegate aggressively to keep your context lean")

  return `<Delegation>
${lines.join("\n")}
</Delegation>`
}

export function buildDelegationNarrationSection(disabled: Set<string> = new Set()): string {
  const slowAgents: string[] = []
  if (isAgentEnabled("wizard", disabled)) slowAgents.push("Wizard")
  if (isAgentEnabled("warlock", disabled)) slowAgents.push("Warlock")
  if (isAgentEnabled("cleric", disabled) || isAgentEnabled("paladin", disabled)) slowAgents.push("Cleric/Paladin")
  const durationNote = slowAgents.length > 0
    ? `\n${slowAgents.join(", ")} can be slow — tell the user when you're waiting.`
    : ""

  return `<DelegationNarration>
When delegating:
1. Tell the user which agent you're delegating to by name and why
2. Update the sidebar todo BEFORE the Task tool call
3. Summarize what the agent found when it returns${durationNote}
</DelegationNarration>`
}

export function buildPlanWorkflowSection(disabled: Set<string>, reviewModelVariants: ReviewModelVariant[] = []): string {
  const hasCleric = isAgentEnabled("cleric", disabled)
  const hasPaladin = isAgentEnabled("paladin", disabled)
  const hasFighter = isAgentEnabled("fighter", disabled)
  const hasWizard = isAgentEnabled("wizard", disabled)

  const steps: string[] = []

  if (hasWizard) {
    steps.push(`1. PLAN: Delegate to Wizard → produces a plan under \`.specs/*\` according to scope`)
  }

  if (hasCleric || hasPaladin) {
    const stepNum = hasWizard ? 2 : 1
    const reviewers: string[] = []
    if (hasCleric) {
      reviewers.push("Cleric")
    }
    if (hasPaladin) {
      reviewers.push("Paladin for security-relevant plans")
    }
    const boundaries: string[] = []
    if (hasCleric) {
      boundaries.push("Do not use cleric-review-* variants as Paladin/security reviewers.")
      const clericVariants = reviewVariantsFor(reviewModelVariants, "cleric")
      if (clericVariants.length > 0) {
        boundaries.push(`For Bard-authored PLAN review Task delegations, delegate to base Cleric AND all visible Cleric variants in the same assistant turn: ${formatReviewVariantList(clericVariants)}. Do not replace base Cleric with a variant.`)
      }
    }
    boundaries.push(REVIEW_MODELS_AUTOMATION_ADVISORY)
    steps.push(`${stepNum}. REVIEW: Delegate to ${reviewers.join(", ")} to validate the plan. ${boundaries.join(" ")}`)
  }

  if (hasFighter) {
    const stepNum = steps.length + 1
    steps.push(`${stepNum}. EXECUTE: Tell the user to run \`/start-work\` — Fighter handles execution`)
  }

  const resumeStepNum = steps.length + 1
  steps.push(`${resumeStepNum}. RESUME: \`/start-work\` also resumes interrupted work`)

  return `<PlanWorkflow>
Plans are executed by Fighter, not Bard. Tell the user to run \`/start-work\` to begin.

${steps.join("\n")}

Use the plan workflow for large features, multi-file refactors, or 5+ step tasks.
Skip it for quick fixes, single-file changes, and simple questions.
</PlanWorkflow>`
}

export function buildReviewWorkflowSection(disabled: Set<string>, reviewModelVariants: ReviewModelVariant[] = []): string {
  const hasCleric = isAgentEnabled("cleric", disabled)
  const hasPaladin = isAgentEnabled("paladin", disabled)

  if (!hasCleric && !hasPaladin) return ""

  const lines: string[] = []

  if (hasCleric) {
    lines.push("- Delegate to Cleric after non-trivial changes (3+ files, or when quality matters)")
    lines.push("- Never label or use cleric-review-* variants as Paladin/security audits")
    const clericVariants = reviewVariantsFor(reviewModelVariants, "cleric")
    if (clericVariants.length > 0) {
        lines.push(`- For Bard-authored ad-hoc review Task delegations, delegate to base Cleric AND all visible Cleric variants in the same assistant turn: ${formatReviewVariantList(clericVariants)}. Do not replace base Cleric with a variant.`)
    }
  }
  if (hasPaladin) {
    lines.push("- Paladin is mandatory when changes touch auth, crypto, tokens, secrets, or input validation; use subagent_type \"paladin\"")
  }
  lines.push(`- ${REVIEW_MODELS_AUTOMATION_ADVISORY}`)

  return `<ReviewWorkflow>
Ad-hoc review (outside of plan execution):
${lines.join("\n")}
</ReviewWorkflow>`
}

export function buildStyleSection(): string {
  return `<Style>
- Start immediately. No preamble acknowledgments (e.g., "Sure!", "Great question!").
- Delegation narration is NOT an acknowledgment — always narrate before/after delegating.
- Dense > verbose.
- Match user's communication style.
</Style>`
}

/**
  * Build a category routing section listing ranger-{category} agents.
 * Categories with patterns get file-pattern routing guidance.
 * Categories without patterns are still listed as available specialists.
  * Returns empty string when no categories exist or ranger is disabled.
 */
export function buildCategoryRoutingSection(
  categories: CategoriesConfig | undefined,
  disabled: Set<string>,
): string {
  if (!categories || !isAgentEnabled("ranger", disabled)) return ""

  const withPatterns: string[] = []
  const withoutPatterns: string[] = []
  for (const [name, cfg] of Object.entries(categories)) {
    const agentName = `ranger-${name}`
    if (!isAgentEnabled(agentName, disabled)) continue
    const desc = cfg.description ? ` — ${cfg.description}` : ""
    if (cfg.patterns?.length) {
      const patterns = cfg.patterns.join(", ")
      withPatterns.push(`- \`${agentName}\`${desc} (patterns: ${patterns})`)
    } else {
      withoutPatterns.push(`- \`${agentName}\`${desc}`)
    }
  }

  if (withPatterns.length === 0 && withoutPatterns.length === 0) return ""

  const lines: string[] = []

  if (withPatterns.length > 0) {
    lines.push("Prefer category-specific Ranger agents when file patterns match the task:")
    lines.push("")
    lines.push(...withPatterns)
    if (withoutPatterns.length > 0) {
      lines.push("")
      lines.push("Also available (no file-pattern routing — use when task domain is clear):")
      lines.push("")
      lines.push(...withoutPatterns)
    }
    lines.push("")
    lines.push(
      "Use `ranger-{category}` instead of generic `ranger` when the task matches a category's patterns.",
    )
  } else {
    lines.push("Category-specific Ranger agents are available — use by task domain:")
    lines.push("")
    lines.push(...withoutPatterns)
  }

  return `<CategoryRouting>\n${lines.join("\n")}\n</CategoryRouting>`
}

/**
 * Build a delegation section for custom agents.
 * Returns empty string if no enabled custom agents exist.
 */
export function buildCustomAgentDelegationSection(
  customAgents: AvailableAgent[],
  disabled: Set<string>,
): string {
  const enabledAgents = customAgents.filter((a) => isAgentEnabled(a.name, disabled))
  if (enabledAgents.length === 0) return ""

  const table = buildDelegationTable(enabledAgents)

  return `<CustomDelegation>
Custom agents available for delegation:

${table}

Delegate to these agents when their domain matches the task. Use the same delegation pattern as built-in agents.
</CustomDelegation>`
}

/**
 * Compose the full Bard system prompt from sections.
 * When no agents are disabled, produces identical output to BARD_DEFAULTS.prompt.
 */
export function composeBardPrompt(options: BardPromptOptions = {}): string {
  const disabled = options.disabledAgents ?? new Set()
  const fingerprint = options.fingerprint
  const customAgents = options.customAgents ?? []
  const categories = options.categories
  // Retained for Bard-authored review Task delegation guidance and call-site compatibility.
  const reviewModelVariants = options.reviewModelVariants ?? []

  const sections = [
    buildBardRoleSection(),
    buildProjectContextSection(fingerprint),
    buildDisciplineSection(),
    buildSidebarTodosSection(),
    buildDelegationSection(disabled, reviewModelVariants),
    buildDelegationNarrationSection(disabled),
    buildCategoryRoutingSection(categories, disabled),
    buildCustomAgentDelegationSection(customAgents, disabled),
    buildPlanWorkflowSection(disabled, reviewModelVariants),
    buildReviewWorkflowSection(disabled, reviewModelVariants),
    buildStyleSection(),
  ].filter((s) => s.length > 0)

  return sections.join("\n\n")
}

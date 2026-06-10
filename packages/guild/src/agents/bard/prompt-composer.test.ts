import { describe, it, expect } from "bun:test"
import {
  composeBardPrompt,
  buildBardRoleSection,
  buildDisciplineSection,
  buildSidebarTodosSection,
  buildDelegationSection,
  buildDelegationNarrationSection,
  buildWizardModeSection,
  buildPlanWorkflowSection,
  buildReviewWorkflowSection,
  buildStyleSection,
  buildCustomAgentDelegationSection,
  buildCategoryRoutingSection,
} from "./prompt-composer"
import type { ProjectFingerprint } from "../../features/analytics/types"
import type { AvailableAgent } from "../dynamic-prompt-builder"

describe("composeBardPrompt", () => {
  it("produces a non-empty prompt with default options", () => {
    const prompt = composeBardPrompt()
    expect(prompt.length).toBeGreaterThan(0)
  })

  it("contains all XML sections with no disabled agents", () => {
    const prompt = composeBardPrompt()
    expect(prompt).toContain("<Role>")
    expect(prompt).toContain("<Discipline>")
    expect(prompt).toContain("<SidebarTodos>")
    expect(prompt).toContain("<Delegation>")
    expect(prompt).toContain("<DelegationNarration>")
    expect(prompt).toContain("<PlanWorkflow>")
    expect(prompt).toContain("<ReviewWorkflow>")
    expect(prompt).toContain("<Style>")
  })

  it("preserves Warp security language with no disabled agents", () => {
    const prompt = composeBardPrompt()
    expect(prompt).toContain("delegate to Paladin for security")
    expect(prompt).toContain("Paladin is mandatory")
  })

  it("preserves review trigger conditions", () => {
    const prompt = composeBardPrompt()
    expect(prompt).toContain("3+ files")
  })

  it("contains plan execution routing in PlanWorkflow", () => {
    const prompt = composeBardPrompt()
    expect(prompt).toContain("Plans are executed by Fighter")
  })

  it("does not include ProjectContext with no fingerprint", () => {
    const prompt = composeBardPrompt()
    expect(prompt).not.toContain("<ProjectContext>")
  })

  it("does not include ProjectContext with null fingerprint", () => {
    const prompt = composeBardPrompt({ fingerprint: null })
    expect(prompt).not.toContain("<ProjectContext>")
  })

  it("includes ProjectContext when fingerprint is provided", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [{ name: "bun", confidence: "high", evidence: "bun.lockb" }],
      isMonorepo: false,
      primaryLanguage: "typescript",
      packageManager: "bun",
    }
    const prompt = composeBardPrompt({ fingerprint: fp })
    expect(prompt).toContain("<ProjectContext>")
    expect(prompt).toContain("typescript")
    expect(prompt).toContain("bun")
    expect(prompt).toContain("</ProjectContext>")
  })

  it("places ProjectContext between Role and Discipline sections", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
      packageManager: "npm",
    }
    const prompt = composeBardPrompt({ fingerprint: fp })
    const roleEnd = prompt.indexOf("</Role>")
    const contextStart = prompt.indexOf("<ProjectContext>")
    const disciplineStart = prompt.indexOf("<Discipline>")
    expect(contextStart).toBeGreaterThan(roleEnd)
    expect(contextStart).toBeLessThan(disciplineStart)
  })
})

describe("buildDelegationSection", () => {
  it("includes all agents by default", () => {
    const section = buildDelegationSection(new Set())
    expect(section).toContain("Rogue")
    expect(section).toContain("Warlock")
    expect(section).toContain("Wizard")
    expect(section).toContain("Fighter")
    expect(section).toContain("Ranger")
    expect(section).toContain("Cleric")
    expect(section).toContain("Paladin")
  })

  it("clarifies Wizard versus Ranger routing boundary", () => {
    const section = buildDelegationSection(new Set())
    expect(section).toContain("delegate to Wizard for planning, scoping, and work breakdown")
    expect(section).toContain("guild-scope, guild-spec, guild-plan, guild-handoff")
    expect(section).toContain("domain expertise rather than planning or scoping")
  })

  it("excludes rogue when disabled", () => {
    const section = buildDelegationSection(new Set(["rogue"]))
    expect(section).not.toContain("delegate to Rogue")
  })

  it("excludes paladin line when paladin disabled", () => {
    const section = buildDelegationSection(new Set(["paladin"]))
    expect(section).toContain("Cleric")
    expect(section).not.toContain("delegate to Paladin for security")
  })

  it("excludes cleric line when cleric disabled but keeps paladin", () => {
    const section = buildDelegationSection(new Set(["cleric"]))
    expect(section).not.toContain("delegate to Cleric")
    expect(section).toContain("delegate to Paladin for security")
  })

  it("excludes both cleric and paladin when both disabled", () => {
    const section = buildDelegationSection(new Set(["cleric", "paladin"]))
    expect(section).not.toContain("Cleric")
    expect(section).not.toContain("Paladin")
  })

  it("always includes delegate aggressively line", () => {
    const section = buildDelegationSection(new Set(["rogue", "warlock", "wizard", "fighter", "ranger", "cleric", "paladin"]))
    expect(section).toContain("Delegate aggressively")
  })

  it("mentions visible Weft review variants when configured", () => {
    const section = buildDelegationSection(new Set(), [
      {
        baseAgent: "cleric" as const,
        key: "cleric-review-opencode-go-kimi-k2-6",
        model: "opencode-go/kimi-k2.6",
        label: "cleric @ opencode-go/kimi-k2.6",
      },
    ])

    expect(section).not.toContain('subagent_type "cleric-review-opencode-go-kimi-k2-6"')
    expect(section).toContain("Never label or use cleric-review-* variants as Paladin/security audits")
  })
})

describe("buildPlanWorkflowSection", () => {
  it("contains plan routing statement", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("Plans are executed by Fighter")
    expect(section).toContain("/start-work")
  })

  it("includes Wizard, Weft, Warp, and Tapestry by default", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("Wizard")
    expect(section).toContain("Cleric")
    expect(section).toContain("Paladin")
    expect(section).toContain("Fighter")
  })

  it("omits Wizard step when wizard disabled", () => {
    const section = buildPlanWorkflowSection(new Set(["wizard"]))
    expect(section).not.toContain("Delegate to Wizard")
  })

  it("omits Weft review when cleric disabled", () => {
    const section = buildPlanWorkflowSection(new Set(["cleric"]))
    expect(section).not.toContain("Cleric review is mandatory")
    // Warp should still be in review step
    expect(section).toContain("Paladin")
  })

  it("omits both review steps when cleric and paladin disabled", () => {
    const section = buildPlanWorkflowSection(new Set(["cleric", "paladin"]))
    expect(section).not.toContain("REVIEW")
  })

  it("includes Warp in review step for security-relevant plans", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("Paladin for security-relevant plans")
  })

  it("includes visible review variants in plan review", () => {
    const section = buildPlanWorkflowSection(new Set(), [
      {
        baseAgent: "cleric" as const,
        key: "cleric-review-opencode-go-glm-5-1",
        model: "opencode-go/glm-5.1",
        label: "cleric @ opencode-go/glm-5.1",
      },
    ])

    expect(section).toContain("Delegate to Cleric, Paladin for security-relevant plans")
    expect(section).toContain("delegate to base Cleric AND all visible Cleric variants")
    expect(section).toContain("Do not replace base Cleric with a variant")
    expect(section).toContain("Do not use cleric-review-* variants as Paladin/security reviewers")
    expect(section).toContain('subagent_type "cleric-review-opencode-go-glm-5-1"')
    expect(section).toContain("Runtime fan-out is owned by Guild for direct `@cleric`/`@paladin` calls")
  })

  it("includes runtime advisory in default plan review step", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("Runtime fan-out is owned by Guild for direct `@cleric`/`@paladin` calls")
    expect(section).toContain("Fighter post-execution review fan-out")
    expect(section).not.toContain('subagent_type "cleric-review-')
  })

  it("omits Warp from review when paladin disabled", () => {
    const section = buildPlanWorkflowSection(new Set(["paladin"]))
    expect(section).toContain("Delegate to Cleric to validate the plan")
    expect(section).not.toContain("Delegate to Cleric, Paladin for security-relevant plans")
  })
})

describe("buildReviewWorkflowSection", () => {
  it("returns empty string when both cleric and paladin disabled", () => {
    const section = buildReviewWorkflowSection(new Set(["cleric", "paladin"]))
    expect(section).toBe("")
  })

  it("includes ad-hoc review section by default", () => {
    const section = buildReviewWorkflowSection(new Set())
    expect(section).toContain("Ad-hoc review")
    expect(section).toContain("Cleric")
    expect(section).toContain("Runtime fan-out is owned by Guild for direct `@cleric`/`@paladin` calls")
  })

  it("includes Warp mandatory line when paladin enabled", () => {
    const section = buildReviewWorkflowSection(new Set())
    expect(section).toContain("Paladin is mandatory")
  })

  it("omits fighter-dependent content gracefully", () => {
    // Review section no longer depends on fighter — output is the same either way
    const withTapestry = buildReviewWorkflowSection(new Set())
    const withoutTapestry = buildReviewWorkflowSection(new Set(["fighter"]))
    expect(withTapestry).toBe(withoutTapestry)
  })

  it("contains Warp mandatory language when paladin enabled", () => {
    const section = buildReviewWorkflowSection(new Set())
    expect(section).toContain("Paladin is mandatory")
    expect(section).toContain("auth")
    expect(section).toContain("crypto")
  })

  it("omits paladin section when paladin disabled", () => {
    const section = buildReviewWorkflowSection(new Set(["paladin"]))
    expect(section).not.toContain("MUST run Paladin")
  })

  it("contains key security trigger keywords when paladin enabled", () => {
    const section = buildReviewWorkflowSection(new Set())
    const triggers = ["crypto", "auth", "tokens", "secrets", "input validation"]
    for (const trigger of triggers) {
      expect(section).toContain(trigger)
    }
  })

  it("includes visible cleric review variants for configured review variants", () => {
    const section = buildReviewWorkflowSection(new Set(), [
      {
        baseAgent: "cleric" as const,
        key: "cleric-review-opencode-go-kimi-k2-6",
        model: "opencode-go/kimi-k2.6",
        label: "cleric @ opencode-go/kimi-k2.6",
      },
      {
        baseAgent: "cleric" as const,
        key: "cleric-review-opencode-go-glm-5-1",
        model: "opencode-go/glm-5.1",
        label: "cleric @ opencode-go/glm-5.1",
      },
    ])

    expect(section).toContain('subagent_type "cleric-review-opencode-go-kimi-k2-6"')
    expect(section).toContain('subagent_type "cleric-review-opencode-go-glm-5-1"')
    expect(section).toContain("delegate to base Cleric AND all visible Cleric variants")
    expect(section).toContain("Do not replace base Cleric with a variant")
    expect(section).toContain("Never label or use cleric-review-* variants as Paladin/security audits")
    expect(section).toContain("Runtime fan-out is owned by Guild for direct `@cleric`/`@paladin` calls")
  })

  it("does not include cleric-review subagent_type entries without configured variants", () => {
    const section = buildReviewWorkflowSection(new Set())
    expect(section).not.toContain('subagent_type "cleric-review-')
  })
})

describe("individual section builders", () => {
  it("buildRoleSection contains Loom identity", () => {
    expect(buildBardRoleSection()).toContain("Bard")
    expect(buildBardRoleSection()).toContain("coordinator")
  })

  it("buildDisciplineSection contains work tracking rules", () => {
    expect(buildDisciplineSection()).toContain("WORK TRACKING")
  })

  it("buildDisciplineSection contains plan routing note", () => {
    const section = buildDisciplineSection()
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter")
  })

  it("buildSidebarTodosSection contains format rules", () => {
    expect(buildSidebarTodosSection()).toContain("35 chars")
  })

  it("buildSidebarTodosSection contains stale-items rule", () => {
    const section = buildSidebarTodosSection()
    expect(section).toContain("never leave stale in_progress")
    expect(section).toContain("BEFORE each delegation call")
  })

  it("buildDelegationNarrationSection contains slow-agent note", () => {
    const section = buildDelegationNarrationSection()
    expect(section).toContain("which agent you're delegating to by name")
    expect(section).toContain("can be slow")
    expect(section).toContain("Wizard")
    expect(section).toContain("Warlock")
  })

  it("buildWizardModeSection offers interactive and automatic choices", () => {
    const section = buildWizardModeSection(new Set())
    expect(section).toContain("MODE: interactive")
    expect(section).toContain("MODE: automatic")
    expect(section).toContain("OpenCode `question` tool")
    expect(section).toContain("choose one of those two options")
  })

  it("buildWizardModeSection omits content when wizard is disabled", () => {
    const section = buildWizardModeSection(new Set(["wizard"]))
    expect(section).toBe("")
  })

  it("buildDelegationNarrationSection omits Wizard from slow agents when disabled", () => {
    const section = buildDelegationNarrationSection(new Set(["wizard"]))
    expect(section).not.toContain("Wizard")
    expect(section).toContain("Warlock")
  })

  it("buildDelegationNarrationSection omits slow-agent note when all slow agents disabled", () => {
    const section = buildDelegationNarrationSection(new Set(["wizard", "warlock", "cleric", "paladin"]))
    expect(section).not.toContain("can be slow")
  })

  it("buildStyleSection contains Dense > verbose", () => {
    expect(buildStyleSection()).toContain("Dense > verbose")
  })
})

describe("buildCustomAgentDelegationSection", () => {
  const makeCustomAgent = (name: string, domain: string, trigger: string): AvailableAgent => ({
    name,
    description: `${name} agent`,
    metadata: {
      category: "specialist",
      cost: "CHEAP",
      triggers: [{ domain, trigger }],
    },
  })

  it("returns empty string when no custom agents", () => {
    expect(buildCustomAgentDelegationSection([], new Set())).toBe("")
  })

  it("returns formatted section for custom agents", () => {
    const agents = [makeCustomAgent("code-reviewer", "Code Review", "Code quality review")]
    const result = buildCustomAgentDelegationSection(agents, new Set())
    expect(result).toContain("<CustomDelegation>")
    expect(result).toContain("</CustomDelegation>")
    expect(result).toContain("Code Review")
    expect(result).toContain("`code-reviewer`")
  })

  it("filters out disabled custom agents", () => {
    const agents = [
      makeCustomAgent("code-reviewer", "Code Review", "Quality review"),
      makeCustomAgent("doc-writer", "Documentation", "Write docs"),
    ]
    const result = buildCustomAgentDelegationSection(agents, new Set(["code-reviewer"]))
    expect(result).not.toContain("code-reviewer")
    expect(result).toContain("doc-writer")
  })

  it("returns empty string when all custom agents are disabled", () => {
    const agents = [makeCustomAgent("code-reviewer", "Code Review", "Quality review")]
    expect(buildCustomAgentDelegationSection(agents, new Set(["code-reviewer"]))).toBe("")
  })

  it("includes multiple custom agents in the table", () => {
    const agents = [
      makeCustomAgent("code-reviewer", "Code Review", "Quality review"),
      makeCustomAgent("compliance", "Compliance", "License checks"),
    ]
    const result = buildCustomAgentDelegationSection(agents, new Set())
    expect(result).toContain("`code-reviewer`")
    expect(result).toContain("`compliance`")
    expect(result).toContain("Code Review")
    expect(result).toContain("Compliance")
  })
})

describe("composeBardPrompt with custom agents", () => {
  it("does not include CustomDelegation when no custom agents provided", () => {
    const prompt = composeBardPrompt()
    expect(prompt).not.toContain("<CustomDelegation>")
  })

  it("does not include CustomDelegation when custom agents array is empty", () => {
    const prompt = composeBardPrompt({ customAgents: [] })
    expect(prompt).not.toContain("<CustomDelegation>")
  })

  it("includes CustomDelegation section when custom agents provided", () => {
    const prompt = composeBardPrompt({
      customAgents: [{
        name: "code-reviewer",
        description: "Reviews code quality",
        metadata: {
          category: "advisor",
          cost: "CHEAP",
          triggers: [{ domain: "Code Review", trigger: "Code quality review and best practices" }],
        },
      }],
    })
    expect(prompt).toContain("<CustomDelegation>")
    expect(prompt).toContain("Code Review")
    expect(prompt).toContain("`code-reviewer`")
    expect(prompt).toContain("</CustomDelegation>")
  })

  it("places CustomDelegation between DelegationNarration and PlanWorkflow", () => {
    const prompt = composeBardPrompt({
      customAgents: [{
        name: "test-agent",
        description: "Test agent",
        metadata: {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "Testing", trigger: "Run tests" }],
        },
      }],
    })
    const narrationEnd = prompt.indexOf("</DelegationNarration>")
    const customStart = prompt.indexOf("<CustomDelegation>")
    const planStart = prompt.indexOf("<PlanWorkflow>")
    expect(customStart).toBeGreaterThan(narrationEnd)
    expect(customStart).toBeLessThan(planStart)
  })

  it("produces identical output to default when customAgents is empty", () => {
    const defaultPrompt = composeBardPrompt()
    const withEmptyCustom = composeBardPrompt({ customAgents: [] })
    expect(withEmptyCustom).toBe(defaultPrompt)
  })

  it("filters disabled custom agents from the section", () => {
    const prompt = composeBardPrompt({
      customAgents: [
        {
          name: "code-reviewer",
          description: "Reviews code",
          metadata: {
            category: "advisor",
            cost: "CHEAP",
            triggers: [{ domain: "Code Review", trigger: "Quality review" }],
          },
        },
        {
          name: "doc-writer",
          description: "Writes docs",
          metadata: {
            category: "utility",
            cost: "CHEAP",
            triggers: [{ domain: "Docs", trigger: "Documentation writing" }],
          },
        },
      ],
      disabledAgents: new Set(["code-reviewer"]),
    })
    expect(prompt).toContain("<CustomDelegation>")
    expect(prompt).not.toContain("code-reviewer")
    expect(prompt).toContain("doc-writer")
  })

  it("omits CustomDelegation entirely when all custom agents are disabled", () => {
    const prompt = composeBardPrompt({
      customAgents: [{
        name: "code-reviewer",
        description: "Reviews code",
        metadata: {
          category: "advisor",
          cost: "CHEAP",
          triggers: [{ domain: "Code Review", trigger: "Quality review" }],
        },
      }],
      disabledAgents: new Set(["code-reviewer"]),
    })
    expect(prompt).not.toContain("<CustomDelegation>")
  })
})

describe("buildCategoryRoutingSection", () => {
  it("returns empty string when categories is undefined", () => {
    expect(buildCategoryRoutingSection(undefined, new Set())).toBe("")
  })

  it("returns empty string when categories is empty", () => {
    expect(buildCategoryRoutingSection({}, new Set())).toBe("")
  })

  it("returns non-empty string when categories have no patterns", () => {
    const cats = { frontend: { description: "Frontend work" } }
    const result = buildCategoryRoutingSection(cats, new Set())
    expect(result).toContain("<CategoryRouting>")
    expect(result).toContain("`ranger-frontend`")
  })

  it("returns empty string when ranger is disabled", () => {
    const cats = { frontend: { patterns: ["src/ui/**"] } }
    expect(buildCategoryRoutingSection(cats, new Set(["ranger"]))).toBe("")
  })

  it("includes ranger-{category} agent for categories with patterns", () => {
    const cats = { frontend: { patterns: ["src/ui/**", "*.css"] } }
    const result = buildCategoryRoutingSection(cats, new Set())
    expect(result).toContain("<CategoryRouting>")
    expect(result).toContain("`ranger-frontend`")
    expect(result).toContain("src/ui/**")
    expect(result).toContain("*.css")
    expect(result).toContain("</CategoryRouting>")
  })

  it("includes category description when provided", () => {
    const cats = { backend: { description: "Backend API work", patterns: ["src/api/**"] } }
    const result = buildCategoryRoutingSection(cats, new Set())
    expect(result).toContain("Backend API work")
    expect(result).toContain("`ranger-backend`")
  })

  it("omits disabled category ranger agents", () => {
    const cats = {
      frontend: { patterns: ["src/ui/**"] },
      backend: { patterns: ["src/api/**"] },
    }
    const result = buildCategoryRoutingSection(cats, new Set(["ranger-frontend"]))
    expect(result).not.toContain("ranger-frontend")
    expect(result).toContain("`ranger-backend`")
  })

  it("returns empty string when all category agents are disabled", () => {
    const cats = { frontend: { patterns: ["src/ui/**"] } }
    expect(buildCategoryRoutingSection(cats, new Set(["ranger-frontend"]))).toBe("")
  })

  it("lists categories without patterns in an 'Also available' subsection", () => {
    const cats = {
      frontend: { description: "UI", patterns: ["src/ui/**"] },
      docs: { description: "Docs only" },
    }
    const result = buildCategoryRoutingSection(cats, new Set())
    expect(result).toContain("`ranger-frontend`")
    expect(result).toContain("Also available")
    expect(result).toContain("`ranger-docs`")
  })
})

describe("composeBardPrompt with categories", () => {
  it("does not include CategoryRouting when no categories provided", () => {
    const prompt = composeBardPrompt()
    expect(prompt).not.toContain("<CategoryRouting>")
  })

  it("includes CategoryRouting even when categories have no patterns", () => {
    const prompt = composeBardPrompt({ categories: { frontend: { description: "UI" } } })
    expect(prompt).toContain("<CategoryRouting>")
    expect(prompt).toContain("ranger-frontend")
  })

  it("includes CategoryRouting when categories with patterns are configured", () => {
    const prompt = composeBardPrompt({
      categories: { frontend: { patterns: ["src/ui/**"] } },
    })
    expect(prompt).toContain("<CategoryRouting>")
    expect(prompt).toContain("`ranger-frontend`")
    expect(prompt).toContain("src/ui/**")
  })

  it("places CategoryRouting after DelegationNarration and before PlanWorkflow", () => {
    const prompt = composeBardPrompt({
      categories: { frontend: { patterns: ["src/ui/**"] } },
    })
    const narrationEnd = prompt.indexOf("</DelegationNarration>")
    const categoryStart = prompt.indexOf("<CategoryRouting>")
    const planStart = prompt.indexOf("<PlanWorkflow>")
    expect(categoryStart).toBeGreaterThan(narrationEnd)
    expect(categoryStart).toBeLessThan(planStart)
  })

  it("produces identical output to default when categories is undefined", () => {
    const defaultPrompt = composeBardPrompt()
    const withUndefined = composeBardPrompt({ categories: undefined })
    expect(withUndefined).toBe(defaultPrompt)
  })

  it("differs from default output when categories with no patterns are provided", () => {
    const defaultPrompt = composeBardPrompt()
    const withNoPatterned = composeBardPrompt({ categories: { frontend: {} } })
    expect(withNoPatterned).not.toBe(defaultPrompt)
  })
})

describe("Bard prompt skill references", () => {
  // Bard's skills are bound via builtin-agents.ts (see builtin-agents.test.ts).
  // The Bard prompt itself references skill-based concepts via section names and workflow guidance,
  // not raw skill names. The actual skill names appear in the prepended skill content.
  // Here we test the concepts that the skill references govern in the prompt text.

  it("PlanWorkflow section references the planning loop that guild-scope/guild-plan govern", () => {
    const section = buildPlanWorkflowSection(new Set())
    // Wizard's planning loop — this is what guild-scope/guild-plan guide
    expect(section).toContain("Wizard runs an interactive planning loop")
    expect(section).toContain("guild-scope, guild-spec, guild-plan")
    expect(section).toContain("plan saved under `.guild/plans/<slug>/`")
  })

  it("PlanWorkflow section references resume via /start-work that guild-handoff governs", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("/start-work")
    expect(section).toContain("RESUME:")
    expect(section).toContain("guild-handoff tracks state")
  })

  it("Discipline section references .guild/plans/ that guild-plan and guild-spec produce", () => {
    const section = buildDisciplineSection()
    expect(section).toContain(".guild/plans/<slug>/")
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter")
  })

  it("Delegation section routes to Wizard (who uses guild-scope, guild-spec, guild-plan) and Fighter (who uses guild-verify)", () => {
    const section = buildDelegationSection(new Set())
    // Wizard: planning, scoping, work breakdown
    expect(section).toContain("delegate to Wizard for planning, scoping, and work breakdown")
    // Fighter: /start-work for execution
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter")
  })

  it("Bard prompt references skill names for Wizard's planning workflow", () => {
    // Bard references skill names to point to Wizard skill behavior without restating full workflow.
    // Skill content is prepended when the agent is created with resolveSkills (tested in builtin-agents.test.ts).
    const prompt = composeBardPrompt()
    expect(prompt).toContain("guild-scope")
    expect(prompt).toContain("guild-spec")
    expect(prompt).toContain("guild-plan")
    expect(prompt).toContain("guild-handoff")
  })
})

describe("Bard planning phase returns control to Bard", () => {
  it("PlanWorkflow section routes plan execution to Fighter, not Bard", () => {
    const section = buildPlanWorkflowSection(new Set())
    // Bard should tell user to run /start-work, not execute the plan itself
    expect(section).toContain("Plans are executed by Fighter")
    expect(section).toContain("/start-work")
    expect(section).not.toContain("Bard executes")
    expect(section).not.toContain("Bard handles execution")
  })

  it("PlanWorkflow includes Wizard in planning phase, then hands off to Fighter", () => {
    const section = buildPlanWorkflowSection(new Set())
    // Wizard does the planning, Fighter does the execution
    expect(section).toContain("Wizard")
    expect(section).toContain("Fighter")
    // The workflow should show: Wizard plans → Fighter executes
    expect(section).toContain("PLAN:")
    expect(section).toContain("EXECUTE:")
  })

  it("PlanWorkflow tells user to run /start-work to begin plan execution", () => {
    const section = buildPlanWorkflowSection(new Set())
    expect(section).toContain("run `/start-work`")
    expect(section).toContain("Fighter handles execution")
  })

  it("Discipline section notes plans live under .guild/plans/ and execution goes through /start-work", () => {
    const section = buildDisciplineSection()
    expect(section).toContain(".guild/plans")
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter")
  })

  it("Delegation section routes Fighter execution to /start-work", () => {
    const section = buildDelegationSection(new Set())
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter")
    // Bard delegates via /start-work, not in-place — handoff is explicit
    expect(section).toContain("hand off to Fighter")
    expect(section).toContain("todo-list driven execution")
  })
})

describe("Bard session boundary semantics", () => {
  it("Delegation section clarifies Fighter executes in a separate session", () => {
    const section = buildDelegationSection(new Set())
    // Should not say Fighter works in the current session
    expect(section).not.toContain("current session")
    expect(section).not.toContain("same session")
  })

  it("PlanWorkflow shows clear handoff boundary between Wizard planning and Fighter execution", () => {
    const section = buildPlanWorkflowSection(new Set())
    // Clear separation: plan via Wizard → execute via /start-work → Fighter
    expect(section).toContain("Wizard runs an interactive planning loop")
    expect(section).toContain("/start-work")
    expect(section).toContain("Fighter handles execution")
  })

  it("no in-place agent switch guidance in Bard prompt — handoff is explicit", () => {
    const prompt = composeBardPrompt()
    // Bard should not be told to "switch to Fighter" — it should hand off via /start-work
    expect(prompt).not.toContain("switch to Fighter")
    expect(prompt).not.toContain("switchAgent")
    expect(prompt).toContain("/start-work")
  })
})

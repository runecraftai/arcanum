import { describe, it, expect } from "bun:test"
import type { LoadedSkill } from "../../features/skill-loader/types"
import {
  composeFighterPrompt,
  buildTapestryRoleSection,
  buildTapestryDisciplineSection,
  buildTapestrySidebarTodosSection,
  buildTapestryPlanExecutionSection,
  buildTapestryContinuationHintSection,
  buildTapestryVerificationSection,
  buildTapestryPostExecutionReviewSection,
  buildTapestryExecutionSection,
  buildTapestryStyleSection,
  buildTapestryDelegationSection,
  buildTapestryParallelismSection,
  buildTapestryErrorHandlingSection,
  buildTapestryCategoryRoutingSection,
} from "./prompt-composer"

describe("composeFighterPrompt", () => {
  it("produces a non-empty prompt with default options", () => {
    const prompt = composeFighterPrompt()
    expect(prompt.length).toBeGreaterThan(0)
  })

  it("contains all XML sections with no disabled agents", () => {
    const prompt = composeFighterPrompt()
    expect(prompt).toContain("<Role>")
    expect(prompt).toContain("<Discipline>")
    expect(prompt).toContain("<SidebarTodos>")
    expect(prompt).toContain("<Delegation>")
    expect(prompt).toContain("<Parallelism>")
    expect(prompt).toContain("<PlanExecution>")
    expect(prompt).toContain("<Verification>")
    expect(prompt).toContain("<ErrorHandling>")
    expect(prompt).toContain("<PostExecutionReview>")
    expect(prompt).toContain("<Execution>")
    expect(prompt).toContain("<Style>")
    expect(prompt).not.toContain("<Continuation>")
  })

  it("adds a continuation hint section when compaction recovery is enabled", () => {
    const prompt = composeFighterPrompt({
      continuation: {
        recovery: { compaction: true },
        idle: { enabled: false, work: false, workflow: false, todo_prompt: false },
      },
    })
    expect(prompt).toContain("<Continuation>")
    expect(prompt).toContain("persisted plan/workflow state")
  })

  it("PostExecutionReview includes Cleric and Paladin by default", () => {
    const prompt = composeFighterPrompt()
    const reviewSection = prompt.slice(
      prompt.indexOf("<PostExecutionReview>"),
      prompt.indexOf("</PostExecutionReview>"),
    )
    expect(reviewSection).toContain("Cleric")
    expect(reviewSection).toContain("Paladin")
  })

  it("PostExecutionReview mentions runtime-owned reviewer fan-out by default", () => {
    const prompt = composeFighterPrompt()
    const reviewSection = prompt.slice(
      prompt.indexOf("<PostExecutionReview>"),
      prompt.indexOf("</PostExecutionReview>"),
    )
    expect(reviewSection).toContain("runtime reviewer fan-out runs automatically")
    expect(reviewSection).toContain("do not delegate terminal reviewers via Task tool")
  })
})

function getSection(prompt: string, tagName: string): string | null {
  const startTag = `<${tagName}>`
  const endTag = `</${tagName}>`
  const startIndex = prompt.indexOf(startTag)

  if (startIndex === -1) {
    return null
  }

  const endIndex = prompt.indexOf(endTag, startIndex)
  return prompt.slice(startIndex, endIndex + endTag.length)
}

describe("buildTapestryPostExecutionReviewSection", () => {
  it("includes both Cleric and Paladin by default", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set())
    expect(section).toContain("Cleric")
    expect(section).toContain("Paladin")
    expect(section).toContain("runtime reviewer fan-out runs automatically")
  })

  it("includes only Cleric when paladin disabled", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set(["paladin"]))
    expect(section).toContain("Summarize Cleric's findings")
    expect(section).not.toContain("Summarize Paladin's findings")
    expect(section).toContain("Do not issue terminal reviewer Task calls")
  })

  it("includes only Paladin when cleric disabled", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set(["cleric"]))
    expect(section).toContain("Summarize Paladin's findings")
    expect(section).not.toContain("Summarize Cleric's findings")
    expect(section).toContain("Do not issue terminal reviewer Task calls")
  })

  it("does not enumerate visible review model variants as task delegates", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set(), [
      {
        baseAgent: "cleric" as const,
        key: "cleric-review-opencode-go-kimi-k2-6",
        model: "opencode-go/kimi-k2.6",
        label: "cleric @ opencode-go/kimi-k2.6",
      },
    ])

    expect(section).not.toContain('subagent_type "cleric-review-opencode-go-kimi-k2-6"')
    expect(section).toContain("the Guild runtime spawns the configured variants and collates results automatically")
    expect(section).toContain("do not issue extra Task calls for them")
    expect(section).toContain("Do not issue terminal reviewer Task calls")
  })

  it("omits review delegation when both disabled", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set(["cleric", "paladin"]))
    expect(section).not.toContain("Delegate to")
    expect(section).not.toContain("do not delegate terminal reviewers via Task tool")
    expect(section).toContain("Report the summary")
  })

  it("contains do NOT attempt to fix with reviewers enabled", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set())
    expect(section).toContain("do NOT attempt to fix")
  })

  it("contains user approval requirement with reviewers enabled", () => {
    const section = buildTapestryPostExecutionReviewSection(new Set())
    expect(section).toContain("user approval")
  })
})

describe("individual fighter section builders", () => {
  it("buildTapestryRoleSection contains Tapestry identity", () => {
    expect(buildTapestryRoleSection()).toContain("Fighter")
    expect(buildTapestryRoleSection()).toContain("coordination orchestrator")
    expect(buildTapestryRoleSection()).toContain("git worktree")
  })

  it("prefers Guild skills before generic skills", () => {
    expect(buildTapestryRoleSection()).toContain("Prefer Guild's own skills first")
  })

  it("buildTapestryDelegationSection routes search work to Rogue and Warlock", () => {
    const section = buildTapestryDelegationSection()
    expect(section).toContain("Rogue (codebase searches")
    expect(section).toContain("Warlock (external docs")
  })

  it("buildTapestryDisciplineSection contains TODO OBSESSION", () => {
    expect(buildTapestryDisciplineSection()).toContain("TODO OBSESSION")
  })

  it("buildTapestrySidebarTodosSection contains format rules", () => {
    expect(buildTapestrySidebarTodosSection()).toContain("35 chars")
  })

  it("buildTapestrySidebarTodosSection contains BEFORE FINISHING mandatory block", () => {
    const section = buildTapestrySidebarTodosSection()
    expect(section).toContain("BEFORE FINISHING (MANDATORY)")
    expect(section).toContain("NON-NEGOTIABLE")
    expect(section).toContain("final todowrite")
  })

  it("buildTapestryPlanExecutionSection references Verification and terminal-state behavior", () => {
    const section = buildTapestryPlanExecutionSection()
    expect(section).toContain("Verification")
    expect(section).toContain("terminal-state behavior")
  })

  it("buildTapestryPlanExecutionSection mentions Cleric by default", () => {
    const section = buildTapestryPlanExecutionSection()
    expect(section).toContain("Cleric")
  })

  it("buildTapestryPlanExecutionSection omits Cleric when disabled", () => {
    const section = buildTapestryPlanExecutionSection(new Set(["cleric"]))
    expect(section).not.toContain("Cleric")
    expect(section).toContain("Verification")
  })

  it("buildTapestryContinuationHintSection returns null when no resume paths are enabled", () => {
    expect(
      buildTapestryContinuationHintSection({
        recovery: { compaction: false },
        idle: { enabled: false, work: false, workflow: false, todo_prompt: true },
      }),
    ).toBeNull()
  })

  it("buildTapestryContinuationHintSection returns a hint when any resume path is enabled", () => {
    const section = buildTapestryContinuationHintSection({
      recovery: { compaction: false },
      idle: { enabled: false, work: true, workflow: false, todo_prompt: false },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("resume from persisted plan/workflow state")
  })

  it("buildTapestryVerificationSection mentions acceptance criteria", () => {
    expect(buildTapestryVerificationSection()).toContain("acceptance criteria")
  })

  it("buildTapestryVerificationSection mentions Ranger output inspection", () => {
    expect(buildTapestryVerificationSection()).toContain("Ranger")
  })

  it("buildTapestryExecutionSection contains top to bottom", () => {
    expect(buildTapestryExecutionSection()).toContain("top to bottom")
  })

  it("buildTapestryStyleSection contains Dense > verbose", () => {
    expect(buildTapestryStyleSection()).toContain("Dense > verbose")
  })

  it("buildTapestryDelegationSection contains subagent_type ranger", () => {
    const section = buildTapestryDelegationSection()
    expect(section).toContain("subagent_type")
    expect(section).toContain("ranger")
  })

  it("warns that subagent_type is case-sensitive (both category and non-category branches)", () => {
    const noCategorySection = buildTapestryDelegationSection()
    expect(noCategorySection).toContain("case-sensitive")

    const categorySection = buildTapestryDelegationSection(["frontend"])
    expect(categorySection).toContain("case-sensitive")
  })

  it("buildTapestryDelegationSection contains delegation contract fields", () => {
    const section = buildTapestryDelegationSection()
    expect(section).toContain("What")
    expect(section).toContain("Files")
    expect(section).toContain("Acceptance")
  })

  it("buildTapestryParallelismSection contains file disjointness rule", () => {
    const section = buildTapestryParallelismSection()
    expect(section).toContain("disjoint")
    expect(section).toContain("3")
  })

  it("buildTapestryParallelismSection mentions max concurrency", () => {
    const section = buildTapestryParallelismSection()
    expect(section).toContain("Maximum 3 concurrent")
  })

  it("buildTapestryErrorHandlingSection contains retry logic", () => {
    const section = buildTapestryErrorHandlingSection()
    expect(section).toContain("Retry")
    expect(section).toContain("blocked")
  })

  it("buildTapestryErrorHandlingSection contains escalation after repeated failures", () => {
    const section = buildTapestryErrorHandlingSection()
    expect(section).toContain("Three or more consecutive failures")
    expect(section).toContain("report to the user")
  })

  it("buildTapestryErrorHandlingSection uses the OpenCode ask_user tool for blockers", () => {
    const section = buildTapestryErrorHandlingSection()
    expect(section).toContain("OpenCode `ask_user` tool")
    expect(section).toContain("ambiguous blocker")
  })

  it("composed prompt contains git worktree reference", () => {
    const prompt = composeFighterPrompt()
    expect(prompt).toContain("git worktree")
  })
})

describe("buildTapestryCategoryRoutingSection", () => {
  it("returns null for empty categories and a section for categories without patterns", () => {
    expect(buildTapestryCategoryRoutingSection({})).toBeNull()
    const section = buildTapestryCategoryRoutingSection({ backend: { model: "claude-opus-4" } })
    expect(section).not.toBeNull()
    expect(section).toContain("ranger-backend")
    expect(section).toContain("explicit/manual-use only")
    expect(section).toContain("never auto-select from file matches")
  })

  it("returns a section when at least one category has patterns", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx", "*.css"] },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("<CategoryRouting>")
  })

  it("lists concrete ranger category agent names for each category with patterns", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
      backend: { patterns: ["*.go"] },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("ranger-frontend")
    expect(section).toContain("ranger-backend")
  })

  it("includes the file patterns for each category", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["src/components/**", "*.tsx", "*.css"] },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("src/components/**")
    expect(section).toContain("*.tsx")
    expect(section).toContain("*.css")
  })

  it("includes routing priority instructions", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("ROUTING PRIORITY")
    expect(section).toContain("[category:")
  })

  it("states overlapping file-wizard matches use the first category in config order", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["src/**"] },
      backend: { patterns: ["src/**/*.ts"] },
    })

    expect(section).not.toBeNull()
    expect(section).toContain(
      "Match task's **Files** against category patterns in config declaration order → use the first matching `ranger-{category}`",
    )
    expect(section).toContain(
      "If multiple categories match the same task's files, the earliest declared matching category wins; later matches do not override earlier ones",
    )
  })

  it("includes fallback to generic ranger", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("ranger")
    expect(section).toContain("fallback")
  })

  it("marks categories without patterns as manual-only even when other categories have patterns", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
      backend: { model: "claude-opus-4" },
    })
    expect(section).not.toBeNull()
    expect(section).toContain("ranger-frontend: patterns [*.tsx]")
    expect(section).toContain(
      "ranger-backend: (no file patterns — explicit/manual-use only; never auto-select from file matches)",
    )
    expect(section).toContain(
      "Categories without file patterns are explicit/manual-use only and are never eligible for file-wizard auto-routing",
    )
  })

  it("omits file-wizard routing steps when all categories are manual-only", () => {
    const section = buildTapestryCategoryRoutingSection({
      backend: { model: "claude-opus-4" },
    })

    expect(section).not.toBeNull()
    expect(section).toContain("ranger-backend")
    expect(section).toContain("explicit/manual-use only")
    expect(section).not.toContain("Match task's **Files** against category patterns in config declaration order")
  })
})

describe("composeFighterPrompt with categories", () => {
  it("includes CategoryRouting section when categories with patterns provided", () => {
    const prompt = composeFighterPrompt({
      categories: { frontend: { patterns: ["*.tsx"] } },
    })
    expect(prompt).toContain("<CategoryRouting>")
    expect(prompt).toContain("ranger-frontend")
  })

  it("omits CategoryRouting section when no categories provided", () => {
    const prompt = composeFighterPrompt()
    expect(prompt).not.toContain("<CategoryRouting>")
  })

  it("includes CategoryRouting section when categories have no patterns", () => {
    const prompt = composeFighterPrompt({
      categories: { backend: { model: "claude-opus-4" } },
    })
    expect(prompt).toContain("<CategoryRouting>")
    expect(prompt).toContain("ranger-backend")
    expect(prompt).toContain("explicit/manual-use only")
    expect(prompt).toContain("never eligible for file-wizard auto-routing")
  })

  it("keeps no-wizard categories out of delegation auto-routing examples", () => {
    const prompt = composeFighterPrompt({
      categories: {
        frontend: { patterns: ["*.tsx"] },
        backend: { model: "claude-opus-4" },
      },
    })
    const delegationSection = getSection(prompt, "Delegation")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain("ranger-frontend")
    expect(delegationSection).not.toContain("ranger-backend")
    expect(delegationSection).not.toContain("ranger-{category}")
  })

  it("delegation section uses concrete category agent names when categories present", () => {
    const prompt = composeFighterPrompt({
      categories: { frontend: { patterns: ["*.tsx"] } },
    })
    const delegationSection = getSection(prompt, "Delegation")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain("ranger-frontend")
    expect(delegationSection).not.toContain("ranger-{category}")
  })

  it("delegation section uses plain ranger when no categories", () => {
    const prompt = composeFighterPrompt()
    const delegationSection = getSection(prompt, "Delegation")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain('subagent_type="ranger"')
    expect(delegationSection).not.toContain("ranger-{category}")
  })

  it("manual-only categories keep plain ranger delegation without placeholder names", () => {
    const prompt = composeFighterPrompt({
      categories: { backend: { model: "claude-opus-4" } },
    })
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")
    const delegationSection = getSection(prompt, "Delegation")

    expect(categoryRoutingSection).not.toBeNull()
    expect(categoryRoutingSection).toContain("ranger-backend")
    expect(categoryRoutingSection).not.toContain("Match task's **Files** against category patterns in config declaration order")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain('subagent_type="ranger"')
    expect(delegationSection).not.toContain("ranger-backend")
    expect(delegationSection).not.toContain("ranger-{category}")
  })
})

describe("composeFighterPrompt with availableSkills", () => {
  function skill(name: string, overrides: Partial<LoadedSkill> = {}): LoadedSkill {
    return { name, description: `Description for ${name}`, content: `Content for ${name}`, scope: "builtin", ...overrides }
  }

  it("renders descriptions for matched skill names", () => {
    const prompt = composeFighterPrompt({
      availableSkills: [skill("guild-load", { description: "Load context." })],
    })
    expect(prompt).toContain("`guild-load` — Load context.")
  })

  it("renders bare name for git-worktree with no matching entry", () => {
    const prompt = composeFighterPrompt({
      availableSkills: [skill("guild-load", { description: "Load context." })],
    })
    const afterRole = prompt.indexOf("</Role>") + "</Role>".length
    const skillsSection = prompt.slice(
      prompt.indexOf("<AvailableSkills>", afterRole),
      prompt.indexOf("</AvailableSkills>"),
    )
    // git-worktree is in FIGHTER_SKILL_NAMES but not in availableSkills
    expect(skillsSection).toContain("- `git-worktree`")
    // It should be a bare bullet with no description
    const gitLine = skillsSection.split("\n").find((l) => l.includes("git-worktree"))
    expect(gitLine).not.toContain("—")
  })

  it("<AvailableSkills> appears directly after <Role> and before <Invariant>", () => {
    const prompt = composeFighterPrompt({
      availableSkills: [skill("guild-execute", { description: "Execute tasks." })],
    })
    const roleEnd = prompt.indexOf("</Role>")
    const skillsStart = prompt.indexOf("<AvailableSkills>", roleEnd)
    const skillsEnd = prompt.indexOf("</AvailableSkills>")
    const invariantStart = prompt.indexOf("<Invariant>")
    expect(skillsStart).toBeGreaterThan(roleEnd)
    expect(skillsEnd).toBeLessThan(invariantStart)
  })
})

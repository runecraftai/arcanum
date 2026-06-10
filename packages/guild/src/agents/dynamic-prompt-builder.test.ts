import { describe, it, expect } from "bun:test"
import {
  categorizeTools,
  buildKeyTriggersSection,
  buildToolSelectionTable,
  buildRogueSection,
  buildWarlockSection,
  buildClericSection,
  buildPaladinSection,
  buildDelegationTable,
  buildCategorySkillsDelegationGuide,
  buildProjectContextSection,
} from "./dynamic-prompt-builder"
import type { AvailableAgent, AvailableSkill, AvailableCategory } from "./dynamic-prompt-builder"
import type { ProjectFingerprint } from "../features/analytics/types"

function makeAgent(name: string, overrides: Partial<AvailableAgent["metadata"]> = {}): AvailableAgent {
  return {
    name,
    description: `${name} agent description.`,
    metadata: {
      category: "specialist",
      cost: "CHEAP",
      triggers: [{ domain: `${name} domain`, trigger: `Use for ${name} tasks` }],
      ...overrides,
    },
  }
}

describe("categorizeTools", () => {
  it("categorizes tool names by prefix/exact match", () => {
    const tools = categorizeTools(["lsp_hover", "ast_grep_find", "grep", "glob", "session_list", "skill", "write"])
    expect(tools.find((t) => t.name === "lsp_hover")?.category).toBe("lsp")
    expect(tools.find((t) => t.name === "ast_grep_find")?.category).toBe("ast")
    expect(tools.find((t) => t.name === "grep")?.category).toBe("search")
    expect(tools.find((t) => t.name === "glob")?.category).toBe("search")
    expect(tools.find((t) => t.name === "session_list")?.category).toBe("session")
    expect(tools.find((t) => t.name === "skill")?.category).toBe("command")
    expect(tools.find((t) => t.name === "write")?.category).toBe("other")
  })

  it("returns empty array for empty input", () => {
    expect(categorizeTools([])).toEqual([])
  })
})

describe("buildKeyTriggersSection", () => {
  it("returns empty string when no agents have keyTrigger", () => {
    const agents = [makeAgent("bard"), makeAgent("fighter")]
    expect(buildKeyTriggersSection(agents)).toBe("")
  })

  it("includes keyTrigger lines for agents that have them", () => {
    const agents = [makeAgent("bard", { keyTrigger: "**'ultrawork'** → Deep execution mode" })]
    const result = buildKeyTriggersSection(agents)
    expect(result).toContain("**'ultrawork'**")
    expect(result).toContain("Key Triggers")
  })
})

describe("buildToolSelectionTable", () => {
  it("orders agents by cost FREE → CHEAP → EXPENSIVE", () => {
    const agents = [
      makeAgent("expensive-agent", { cost: "EXPENSIVE" }),
      makeAgent("free-agent", { cost: "FREE" }),
      makeAgent("cheap-agent", { cost: "CHEAP" }),
    ]
    const result = buildToolSelectionTable(agents)
    const freePos = result.indexOf("free-agent")
    const cheapPos = result.indexOf("cheap-agent")
    const expensivePos = result.indexOf("expensive-agent")
    expect(freePos).toBeLessThan(cheapPos)
    expect(cheapPos).toBeLessThan(expensivePos)
  })

  it("excludes utility category agents", () => {
    const agents = [
      makeAgent("ranger", { category: "utility" }),
      makeAgent("wizard", { cost: "EXPENSIVE", category: "specialist" }),
    ]
    const result = buildToolSelectionTable(agents)
    expect(result).not.toContain("ranger")
    expect(result).toContain("wizard")
  })

  it("includes tool names in FREE section when tools provided", () => {
    const agents = [makeAgent("bard")]
    const tools = categorizeTools(["grep", "glob"])
    const result = buildToolSelectionTable(agents, tools)
    expect(result).toContain("`grep`")
    expect(result).toContain("FREE")
  })

  it("always ends with default flow line", () => {
    const result = buildToolSelectionTable([makeAgent("bard")])
    expect(result).toContain("Default flow")
  })
})

describe("buildRogueSection", () => {
  it("returns empty string when no rogue agent", () => {
    const agents = [makeAgent("bard")]
    expect(buildRogueSection(agents)).toBe("")
  })

  it("returns rogue section when rogue agent present", () => {
    const agents = [makeAgent("rogue", {
      useWhen: ["Wizard unknown", "Multi-file search needed"],
      avoidWhen: ["File path known", "Single file only"],
    })]
    const result = buildRogueSection(agents)
    expect(result).toContain("Rogue Agent")
    expect(result).toContain("Wizard unknown")
    expect(result).toContain("File path known")
  })
})

describe("buildWarlockSection", () => {
  it("returns empty string when no warlock agent", () => {
    const agents = [makeAgent("bard")]
    expect(buildWarlockSection(agents)).toBe("")
  })

  it("returns warlock section when warlock agent present", () => {
    const agents = [makeAgent("warlock", {
      useWhen: ["official docs", "external library"],
    })]
    const result = buildWarlockSection(agents)
    expect(result).toContain("Warlock Agent")
    expect(result).toContain('"official docs"')
  })
})

describe("buildDelegationTable", () => {
  it("includes all agents with their triggers", () => {
    const agents = [
      makeAgent("bard", { triggers: [{ domain: "Orchestration", trigger: "Main tasks" }] }),
      makeAgent("wizard", { triggers: [{ domain: "Planning", trigger: "Complex plans" }] }),
    ]
    const result = buildDelegationTable(agents)
    expect(result).toContain("**Orchestration**")
    expect(result).toContain("`bard`")
    expect(result).toContain("**Planning**")
    expect(result).toContain("`wizard`")
  })

  it("handles agents with no triggers", () => {
    const agents = [makeAgent("bard", { triggers: [] })]
    const result = buildDelegationTable(agents)
    expect(result).toContain("### Delegation Table:")
  })
})

describe("buildClericSection", () => {
  it("returns empty string when no cleric agent present", () => {
    const agents = [makeAgent("bard")]
    expect(buildClericSection(agents)).toBe("")
  })

  it("returns section with useWhen and avoidWhen when cleric agent present", () => {
    const agents = [makeAgent("cleric", {
      useWhen: ["After completing a multi-file implementation", "Before executing a complex plan"],
      avoidWhen: ["Simple single-file changes", "Trivial fixes"],
    })]
    const result = buildClericSection(agents)
    expect(result).toContain("After completing a multi-file implementation")
    expect(result).toContain("Simple single-file changes")
  })

  it("section contains Weft Agent and Quality Gate", () => {
    const agents = [makeAgent("cleric", {
      useWhen: ["After completing work"],
      avoidWhen: ["Trivial changes"],
    })]
    const result = buildClericSection(agents)
    expect(result).toContain("Cleric Agent")
    expect(result).toContain("Quality Gate")
  })
})

describe("buildPaladinSection", () => {
  it("returns empty string when no paladin agent present", () => {
    const agents = [makeAgent("bard")]
    expect(buildPaladinSection(agents)).toBe("")
  })

  it("returns section with useWhen and avoidWhen when paladin agent present", () => {
    const agents = [makeAgent("paladin", {
      useWhen: ["After implementing authentication or authorization logic", "When implementing OAuth2, OIDC, WebAuthn"],
      avoidWhen: ["Pure documentation or README changes", "CSS/styling-only changes"],
    })]
    const result = buildPaladinSection(agents)
    expect(result).toContain("After implementing authentication or authorization logic")
    expect(result).toContain("Pure documentation or README changes")
  })

  it("section contains Warp Agent and Security Gate", () => {
    const agents = [makeAgent("paladin", {
      useWhen: ["After adding auth logic"],
      avoidWhen: ["Documentation only"],
    })]
    const result = buildPaladinSection(agents)
    expect(result).toContain("Paladin Agent")
    expect(result).toContain("Security Gate")
  })
})

describe("buildCategorySkillsDelegationGuide", () => {
  it("returns empty string when no categories or skills", () => {
    expect(buildCategorySkillsDelegationGuide([], [])).toBe("")
  })

  it("lists categories with descriptions", () => {
    const categories: AvailableCategory[] = [
      { name: "quick", description: "Fast tasks" },
      { name: "deep", description: "Complex reasoning" },
    ]
    const result = buildCategorySkillsDelegationGuide(categories, [])
    expect(result).toContain("`quick`")
    expect(result).toContain("Fast tasks")
    expect(result).toContain("`deep`")
  })

  it("separates builtin and custom skills correctly", () => {
    const categories: AvailableCategory[] = [{ name: "quick", description: "Fast" }]
    const skills: AvailableSkill[] = [
      { name: "playwright", description: "Browser automation", location: "builtin" },
      { name: "my-skill", description: "Custom skill", location: "user" },
    ]
    const result = buildCategorySkillsDelegationGuide(categories, skills)
    expect(result).toContain("**Built-in**: playwright")
    expect(result).toContain("**⚡ YOUR SKILLS (PRIORITY)**")
    expect(result).toContain("my-skill (user)")
  })

  it("prioritizes guild skills over generic skills", () => {
    const result = buildCategorySkillsDelegationGuide([], [
      { name: "guild-load", description: "Load Guild context", location: "builtin" },
      { name: "generic-skill", description: "Generic exploration", location: "builtin" },
    ])
    expect(result).toContain("Guild's built-in skills")
    expect(result).toContain("generic skills")
  })
})

describe("buildProjectContextSection", () => {
  it("returns empty string for null fingerprint", () => {
    expect(buildProjectContextSection(null)).toBe("")
  })

  it("returns empty string for undefined fingerprint", () => {
    expect(buildProjectContextSection(undefined)).toBe("")
  })

  it("includes language and package manager when present", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
      packageManager: "bun",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("<ProjectContext>")
    expect(result).toContain("</ProjectContext>")
    expect(result).toContain("typescript")
    expect(result).toContain("bun")
    expect(result).toContain("This is a typescript project using bun.")
  })

  it("includes language without package manager", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "python",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("This is a python project.")
    expect(result).not.toContain("using")
  })

  it("includes high-confidence stack entries only", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [
        { name: "react", confidence: "high", evidence: "package.json dep" },
        { name: "tailwind", confidence: "medium", evidence: "devDep" },
        { name: "typescript", confidence: "high", evidence: "tsconfig.json exists" },
      ],
      isMonorepo: false,
      primaryLanguage: "typescript",
      packageManager: "npm",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("react, typescript")
    expect(result).not.toContain("tailwind")
  })

  it("includes monorepo flag when detected", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: true,
      primaryLanguage: "typescript",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("Monorepo structure detected.")
  })

  it("omits monorepo line when not a monorepo", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
    }
    const result = buildProjectContextSection(fp)
    expect(result).not.toContain("Monorepo")
  })

  it("returns empty string when fingerprint has no useful data", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
    }
    const result = buildProjectContextSection(fp)
    expect(result).toBe("")
  })

  it("includes platform when os is present", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
      os: "darwin",
      arch: "arm64",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("Platform: darwin (arm64).")
  })

  it("includes platform without arch", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
      os: "linux",
    }
    const result = buildProjectContextSection(fp)
    expect(result).toContain("Platform: linux.")
    expect(result).not.toContain("(")
  })

  it("omits platform when os is not present", () => {
    const fp: ProjectFingerprint = {
      generatedAt: new Date().toISOString(),
      stack: [],
      isMonorepo: false,
      primaryLanguage: "typescript",
    }
    const result = buildProjectContextSection(fp)
    expect(result).not.toContain("Platform")
  })
})

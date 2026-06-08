import { describe, it, expect, mock } from "bun:test"
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "./types"
import { buildAgent, stripDisabledAgentReferences, registerAgentNameVariants, addBuiltinNameVariant } from "./agent-builder"
import type { CategoriesConfig } from "../config/schema"

function makeFactory(baseConfig: Partial<AgentConfig> = {}): AgentFactory {
  const factory: AgentFactory = (model: string) => ({ ...baseConfig, model })
  factory.mode = "subagent"
  return factory
}

describe("buildAgent", () => {
  it("factory source is called with model string", () => {
    const factory = makeFactory({ temperature: 0.1 })
    const result = buildAgent(factory, "anthropic/claude-opus-4")
    expect(result.model).toBe("anthropic/claude-opus-4")
    expect(result.temperature).toBe(0.1)
  })

  it("static config source is cloned (original not mutated)", () => {
    const staticConfig: AgentConfig = { model: "openai/gpt-5", temperature: 0.2 }
    const result = buildAgent(staticConfig, "ignored-model")
    // Static config ignores model argument, preserves its own model
    expect(result.model).toBe("openai/gpt-5")
    // Mutate result, original should be unchanged
    result.temperature = 0.9
    expect(staticConfig.temperature).toBe(0.2)
  })

  it("category default model applies when base has no model", () => {
    const factory: AgentFactory = (model: string) => ({ category: "quick" } as AgentConfig)
    factory.mode = "subagent"
    const categories: CategoriesConfig = {
      quick: { model: "google/gemini-3-flash" },
    }
    const result = buildAgent(factory, "some-model", { categories })
    expect(result.model).toBe("google/gemini-3-flash")
  })

  it("category model does NOT apply when base already has a model", () => {
    const factory: AgentFactory = (model: string) => ({ model, category: "quick" } as AgentConfig)
    factory.mode = "subagent"
    const categories: CategoriesConfig = {
      quick: { model: "google/gemini-3-flash" },
    }
    const result = buildAgent(factory, "anthropic/claude-sonnet-4", { categories })
    expect(result.model).toBe("anthropic/claude-sonnet-4")
  })

  it("category temperature applies when base has no temperature", () => {
    const factory: AgentFactory = (model: string) => ({ category: "deep" } as AgentConfig)
    factory.mode = "subagent"
    const categories: CategoriesConfig = {
      deep: { temperature: 0.5 },
    }
    const result = buildAgent(factory, "model", { categories })
    expect(result.temperature).toBe(0.5)
  })

  it("category temperature does NOT apply when base already has temperature", () => {
    const factory: AgentFactory = (model: string) => ({ temperature: 0.1, category: "deep" } as AgentConfig)
    factory.mode = "subagent"
    const categories: CategoriesConfig = {
      deep: { temperature: 0.9 },
    }
    const result = buildAgent(factory, "model", { categories })
    expect(result.temperature).toBe(0.1)
  })

  it("resolveSkills is called with agent skills and result prepended to prompt", () => {
    const resolveSkills = mock((_names: string[]) => "## Skill Content\n\nDo things.")
    const factory: AgentFactory = (model: string) =>
      ({ model, skills: ["playwright"], prompt: "Base prompt." } as AgentConfig)
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { resolveSkills })
    expect(resolveSkills).toHaveBeenCalledWith(["playwright"], undefined)
    expect(result.prompt).toBe("## Skill Content\n\nDo things.\n\nBase prompt.")
  })

  it("skills are prepended even when base has no prompt", () => {
    const resolveSkills = mock((_names: string[]) => "## Skill Content")
    const factory: AgentFactory = (model: string) => ({ model, skills: ["git-master"] } as AgentConfig)
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { resolveSkills })
    expect(result.prompt).toBe("## Skill Content")
  })

  it("resolveSkills is NOT called when agent has no skills", () => {
    const resolveSkills = mock((_names: string[]) => "")
    const factory: AgentFactory = (model: string) => ({ model } as AgentConfig)
    factory.mode = "subagent"
    buildAgent(factory, "model", { resolveSkills })
    expect(resolveSkills).not.toHaveBeenCalled()
  })

  it("empty resolveSkills result does not modify prompt", () => {
    const resolveSkills = mock((_names: string[]) => "")
    const factory: AgentFactory = (model: string) => ({ model, skills: ["missing"], prompt: "Original." } as AgentConfig)
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { resolveSkills })
    expect(result.prompt).toBe("Original.")
  })

  it("no options provided: returns base config with model applied", () => {
    const factory = makeFactory({ temperature: 0.3 })
    const result = buildAgent(factory, "google/gemini-3-pro")
    expect(result.model).toBe("google/gemini-3-pro")
    expect(result.temperature).toBe(0.3)
  })

  it("disabledAgents strips lines referencing disabled agents from prompt", () => {
    const factory: AgentFactory = (model: string) => ({
      model,
      prompt: "Line 1\n- Use rogue (codebase explorer) for broad searches\n- Use warlock (external researcher) for library/API docs\nLine 4",
    })
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { disabledAgents: new Set(["rogue"]) })
    expect(result.prompt).not.toContain("rogue")
    expect(result.prompt).toContain("warlock")
    expect(result.prompt).toContain("Line 1")
    expect(result.prompt).toContain("Line 4")
  })

  it("disabledAgents with empty set does not modify prompt", () => {
    const factory: AgentFactory = (model: string) => ({
      model,
      prompt: "- Use rogue for searches",
    })
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { disabledAgents: new Set() })
    expect(result.prompt).toBe("- Use rogue for searches")
  })

  it("disabledAgents does not modify prompt when agent has no prompt", () => {
    const factory: AgentFactory = (model: string) => ({ model })
    factory.mode = "subagent"
    const result = buildAgent(factory, "model", { disabledAgents: new Set(["rogue"]) })
    expect(result.prompt).toBeUndefined()
  })
})

describe("stripDisabledAgentReferences", () => {
  it("returns prompt unchanged when disabled set is empty", () => {
    const prompt = "Use rogue for searches\nUse warlock for docs"
    expect(stripDisabledAgentReferences(prompt, new Set())).toBe(prompt)
  })

  it("removes lines mentioning a disabled agent", () => {
    const prompt = "Line 1\n- Use rogue (codebase explorer) for broad searches\nLine 3"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue"]))
    expect(result).not.toContain("rogue")
    expect(result).toContain("Line 1")
    expect(result).toContain("Line 3")
  })

  it("removes lines with capitalized agent name", () => {
    const prompt = "**Plan Review** (reviewing Wizard's \`.guild/plans/<slug>/\` output):\nOther content"
    const result = stripDisabledAgentReferences(prompt, new Set(["wizard"]))
    expect(result).not.toContain("Wizard")
    expect(result).toContain("Other content")
  })

  it("handles multiple disabled agents", () => {
    const prompt = "Use rogue for searches\nUse warlock for docs\nUse cleric for review\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue", "warlock"]))
    expect(result).not.toContain("rogue")
    expect(result).not.toContain("warlock")
    expect(result).toContain("cleric")
    expect(result).toContain("Keep this")
  })

  it("uses word boundaries to avoid false positives", () => {
    const prompt = "threading is a wizard for concurrency\nUse rogue for searches"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue"]))
    // "threading" contains "rogue" but the negative lookahead (?!\w) prevents
    // matching because "rogue" is immediately followed by "i" (a word character).
    // Only standalone "rogue" (not part of a larger word) is matched and stripped.
    expect(result).toContain("threading is a wizard for concurrency")
    expect(result).not.toContain("Use rogue for searches")
  })

  it("returns prompt unchanged for unknown agent names", () => {
    const prompt = "Use rogue for searches"
    const result = stripDisabledAgentReferences(prompt, new Set(["unknown-agent"]))
    expect(result).toBe(prompt)
  })

  it("preserves empty lines", () => {
    const prompt = "Line 1\n\nLine 3"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue"]))
    expect(result).toBe("Line 1\n\nLine 3")
  })
})

describe("registerAgentNameVariants", () => {
  it("registers custom agent and strips its references when disabled", () => {
    registerAgentNameVariants("my-bot", ["my-bot", "MyBot"])
    const prompt = "Use my-bot for custom tasks\nUse MyBot for stuff\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["my-bot"]))
    expect(result).not.toContain("my-bot")
    expect(result).not.toContain("MyBot")
    expect(result).toContain("Keep this")
  })

  it("auto-generates title-case variant when no variants provided", () => {
    registerAgentNameVariants("helper")
    const prompt = "Use helper for tasks\nUse Helper for tasks\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["helper"]))
    expect(result).not.toContain("helper")
    expect(result).not.toContain("Helper")
    expect(result).toContain("Keep this")
  })

  it("does not override builtin agent variants", () => {
    registerAgentNameVariants("rogue", ["custom-rogue"])
    // The builtin "Thread" variant should still work
    const prompt = "Use Thread for exploration"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue"]))
    expect(result).not.toContain("Thread")
  })
})

describe("addBuiltinNameVariant", () => {
  it("adds a new variant to an existing builtin", () => {
    addBuiltinNameVariant("rogue", "糸")
    const prompt = "Use 糸 for codebase exploration\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["rogue"]))
    expect(result).not.toContain("糸")
    expect(result).toContain("Keep this")
  })

  it("does not add duplicate variants", () => {
    addBuiltinNameVariant("warlock", "MySpindle")
    addBuiltinNameVariant("warlock", "MySpindle")
    // A duplicate would cause a doubled regex alternation — just verify stripping still works
    const prompt = "Use MySpindle for research\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["warlock"]))
    expect(result).not.toContain("MySpindle")
    expect(result).toContain("Keep this")
  })

  it("is a no-op for an unknown config key (no existing entry to append to)", () => {
    // Should not throw and should not affect stripping of unknown agents
    expect(() => addBuiltinNameVariant("nonexistent-agent", "SomeVariant")).not.toThrow()
    const prompt = "Use SomeVariant for tasks"
    // stripping by nonexistent-agent key has no registered variants so prompt is unchanged
    const result = stripDisabledAgentReferences(prompt, new Set(["nonexistent-agent"]))
    expect(result).toBe(prompt)
  })

  it("custom display name is stripped when builtin agent is disabled", () => {
    addBuiltinNameVariant("wizard", "設計")
    const prompt = "- Use 設計 for planning\n- Use rogue for exploration\nKeep this"
    const result = stripDisabledAgentReferences(prompt, new Set(["wizard"]))
    expect(result).not.toContain("設計")
    expect(result).toContain("rogue")
    expect(result).toContain("Keep this")
  })
})

import { describe, it, expect } from "bun:test"
import { buildEnabledAgentKeys } from "./enabled-agent-keys"
import type { GuildConfig } from "../../config/schema"

const BUILTINS = ["bard", "fighter", "ranger", "wizard", "rogue", "warlock", "cleric", "paladin"]

describe("buildEnabledAgentKeys", () => {
  it("includes all builtins by default", () => {
    const result = buildEnabledAgentKeys({})
    for (const name of BUILTINS) {
      expect(result.has(name)).toBe(true)
    }
  })

  it("excludes disabled builtins", () => {
    const result = buildEnabledAgentKeys({ disabled_agents: ["bard", "paladin"] })
    expect(result.has("bard")).toBe(false)
    expect(result.has("paladin")).toBe(false)
    expect(result.has("fighter")).toBe(true)
  })

  it("includes custom agents not in disabled list", () => {
    const config: GuildConfig = {
      custom_agents: {
        "my-agent": { model: "claude-3-haiku" },
        "other-agent": { model: "gpt-4o" },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("my-agent")).toBe(true)
    expect(result.has("other-agent")).toBe(true)
  })

  it("excludes disabled custom agents", () => {
    const config: GuildConfig = {
      custom_agents: {
        "my-agent": { model: "claude-3-haiku" },
        "other-agent": { model: "gpt-4o" },
      },
      disabled_agents: ["my-agent"],
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("my-agent")).toBe(false)
    expect(result.has("other-agent")).toBe(true)
  })

  it("includes ranger-{category} when category has patterns and ranger is enabled", () => {
    const config: GuildConfig = {
      categories: {
        frontend: { patterns: ["**/*.tsx", "**/*.css"] },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger-frontend")).toBe(true)
  })

  it("includes ranger-{category} even when category has no patterns", () => {
    const config: GuildConfig = {
      categories: {
        frontend: { description: "Frontend work" },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger-frontend")).toBe(true)
  })

  it("includes ranger-{category} even when category has empty patterns array", () => {
    const config: GuildConfig = {
      categories: {
        frontend: { patterns: [] },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger-frontend")).toBe(true)
  })

  it("excludes ranger-{category} when base ranger is disabled", () => {
    const config: GuildConfig = {
      disabled_agents: ["ranger"],
      categories: {
        frontend: { patterns: ["**/*.tsx"] },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger")).toBe(false)
    expect(result.has("ranger-frontend")).toBe(false)
  })

  it("excludes ranger-{category} when the specific category agent is disabled", () => {
    const config: GuildConfig = {
      disabled_agents: ["ranger-frontend"],
      categories: {
        frontend: { patterns: ["**/*.tsx"] },
        backend: { patterns: ["**/*.ts"] },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger-frontend")).toBe(false)
    expect(result.has("ranger-backend")).toBe(true)
  })

  it("handles multiple categories with mixed patterns", () => {
    const config: GuildConfig = {
      categories: {
        frontend: { patterns: ["**/*.tsx"] },
        backend: { description: "No patterns here" },
        infra: { patterns: ["**/terraform/**"] },
      },
    }
    const result = buildEnabledAgentKeys(config)
    expect(result.has("ranger-frontend")).toBe(true)
    expect(result.has("ranger-backend")).toBe(true)
    expect(result.has("ranger-infra")).toBe(true)
  })

  it("returns empty categories set when no categories defined", () => {
    const result = buildEnabledAgentKeys({})
    const categoryShuttles = [...result].filter(k => k.startsWith("ranger-"))
    expect(categoryShuttles).toHaveLength(0)
  })
})

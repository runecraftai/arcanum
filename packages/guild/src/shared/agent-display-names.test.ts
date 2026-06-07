import { describe, it, expect, afterEach } from "bun:test"
import {
  AGENT_DISPLAY_NAMES,
  getAgentDisplayName,
  getAgentConfigKey,
  registerAgentDisplayName,
  updateBuiltinDisplayName,
  resetDisplayNames,
} from "./agent-display-names"

describe("getAgentDisplayName", () => {
  it("returns display name for known config keys", () => {
    expect(getAgentDisplayName("bard")).toBe("Bard (Guildmaster)")
    expect(getAgentDisplayName("fighter")).toBe("Fighter (Execution Lead)")
    expect(getAgentDisplayName("ranger")).toBe("Ranger (Specialist)")
    expect(getAgentDisplayName("wizard")).toBe("Wizard (Planner)")
    expect(getAgentDisplayName("rogue")).toBe("Rogue (Scout)")
    expect(getAgentDisplayName("warlock")).toBe("Warlock (Researcher)")
    expect(getAgentDisplayName("cleric")).toBe("Cleric (Reviewer)")
    expect(getAgentDisplayName("paladin")).toBe("Paladin (Security)")
  })

  it("returns original key for unknown agents", () => {
    expect(getAgentDisplayName("custom-agent")).toBe("custom-agent")
    expect(getAgentDisplayName("unknown")).toBe("unknown")
  })

  it("performs case-insensitive lookup", () => {
    expect(getAgentDisplayName("LOOM")).toBe("Bard (Guildmaster)")
    expect(getAgentDisplayName("Loom")).toBe("Bard (Guildmaster)")
    expect(getAgentDisplayName("Thread")).toBe("Rogue (Scout)")
  })
})

describe("getAgentConfigKey", () => {
  it("resolves display names back to config keys", () => {
    expect(getAgentConfigKey("Bard (Guildmaster)")).toBe("bard")
    expect(getAgentConfigKey("Fighter (Execution Lead)")).toBe("fighter")
    expect(getAgentConfigKey("Wizard (Planner)")).toBe("wizard")
    expect(getAgentConfigKey("Rogue (Scout)")).toBe("rogue")
    expect(getAgentConfigKey("Warlock (Researcher)")).toBe("warlock")
    expect(getAgentConfigKey("Ranger (Specialist)")).toBe("ranger")
    expect(getAgentConfigKey("Cleric (Reviewer)")).toBe("cleric")
    expect(getAgentConfigKey("Paladin (Security)")).toBe("paladin")
  })

  it("passes through config keys unchanged", () => {
    expect(getAgentConfigKey("bard")).toBe("bard")
    expect(getAgentConfigKey("rogue")).toBe("rogue")
  })

  it("returns lowercase for unknown agents", () => {
    expect(getAgentConfigKey("UnknownAgent")).toBe("unknownagent")
  })

  it("accepts structured agent objects", () => {
    expect(getAgentConfigKey({ name: "Bard (Guildmaster)" })).toBe("bard")
    expect(getAgentConfigKey({ label: "Paladin (Security)" })).toBe("paladin")
    expect(getAgentConfigKey({ id: "cleric" })).toBe("cleric")
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("has entries for all 8 built-in agents with display names", () => {
    const expectedKeys = ["bard", "fighter", "ranger", "wizard", "rogue", "warlock", "paladin", "cleric"]
    for (const key of expectedKeys) {
      expect(AGENT_DISPLAY_NAMES[key]).toBeDefined()
    }
    // At least the 8 built-in agents (may be more if custom agents registered in other tests)
    expect(Object.keys(AGENT_DISPLAY_NAMES).length).toBeGreaterThanOrEqual(8)
  })
})

describe("registerAgentDisplayName", () => {
  afterEach(() => {
    resetDisplayNames()
  })

  it("registers a new display name", () => {
    registerAgentDisplayName("custom-test-agent", "Custom Test Agent")
    expect(getAgentDisplayName("custom-test-agent")).toBe("Custom Test Agent")
  })

  it("registered agent is resolvable via getAgentConfigKey", () => {
    registerAgentDisplayName("custom-test-agent", "Custom Test Agent")
    expect(getAgentConfigKey("Custom Test Agent")).toBe("custom-test-agent")
  })

  it("overwrites existing display name for same custom agent", () => {
    registerAgentDisplayName("custom-test-agent", "First Name")
    registerAgentDisplayName("custom-test-agent", "Second Name")
    expect(getAgentDisplayName("custom-test-agent")).toBe("Second Name")
  })

  it("multiple custom agents can be registered", () => {
    registerAgentDisplayName("custom-test-agent", "Agent A")
    registerAgentDisplayName("another-custom", "Agent B")
    expect(getAgentDisplayName("custom-test-agent")).toBe("Agent A")
    expect(getAgentDisplayName("another-custom")).toBe("Agent B")
  })

  it("throws when trying to register a builtin config key", () => {
    expect(() => registerAgentDisplayName("bard", "My Loom")).toThrow(
      /built-in agent name/,
    )
    expect(() => registerAgentDisplayName("paladin", "My Warp")).toThrow(
      /built-in agent name/,
    )
  })

  it("throws when display name collides with a builtin agent's display name", () => {
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "Bard (Guildmaster)"),
    ).toThrow(/reserved for built-in agent/)
  })

  it("throws on case-insensitive collision with builtin display name", () => {
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "bard (guildmaster)"),
    ).toThrow(/reserved for built-in agent/)
  })

  it("allows display names that don't collide with builtins", () => {
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "My Custom Reviewer"),
    ).not.toThrow()
  })
})

describe("updateBuiltinDisplayName", () => {
  afterEach(() => {
    resetDisplayNames()
  })

  it("updates display name for a known builtin", () => {
    updateBuiltinDisplayName("bard", "My Loom")
    expect(getAgentDisplayName("bard")).toBe("My Loom")
  })

  it("reverse lookup returns config key after update", () => {
    updateBuiltinDisplayName("bard", "My Loom")
    expect(getAgentConfigKey("My Loom")).toBe("bard")
  })

  it("old display name no longer resolves after update (cache invalidated)", () => {
    updateBuiltinDisplayName("bard", "My Loom")
    // The old name should not reverse-resolve to "bard" anymore
    expect(getAgentConfigKey("Bard (Guildmaster)")).not.toBe("bard")
  })

  it("multiple updates to same key use last value", () => {
    updateBuiltinDisplayName("bard", "First Name")
    updateBuiltinDisplayName("bard", "Second Name")
    expect(getAgentDisplayName("bard")).toBe("Second Name")
  })

  it("throws for non-builtin keys", () => {
    expect(() => updateBuiltinDisplayName("my-custom-agent", "Custom")).toThrow(
      /not a built-in agent/,
    )
  })

  it("accepts unicode / CJK display names", () => {
    updateBuiltinDisplayName("rogue", "糸")
    expect(getAgentDisplayName("rogue")).toBe("糸")
  })

  it("after override, old builtin display name is still reserved for registerAgentDisplayName", () => {
    // Override bard to "My Loom"
    updateBuiltinDisplayName("bard", "My Loom")
    // The original name "Bard (Guildmaster)" must still be reserved
    // (INITIAL_BUILTIN_DISPLAY_NAMES prevents it from being claimed)
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "Bard (Guildmaster)"),
    ).toThrow(/reserved for built-in agent/)
  })

  it("after override, the new display name is also reserved for registerAgentDisplayName", () => {
    updateBuiltinDisplayName("bard", "My Loom")
    // The current (overridden) name should also be blocked
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "My Loom"),
    ).toThrow(/reserved for built-in agent/)
  })
})

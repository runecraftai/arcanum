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
    expect(getAgentDisplayName("loom")).toBe("Bard (Guildmaster)")
    expect(getAgentDisplayName("tapestry")).toBe("Fighter (Execution Lead)")
    expect(getAgentDisplayName("shuttle")).toBe("Ranger (Specialist)")
    expect(getAgentDisplayName("pattern")).toBe("Wizard (Planner)")
    expect(getAgentDisplayName("thread")).toBe("Rogue (Scout)")
    expect(getAgentDisplayName("spindle")).toBe("Warlock (Researcher)")
    expect(getAgentDisplayName("weft")).toBe("Cleric (Reviewer)")
    expect(getAgentDisplayName("warp")).toBe("Paladin (Security)")
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
    expect(getAgentConfigKey("Bard (Guildmaster)")).toBe("loom")
    expect(getAgentConfigKey("Fighter (Execution Lead)")).toBe("tapestry")
    expect(getAgentConfigKey("Wizard (Planner)")).toBe("pattern")
    expect(getAgentConfigKey("Rogue (Scout)")).toBe("thread")
    expect(getAgentConfigKey("Warlock (Researcher)")).toBe("spindle")
    expect(getAgentConfigKey("Ranger (Specialist)")).toBe("shuttle")
    expect(getAgentConfigKey("Cleric (Reviewer)")).toBe("weft")
    expect(getAgentConfigKey("Paladin (Security)")).toBe("warp")
  })

  it("passes through config keys unchanged", () => {
    expect(getAgentConfigKey("loom")).toBe("loom")
    expect(getAgentConfigKey("thread")).toBe("thread")
  })

  it("returns lowercase for unknown agents", () => {
    expect(getAgentConfigKey("UnknownAgent")).toBe("unknownagent")
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("has entries for all 8 built-in agents with display names", () => {
    const expectedKeys = ["loom", "tapestry", "shuttle", "pattern", "thread", "spindle", "warp", "weft"]
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
    expect(() => registerAgentDisplayName("loom", "My Loom")).toThrow(
      /built-in agent name/,
    )
    expect(() => registerAgentDisplayName("warp", "My Warp")).toThrow(
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
    updateBuiltinDisplayName("loom", "My Loom")
    expect(getAgentDisplayName("loom")).toBe("My Loom")
  })

  it("reverse lookup returns config key after update", () => {
    updateBuiltinDisplayName("loom", "My Loom")
    expect(getAgentConfigKey("My Loom")).toBe("loom")
  })

  it("old display name no longer resolves after update (cache invalidated)", () => {
    updateBuiltinDisplayName("loom", "My Loom")
    // The old name should not reverse-resolve to "loom" anymore
    expect(getAgentConfigKey("Bard (Guildmaster)")).not.toBe("loom")
  })

  it("multiple updates to same key use last value", () => {
    updateBuiltinDisplayName("loom", "First Name")
    updateBuiltinDisplayName("loom", "Second Name")
    expect(getAgentDisplayName("loom")).toBe("Second Name")
  })

  it("throws for non-builtin keys", () => {
    expect(() => updateBuiltinDisplayName("my-custom-agent", "Custom")).toThrow(
      /not a built-in agent/,
    )
  })

  it("accepts unicode / CJK display names", () => {
    updateBuiltinDisplayName("thread", "糸")
    expect(getAgentDisplayName("thread")).toBe("糸")
  })

  it("after override, old builtin display name is still reserved for registerAgentDisplayName", () => {
    // Override loom to "My Loom"
    updateBuiltinDisplayName("loom", "My Loom")
    // The original name "Bard (Guildmaster)" must still be reserved
    // (INITIAL_BUILTIN_DISPLAY_NAMES prevents it from being claimed)
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "Bard (Guildmaster)"),
    ).toThrow(/reserved for built-in agent/)
  })

  it("after override, the new display name is also reserved for registerAgentDisplayName", () => {
    updateBuiltinDisplayName("loom", "My Loom")
    // The current (overridden) name should also be blocked
    expect(() =>
      registerAgentDisplayName("custom-test-agent", "My Loom"),
    ).toThrow(/reserved for built-in agent/)
  })
})

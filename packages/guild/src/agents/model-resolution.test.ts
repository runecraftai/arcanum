import { describe, it, expect } from "bun:test"
import { resolveAgentModel, AGENT_MODEL_REQUIREMENTS, getNextFallbackModel } from "./model-resolution"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  it("has entries for all 6 agents", () => {
    const agents = ["bard", "fighter", "ranger", "wizard", "rogue", "warlock", "cleric"] as const
    for (const a of agents) {
      expect(AGENT_MODEL_REQUIREMENTS[a]).toBeDefined()
      expect(AGENT_MODEL_REQUIREMENTS[a].fallbackChain.length).toBeGreaterThan(0)
    }
  })

  it("each entry has providers and model", () => {
    for (const req of Object.values(AGENT_MODEL_REQUIREMENTS)) {
      for (const entry of req.fallbackChain) {
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(entry.model).toBeTruthy()
      }
    }
  })
})

describe("resolveAgentModel", () => {
  const available = new Set([
    "github-copilot/claude-opus-4.6",
    "github-copilot/claude-sonnet-4.6",
    "github-copilot/claude-haiku-4.5",
    "anthropic/claude-opus-4",
    "anthropic/claude-sonnet-4",
    "openai/gpt-5",
  ])

  it("explicit override takes precedence over everything", () => {
    const result = resolveAgentModel("bard", {
      availableModels: available,
      agentMode: "primary",
      uiSelectedModel: "openai/gpt-5",
      overrideModel: "anthropic/claude-opus-4",
    })
    expect(result).toBe("anthropic/claude-opus-4")
  })

  it("UI-selected model applies for primary agents", () => {
    const result = resolveAgentModel("bard", {
      availableModels: new Set(),
      agentMode: "primary",
      uiSelectedModel: "openai/gpt-5",
    })
    expect(result).toBe("openai/gpt-5")
  })

  it("UI-selected model applies for 'all' mode agents", () => {
    const result = resolveAgentModel("ranger", {
      availableModels: new Set(),
      agentMode: "all",
      uiSelectedModel: "openai/gpt-5",
    })
    expect(result).toBe("openai/gpt-5")
  })

  it("subagent ignores UI-selected model", () => {
    const result = resolveAgentModel("wizard", {
      availableModels: available,
      agentMode: "subagent",
      uiSelectedModel: "openai/gpt-5",
    })
    // Should use fallback chain, not the UI model — wizard finds anthropic/claude-opus-4 (first available in chain)
    expect(result).toBe("anthropic/claude-opus-4")
  })

  it("category model applies when available and no higher priority", () => {
    const result = resolveAgentModel("rogue", {
      availableModels: new Set(["anthropic/claude-sonnet-4"]),
      agentMode: "subagent",
      categoryModel: "anthropic/claude-sonnet-4",
    })
    expect(result).toBe("anthropic/claude-sonnet-4")
  })

  it("category model is skipped when not in availableModels", () => {
    const result = resolveAgentModel("bard", {
      availableModels: available,
      agentMode: "subagent",
      categoryModel: "some/unavailable-model",
    })
    // Falls through to fallback chain — bard finds anthropic/claude-opus-4 (first available in chain)
    expect(result).toBe("anthropic/claude-opus-4")
  })

  it("falls through fallback chain to first available", () => {
    const result = resolveAgentModel("bard", {
      availableModels: new Set(["anthropic/claude-opus-4"]),
      agentMode: "subagent",
    })
    expect(result).toBe("anthropic/claude-opus-4")
  })

  it("uses system default when nothing else available", () => {
    const result = resolveAgentModel("bard", {
      availableModels: new Set(),
      agentMode: "subagent",
      systemDefaultModel: "openai/gpt-4o",
    })
    expect(result).toBe("openai/gpt-4o")
  })

  it("returns best-guess offline model when availableModels empty and no systemDefault", () => {
    const result = resolveAgentModel("bard", {
      availableModels: new Set(),
      agentMode: "subagent",
    })
    // Should be the first in bard's fallback chain
    expect(result).toBe("anthropic/claude-opus-4.6")
  })

  it("override beats UI model for primary agent", () => {
    const result = resolveAgentModel("fighter", {
      availableModels: new Set(),
      agentMode: "primary",
      uiSelectedModel: "google/gemini-3-pro",
      overrideModel: "anthropic/claude-sonnet-4",
    })
    expect(result).toBe("anthropic/claude-sonnet-4")
  })

  it("resolves custom agent with explicit override model", () => {
    const result = resolveAgentModel("my-custom-agent", {
      availableModels: new Set(),
      agentMode: "subagent",
      overrideModel: "custom/model-v1",
    })
    expect(result).toBe("custom/model-v1")
  })

  it("resolves custom agent with customFallbackChain", () => {
    const result = resolveAgentModel("my-custom-agent", {
      availableModels: new Set(["anthropic/claude-sonnet-4"]),
      agentMode: "subagent",
      customFallbackChain: [
        { providers: ["anthropic"], model: "claude-sonnet-4" },
      ],
    })
    expect(result).toBe("anthropic/claude-sonnet-4")
  })

  it("custom agent falls to system default when no fallback chain matches", () => {
    const result = resolveAgentModel("my-custom-agent", {
      availableModels: new Set(),
      agentMode: "subagent",
      systemDefaultModel: "fallback/model",
    })
    expect(result).toBe("fallback/model")
  })

  it("custom agent uses hardcoded default when nothing matches", () => {
    const result = resolveAgentModel("my-custom-agent", {
      availableModels: new Set(),
      agentMode: "subagent",
    })
    expect(result).toBe("anthropic/claude-opus-4.6")
  })

  it("custom agent best-guess uses first fallback entry when offline", () => {
    const result = resolveAgentModel("my-custom-agent", {
      availableModels: new Set(),
      agentMode: "subagent",
      customFallbackChain: [
        { providers: ["google"], model: "gemini-3-pro" },
      ],
    })
    expect(result).toBe("google/gemini-3-pro")
  })

  // --- Builtin with fallback_models (customFallbackChain) ---

  it("builtin agent with fallback_models uses custom chain instead of native default", () => {
    const available = new Set([
      "google/gemini-3-pro",
      "anthropic/claude-opus-4.6",
    ])
    const result = resolveAgentModel("bard", {
      availableModels: available,
      agentMode: "subagent",
      customFallbackChain: [
        { providers: ["google"], model: "gemini-3-pro" },
      ],
    })
    // Should pick from custom chain (google/gemini-3-pro), not bard's native chain (anthropic/claude-opus-4.6)
    expect(result).toBe("google/gemini-3-pro")
  })

  it("builtin agent with model + fallback_models: model override wins", () => {
    const available = new Set([
      "google/gemini-3-pro",
      "openai/gpt-5",
    ])
    const result = resolveAgentModel("wizard", {
      availableModels: available,
      agentMode: "subagent",
      overrideModel: "openai/gpt-5",
      customFallbackChain: [
        { providers: ["google"], model: "gemini-3-pro" },
      ],
    })
    // overrideModel takes precedence over customFallbackChain
    expect(result).toBe("openai/gpt-5")
  })

  it("custom fallback chain with no available models uses offline best-guess from custom chain, not native", () => {
    const available = new Set([
      "anthropic/claude-opus-4.6", // available but NOT in custom chain
    ])
    const result = resolveAgentModel("fighter", {
      availableModels: available,
      agentMode: "subagent",
      customFallbackChain: [
        { providers: ["google"], model: "gemini-3-pro" },
        { providers: ["openai"], model: "gpt-5" },
      ],
    })
    // Custom chain replaces native chain entirely. No custom entry matches available,
    // so offline best-guess picks first custom entry — NOT fighter's native chain.
    expect(result).toBe("google/gemini-3-pro")
  })

  it("without customFallbackChain, builtin falls through native chain as before", () => {
    const available = new Set([
      "openai/gpt-5",
    ])
    const result = resolveAgentModel("bard", {
      availableModels: available,
      agentMode: "subagent",
    })
    // No custom chain provided → uses bard's native fallback chain
    expect(result).toBe("openai/gpt-5")
  })
})

describe("getNextFallbackModel", () => {
  it("returns next model in bard's chain after openai/gpt-5", () => {
    // bard chain: anthropic/claude-opus-4.6 -> anthropic/claude-opus-4 -> openai/gpt-5
    // If gpt-5 failed and all are available, there's no next (gpt-5 is last)
    const available = new Set(["anthropic/claude-opus-4.6", "anthropic/claude-opus-4", "openai/gpt-5"])
    const result = getNextFallbackModel("bard", "openai/gpt-5", available)
    expect(result).toBeNull()
  })

  it("returns next model in bard's chain after anthropic/claude-opus-4.6", () => {
    // bard chain: anthropic/claude-opus-4.6 -> anthropic/claude-opus-4 -> openai/gpt-5
    const available = new Set(["anthropic/claude-opus-4.6", "anthropic/claude-opus-4", "openai/gpt-5"])
    const result = getNextFallbackModel("bard", "anthropic/claude-opus-4.6", available)
    expect(result).toBe("anthropic/claude-opus-4")
  })

  it("skips unavailable models and returns first available after failed", () => {
    // bard chain: anthropic/claude-opus-4.6 -> anthropic/claude-opus-4 -> openai/gpt-5
    // claude-opus-4 is not available, so skip to gpt-5
    const available = new Set(["anthropic/claude-opus-4.6", "openai/gpt-5"])
    const result = getNextFallbackModel("bard", "anthropic/claude-opus-4.6", available)
    expect(result).toBe("openai/gpt-5")
  })

  it("returns null for unknown agent", () => {
    const available = new Set(["anthropic/claude-opus-4.6"])
    const result = getNextFallbackModel("unknown-agent", "anthropic/claude-opus-4.6", available)
    expect(result).toBeNull()
  })

  it("returns next model in fighter's chain after anthropic/claude-sonnet-4.6", () => {
    // fighter chain: anthropic/claude-sonnet-4.6 -> anthropic/claude-sonnet-4 -> openai/gpt-5
    const available = new Set(["anthropic/claude-sonnet-4.6", "anthropic/claude-sonnet-4", "openai/gpt-5"])
    const result = getNextFallbackModel("fighter", "anthropic/claude-sonnet-4.6", available)
    expect(result).toBe("anthropic/claude-sonnet-4")
  })

  it("returns null when failed model is last in chain", () => {
    // rogue chain: anthropic/claude-haiku-4.5 -> anthropic/claude-haiku-4 -> google/gemini-3-flash
    const available = new Set(["anthropic/claude-haiku-4.5", "anthropic/claude-haiku-4", "google/gemini-3-flash"])
    const result = getNextFallbackModel("rogue", "google/gemini-3-flash", available)
    expect(result).toBeNull()
  })

  it("returns next available when intermediate models are missing", () => {
    // fighter chain: anthropic/claude-sonnet-4.6 -> anthropic/claude-sonnet-4 -> openai/gpt-5
    // Only gpt-5 is available after the failed first model
    const available = new Set(["anthropic/claude-sonnet-4.6", "openai/gpt-5"])
    const result = getNextFallbackModel("fighter", "anthropic/claude-sonnet-4.6", available)
    expect(result).toBe("openai/gpt-5")
  })
})

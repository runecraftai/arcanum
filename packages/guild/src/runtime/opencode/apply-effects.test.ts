import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test"
import type { ReviewerPlan } from "../../agents/review-resolver"
import { applyRuntimeEffects } from "./apply-effects"
import { clearFailoverGuard } from "../../application/failover/failover-guard"
import { installTestSink, setLogLevel } from "../../shared/log"

function fanOutPlan(scope: "direct" | "post-execution"): ReviewerPlan {
  return {
    kind: "fan-out",
    scope,
    baseAgent: "cleric",
    primary: { agentName: "cleric", label: "Weft", model: "openai/gpt-4o" },
    variants: [
      { baseAgent: "cleric", key: "cleric.reviewer.1", model: "anthropic/claude-sonnet-4", label: "cleric @ anthropic/claude-sonnet-4" },
      { baseAgent: "cleric", key: "cleric.reviewer.2", model: "google/gemini-2.5-pro", label: "cleric @ google/gemini-2.5-pro" },
    ],
    batch: { mode: "parallel", size: 3 },
  }
}

function primaryOnlyPlan(scope: "direct" | "post-execution"): ReviewerPlan {
  return {
    kind: "primary-only",
    scope,
    baseAgent: "cleric",
    primary: { agentName: "cleric", label: "Weft", model: "openai/gpt-4o" },
    reason: "no-variants",
  }
}

function makeReviewerClient() {
  let sessionIndex = 0
  const createCalls: string[] = []
  const promptAsyncCalls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }> } }> = []

  const client = {
    session: {
      create: mock(async (input?: { title?: string }) => {
        sessionIndex += 1
        createCalls.push(input?.title ?? "")
        return { data: { id: `review-session-${sessionIndex}` } }
      }),
      prompt: mock(async (input: { body?: { model?: { providerID?: string; modelID?: string }; parts?: Array<{ text?: string }> } }) => {
        const text = input.body?.parts?.[0]?.text ?? ""
        const provider = input.body?.model?.providerID ?? "unknown"
        const model = input.body?.model?.modelID ?? "unknown"

        if (text.includes("You are collating multiple AI review outputs into a single consolidated review.")) {
          return { data: { output: "collated output" } }
        }

        return { data: { output: `review:${provider}/${model}` } }
      }),
      promptAsync: mock(async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }> } }) => {
        promptAsyncCalls.push(input)
      }),
    },
  }

  return { client, createCalls, promptAsyncCalls }
}

describe("applyRuntimeEffects", () => {
  it("switches agent and appends prompt text", async () => {
    const output = {
      message: { agent: "Loom (Main Orchestrator)" },
      parts: [{ type: "text", text: "hello" }],
    }

    await applyRuntimeEffects({
      effects: [
        { type: "switchAgent", agent: "fighter" },
        { type: "appendPromptText", text: "## Injected" },
      ],
      output,
    })

    expect(output.message.agent).toBe("Fighter (Execution Lead)")
    expect(output.parts[0].text).toContain("## Injected")
  })

  it("appends prompt text by creating a new text part when needed", async () => {
    const output = {
      message: { agent: "Loom (Main Orchestrator)" },
      parts: [{ type: "image" }],
    }

    await applyRuntimeEffects({
      effects: [{ type: "appendPromptText", text: "## Injected" }],
      output,
    })

    expect(output.parts).toEqual([
      { type: "image" },
      { type: "text", text: "## Injected" },
    ])
  })

  it("injects promptAsync through client", async () => {
    const calls: Array<{ path: { id: string }; body: unknown }> = []
    const client = {
      session: {
        promptAsync: async (input: { path: { id: string }; body: unknown }) => {
          calls.push(input)
        },
      },
    }

    await applyRuntimeEffects({
      effects: [{ type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" }],
      client: client as never,
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].path.id).toBe("s1")
  })

  it("restores agent identity without prompt text", async () => {
    const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
    const client = {
      session: {
        promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
          calls.push(input)
        },
      },
    }

    await applyRuntimeEffects({
      effects: [{ type: "restoreAgent", sessionId: "s2", agent: "bard" }],
      client: client as never,
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].path.id).toBe("s2")
    expect(calls[0].body.agent).toBe("Bard (Guildmaster)")
    expect(calls[0].body.parts).toEqual([])
  })

  it("appends command output as a new text part", async () => {
    const output = { parts: [] as Array<{ type: string; text: string }> }

    await applyRuntimeEffects({
      effects: [{ type: "appendCommandOutput", text: "report" }],
      output,
    })

    expect(output.parts).toEqual([{ type: "text", text: "report" }])
  })

  it("runs reviewer fan-out in direct scope and creates variants + collation sessions", async () => {
    const { client } = makeReviewerClient()

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: fanOutPlan("direct"),
        capturedPrimaryOutput: "primary direct output",
        promptText: "review this",
        originalContext: "ctx",
        idempotencyKey: "k1",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
    })

    expect(client.session.create).toHaveBeenCalledTimes(3)
  })

  it("runs reviewer fan-out in post-execution scope and creates primary + variants + collation sessions", async () => {
    const { client } = makeReviewerClient()

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: fanOutPlan("post-execution"),
        promptText: "review this",
        originalContext: "ctx",
        idempotencyKey: "k2",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
    })

    expect(client.session.create).toHaveBeenCalledTimes(4)
  })

  it("runs primary-only in post-execution scope with exactly one session.create", async () => {
    const { client } = makeReviewerClient()

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: primaryOnlyPlan("post-execution"),
        promptText: "review this",
        originalContext: "ctx",
        idempotencyKey: "k3",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
    })

    expect(client.session.create).toHaveBeenCalledTimes(1)
  })

  it("runs primary-only in direct scope with zero session.create", async () => {
    const { client } = makeReviewerClient()

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: primaryOnlyPlan("direct"),
        capturedPrimaryOutput: "primary direct output",
        promptText: "review this",
        originalContext: "ctx",
        idempotencyKey: "k4",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
    })

    expect(client.session.create).toHaveBeenCalledTimes(0)
  })

  it("dedupes second runReviewerFanOut invocation by idempotency key", async () => {
    const { client } = makeReviewerClient()
    const effect = {
      type: "runReviewerFanOut" as const,
      sessionId: "origin-session",
      plan: fanOutPlan("post-execution"),
      promptText: "review this",
      originalContext: "ctx",
      idempotencyKey: "shared-key",
      delivery: { kind: "injectPromptAsync" as const },
    }

    await applyRuntimeEffects({ effects: [effect], client: client as never })
    await applyRuntimeEffects({ effects: [effect], client: client as never })

    expect(client.session.create).toHaveBeenCalledTimes(4)
    expect(client.session.promptAsync).toHaveBeenCalledTimes(1)
  })

  it("does not suppress fan-out when prompt text contains sentinel", async () => {
    const { client } = makeReviewerClient()

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: fanOutPlan("post-execution"),
        promptText: "review this <!-- guild:reviewer-fanout --> now",
        originalContext: "ctx",
        idempotencyKey: "k-sentinel",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
    })

    expect(client.session.create).toHaveBeenCalledTimes(4)
    expect(client.session.promptAsync).toHaveBeenCalledTimes(1)
  })

  it("delivers final reviewer output via session.promptAsync with sentinel header", async () => {
    const { client, promptAsyncCalls } = makeReviewerClient()
    const recorded: Array<{ sessionId: string; text: string; metadata?: { kind: string; nonce?: string } }> = []

    await applyRuntimeEffects({
      effects: [{
        type: "runReviewerFanOut",
        sessionId: "origin-session",
        plan: fanOutPlan("post-execution"),
        promptText: "review this",
        originalContext: "ctx",
        idempotencyKey: "k5",
        delivery: { kind: "injectPromptAsync" },
      }],
      client: client as never,
      recordInjectedPrompt: (sessionId, text, metadata) => {
        recorded.push({ sessionId, text, metadata: metadata as { kind: string; nonce?: string } | undefined })
      },
    })

    expect(client.session.promptAsync).toHaveBeenCalledTimes(1)
    expect(promptAsyncCalls[0]?.path.id).toBe("origin-session")
    expect(promptAsyncCalls[0]?.body.parts[0]?.text).toContain("<!-- guild:reviewer-fanout -->")
    expect(promptAsyncCalls[0]?.body.parts[0]?.text).toMatch(/nonce:[0-9a-f-]{36}/i)
    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.metadata?.kind).toBe("reviewer-fanout")
    expect(recorded[0]?.metadata?.nonce).toMatch(/^[0-9a-f-]{36}$/i)
  })
})

describe("injectPromptAsync failover replay", () => {
  beforeEach(() => {
    clearFailoverGuard()
  })

  function makeFailingClient(shouldFail: (callIndex: number) => boolean) {
    let callIndex = 0
    const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
    const client = {
      session: {
        promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
          calls.push(input)
          const fail = shouldFail(callIndex)
          callIndex++
          if (fail) {
            throw new Error("OpenAI: quota exceeded")
          }
        },
      },
    }
    return { client, calls }
  }

  function makeMockTracker() {
    return {
      setAgentName: () => {},
      trackModel: () => {},
      endSession: () => {},
      trackCost: () => {},
      trackTokenUsage: () => {},
      trackToolStart: () => {},
      trackToolEnd: () => {},
    }
  }

  it("retries with next fallback model when OpenAI quota error occurs", async () => {
    // First call fails, second succeeds
    const { client, calls } = makeFailingClient((idx) => idx === 0)

    await applyRuntimeEffects({
      effects: [
        // Track claude-opus-4.6 (first in bard's chain) so next fallback is claude-opus-4
        { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
        { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
      ],
      client: client as never,
      tracker: makeMockTracker(),
      availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
    })

    // Two calls: original (failed) + retry
    expect(calls).toHaveLength(2)
    expect(calls[0].path.id).toBe("s1")
    expect(calls[1].path.id).toBe("s1")
  })

  it("does NOT retry for non-eligible errors", async () => {
    const nonEligibleClient = {
      session: {
        promptAsync: async () => {
          throw new Error("openai: invalid API key")
        },
      },
    }

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "openai/gpt-5" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: nonEligibleClient as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("openai: invalid API key")
  })

  it("propagates error when failover also fails", async () => {
    // Both calls fail
    const { client, calls } = makeFailingClient(() => true)

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    // Two calls: original + failed retry
    expect(calls).toHaveLength(2)
  })

  it("does NOT retry when no model is tracked for session", async () => {
    const { client, calls } = makeFailingClient(() => true)

    await expect(
      applyRuntimeEffects({
        effects: [
          // No trackModel effect — session has no tracked model
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    // Only one call — no retry because no model tracked
    expect(calls).toHaveLength(1)
  })

  it("does NOT retry when no next fallback is available", async () => {
    const { client, calls } = makeFailingClient(() => true)

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        // Only the current model is available — no next fallback
        availableModels: new Set(["anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    // Only one call — no retry because no next fallback
    expect(calls).toHaveLength(1)
  })

  it("prevents loop: second failover for same execution is blocked", async () => {
    const { client, calls } = makeFailingClient(() => true)

    // First attempt: failover is attempted but fails
    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    const firstCallCount = calls.length

    // Second attempt: same session+agent — guard blocks retry
    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    // Second invocation should NOT attempt failover (only 1 call instead of 2)
    const secondCallCount = calls.length - firstCallCount
    expect(secondCallCount).toBe(1) // Only the original call, no retry
  })

  it("succeeds on retry when fallback model works", async () => {
    let callIndex = 0
    const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
    const client = {
      session: {
        promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
          calls.push(input)
          callIndex++
          // First call fails with eligible error, second succeeds
          if (callIndex === 1) {
            throw new Error("OpenAI: rate limit exceeded")
          }
        },
      },
    }

    const recorded: Array<{ sessionId: string; text: string }> = []

    await applyRuntimeEffects({
      effects: [
        { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
        { type: "injectPromptAsync", sessionId: "s1", text: "continue working", agent: "bard" },
      ],
      client: client as never,
      tracker: makeMockTracker(),
      availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      recordInjectedPrompt: (sessionId, text) => recorded.push({ sessionId, text }),
    })

    expect(calls).toHaveLength(2)
    expect(recorded).toHaveLength(1)
    expect(recorded[0].text).toBe("continue working")
  })
})

describe("failover structured logging", () => {
  beforeEach(() => {
    clearFailoverGuard()
    setLogLevel("DEBUG")
  })

  afterEach(() => {
    setLogLevel("INFO")
  })

  function makeMockTracker() {
    return {
      setAgentName: () => {},
      trackModel: () => {},
      endSession: () => {},
      trackCost: () => {},
      trackTokenUsage: () => {},
      trackToolStart: () => {},
      trackToolEnd: () => {},
    }
  }

  it("logs eligible_retry with agent, models, and reason", async () => {
    const { entries, uninstall } = installTestSink()
    let callIndex = 0
    const client = {
      session: {
        promptAsync: async () => {
          callIndex++
          if (callIndex === 1) throw new Error("OpenAI: quota exceeded")
        },
      },
    }

    await applyRuntimeEffects({
      effects: [
        { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
        { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
      ],
      client: client as never,
      tracker: makeMockTracker(),
      availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
    })

    const eligibleEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "eligible_retry")
    expect(eligibleEntry).toBeDefined()
    const d = eligibleEntry!.data as Record<string, unknown>
    expect(d.sessionId).toBe("s1")
    expect(d.agent).toBe("bard")
    expect(d.currentModel).toBe("anthropic/claude-opus-4.6")
    expect(d.nextModel).toBe("anthropic/claude-opus-4")
    expect(d.reason).toBe("quota")
    uninstall()
  })

  it("logs retry_succeeded when fallback works", async () => {
    const { entries, uninstall } = installTestSink()
    let callIndex = 0
    const client = {
      session: {
        promptAsync: async () => {
          callIndex++
          if (callIndex === 1) throw new Error("OpenAI: rate limit exceeded")
        },
      },
    }

    await applyRuntimeEffects({
      effects: [
        { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
        { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
      ],
      client: client as never,
      tracker: makeMockTracker(),
      availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
    })

    const successEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "retry_succeeded")
    expect(successEntry).toBeDefined()
    const d = successEntry!.data as Record<string, unknown>
    expect(d.nextModel).toBe("anthropic/claude-opus-4")
    expect(d.reason).toBe("rate_limit")
    uninstall()
  })

  it("logs retry_failed when fallback also fails", async () => {
    const { entries, uninstall } = installTestSink()
    const client = {
      session: {
        promptAsync: async () => {
          throw new Error("OpenAI: quota exceeded")
        },
      },
    }

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    const failedEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "retry_failed")
    expect(failedEntry).toBeDefined()
    const d = failedEntry!.data as Record<string, unknown>
    expect(d.currentModel).toBe("anthropic/claude-opus-4.6")
    expect(d.nextModel).toBe("anthropic/claude-opus-4")
    expect(d.reason).toBe("quota")
    uninstall()
  })

  it("logs blocked_loop when guard prevents retry", async () => {
    const { entries, uninstall } = installTestSink()
    const client = {
      session: {
        promptAsync: async () => {
          throw new Error("OpenAI: quota exceeded")
        },
      },
    }

    // First attempt
    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    // Second attempt — should be blocked
    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6", "anthropic/claude-opus-4"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    const blockedEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "blocked_loop")
    expect(blockedEntry).toBeDefined()
    const d = blockedEntry!.data as Record<string, unknown>
    expect(d.sessionId).toBe("s1")
    expect(d.agent).toBe("bard")
    expect(d.failoverKey).toBe("inject:s1:bard")
    uninstall()
  })

  it("logs no_model_tracked when session has no tracked model", async () => {
    const { entries, uninstall } = installTestSink()
    const client = {
      session: {
        promptAsync: async () => {
          throw new Error("OpenAI: quota exceeded")
        },
      },
    }

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    const noModelEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "no_model_tracked")
    expect(noModelEntry).toBeDefined()
    const d = noModelEntry!.data as Record<string, unknown>
    expect(d.sessionId).toBe("s1")
    expect(d.agent).toBe("bard")
    expect(d.currentModel).toBeUndefined()
    uninstall()
  })

  it("logs no_fallback_available when no next model exists", async () => {
    const { entries, uninstall } = installTestSink()
    const client = {
      session: {
        promptAsync: async () => {
          throw new Error("OpenAI: quota exceeded")
        },
      },
    }

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "anthropic/claude-opus-4.6" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("OpenAI: quota exceeded")

    const noFallbackEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "no_fallback_available")
    expect(noFallbackEntry).toBeDefined()
    const d = noFallbackEntry!.data as Record<string, unknown>
    expect(d.sessionId).toBe("s1")
    expect(d.currentModel).toBe("anthropic/claude-opus-4.6")
    expect(d.reason).toBe("quota")
    uninstall()
  })

  it("logs error_ignored for non-eligible errors", async () => {
    const { entries, uninstall } = installTestSink()
    const client = {
      session: {
        promptAsync: async () => {
          throw new Error("openai: invalid API key")
        },
      },
    }

    await expect(
      applyRuntimeEffects({
        effects: [
          { type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "openai/gpt-5" } },
          { type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "bard" },
        ],
        client: client as never,
        tracker: makeMockTracker(),
        availableModels: new Set(["openai/gpt-5", "anthropic/claude-opus-4.6"]),
      }),
    ).rejects.toThrow("openai: invalid API key")

    const ignoredEntry = entries.find((e) => e.data && (e.data as Record<string, unknown>).status === "error_ignored")
    expect(ignoredEntry).toBeDefined()
    const d = ignoredEntry!.data as Record<string, unknown>
    expect(d.sessionId).toBe("s1")
    expect(d.agent).toBe("bard")
    expect(d.reason).toBeNull()
    uninstall()
  })
})

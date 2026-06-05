import { describe, expect, it } from "bun:test"
import { createDirectReviewerFanOutSessionPolicy } from "./direct-reviewer-fanout-session-policy"
import type { ReviewerPlan } from "../../agents/review-resolver"

function makeFanOutPlan(baseAgent: "cleric" | "paladin"): ReviewerPlan {
  return {
    kind: "fan-out",
    scope: "direct",
    baseAgent,
    primary: {
      agentName: baseAgent,
      label: baseAgent === "cleric" ? "Cleric" : "Paladin",
      model: "primary-model",
    },
      variants: [
        {
          baseAgent,
          key: `${baseAgent}-v1`,
          model: "variant-model",
          label: `${baseAgent} @ variant-model`,
      },
    ],
    batch: { mode: "parallel", size: 2 },
  }
}

describe("createDirectReviewerFanOutSessionPolicy", () => {
  it("emits fan-out effect with original prompt and captured primary output", async () => {
    const plan = makeFanOutPlan("cleric")
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => plan,
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-1",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      originalPromptText: "user original request",
      messageId: "msg-1",
    })

    expect(result.effects).toHaveLength(1)
    expect(result.effects[0]).toMatchObject({
      type: "runReviewerFanOut",
      sessionId: "sess-1",
      plan,
      capturedPrimaryOutput: "assistant verdict",
      promptText: "user original request",
      originalContext: "user original request",
      idempotencyKey: "sess-1:msg-1",
      delivery: { kind: "injectPromptAsync" },
    })
    expect((result.effects[0] as { promptText: string }).promptText).not.toBe("assistant verdict")
  })

  it("emits zero effects for primary-only direct plan", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => ({
          kind: "primary-only",
          scope: "direct",
          baseAgent: "paladin",
          primary: { agentName: "paladin", label: "Paladin", model: "model" },
          reason: "no-variants",
        }),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-2",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "paladin",
      assistantText: "assistant verdict",
      originalPromptText: "user original request",
      messageId: "msg-2",
    })

    expect(result.effects).toEqual([])
  })

  it("emits zero effects for disabled plan", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => ({
          kind: "disabled",
          scope: "direct",
          baseAgent: "cleric",
          reason: "agent-disabled",
        }),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-3",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      originalPromptText: "user original request",
      messageId: "msg-3",
    })

    expect(result.effects).toEqual([])
  })

  it("emits zero effects when originalPromptText is missing", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-4",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      messageId: "msg-4",
    })

    expect(result.effects).toEqual([])
  })

  it("still emits fan-out when assistant text includes reviewer fan-out sentinel", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-5",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "result <!-- guild:reviewer-fanout --> message",
      originalPromptText: "user original request",
      respondingToTrustedInjectedPromptKind: "generic",
      messageId: "msg-5",
    })

    expect(result.effects).toHaveLength(1)
    expect(result.effects[0]).toMatchObject({
      type: "runReviewerFanOut",
      sessionId: "sess-5",
      idempotencyKey: "sess-5:msg-5",
    })
  })

  it("emits zero effects when responding to trusted reviewer-fanout injected prompt", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-8",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      originalPromptText: "runtime injected prompt",
      respondingToTrustedInjectedPromptKind: "reviewer-fanout",
      messageId: "msg-8",
    })

    expect(result.effects).toEqual([])
  })

  it("still emits fan-out when responding to trusted generic injected prompt", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-9",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      originalPromptText: "runtime injected generic prompt",
      respondingToTrustedInjectedPromptKind: "generic",
      messageId: "msg-9",
    })

    expect(result.effects).toHaveLength(1)
    expect(result.effects[0]).toMatchObject({
      type: "runReviewerFanOut",
      sessionId: "sess-9",
      idempotencyKey: "sess-9:msg-9",
    })
  })

  it("emits zero effects when messageId is missing", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-7",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "cleric",
      assistantText: "assistant verdict",
      originalPromptText: "user original request",
      messageId: "",
    })

    expect(result.effects).toEqual([])
  })

  it("emits zero effects for unknown foreground agent", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-6",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "wizard",
      assistantText: "assistant verdict",
      originalPromptText: "user original request",
      messageId: "msg-6",
    })

    expect(result.effects).toEqual([])
  })

  it("falls back to explicit @cleric mention when foreground agent is bard", async () => {
    const plan = makeFanOutPlan("cleric")
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => plan,
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-10",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "bard",
      assistantText: "assistant verdict",
      originalPromptText: "Puedes probar con @cleric el ultimo commit?",
      messageId: "msg-10",
    })

    expect(result.effects).toHaveLength(1)
    expect(result.effects[0]).toMatchObject({
      type: "runReviewerFanOut",
      sessionId: "sess-10",
      plan,
      idempotencyKey: "sess-10:msg-10",
    })
  })

  it("falls back to explicit @paladin mention when foreground agent is bard", async () => {
    const plan = makeFanOutPlan("paladin")
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => plan,
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-11",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "bard",
      assistantText: "assistant verdict",
      originalPromptText: "Puedes probar con @paladin el ultimo commit?",
      messageId: "msg-11",
    })

    expect(result.effects).toHaveLength(1)
    expect(result.effects[0]).toMatchObject({
      type: "runReviewerFanOut",
      sessionId: "sess-11",
      plan,
      idempotencyKey: "sess-11:msg-11",
    })
  })

  it("does not treat natural-language cleric text as explicit fallback when foreground agent is bard", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-12",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "bard",
      assistantText: "assistant verdict",
      originalPromptText: "Puedes probar con cleric el ultimo commit?",
      messageId: "msg-12",
    })

    expect(result.effects).toEqual([])
  })

  it("does not fallback when both @cleric and @paladin mentions are present and foreground agent is not explicit reviewer", async () => {
    const policy = createDirectReviewerFanOutSessionPolicy({
      reviewerResolver: {
        forBaseAgent: () => makeFanOutPlan("cleric"),
      },
    })

    const result = await policy.onAssistantMessage({
      directory: "repo",
      sessionId: "sess-13",
      hooks: {
        contextWindowThresholds: null,
        rulesInjectorEnabled: false,
        rangerMdOnlyEnabled: false,
        verificationReminderEnabled: false,
        todoDescriptionOverrideEnabled: false,
        todoContinuationEnforcerEnabled: false,
      },
      inputTokens: 100,
      foregroundAgent: "bard",
      assistantText: "assistant verdict",
      originalPromptText: "Compare @cleric and @paladin on this commit",
      messageId: "msg-13",
    })

    expect(result.effects).toEqual([])
  })
})

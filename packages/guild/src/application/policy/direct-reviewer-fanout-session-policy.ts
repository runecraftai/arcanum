import { createPolicyResult, type PolicyResult } from "../../domain/policy/policy-result"
import type { ReviewBaseAgent, ReviewerPlan } from "../../agents/review-resolver"
import type { RuntimeEffect } from "../../runtime/opencode/effects"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import type {
  RuntimeAssistantMessageInput,
  RuntimeBeforeCompactionInput,
  RuntimeCompactionInput,
  RuntimeSessionDeletedInput,
  RuntimeSessionIdleInput,
} from "./runtime-policy"
import type { SessionPolicy } from "./session-policy"

export function createDirectReviewerFanOutSessionPolicy(args: {
  reviewerResolver: {
    forBaseAgent(baseAgent: ReviewBaseAgent, scope: "direct" | "post-execution"): ReviewerPlan
  }
}): SessionPolicy {
  return {
    onAssistantMessage(input: RuntimeAssistantMessageInput): PolicyResult<RuntimeEffect> {
      if (!input.assistantText) {
        return createPolicyResult<RuntimeEffect>()
      }

      if (!input.originalPromptText) {
        return createPolicyResult<RuntimeEffect>()
      }

      if (input.respondingToTrustedInjectedPromptKind === "reviewer-fanout") {
        return createPolicyResult<RuntimeEffect>()
      }

      const resolvedBaseAgent = resolveDirectReviewBaseAgent({
        foregroundAgent: input.foregroundAgent,
        originalPromptText: input.originalPromptText,
      })
      if (!resolvedBaseAgent) {
        return createPolicyResult<RuntimeEffect>()
      }

      const plan = args.reviewerResolver.forBaseAgent(resolvedBaseAgent, "direct")
      if (plan.kind === "disabled") {
        return createPolicyResult<RuntimeEffect>()
      }

      if (plan.kind === "primary-only" && plan.scope === "direct") {
        return createPolicyResult<RuntimeEffect>()
      }

      if (plan.kind !== "fan-out" || plan.scope !== "direct") {
        return createPolicyResult<RuntimeEffect>()
      }

      if (!input.messageId) {
        return createPolicyResult<RuntimeEffect>()
      }

      return createPolicyResult<RuntimeEffect>([
        {
          type: "runReviewerFanOut",
          sessionId: input.sessionId,
          plan,
          capturedPrimaryOutput: input.assistantText,
          promptText: input.originalPromptText,
          originalContext: input.originalPromptText,
          idempotencyKey: `${input.sessionId}:${input.messageId}`,
          delivery: { kind: "injectPromptAsync" },
        },
      ])
    },
    onSessionIdle(_input: RuntimeSessionIdleInput): PolicyResult<RuntimeEffect> {
      return createPolicyResult<RuntimeEffect>()
    },
    onSessionDeleted(_input: RuntimeSessionDeletedInput): PolicyResult<RuntimeEffect> {
      return createPolicyResult<RuntimeEffect>()
    },
    beforeCompaction(_input: RuntimeBeforeCompactionInput): void {
      return
    },
    onCompaction(_input: RuntimeCompactionInput): PolicyResult<RuntimeEffect> {
      return createPolicyResult<RuntimeEffect>()
    },
  }
}

function resolveDirectReviewBaseAgent(input: {
  foregroundAgent?: string | null
  originalPromptText: string
}): ReviewBaseAgent | null {
  const configuredForeground = input.foregroundAgent ? getAgentConfigKey(input.foregroundAgent) : null
  if (configuredForeground === "cleric" || configuredForeground === "paladin") {
    return configuredForeground
  }

  return resolveExplicitMentionBaseAgent(input.originalPromptText)
}

function resolveExplicitMentionBaseAgent(promptText: string): ReviewBaseAgent | null {
  const hasClericMention = /(^|[^\w])@cleric\b/i.test(promptText)
  const hasPaladinMention = /(^|[^\w])@paladin\b/i.test(promptText)

  if (hasClericMention && hasPaladinMention) {
    return null
  }

  if (hasClericMention) {
    return "cleric"
  }

  if (hasPaladinMention) {
    return "paladin"
  }

  return null
}

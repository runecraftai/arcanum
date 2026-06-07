import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createSessionClient } from "../../infrastructure/opencode/session-client"
import { runReviewerFanOut } from "../../agents/review-orchestrator"
import type { PluginContext } from "../../plugin/types"
import type { SessionTracker } from "../../features/analytics"
import type { RuntimeEffect } from "./effects"
import { randomUUID } from "node:crypto"
import type { TrustedInjectedPromptMetadata } from "./trusted-message-state"
import { classifyOpenAIFailoverError } from "../../application/failover/openai-error-classifier"
import { canAttemptFailover, markFailoverAttempted } from "../../application/failover/failover-guard"
import { getNextFallbackModel } from "../../agents/model-resolution"
import { logFailoverEvent } from "../../shared/log"

const REVIEWER_FANOUT_SENTINEL = "<!-- guild:reviewer-fanout -->"
const reviewerFanOutSeenByClient = new WeakMap<object, Set<string>>()

function getReviewerFanOutSeenSet(client: PluginContext["client"]): Set<string> {
  const key = client as unknown as object
  let seen = reviewerFanOutSeenByClient.get(key)
  if (!seen) {
    seen = new Set<string>()
    reviewerFanOutSeenByClient.set(key, seen)
  }
  return seen
}

export async function applyRuntimeEffects(args: {
  effects: RuntimeEffect[]
  output?: { message?: Record<string, unknown>; parts?: Array<{ type: string; text?: string }> }
  client?: PluginContext["client"]
  tracker?: SessionTracker
  recordInjectedPrompt?: (sessionId: string, text: string, metadata?: TrustedInjectedPromptMetadata) => void
  pausePlan?: () => void
  pauseWorkflow?: (reason: string) => void
  availableModels?: Set<string>
}): Promise<void> {
  const { effects, output, client, tracker, recordInjectedPrompt, pausePlan, pauseWorkflow, availableModels } = args
  const sessionClient = client ? createSessionClient(client) : null

  // Track the current model per session (from trackModel analytics events)
  // so we can resolve the next fallback when injectPromptAsync fails.
  const sessionModel = new Map<string, string>()

  for (const effect of effects) {
    switch (effect.type) {
      case "switchAgent": {
        if (output?.message) {
          output.message.agent = getAgentDisplayName(effect.agent)
        }
        break
      }
      case "appendPromptText": {
        if (output?.parts) {
          appendToTextParts(output.parts, effect.text, effect.separator ?? "\n\n---\n")
        }
        break
      }
      case "appendCommandOutput": {
        if (output?.parts) {
          output.parts.push({ type: "text", text: effect.text })
        }
        break
      }
      case "injectPromptAsync": {
        if (sessionClient) {
          const failoverKey = `inject:${effect.sessionId}:${effect.agent ?? "default"}`
          try {
            await sessionClient.promptAsync({
              sessionId: effect.sessionId,
              parts: [{ type: "text", text: effect.text }],
              ...(effect.agent ? { agent: getAgentDisplayName(effect.agent) } : {}),
            })
            recordInjectedPrompt?.(effect.sessionId, effect.text)
          } catch (error) {
            // Classify the error to determine failover eligibility and reason
            const classification = classifyOpenAIFailoverError(error)

            // Non-eligible error: log and propagate
            if (!classification.eligible) {
              logFailoverEvent({
                status: classification.provider === "openai" ? "error_ignored" : "error_ignored",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                currentModel: sessionModel.get(effect.sessionId),
                reason: classification.reason,
                summary: `[failover:error_ignored] provider=${classification.provider} reason=${classification.reason ?? "none"}`,
              })
              throw error
            }

            // One-shot guard: only one failover attempt per execution
            if (!canAttemptFailover(failoverKey)) {
              logFailoverEvent({
                status: "blocked_loop",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                currentModel: sessionModel.get(effect.sessionId),
                reason: classification.reason,
                failoverKey,
                summary: `[failover:blocked_loop] already attempted for this execution`,
              })
              throw error
            }

            // Resolve the next fallback model
            const currentModel = sessionModel.get(effect.sessionId)
            if (!currentModel) {
              logFailoverEvent({
                status: "no_model_tracked",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                reason: classification.reason,
                failoverKey,
                summary: `[failover:no_model_tracked] cannot resolve next fallback`,
              })
              markFailoverAttempted(failoverKey)
              throw error
            }

            const nextModel = effect.agent
              ? getNextFallbackModel(effect.agent, currentModel, availableModels ?? new Set())
              : null

            if (!nextModel) {
              logFailoverEvent({
                status: "no_fallback_available",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                currentModel,
                reason: classification.reason,
                failoverKey,
                summary: `[failover:no_fallback_available] current=${currentModel}`,
              })
              markFailoverAttempted(failoverKey)
              throw error
            }

            // Mark failover as attempted before retrying
            markFailoverAttempted(failoverKey)

            logFailoverEvent({
              status: "eligible_retry",
              sessionId: effect.sessionId,
              agent: effect.agent ?? undefined,
              currentModel,
              nextModel,
              reason: classification.reason,
              failoverKey,
              summary: `[failover:eligible_retry] ${currentModel} → ${nextModel} reason=${classification.reason}`,
            })

            // Retry once with the fallback model
            try {
              await sessionClient.promptAsync({
                sessionId: effect.sessionId,
                parts: [{ type: "text", text: effect.text }],
                ...(effect.agent ? { agent: getAgentDisplayName(effect.agent) } : {}),
              })
              recordInjectedPrompt?.(effect.sessionId, effect.text)
              logFailoverEvent({
                status: "retry_succeeded",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                currentModel,
                nextModel,
                reason: classification.reason,
                summary: `[failover:retry_succeeded] ${nextModel}`,
              })
            } catch (retryError) {
              logFailoverEvent({
                status: "retry_failed",
                sessionId: effect.sessionId,
                agent: effect.agent ?? undefined,
                currentModel,
                nextModel,
                reason: classification.reason,
                summary: `[failover:retry_failed] ${nextModel} also failed`,
              })
              throw error
            }
          }
        }
        break
      }
      case "restoreAgent": {
        if (sessionClient) {
          await sessionClient.restoreAgent({
            sessionId: effect.sessionId,
            agent: getAgentDisplayName(effect.agent),
          })
        }
        break
      }
      case "pauseExecution": {
        if (effect.target === "plan" || effect.target === "both") {
          pausePlan?.()
        }
        if (effect.target === "workflow" || effect.target === "both") {
          pauseWorkflow?.(effect.reason)
        }
        break
      }
      case "trackAnalytics": {
        if (!tracker) {
          break
        }
        const event = effect.event
        switch (event.kind) {
          case "setAgentName":
            tracker.setAgentName(event.sessionId, event.agent)
            break
          case "trackModel":
            tracker.trackModel(event.sessionId, event.modelId)
            sessionModel.set(event.sessionId, event.modelId)
            break
          case "endSession":
            tracker.endSession(event.sessionId)
            break
          case "trackCost":
            tracker.trackCost(event.sessionId, event.cost)
            break
          case "trackTokenUsage":
            tracker.trackTokenUsage(event.sessionId, event.usage)
            break
          case "trackToolStart":
            tracker.trackToolStart(event.sessionId, event.tool, event.callId, event.agent)
            break
          case "trackToolEnd":
            tracker.trackToolEnd(event.sessionId, event.tool, event.callId, event.agent)
            break
        }
        break
      }
      case "runReviewerFanOut": {
        if (!client) {
          break
        }

        const seen = getReviewerFanOutSeenSet(client)
        if (seen.has(effect.idempotencyKey)) {
          break
        }

        // Record idempotency key before execution (including failures) to avoid retry storms.
        seen.add(effect.idempotencyKey)

        try {
          const { output: fanOutOutput, failureWarning } = await runReviewerFanOut({
            plan: effect.plan,
            capturedPrimaryOutput: effect.capturedPrimaryOutput,
            promptText: effect.promptText,
            originalContext: effect.originalContext,
            client,
          })

          if (!fanOutOutput) {
            break
          }

          const mergedOutput = failureWarning && !fanOutOutput.startsWith(failureWarning)
            ? `${failureWarning}\n\n${fanOutOutput}`
            : fanOutOutput
          const nonce = randomUUID()
          const taggedOutput = `${REVIEWER_FANOUT_SENTINEL} <!-- guild:reviewer-fanout nonce:${nonce} -->\n${mergedOutput}`

          if (effect.delivery.kind === "injectPromptAsync") {
            await client.session.promptAsync({
              path: { id: effect.sessionId },
              body: { parts: [{ type: "text", text: taggedOutput }] },
            })
            recordInjectedPrompt?.(effect.sessionId, taggedOutput, { kind: "reviewer-fanout", nonce })
          }
        } catch (error) {
          console.error("[guild:ERROR] runReviewerFanOut effect failed", error)
        }

        break
      }
    }
  }
}

function appendToTextParts(parts: Array<{ type: string; text?: string }>, text: string, separator: string): void {
  const idx = parts.findIndex((part) => part.type === "text" && part.text)
  if (idx >= 0 && parts[idx].text) {
    parts[idx].text += `${separator}${text}`
    return
  }

  parts.push({ type: "text", text })
}

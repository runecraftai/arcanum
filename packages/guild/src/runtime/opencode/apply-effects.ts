import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createSessionClient } from "../../infrastructure/opencode/session-client"
import { runReviewerFanOut } from "../../agents/review-orchestrator"
import { FIGHTER_TERMINAL_HANDOFF_DIRECTIVE } from "../../agents/fighter/prompt-composer"
import type { PluginContext } from "../../plugin/types"
import type { SessionTracker } from "../../features/analytics"
import type { RuntimeEffect } from "./effects"
import { randomUUID } from "node:crypto"
import type { TrustedInjectedPromptMetadata } from "./trusted-message-state"
import { classifyOpenAIFailoverError } from "../../application/failover/openai-error-classifier"
import { canAttemptFailover, markFailoverAttempted } from "../../application/failover/failover-guard"
import { getNextFallbackModel, type FallbackEntry } from "../../agents/model-resolution"
import { logFailoverEvent, log, error } from "../../shared/log"
import { SessionCreationCorrelator } from "./correlator"
import type { AgentConfig } from "@opencode-ai/sdk"

const REVIEWER_FANOUT_SENTINEL = "<!-- guild:reviewer-fanout -->"
const reviewerFanOutSeenByClient = new WeakMap<object, Set<string>>()

const wizardHandoffSeenByClient = new WeakMap<object, Set<string>>()

export const WIZARD_PLAN_COMPLETE_SENTINEL = "<!-- guild:wizard-plan-complete -->"
const WIZARD_SPAWN_MOUNT_DELAY_MS = 300
const WIZARD_SPAWN_APPEND_PROMPT_MAX_RETRIES = 3
const WIZARD_SPAWN_APPEND_PROMPT_RETRY_DELAY_MS = 100

export const sessionCreationCorrelator = new SessionCreationCorrelator()

function getReviewerFanOutSeenSet(client: PluginContext["client"]): Set<string> {
  const key = client as unknown as object
  let seen = reviewerFanOutSeenByClient.get(key)
  if (!seen) {
    seen = new Set<string>()
    reviewerFanOutSeenByClient.set(key, seen)
  }
  return seen
}

function getWizardHandoffSeenSet(client: PluginContext["client"]): Set<string> {
  const key = client as unknown as object
  let seen = wizardHandoffSeenByClient.get(key)
  if (!seen) {
    seen = new Set<string>()
    wizardHandoffSeenByClient.set(key, seen)
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
  agents?: Record<string, AgentConfig>
}): Promise<void> {
  const { effects, output, client, tracker, recordInjectedPrompt, pausePlan, pauseWorkflow, availableModels, agents } = args
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

            const agentFallbackChain: FallbackEntry[] | undefined = (
              agents?.[effect.agent ?? ""] as { fallbackChain?: FallbackEntry[] } | undefined
            )?.fallbackChain
            const nextModel = effect.agent
              ? getNextFallbackModel(effect.agent, currentModel, availableModels ?? new Set(), agentFallbackChain)
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
          const taggedOutput = `${REVIEWER_FANOUT_SENTINEL} <!-- guild:reviewer-fanout nonce:${nonce} -->\n${mergedOutput}\n\n${FIGHTER_TERMINAL_HANDOFF_DIRECTIVE}`

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
      case "wizardReturnHandoff": {
        if (!sessionClient || !client) break

        const seen = getWizardHandoffSeenSet(client)
        const key = `wizard:${effect.originatingSessionId}`
        if (seen.has(key)) break

        seen.add(key)

        const bardAgent = getAgentDisplayName("bard")
        await sessionClient.restoreAgent({
          sessionId: effect.originatingSessionId,
          agent: bardAgent,
        })

        await sessionClient.promptAsync({
          sessionId: effect.originatingSessionId,
          parts: [{ type: "text", text: `**Wizard planning complete:** ${effect.planSummary}\n\nReady for /start-work when you want to execute.` }],
          agent: bardAgent,
        })

        recordInjectedPrompt?.(effect.originatingSessionId, effect.planSummary, { kind: "wizard-return-handoff" })

        break
      }
      case "spawnFighterSession": {
        if (!sessionClient || !client) {
          break
        }

        const { planName, progress, contextInjection } = effect
        const fighterAgent = getAgentDisplayName("fighter")
        const sessionTitle = `Fighter - ${planName}`

        log("[guild:spawnFighterSession] Creating new Fighter session", {
          planName,
          progress: `${progress.completed}/${progress.total}`,
        })

        let fighterSessionId: string

        // Step 1: Create session
        try {
          fighterSessionId = await sessionClient.createSession({
            title: sessionTitle,
            agent: fighterAgent,
          })
        } catch (createError) {
          const errorMessage = createError instanceof Error ? createError.message : String(createError)
          console.error(`[guild:ERROR] spawnFighterSession create failed: ${errorMessage}`)
          log("[guild:spawnFighterSession] Session creation failed, falling back", { error: errorMessage })
          applySpawnFallback(output, fighterAgent, contextInjection, FIGHTER_SPAWN_FALLBACK_MESSAGE)
          break
        }

        if (!fighterSessionId) {
          log("[guild:spawnFighterSession] Null session ID, falling back", { planName })
          applySpawnFallback(output, fighterAgent, contextInjection, FIGHTER_SPAWN_FALLBACK_MESSAGE)
          break
        }

        log("[guild:spawnFighterSession] Fighter session created", {
          fighterSessionId,
          planName,
        })

        // Step 2: Seed session with plan context (retry once on failure)
        const seeded = await seedSessionWithRetry(
          sessionClient,
          fighterSessionId,
          contextInjection,
          fighterAgent,
          planName,
        )

        if (!seeded) {
          log("[guild:spawnFighterSession] Prompt injection failed after retry, falling back", {
            fighterSessionId,
            planName,
          })
          applySpawnFallback(output, fighterAgent, contextInjection, FIGHTER_SPAWN_FALLBACK_MESSAGE)
          break
        }

        log("[guild:spawnFighterSession] Plan context seeded to Fighter session", {
          fighterSessionId,
          planName,
        })

        // Inject a handoff notification into the originating Bard session
        const handoffMessage = `

---

**Fighter session spawned:** Work on "${planName}" (${progress.completed}/${progress.total} tasks) has been delegated to a new Fighter session.

The Fighter session is now executing the plan independently. You can continue here or switch to the Fighter session to monitor progress.`

        if (output?.parts) {
          appendToTextParts(output.parts, handoffMessage, "\n\n---\n")
        }

        // Notify the originating session about the spawn (for UX tracking)
        recordInjectedPrompt?.(effect.sessionId, `[spawn:Fighter:${fighterSessionId}:${planName}]`)

        break
      }
      case "spawnWizardSession": {
        if (!sessionClient || !client) {
          break
        }

        const { title, contextInjection, sessionId: originatingId } = effect
        const wizardAgent = getAgentDisplayName("wizard")
        const sessionTitle = `Wizard: ${title}`

        log("[guild:spawnWizardSession] Creating new Wizard session", { title })

        // Step 1: Two-step guard — create session as preflight
        let preflightId: string
        try {
          preflightId = await sessionClient.createSession({ title: sessionTitle, agent: wizardAgent })
        } catch (createError) {
          const errorMessage = createError instanceof Error ? createError.message : String(createError)
          error(`spawnWizardSession create failed: ${errorMessage}`)
          log("[guild:spawnWizardSession] Session creation failed, falling back", { error: errorMessage })
          applySpawnFallback(output, wizardAgent, contextInjection, WIZARD_SPAWN_FALLBACK_MESSAGE)
          break
        }

        if (!preflightId) {
          log("[guild:spawnWizardSession] Null preflight session ID, falling back", { title })
          applySpawnFallback(output, wizardAgent, contextInjection, WIZARD_SPAWN_FALLBACK_MESSAGE)
          break
        }

        // Primary path: interactive window-switch with correlation
        try {
          // Step 2: Arm correlator latch for the originating session
          const correlationPromise = sessionCreationCorrelator.arm(originatingId)

          // Step 3: Open a new session window via TUI command
          await client.tui.executeCommand({ body: { command: "session_new" } })

          // Step 4: Wait for mount delay, then retry appendPrompt
          const seedPrompt = contextInjection
          await new Promise((r) => setTimeout(r, WIZARD_SPAWN_MOUNT_DELAY_MS))

          let appendSucceeded = false
          for (let attempt = 0; attempt < WIZARD_SPAWN_APPEND_PROMPT_MAX_RETRIES; attempt++) {
            try {
              await client.tui.appendPrompt({ body: { text: seedPrompt } })
              appendSucceeded = true
              break
            } catch (appendError) {
              log("[guild:spawnWizardSession] appendPrompt failed, retrying", {
                attempt: attempt + 1,
                error: appendError instanceof Error ? appendError.message : String(appendError),
              })
              if (attempt < WIZARD_SPAWN_APPEND_PROMPT_MAX_RETRIES - 1) {
                await new Promise((r) => setTimeout(r, WIZARD_SPAWN_APPEND_PROMPT_RETRY_DELAY_MS))
              }
            }
          }

          if (!appendSucceeded) {
            throw new Error(`Failed to append prompt after ${WIZARD_SPAWN_APPEND_PROMPT_MAX_RETRIES} retries`)
          }

          // Step 5: Wait for the correlator to resolve with the new session ID
          const newId = await correlationPromise

          // Step 6: Restore agent and seed the new session
          await sessionClient.restoreAgent({ sessionId: newId, agent: wizardAgent })

          const seeded = await seedSessionWithRetry(
            sessionClient,
            newId,
            contextInjection,
            wizardAgent,
            title,
          )

          if (!seeded) {
            throw new Error(`Failed to seed Wizard session ${newId}`)
          }

          sessionCreationCorrelator.registerMapping(newId, originatingId)

          // Handoff notification to originating session
          const handoffMessage = `

---

**Wizard session spawned:** Planning for "${title}" has been delegated to a new Wizard session.

The Wizard session is now handling interactive planning independently. You can continue here or switch to the Wizard session to collaborate.`

          if (output?.parts) {
            appendToTextParts(output.parts, handoffMessage, "\n\n---\n")
          }

          recordInjectedPrompt?.(originatingId, `[spawn:Wizard:${newId}:${title}]`)
        } catch (primaryError) {
          const errorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError)
          log("[guild:spawnWizardSession] Interactive path failed, using deterministic fallback", {
            error: errorMessage,
          })

          // Deterministic fallback path
          try {
            const createdId = await sessionClient.createSession({
              title: sessionTitle,
              agent: wizardAgent,
            })

            if (!createdId) {
              throw new Error("Null session ID in fallback path")
            }

            const seeded = await seedSessionWithRetry(
              sessionClient,
              createdId,
              contextInjection,
              wizardAgent,
              title,
            )

            if (!seeded) {
              throw new Error(`Failed to seed Wizard session ${createdId} in fallback`)
            }

            sessionCreationCorrelator.registerMapping(createdId, originatingId)

            if (output?.parts) {
              appendToTextParts(
                output.parts,
                `\n\n---\n\n**Wizard planning started in background:** The plan for "${title}" is being generated in a new session. You will be notified when it completes.`,
                "\n\n---\n",
              )
            }

            recordInjectedPrompt?.(originatingId, `[spawn:Wizard:${createdId}:${title}]`)
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            error(`spawnWizardSession fallback also failed: ${fallbackMessage}`)
            log("[guild:spawnWizardSession] Fallback path also failed", { error: fallbackMessage })
            applySpawnFallback(output, wizardAgent, contextInjection, WIZARD_SPAWN_FALLBACK_MESSAGE)
          }
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

type EffectOutput = {
  message?: Record<string, unknown>
  parts?: Array<{ type: string; text?: string }>
}

const FIGHTER_SPAWN_FALLBACK_MESSAGE =
  "\n\n---\n\n**Could not open Fighter in new window. Running in current session instead.**"

const WIZARD_SPAWN_FALLBACK_MESSAGE =
  "\n\n---\n\n**Could not open Wizard planning session. Continuing in current session instead.**"

function applySpawnFallback(
  output: EffectOutput | undefined,
  agent: string,
  contextInjection: string,
  fallbackMessage: string,
): void {
  if (output?.parts) {
    appendToTextParts(output.parts, fallbackMessage, "\n\n---\n")
    appendToTextParts(output.parts, contextInjection, "\n\n")
  }
  if (output?.message) {
    output.message.agent = agent
  }
}

async function seedSessionWithRetry(
  sessionClient: NonNullable<ReturnType<typeof createSessionClient>>,
  sessionId: string,
  text: string,
  agent: string,
  label: string,
): Promise<boolean> {
  try {
    await sessionClient.promptAsync({
      sessionId,
      parts: [{ type: "text", text }],
      agent,
    })
    return true
  } catch (promptError) {
    const errorMessage = promptError instanceof Error ? promptError.message : String(promptError)
    log("[guild:seedSessionWithRetry] Prompt injection failed, retrying", {
      sessionId,
      label,
      error: errorMessage,
    })

    try {
      await sessionClient.promptAsync({
        sessionId,
        parts: [{ type: "text", text }],
        agent,
      })
      return true
    } catch (retryError) {
      const retryMessage = retryError instanceof Error ? retryError.message : String(retryError)
      error(`seedSessionWithRetry prompt injection failed after retry: ${retryMessage}`)
      return false
    }
  }
}

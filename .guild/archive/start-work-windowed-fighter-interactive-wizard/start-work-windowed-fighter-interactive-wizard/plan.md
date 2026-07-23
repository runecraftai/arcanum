# Windowed Fighter handoff + interactive Wizard planning

## TL;DR
> **Summary**: Split planning and execution into explicit Guild-managed phases: Wizard becomes an interactive planning phase that can surface clarifications and return control to Bard, and `/start-work` launches Fighter in a separate session/window so the original Bard window stays clean.
> **Estimated Effort**: Medium

## Context
### Original Request
Improve Guild's start-work flow so Fighter can start in a new session/window, while Wizard becomes a normal interactive planning agent that can ask questions and work with Bard/user during planning.

### Key Findings
- `/start-work` currently rides the chat-policy path, then switches the same session to Fighter and appends plan context into the same output.
- The command router does not own `/start-work`; the handoff happens later in the chat-message path.
- Wizard is currently registered as a `subagent` and Bard prompts still describe Wizard as a delegated planning step.
- Guild already knows how to create ephemeral sessions for review fan-out, so session creation is the most likely primitive to reuse for a windowed handoff.
- Wizard's current prompt carries the long inline rules directly in `packages/guild/src/agents/wizard/default.ts`; Bard duplicates parts of the workflow in `packages/guild/src/agents/bard/prompt-composer.ts`.

### Decisions
- [x] Wizard becomes a normal agent, not a subagent.
- [x] Wizard may use the question tool when uncertain.
- [x] Agents should present explicit options when they need user input.
- [x] Bard remains the orchestrator and decides whether to invoke Wizard or Fighter.
- [x] `/start-work` should try to launch Fighter in a new session/window.
- [x] If new-session spawning is unsupported or fails, Guild falls back to the existing behavior and shows a clear error message.
- [x] No extra confirmation step before spawning.
- [x] Clarifications are handled by whichever agent asked the question.
- [x] Wizard must always generate the artifacts appropriate to task scope: full `spec.md` + `design.md` + `tasks.md` when the scope warrants it, and the complete minimal artifact set when the scope is smaller; never default to only a single plan file.
- [x] Wizard prompt should stay short and modular by leaning on the existing Guild skills as the source of truth for scope, spec, plan, handoff, and verification behavior.

### Current-flow assumptions to verify
- OpenCode's client API can create a new session/window and immediately target it with a prompt.
- Guild can set the new session's agent to Fighter without mutating the originating Bard session.
- The current plan/state files are sufficient; only the session target and orchestration need to change.
- The existing trusted-command envelope flow can still identify `/start-work` after the handoff.

## Objectives
### Core Objective
Make plan generation and plan execution first-class, separate Guild orchestration phases: Wizard is interactive and Bard-visible; Fighter runs in a clean, separate session/window when spawning is supported.

### Target UX/flow
- Bard receives the user's request and decides whether to invoke Wizard for planning or Fighter for execution.
- Wizard can ask clarifying questions and present explicit options when input is needed.
- Clarifications stay with the agent that asked them; Bard and Wizard each own their own follow-up loop.
- When the plan is ready, control returns to Bard with a concise summary and the plan file path.
- When `/start-work` is triggered, Guild attempts to open Fighter in a new session/window; if that fails, it falls back to the current same-session behavior with a clear error message.

### Deliverables
- [x] Windowed Fighter launch path that creates/targets a separate session instead of reusing the Bard session.
- [x] Interactive Wizard planning phase with a clear handoff back to Bard at completion.
- [x] Docs/tests updated to match the new orchestration story.

### Definition of Done
- [x] `/start-work` no longer pollutes the initiating Bard window on success.
- [x] A planning request can be followed interactively without Wizard remaining a hidden one-shot subagent.
- [x] Targeted Guild tests cover the new session-spawn and planning handoff behavior.

### Guardrails (Must NOT)
- [x] Do not change Fighter's plan-execution semantics beyond the session target.
- [x] Do not rewrite plan file formats, work-state storage, or continuation rules unless required by the new session model.
- [x] Do not expand unrelated command routing behavior.

## TODOs

- [x] 1. Confirm the host/session-spawn contract
  **What**: Verify how OpenCode can create a new session/window, how to target it with Fighter, and how to detect unsupported or failed spawn attempts so Guild can fail over cleanly.
  **Files**: `packages/guild/src/runtime/opencode/apply-effects.ts`, `packages/guild/src/infrastructure/opencode/session-client.ts`, `packages/guild/src/runtime/opencode/plugin-adapter.ts`
  **Acceptance**: A concrete spawn API shape and fallback/error path are documented in the plan notes.

  ### Confirmed Spawn API Contract

  #### Session Creation
  ```
  client.session.create(input?: { title?: string, body?: { title: string } })
    → Promise<{ data: { id: string } } | unknown>
  ```
  - Returns session ID in `response.data.id`
  - Used for ephemeral sessions in `review-orchestrator.ts:createEphemeralSession()`
  - Throws if creation fails (caller catches and handles fallback)

  #### Session Targeting (Prompt Injection)
  ```
  client.session.promptAsync({
    path: { id: sessionId },
    body: { parts: [...], agent?: string, model?: {...} }
  })
  ```
  - Used in `apply-effects.ts` for injecting prompts into sessions
  - `path.id` targets the session
  - `body.agent` sets the agent (e.g., "Fighter (Execution Lead)")
  - `body.model` can override the model

  #### Session Prompt (Synchronous)
  ```
  client.session.prompt({
    sessionID: string,
    path: { id: sessionId, sessionID: string },
    body: { agent?: string, model?: {...}, parts: [...] }
  })
  ```
  - Used in `review-orchestrator.ts` for sending prompts to newly created sessions

  #### Session Status (for polling)
  ```
  client.session.status()
    → Promise<{ data?: Record<string, { type: string }> }>
  ```
  - Used in `spawn` package's `TmuxSessionManager` for session health monitoring

  #### Agent Restore
  ```
  client.session.restoreAgent({ sessionId: string, agent: string })
  ```
  - Restores agent identity without sending prompt text

  ### Spawn Workflow for `/start-work` → Fighter

  1. **Create new session**:
     ```typescript
     const response = await client.session.create({ title: "Fighter - <plan-name>" })
     const sessionId = extractSessionId(unwrapResponseData(response))
     if (!sessionId) throw new Error("Failed to spawn Fighter session")
     ```

  2. **Seed session with plan context**:
     ```typescript
     await client.session.prompt({
       sessionID: sessionId,
       path: { id: sessionId, sessionID: sessionId },
       body: {
         agent: getAgentDisplayName("fighter"),
         parts: [{ type: "text", text: planContext }],
       },
     })
     ```

  3. **Target with Fighter for execution** via `injectPromptAsync` or `promptAsync`

  ### Error Detection and Fallback Paths

  | Error Type | Detection | Fallback Action |
  |------------|-----------|-----------------|
  | Session creation fails | `session.create` throws or returns `{ data: null }` | Fall back to in-session agent switch with clear error message |
  | Prompt injection fails | `promptAsync` throws | Retry once, then fall back to in-session behavior |
  | tmux not available | `spawnTmuxPane` returns `{ success: false }` | Skip pane spawning, use terminal session |
  | Not inside tmux | `isInsideTmux()` returns false | Skip pane spawning entirely |

  ### Fallback Behavior

  When spawning fails:
  1. Log the failure with clear reason
  2. Surface user-visible message: "Could not open Fighter in new window. Running in current session instead."
  3. Fall back to existing in-session agent switch behavior
  4. No extra confirmation step required

  ### Implementation Pattern (from review-orchestrator.ts:322-334)

  ```typescript
  async function createEphemeralSession(client: ReviewClient, title: string): Promise<string> {
    const response = await client.session.create({
      title,
      body: { title },
    })

    const sessionId = extractSessionId(unwrapResponseData(response))
    if (!sessionId) {
      throw new Error("Failed to create review session")
    }

    return sessionId
  }
  ```

  This pattern can be reused for Fighter session spawning with appropriate error handling.

- [x] 2. Design the windowed Fighter orchestration path
  **What**: Add the runtime plumbing needed to create a new session/window for Fighter, seed it with the selected plan, and keep the Bard session as the UX entrypoint instead of the execution target; on failure, surface a clear fallback error and continue with the current behavior.
  **Files**: `packages/guild/src/runtime/opencode/effects.ts`, `packages/guild/src/runtime/opencode/apply-effects.ts`, `packages/guild/src/infrastructure/opencode/session-client.ts`, `packages/guild/src/application/commands/start-work-command.ts`
  **Acceptance**: `/start-work` can be modeled as a spawn-and-handoff operation rather than an in-place agent switch.

- [x] 3. Turn Wizard into an interactive planning phase
  **What**: Replace Wizard's long inline prompt rules with a compact skill-driven prompt that references `guild-scope`, `guild-spec`, `guild-plan`, `guild-handoff`, and `guild-verify`; keep the interactive question-tool loop and artifact-scope rule intact.
  **Files**: `packages/guild/src/agents/wizard/default.ts`, `packages/guild/src/agents/wizard/index.ts`, `packages/guild/src/agents/bard/prompt-composer.ts`, `packages/guild/src/agents/builtin-agents.ts`
  **Acceptance**: Wizard prompt is materially shorter, delegates behavior to the named skills, still enforces interactive clarification behavior, and still requires the right artifact set for the task scope.

- [x] 4. Update user-facing docs and flow descriptions
  **What**: Rewrite the `/start-work`, agent, and architecture docs so they describe the new planning/execution split, the clean-window behavior, the fallback error path, the question-tool clarification model, and Wizard's skill-driven artifact-generation rule.
  **Files**: `packages/guild/docs/commands.md`, `packages/guild/docs/agents.md`, `packages/guild/docs/architecture.md`, `packages/guild/README.md`
  **Acceptance**: Docs consistently explain when Bard stays active, when Wizard is interactive, when Fighter moves to a separate session/window or falls back, and what artifacts Wizard must generate at each scope.

- [x] 5. Add/adjust tests around the new session boundary
  **What**: Extend the plugin-interface and runtime E2E coverage to assert the new handoff semantics, plus prompt tests for the revised Bard/Wizard instructions, fallback messaging, skill references, and artifact-scope rule.
  **Files**: `packages/guild/src/plugin/plugin-interface.test.ts`, `packages/guild/test/e2e/start-work-runtime.e2e.test.ts`, `packages/guild/src/agents/bard/prompt-composer.test.ts`, `packages/guild/src/agents/builtin-agents.test.ts`, `packages/guild/src/runtime/opencode/apply-effects.test.ts`
  **Acceptance**: Tests prove the old same-window mutation is gone, the new session is targeted when possible, the fallback path is explicit, the planning phase returns control to Bard, and Wizard's artifact scope rule is enforced in prompts/docs.

- [x] 6. Trim duplicate workflow language from Bard
  **What**: Reduce Bard's inline guidance so it points to Wizard skill behavior instead of restating the full planning workflow; preserve concise delegation cues and orchestrator behavior.
  **Files**: `packages/guild/src/agents/bard/prompt-composer.ts`, `packages/guild/src/agents/bard/prompt-composer.test.ts`
  **Acceptance**: Bard prompt remains concise, still directs planning/execution appropriately, and no longer duplicates the long Wizard workflow rules.

## Verification
- [x] `bun test packages/guild/src/plugin/plugin-interface.test.ts packages/guild/test/e2e/start-work-runtime.e2e.test.ts packages/guild/src/agents/bard/prompt-composer.test.ts packages/guild/src/agents/builtin-agents.test.ts packages/guild/src/runtime/opencode/apply-effects.test.ts`
- [x] Guild docs no longer describe `/start-work` as a same-window agent switch
- [x] No regression in existing workflow, continuation, or analytics behavior

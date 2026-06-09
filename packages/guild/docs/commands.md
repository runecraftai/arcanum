# Commands

Guild ships five built-in slash commands. All of them are routed through Guild's command envelope and return their output in the same OpenCode message as the response.

This page documents each command's purpose, syntax, expected behavior, and the most common failure modes.

## `/start-work`

**Purpose**: Hand off a Guild plan to **Fighter** for execution. Fighter runs in a separate session/window, keeping the original Bard window clean and available for follow-up questions or monitoring.

**Syntax**: `/start-work [plan-name]`

**Behavior**:

1. **Detect and resolve.** The command router parses `/start-work` and resolves the target plan (explicit name, most recent incomplete, or prompts for selection among multiple incomplete plans).
2. **Validate.** The plan is checked for structural validity before execution begins. Invalid plans return an error and ask the user to fix the file — execution is blocked.
3. **Spawn Fighter in a new session.** Guild attempts to open Fighter in a new session/window and seeds it with the plan context (plan path, progress, sidebar todo instructions). Bard stays active in the original window.
4. **Fallback.** If session spawning is unsupported or fails, Guild falls back to an in-place agent switch with a clear message: *"Could not open Fighter in new window. Running in current session instead."* No extra confirmation is required — the user is informed and execution proceeds.
5. **Workflow guard.** If a workflow is currently active, `/start-work` presents options to pause the workflow, abort it, or cancel — it does not start execution while a workflow is running.

**Bard stays active**: The original Bard session remains interactive throughout. You can ask follow-up questions, check status, or issue other commands while Fighter executes in its window. This is the clean-window model.

**Fighter receives**: The plan file path, progress snapshot (`N/M tasks done`), working directory, and instructions to restore the sidebar todo state from the first unchecked task.

**What Wizard generates** (artifact-scope rule): Plans live at `.guild/plans/<slug>/`. Wizard always generates the artifact set appropriate to the task scope using the `guild-scope` skill:

| Scope | Artifacts |
| --- | --- |
| **Small** (1–3 files, quick fix) | Single concise plan document with objectives, file list, and step-by-step TODOs |
| **Medium** (4–10 files, feature work) | Full plan document with context, objectives, deliverables, TODOs, and verification |
| **Large** (10+ files, complex feature or refactor) | `spec.md` + `design.md` + `tasks.md`, plus supporting artifacts as needed (Mermaid diagrams, data models, API contracts) |

Wizard produces these via `guild-spec` (writes the spec), `guild-plan` (breaks it into tasks), and `guild-handoff`/`guild-verify` for state management. In foreground planning, Wizard also receives a rich handoff payload with goal, summary, open questions, and relevant context. See [Agents — Wizard](agents.md#wizard-planner) for the full skill-driven model.

**Common failure modes**:

- *No plan found* — run Wizard first to generate a plan in `.guild/plans/<slug>/`.
- *Plan name typo* — `/start-work` accepts the exact slug; list plans in `.guild/plans/` if you are unsure.
- *Wrong directory* — plans are scoped to the current OpenCode project directory.
- *Spawn not supported* — falls back to in-session execution with a user-visible message.
- *Plan validation failed* — the plan has structural issues; fix the file and retry.
- *Active workflow conflict* — presented with options to pause, abort, or cancel.

## `/run-workflow`

**Purpose**: Run a multi-step workflow definition.

**Syntax**: `/run-workflow <workflow-name> ["goal"]`

**Behavior**:

- Loads the named workflow from `.opencode/workflows/` (project) or `~/.config/opencode/workflows/` (user).
- Starts a new workflow instance and stores its state in `.guild/workflows/`.
- Switches the active agent and routes the goal through the workflow's first step.

**Common failure modes**:

- *Workflow not found* — verify the file is in `.opencode/workflows/` or one of the `workflows.directories` paths from config, and that `name` in the file matches what you passed.
- *Already running* — only one workflow instance is active at a time per project. Use the controls in [Workflows — controls](workflows/controls.md) to pause, skip, or abort the current one.
- *Schema validation error* — the workflow file must match the schema; see [Workflows — authoring](workflows/authoring.md).

## `/guild-health`

**Purpose**: Show Guild's config health and any validation issues.

**Syntax**: `/guild-health`

**Behavior**:

- Lists the config files that were loaded.
- Lists the registered built-in agents.
- Reports any config warnings or errors from the last load.

This is the first command to run when something looks wrong. See [Troubleshooting](troubleshooting.md) for symptom-based diagnosis.

**Common failure modes**:

- *Empty response* — Guild is not loaded. Check that `@runecraft/guild` is in `opencode.json` and that OpenCode was restarted.

## `/metrics`

**Purpose**: Show Guild analytics and per-plan metrics reports.

**Syntax**: `/metrics [plan-name|all]`

**Behavior**:

- Reads session summaries and metrics reports from `.guild/analytics/` (canonical). Analytics files are `session-summaries.jsonl`, `fingerprint.json`, and `metrics-reports.jsonl`.
- Renders a markdown report that includes token usage, tool call counts, and per-plan aggregation when a `plan-name` is supplied.
- `all` (or no argument) renders the global view across all plans.

**Analytics requirement**: This command requires `analytics.enabled: true` in your Guild config. If analytics is disabled, the command returns a short message telling you how to enable it.

**Common failure modes**:

- *Analytics not enabled* — set `analytics.enabled` to `true` and restart OpenCode.
- *No reports yet* — metrics are written at the end of a session; if the project is brand-new, run a session first.

See [Analytics](analytics.md) for the full opt-in model and what gets recorded.

## `/token-report`

**Purpose**: Show token usage and cost report across sessions.

**Syntax**: `/token-report`

**Behavior**:

- Reads session summaries from `.guild/analytics/session-summaries.jsonl`.
- Aggregates token counts by agent and session.
- Renders a markdown report directly in the OpenCode response.

Unlike `/metrics`, this command does not require analytics to be enabled — token data is included in the session summaries that are written by default. It is, however, only useful once at least one session has been recorded.

**Common failure modes**:

- *No data* — start a session and finish it; the summary is written on session end.

## Common workflow controls (not slash commands)

A few natural-language keywords act as controls during an active workflow. They are detected in chat messages, not registered as slash commands.

| Phrase | Effect |
| --- | --- |
| `workflow pause` / `pause workflow` | Pauses the current workflow instance. |
| `workflow skip` / `skip step` | Skips the current step. |
| `workflow abort` / `abort workflow` | Aborts the workflow and clears the active instance. |

See [Workflows — controls](workflows/controls.md) for the full set of expected behaviors and recovery steps.

## See also

- [Getting started](getting-started.md) — how to run `/guild-health` for the first time.
- [Troubleshooting](troubleshooting.md) — symptom-based diagnosis for command failures.

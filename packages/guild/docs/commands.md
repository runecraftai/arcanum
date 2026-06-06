# Commands

Guild ships five built-in slash commands. All of them are routed through Guild's command envelope and return their output in the same OpenCode message as the response.

This page documents each command's purpose, syntax, expected behavior, and the most common failure modes.

## `/start-work`

**Purpose**: Start executing a Guild plan that was produced by the **Wizard** planner agent.

**Syntax**: `/start-work [plan-name]`

**Behavior**:

- Switches the active agent to **Fighter**, the execution orchestrator.
- Injects the plan context for the named plan (or the most recent plan when no name is given).
- Hands control to Fighter to drive the plan's tasks through completion.

**Common failure modes**:

- *No plan found* — run Wizard first to generate a plan in `.guild/plans/`.
- *Plan name typo* — `/start-work` accepts the exact plan name; list plans in `.guild/plans/` if you are unsure.
- *Wrong directory* — plans are scoped to the current OpenCode project directory.

See [Workflows — overview](workflows/overview.md) for the relationship between plans and workflows.

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

- Reads session summaries and metrics reports from `.guild/analytics/`.
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

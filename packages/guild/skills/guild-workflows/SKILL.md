---
name: guild-workflows
description: >
  Create, customize, and invoke Guild workflow definitions (multi-step agent pipelines).
  Use when the user asks how to create a workflow, what completion methods exist,
  how to chain agents across steps, or describes a multi-step process that would
  benefit from a structured workflow.
license: CC-BY-4.0
---

# guild-workflows

Define and run multi-step agent pipelines with automatic step progression.

## Overview

A Guild workflow is a JSONC file that declares an ordered sequence of steps, each executed by a specific agent. The workflow engine handles step progression automatically based on completion detection — no manual handoff needed. Workflows are reusable templates; each invocation creates an isolated instance bound to a user goal.

## When to Use

- User asks "how do I create a workflow?" or "what is a Guild workflow?"
- User describes a repeating multi-step process (plan → review → execute, or gather → implement → verify) and a workflow would encode it.
- User wants to chain agents with gates, approvals, or artifact passing between steps.
- User asks about completion methods, step types, or workflow schema.

**Do NOT use for**: single-agent tasks, ad-hoc plans (use `guild-plan`), or one-off delegations that don't repeat.

## Primary inputs

- `.opencode/workflows/<name>.jsonc` — project-level workflow definition (highest precedence)
- `~/.config/opencode/workflows/<name>.jsonc` — user-level workflow definition (lowest precedence)
- Config `workflows.directories` — optional extra directories to scan

## Workflow definition schema

```jsonc
{
  "name": "my-workflow",       // kebab-case; must match the filename
  "description": "What it does",
  "version": 1,
  "steps": [
    {
      "id": "step-id",         // kebab-case, unique within the workflow
      "name": "Human name",
      "type": "interactive",   // interactive | autonomous | gate
      "agent": "wizard",       // which Guild agent runs this step
      "prompt": "Do X for {{instance.goal}}. Prior output: {{artifacts.plan}}",
      "completion": {
        "method": "user_confirm"  // see Completion Methods below
      },
      "artifacts": {           // optional
        "inputs": [{ "name": "plan", "description": "Approved plan" }],
        "outputs": [{ "name": "result", "description": "Execution result" }]
      },
      "on_reject": "pause"     // gate steps only: pause | fail
    }
  ]
}
```

## Step types

| Type | Behaviour |
| --- | --- |
| `interactive` | Requires user input to advance; engine waits for explicit confirmation |
| `autonomous` | Runs without user intervention; advances when completion is detected |
| `gate` | Requires APPROVE or REJECT verdict from the assigned agent; `on_reject` controls what happens |

## Completion methods

| Method | Advances when |
| --- | --- |
| `user_confirm` | User confirms explicitly, or custom `keywords` are detected in agent output |
| `plan_created` | A plan named `plan_name` appears under `.guild/plans/` |
| `plan_complete` | A plan named `plan_name` is marked complete |
| `review_verdict` | Agent emits APPROVE or REJECT |
| `agent_signal` | Agent emits an explicit completion signal |

## Template variables in `prompt`

- `{{instance.goal}}` — the goal the user passed when starting the workflow
- `{{artifacts.NAME}}` — value of an artifact produced by a prior step

## Workflow lifecycle

1. User runs `/workflow <name> <goal>` — engine creates an instance, injects the first step's prompt, activates the assigned agent.
2. Engine checks completion on each `session.idle` event.
3. On completion: step is marked done, artifacts are merged, next step is activated automatically.
4. On gate rejection: workflow pauses (or fails, per `on_reject`).
5. User can `/workflow pause`, `/workflow resume`, `/workflow skip`, or `/workflow abort` at any time.

## Process

1. Identify whether the user wants to **understand** workflows (explain schema + lifecycle) or **create** one (author a JSONC file).
2. If creating: ask for the goal, the repeating steps, and which agent fits each step. Map to step types and completion methods.
3. Draft the JSONC in `.opencode/workflows/<name>.jsonc`. Use kebab-case for `name` and all `id` fields.
4. Confirm artifact passing: if a later step needs output from an earlier one, declare `outputs` on the producer and `inputs` on the consumer, then reference via `{{artifacts.NAME}}` in the prompt.
5. For gate steps, decide `on_reject`: `pause` (workflow suspends, user can resume) or `fail` (workflow terminates).
6. Validate: every step has a unique `id`, `agent` is a valid Guild agent name, `completion.method` matches the step's intent.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I'll just delegate manually each time." | Manual delegation loses context between steps. Workflows thread artifacts and goal automatically. |
| "The workflow file is too much setup." | A 3-step workflow is ~30 lines of JSONC. The payoff is repeatable, context-aware execution. |
| "I don't know which completion method to use." | Default to `user_confirm` for interactive steps and `plan_complete` for autonomous ones. Gate steps always use `review_verdict`. |
| "I can skip the gate step." | Gate steps are the safety valve. Skipping them removes the only structured rejection path. |

## Red Flags

- `name` in the JSONC does not match the filename (discovery will still load it, but it's confusing).
- A step's `agent` is not a valid Guild agent (`bard`, `fighter`, `wizard`, `rogue`, `warlock`, `cleric`, `ranger`, `paladin`).
- `artifacts.outputs` declared on a step but never referenced via `{{artifacts.NAME}}` in a later prompt — dead artifact.
- `on_reject` missing on a `gate` step (defaults to `pause`, but should be explicit).
- `completion.plan_name` missing when method is `plan_created` or `plan_complete`.

## Verification

The skill is complete when ALL of the following are true:

- The workflow file exists at `.opencode/workflows/<name>.jsonc` (or `~/.config/opencode/workflows/<name>.jsonc` for user-level).
- `name` field matches the filename (without extension).
- Every step has a unique `id`, a valid `type`, a valid `agent`, and a `completion.method`.
- Artifact references in `prompt` fields (`{{artifacts.X}}`) have a matching `outputs` declaration in a prior step.
- Gate steps have an explicit `on_reject` value.

## See also

- [guild-plan](guild-plan) — creates `.guild/plans/<slug>/tasks.md` for Fighter execution (different from workflows).
- [guild-scope](guild-scope) — classifies work size before deciding whether a workflow or a simple plan is appropriate.
- [guild-handoff](guild-handoff) — tracks state between sessions; workflows persist across sessions automatically.

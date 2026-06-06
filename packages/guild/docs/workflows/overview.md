# Workflows

A workflow is a named sequence of steps that guides a multi-step task from start to finish. Guild ships with a workflow system that handles interactive and autonomous steps, gates that pause for human review, and explicit user controls to pause, skip, or abort.

This page is the entry point. See the linked pages for the rest.

## What a workflow looks like

A workflow is a JSON document with three top-level fields:

```jsonc
{
  "name": "release",
  "description": "Cut a release of the package: bump, test, publish.",
  "steps": [
    { "id": "bump",  "type": "autonomous",  "prompt": "Bump the version in package.json..." },
    { "id": "test",  "type": "autonomous",  "prompt": "Run the test suite..." },
    { "id": "review","type": "gate",        "prompt": "Review the diff before publishing." }
  ]
}
```

The full schema and authoring notes are in [Authoring](authoring.md). For the controls you can issue mid-workflow, see [Controls](controls.md). For ready-to-copy examples, see [Examples](../examples/workflows/).

## Where workflows live

Guild loads workflow definitions from two locations:

| Location | Purpose |
| --- | --- |
| `.opencode/workflows/<name>.json` | Project workflows. Committed to the repo and shared with the team. |
| `~/.config/opencode/workflows/<name>.json` | User workflows. Personal, machine-local. |

A workflow name is the file's basename without `.json`. When the same name exists in both locations, the project workflow wins; the user workflow is only used if no project workflow is defined with that name.

## Step types

Every step has a `type` that controls its runtime behavior.

| Type | Behavior |
| --- | --- |
| `interactive` | Drives a normal back-and-forth turn with the user. The step is "done" when the user confirms or moves on. |
| `autonomous` | Runs without user intervention until the step is finished. The model works the prompt to completion. |
| `gate` | Pauses for explicit human review. The step does not progress until a completion signal is sent. |

Steps are executed in the order they appear in the `steps` array. The first step is the entry point.

## Completion methods

Steps finish when one of these signals is detected:

- `user_confirm` — the user types a confirmation keyword in the chat.
- `plan_created` — a plan file appears under `.guild/plans/`.
- `plan_complete` — a plan's status flips to complete.
- `review_verdict` — Cleric or Paladin produces an APPROVE verdict.
- `agent_signal` — a custom signal the agent emits at the end of a step.

The completion method is configured per step in the workflow definition. See [Authoring](authoring.md) for the full schema.

## Invoking a workflow

Use the `/run-workflow` slash command:

```sh
/run-workflow release
```

If `release` is not a known workflow, the command fails with a list of available names. For a full description of the command, see [Commands](../commands.md#run-workflow).

You can also invoke a workflow from a plan by listing the workflow name in the plan's `workflows` array. The first interactive step is the entry point.

## Controls

While a workflow is running, you can issue these natural-language controls in the chat:

- **Pause** — "pause", "hold on", "wait". The current step finishes; no new step starts.
- **Resume** — "continue", "resume", "go".
- **Skip** — "skip this step". The current step is marked complete without finishing.
- **Abort** — "abort", "stop the workflow", "cancel". The workflow exits with an aborted status.

Controls are keyword-driven, not slash commands. They are matched at the start of the user message after a small stopword filter. See [Controls](controls.md) for the exact keywords and edge cases.

## See also

- [Authoring](authoring.md) — write your own workflows.
- [Controls](controls.md) — pause, resume, skip, abort.
- [Examples](../examples/workflows/) — ready-to-copy workflow definitions.
- [Commands](../commands.md#run-workflow) — `/run-workflow` reference.

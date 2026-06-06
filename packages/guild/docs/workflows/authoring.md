# Authoring workflows

This page documents the full schema for a workflow file and the recommended authoring style. For an overview of what workflows are, see [Overview](overview.md). For ready-to-copy examples, see [Examples](../examples/workflows/).

## File location and name

Workflow files live in:

- `.opencode/workflows/<name>.json` — project, committed.
- `~/.config/opencode/workflows/<name>.json` — user, machine-local.

The name is the file's basename without `.json`. Use lowercase, hyphenated names (`release`, `migrate-db`, `weekly-review`).

## Top-level shape

```ts
{
  name: string,                 // required, matches the filename
  description?: string,         // surfaced in /run-workflow help
  default_model?: string,       // model used by steps that don't override it
  default_completion?: { ... }, // completion defaults for steps
  steps: Array<Step>            // required, at least one step
}
```

A minimal workflow:

```jsonc
{
  "name": "echo",
  "description": "Prints a single message and exits.",
  "steps": [
    { "id": "say-hi", "type": "autonomous", "prompt": "Print 'hello' to the chat." }
  ]
}
```

## Step reference

Each step is an object with these fields:

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `id` | Yes | `string` | Stable identifier. Referenced by completion methods, variables, and the audit log. |
| `type` | Yes | `"interactive" \| "autonomous" \| "gate"` | Controls runtime behavior. |
| `prompt` | Yes | `string` | Instructions given to the agent for the step. |
| `completion` | No | `Completion` | How the step finishes. Inherits from `default_completion` if absent. |
| `model` | No | `string` | Per-step model override. |
| `tools` | No | `Record<string, boolean>` | Per-step tool allow/deny. |
| `condition` | No | `string` | Skip-if expression evaluated against step context. |

The step's `prompt` is required, even for `gate` steps where the agent is not asked to do work. The prompt is the message shown to the reviewer.

## Step types in detail

### `interactive`

The model holds a normal conversation until the user moves on. Use for steps that need clarification, options, or any back-and-forth with the user.

```jsonc
{
  "id": "confirm-scope",
  "type": "interactive",
  "prompt": "Confirm the scope of the release with the user."
}
```

### `autonomous`

The model runs the prompt to completion without user interaction. Use for mechanical work: running tests, applying migrations, writing files. Do not use for steps that have multiple acceptable outcomes.

```jsonc
{
  "id": "apply-migration",
  "type": "autonomous",
  "prompt": "Apply the migration in db/migrations/0001.sql using psql."
}
```

### `gate`

A hard pause. The step does not progress until a `user_confirm` or `review_verdict` signal arrives. Use before destructive operations (publishing, deleting branches) and for human review.

```jsonc
{
  "id": "review-pr",
  "type": "gate",
  "prompt": "Open the PR and confirm the diff is ready to merge."
}
```

## Completion methods

Each step can specify a `completion` block. If absent, the workflow's `default_completion` is used.

| Method | Signal | Typical use |
| --- | --- | --- |
| `user_confirm` | User types a confirmation in the chat. | Interactive steps and gates. |
| `plan_created` | A new plan appears in `.guild/plans/`. | Steps that drive planning. |
| `plan_complete` | An active plan reaches the `complete` state. | Implementation steps driven by a plan. |
| `review_verdict` | Cleric or Paladin emits APPROVE. | Review gates. |
| `agent_signal` | A custom signal emitted at the end of a step. | Step-internal completion. |

Example:

```jsonc
{
  "id": "implement",
  "type": "autonomous",
  "prompt": "Implement the plan in .guild/plans/feature-x.md.",
  "completion": { "method": "plan_complete" }
}
```

## Templating

Step prompts support a small templating syntax for accessing prior step output and run context. The exact tokens depend on the runtime, but the common ones are:

- `{{steps.<id>.output}}` — the last assistant message for the named step.
- `{{run.id}}` — the current run identifier.
- `{{run.dir}}` — the absolute path to the run directory.

If you need values from multiple steps, prefer writing them to a file and reading that file in a later step. Templating is for short cross-references only.

## Conditions

A step may declare a `condition` to skip itself. The condition is a small expression evaluated against the run context. The simplest form is a property path:

```jsonc
{ "id": "publish", "type": "autonomous", "condition": "run.flags.dry_run == false" }
```

Conditions are an opt-in feature. If you do not need them, omit the field.

## Authoring style

A few conventions that make workflows easier to maintain:

- **Idempotent steps.** A step that has run once should produce the same result on a second run. Avoid steps that depend on the model's current opinion.
- **Narrow prompts.** A step should ask for one thing. If you are tempted to use "and", split the step.
- **Stable IDs.** Step IDs become part of the audit log and any plan that references them. Renaming is a breaking change.
- **Gates around destruction.** Place a `gate` step before any operation that pushes, deletes, or sends a message.
- **Test workflows locally first.** Run a workflow on a sample input before committing it.

## Example: end-to-end workflow

```jsonc
{
  "name": "release",
  "description": "Bump version, test, and publish the package.",
  "default_completion": { "method": "user_confirm" },
  "steps": [
    {
      "id": "bump",
      "type": "autonomous",
      "prompt": "Bump the version in packages/guild/package.json using semver. The user will say which segment."
    },
    {
      "id": "test",
      "type": "autonomous",
      "prompt": "Run `bun run test` from the repo root. If any test fails, stop and report."
    },
    {
      "id": "review",
      "type": "gate",
      "prompt": "Review the diff. Confirm when ready to publish."
    },
    {
      "id": "publish",
      "type": "autonomous",
      "prompt": "Run `bun run publish` from packages/guild."
    }
  ]
}
```

## See also

- [Overview](overview.md)
- [Controls](controls.md)
- [Examples](../examples/workflows/)
- [Configuration — Workflows](../configuration.md#workflows)

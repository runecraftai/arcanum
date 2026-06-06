# Controls

While a workflow is running, you can pause, resume, skip, or abort it by typing a short phrase in the chat. Controls are **natural-language keywords**, not slash commands. Guild matches them at the start of your message after a small stopword filter.

For an overview of what workflows are, see [Overview](overview.md). For the JSON schema, see [Authoring](authoring.md).

## The four controls

| Control | Effect |
| --- | --- |
| Pause | The current step runs to completion. The workflow does not advance to the next step until you resume. |
| Resume | The workflow advances to the next step. Use this after a pause or a long-running autonomous step. |
| Skip | The current step is marked complete without finishing. The workflow advances. |
| Abort | The workflow exits with an aborted status. Plans and partial work are left in place. |

Pause and resume are inverses. Skip and abort are destructive: skip marks one step as done, abort ends the whole run.

## Keywords

The detector matches these phrases at the start of a user message. Matching is case-insensitive and ignores a small set of leading stopwords (the, a, an, my, our, this, that).

| Control | Matched phrases |
| --- | --- |
| Pause | `pause`, `hold on`, `hold up`, `wait`, `wait a moment` |
| Resume | `continue`, `resume`, `go`, `go on`, `proceed` |
| Skip | `skip this step`, `skip step`, `skip` |
| Abort | `abort`, `abort the workflow`, `stop the workflow`, `cancel the workflow`, `cancel` |

A trailing noun is allowed and ignored: "pause the workflow" and "pause" both trigger pause. "abort the plan" triggers abort — the detector treats "plan" and "workflow" as synonyms in this context.

## How matching works

1. The user message is lowercased and stripped of leading stopwords.
2. The first non-stopword token is checked against the keyword table.
3. The first match wins. If none match, the message is treated as a normal user prompt.

This means a sentence like "please pause here" is parsed as `pause` (the first non-stopword token). A sentence like "let's pause for a second and look at the diff" is also parsed as `pause`.

A sentence that does not start with a control keyword — for example, "hold on, can you check the tests first?" — falls through to the normal chat path. If you want a control, put the keyword first.

## What happens to state

### Pause

The current step continues running. Once it completes, the workflow does not start the next step. The workflow state is `paused`. Resuming from a paused state advances to the next step as if nothing had happened.

### Resume

The workflow transitions from `paused` to `running` and starts the next step. If the workflow was not paused, resume is a no-op.

### Skip

The current step is marked as `skipped` in the audit log. The workflow advances to the next step. Use skip when a step is no longer relevant but the rest of the workflow is still useful. A skipped step does not block later steps that depend on its output — if they do, expect a degraded result.

### Abort

The workflow transitions to `aborted` and stops. Any plan or partial work the workflow produced is left in place. The audit log records the abort with a timestamp and the message that triggered it.

## Examples

Pause for a long-running step:

```
> run the test suite
[autonomous step runs]
> pause
> hold on, the test is failing
> let me check
> resume
```

Skip a step that no longer applies:

```
> /run-workflow release
[step: bump]
> skip this step
[step: review]
```

Abort a workflow that is no longer wanted:

```
> /run-workflow release
> abort
workflow aborted.
```

## Caveats

- Controls are **not** slash commands. `/pause` is not a control; it is a literal command name that does not exist.
- The first non-stopword token wins. A message that starts with "can you pause" still matches pause.
- A message that contains a control keyword in the middle of a sentence is not a control. Put the keyword first.
- Pause and resume are local to a single workflow run. They do not transfer between runs or between workflows.

## See also

- [Overview](overview.md)
- [Authoring](authoring.md)
- [Examples](../examples/workflows/)

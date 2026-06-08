# Continuation

Continuation is Guild's name for the small set of behaviors that keep a long-running session useful: resuming after a context restoration, prompting for next steps when the session goes idle, and preserving todo state across interruptions. This page documents the four continuation modes and how to configure them.

For the schema field, see [Configuration](configuration.md#continuation). For diagnostics, see [Troubleshooting](troubleshooting.md).

## The four continuation modes

| Mode | What it does | Default |
| --- | --- | --- |
| Manual resume | A user-driven action — the user types a new prompt or command to continue. | Always available. |
| Compaction recovery | Guild injects a resume prompt after OpenCode's context restoration so the agent picks up where it left off. | Enabled. |
| Idle prompts | Guild injects a continuation prompt when the session goes idle and there is active work, an active workflow, or pending todos. | Disabled. |
| Todo continuation | A sub-mode of idle prompts: handles lingering in-progress todos when no other repair path is available. | Disabled. |

These modes are independent. You can use only manual resume, only compaction recovery, or any combination.

## Manual resume

Manual resume is what you do by default. You finish a step, the model returns control to you, and you send the next message.

Nothing to configure. Manual resume is always available because it is just a regular OpenCode turn.

## Compaction recovery

OpenCode periodically compacts long sessions and restores context from a snapshot. Without recovery, the agent can come back "amnesiac" and forget the plan it was driving.

With `continuation.recovery.compaction: true` (the default), Guild injects a short resume prompt into the restored context. The prompt tells the agent:

- which plan or workflow it was working on,
- the current step and the remaining tasks,
- a hint to read the plan's `.guild/plans/<slug>/state.md` and `.guild/plans/<slug>/tasks.md` before continuing.

To turn recovery off (not recommended for long sessions):

```jsonc
{ "continuation": { "recovery": { "compaction": false } } }
```

Recovery is on by default because it costs almost nothing and prevents a frequent surprise.

## Idle prompts

Idle prompts are an opt-in convenience. When the session becomes idle, Guild checks for active work, an active workflow, or pending todos. If any of those is true, it injects a continuation prompt so the next user turn does not start from a blank agent.

The full config block:

```jsonc
{
  "continuation": {
    "idle": {
      "enabled": true,
      "work": true,
      "workflow": false,
      "todo_prompt": true
    }
  }
}
```

Each field:

- `enabled` — master switch for all idle prompts.
- `work` — idle prompt for active `/start-work` plans with remaining tasks. Defaults to `enabled` when not specified.
- `workflow` — idle prompt for active workflows waiting to continue. Defaults to `enabled`.
- `todo_prompt` — prompt fallback for lingering `in_progress` todos when silent repair is unavailable. Defaults to `enabled`.

You can rely on the master switch and let the per-mode fields inherit, or override individual modes when you want a partial rollout (for example, idle prompts for plans but not for workflows).

### When to enable idle prompts

Idle prompts are most useful for:

- Long-running sessions where you step away and come back.
- Workflows that have a natural pause between user interactions.
- Plans where the model might otherwise drop the thread after a long output.

They are not useful if you prefer to drive the session turn-by-turn manually. In that case leave `continuation.idle.enabled` at its default of `false`.

## Todo continuation

Todo continuation is a sub-mode of idle prompts. When the session becomes idle and there are todos still in `in_progress` status, Guild injects a small prompt asking the agent to either resume the todo or mark it complete.

This is most useful in sessions that interleave many small tasks where some are easy to forget. It pairs naturally with Fighter's todo-list execution model.

Enable it through the same `idle` block:

```jsonc
{ "continuation": { "idle": { "todo_prompt": true } } }
```

If you set `todo_prompt: false` while leaving `enabled: true`, Guild will still inject prompts for active plans and workflows but not for orphan todos.

## Combined example

The most common production setup is "recovery always, idle only for plans":

```jsonc
{
  "continuation": {
    "recovery": { "compaction": true },
    "idle": {
      "enabled": true,
      "work": true,
      "workflow": false,
      "todo_prompt": false
    }
  }
}
```

This keeps the agent on track after context restoration, prompts when a `/start-work` plan is paused, and stays out of the way for workflows and todos.

## See also

- [Configuration — Continuation example](configuration.md#continuation)
- [Troubleshooting](troubleshooting.md)
- [Workflows — controls](workflows/controls.md) for explicit pause/resume/skip/abort keywords.

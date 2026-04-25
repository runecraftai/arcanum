# State Management

State management tracks the progress of feature execution across sessions.

## State File Location

State is stored in `.specs/features/<name>/STATE.md` (optional, created as needed).

## State Frontmatter

```yaml
---
feature: feature-name
status: draft | approved | in-progress | completed | partial | archived
started: 2026-04-24T10:30:00Z
last-updated: 2026-04-24T15:45:00Z
phase: spec | plan | build | test | review | simplify | ship
checkpoint: task-5-in-progress
blocked-by: [] or [reason]
---
```

## Status Values

- **draft**: Initial state, spec not yet approved
- **approved**: Spec/design/tasks approved, ready to build
- **in-progress**: Currently being executed
- **completed**: All tasks complete, ship ready
- **partial**: Some tasks blocked, can't proceed
- **archived**: Feature shipped, moved to archive/

## Checkpoint Format

Checkpoint identifies where execution paused:

```
checkpoint: task-5-in-progress
```

Allows resumption at `Task 5` when user says "resume work".

## Blocked State

If a task or phase is blocked, record:

```yaml
blocked-by:
  - External API not responding
  - Awaiting design feedback
```

## Resume Logic

When user says `/spec resume`:

1. Load most recent STATE.md with `status: in-progress`
2. Extract `phase` and `checkpoint`
3. Offer to continue from that point
4. Jump directly to the checkpoint task

Example:
```
Feature: user-auth-service
Last session: 2026-04-24 10:30
Current checkpoint: Phase BUILD, Task 5

Resume from here? (yes / no)
```

## Pause Logic

When user says `/spec pause`:

1. Create or update STATE.md
2. Set `status: in-progress`
3. Set `checkpoint` to current task
4. Record `last-updated` timestamp
5. Run LEARN phase
6. Report: "Work paused at [checkpoint]. Resume with `/spec resume`."

## State Transitions

```
draft → approved → in-progress → completed → archived
                       ↓
                    partial (with blocker reason)
```

## Cleanup

After feature is shipped:
- Update status to `archived`
- Move feature directory to `.specs/archive/YYYY-MM-DD-<name>/`
- Keep STATE.md for historical reference

# State Management

State management tracks project memory and feature progress across sessions. The spec-driven skill maintains two levels of STATE plus one current handoff checkpoint.

## Dual-Level STATE

### Global STATE — `.specs/project/STATE.md`
- **Scope**: cross-cutting, project-wide
- **Content**: architectural decisions, project-wide blockers, lessons learned across features, cross-feature todos, deferred ideas
- **Lifecycle**: persists indefinitely; pruned monthly for completed items
- **Schema**: → see `state-global.md`

### Feature STATE — `.specs/features/<name>/STATE.md`
- **Scope**: single feature only
- **Content**: checkpoint (last completed phase), artifact status, feature-specific blockers, resume context
- **Lifecycle**: created at SPEC start → updated each phase → archived (status: shipped) at SHIP
- **Schema**: → see below (existing frontmatter format)

**Rule**: Never duplicate information between global and feature STATE. If an item affects only one feature → feature STATE. If it affects multiple features or the project as a whole → global STATE.

## State File Location

Feature state is stored in `.specs/features/<name>/STATE.md` (optional, created as needed).

Project handoff state is stored in `.specs/project/HANDOFF.md`. It is overwritten on pause and read on resume. Use `HANDOFF.md` for the current checkpoint; use `.specs/project/STATE.md` for durable decisions, blockers, lessons, todos, and deferred ideas.

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

1. Load `.specs/project/HANDOFF.md` if present
2. Load `.specs/project/STATE.md` for durable project context
3. Load most recent feature STATE.md with `status: in-progress` if the handoff is missing or incomplete
4. Extract `phase` and `checkpoint`
5. Offer to continue from that point
6. Jump directly to the checkpoint task after confirmation

Example:
```
Feature: user-auth-service
Last session: 2026-04-24 10:30
Current checkpoint: Phase BUILD, Task 5

Resume from here? (yes / no)
```

## Pause Logic

When user says `/spec pause`:

1. Create or update `.specs/project/HANDOFF.md`
2. Create or update feature STATE.md when pausing inside a feature
3. Set feature `status: in-progress`
4. Set feature `checkpoint` to current task
5. Record `last-updated` timestamp
6. Append durable project-level memory to `.specs/project/STATE.md` only when needed
7. Run LEARN phase
8. Report: "Work paused at [checkpoint]. Resume with `/spec resume`."

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
- Do not load archived feature state by default during normal resume or context loading

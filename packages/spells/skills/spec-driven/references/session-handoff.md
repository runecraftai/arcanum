# Session Handoff

Pause and resume work deterministically using `.specs/project/HANDOFF.md` and `.specs/project/STATE.md`.

## Purpose

`HANDOFF.md` is the current-session checkpoint. It is overwritten on each pause because it represents the latest resumable position.

`STATE.md` is persistent project memory. Append durable decisions, blockers, lessons, todos, and deferred ideas there only when they matter beyond the current checkpoint.

## Pause Work

Triggers:

- `pause work`
- `end session`
- `create handoff`
- `/spec pause`
- `pausar trabalho`

### Process

1. Identify active feature, phase, task, branch, and uncommitted changes.
2. Write `.specs/project/HANDOFF.md` with the template below.
3. Update `.specs/project/STATE.md` only for project-level decisions, blockers, lessons, todos, or deferred ideas.
4. If pausing during feature execution, update `.specs/features/<name>/tasks.md` or feature `STATE.md` with the current checkpoint.
5. Run LEARN to create an immutable `.specs/sessions/YYYY-MM-DD-<feature>.md` log when meaningful work occurred.
6. Report the exact resume command: `/spec resume`.

### HANDOFF.md Template

```markdown
# Handoff

**Date:** YYYY-MM-DDTHH:mm:ssZ
**Feature:** <feature name or none>
**Phase:** INIT | MAP | QUICK | SPEC | PLAN | BUILD | TEST | VALIDATE | REVIEW | SIMPLIFY | SHIP
**Task:** <task id/title or none>
**Branch:** <git branch if applicable>

## Completed

- <completed work item>

## In Progress

- <current work and exact checkpoint>
- Location: `<file:line>` when useful

## Pending

- <next immediate action>
- <following action>

## Blockers

- <blocker, owner, and impact>

## Uncommitted Changes

- `<path>` — <why changed>

## Context

- Related decisions: `.specs/project/STATE.md#<section>`
- Relevant artifacts: `.specs/features/<name>/spec.md`, `design.md`, `tasks.md`
```

## Resume Work

Triggers:

- `resume work`
- `continue`
- `load handoff`
- `/spec resume`
- `retomar trabalho`

### Process

1. Load `.specs/project/HANDOFF.md` if present.
2. Load `.specs/project/STATE.md` for project-level context.
3. Load only the active feature artifacts named in the handoff.
4. Summarize current position:

```markdown
Resuming <feature> at <phase/task>.
Completed: <summary>
Next: <immediate action>
Blockers: <none or list>
```

5. Ask before proceeding when the next action changes code or commits.

## Recovery Without HANDOFF.md

If `.specs/project/HANDOFF.md` is missing:

1. Inspect `.specs/project/STATE.md` for active blockers and todos.
2. Inspect non-archived `.specs/features/*/tasks.md` for unchecked tasks.
3. Inspect recent `.specs/sessions/` logs.
4. Present the likely resume point and ask for confirmation.

Do not load `.specs/archive/` by default.

## Completion Criteria

Handoff is complete when:

1. `.specs/project/HANDOFF.md` points to a concrete next action
2. Durable project memory is appended to `.specs/project/STATE.md` if needed
3. Feature checkpoint is updated if feature work is in progress
4. Resume instructions are clear

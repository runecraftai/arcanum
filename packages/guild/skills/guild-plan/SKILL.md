---
name: guild-plan
description: >
  Break a Guild feature spec into atomic tasks and execution order.
  Use when creating `.guild/plans/<slug>/tasks.md` or sequencing work.
license: CC-BY-4.0
---

# guild-plan

Decompose work into small, ordered tasks.

## Overview

Read the spec, map each requirement ID to one or more atomic tasks, and order them by dependency. Each task is independently verifiable, has a traceable requirement ID, and carries an explicit verification command. The plan is the work breakdown; it is not a re-spec.

## When to Use

- A `.guild/plans/<slug>/spec.md` exists with traceable requirement IDs.
- The next step is to break the spec into `tasks.md` and sequence the work.
- The user wants a Wizard-style plan for an upcoming change.

**Do NOT use for**: spec authoring (use `guild-spec`), scope classification (use `guild-scope`), implementation (use `guild-execute`), or verification (use `guild-verify`).

## Primary inputs

- `.guild/plans/<slug>/spec.md` — feature requirements with `REQ-NNN` IDs
- `.guild/plans/<slug>/tasks.md` — target artifact
- `.guild/plans/<slug>/state.md` — current plan status
- `.guild/knowledge/conventions.md` — coding standards

## Readiness Gate

Before beginning the planning process, verify the following prerequisites exist. If any are missing, stop and guide the user to the prerequisite skill — do not proceed to plan without them.

- **spec.md exists and has REQ-NNN IDs**: Read `.guild/plans/<slug>/spec.md` and confirm it contains at least one `REQ-NNN` requirement ID. If it is missing or has no traceable IDs, direct the user to run `guild-spec` first.
- **Scope is classified in state.md**: Read `.guild/plans/<slug>/state.md` and confirm it contains a scope decision (`init`, `feature`, `quick task`, `handoff`). If `state.md` is missing or has no scope classification, direct the user to run `guild-scope` first.
- **Slug is valid**: Confirm the slug is lowercase, hyphenated, and unique across `.guild/plans/`. If the slug is invalid or collides with an existing plan, direct the user to run `guild-scope` first.

When all three gates pass, proceed to the Process steps below. When one or more gates fail, report which gate failed and which skill to run — do not attempt to create the missing artifacts inline.

## Process

1. Read `spec.md` and capture the full set of `REQ-NNN` IDs.
2. For each requirement, decompose into one or more atomic tasks. Each task does one thing and has one verification command.
3. Order tasks by dependency: prerequisites first, parallel-safe tasks grouped, and integration / wiring tasks last.
4. For each task row, write: identifier (e.g., `T01`), description, requirement ID(s) it satisfies, verification command (or "manual" with a step), and a status (`pending`).
5. Use the artifact-scope rule: a small change can use `tasks.md` only; a medium change uses `spec.md` + `tasks.md`; a large change uses `spec.md` + `design.md` + `tasks.md` (+ extras). Match the artifact set to the scope (see `guild-scope`).
6. Update `state.md` to reflect the new plan status (`planned` or `in-progress` if execution starts immediately).
7. Save to `.guild/plans/<slug>/tasks.md`.

## Parallel Groups (optional)

When a plan contains tasks that are genuinely independent — no shared files, no cross-group ordering dependency — the planner can declare parallel groups at the bottom of `tasks.md` to signal that these tasks can run concurrently:

```
## Parallel Groups
- **group-a**: T01, T02
- **group-b**: T05, T06
```

**When to declare groups**: Every task in a group must touch a file-touch set that is disjoint from every other group's tasks, and no task in one group may depend on another group's output (ordering-free). At least two groups with at least one task each must exist.

**When NOT to declare groups**: Any file touched by two or more groups; any task that depends on another group's output; fewer than two groups total; or no declared groups at all (sequential execution remains the default and is completely unaffected).

**Planner responsibility**: Independence is declared by the planner at planning time based on file-touch-overlap analysis — it is not inferred automatically by the executor at runtime. The declaration is a signal to the executor, not a guarantee that must be runtime-verified.

Groups do not change the task-row format or numbering — each task still carries its identifier, description, requirement IDs, verification command, and status. Ordering within a group follows the same dependency rules as ordering across ungrouped tasks.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I can hold the whole plan in my head." | Step 2 requires explicit decomposition. The plan is the contract for the next agent; head-only plans are not handoffable. |
| "Tasks are bureaucracy, just start." | Tasks are the audit trail. `guild-verify` reads `tasks.md`; without tasks, verification has no per-task criteria. |
| "I'll add tasks later." | Step 7 saves the file. "Later" is a rationalization; the plan is incomplete until tasks are written. |
| "The verification command can be filled in by the implementer." | Step 4 requires the verification command at planning time. Fill-in-later produces unverified work. |
| "Two tasks in one row save time." | Step 2 says atomic. Bundling hides which step broke when something fails. |

## Red Flags

- `tasks.md` has no requirement IDs mapped to rows.
- A task row has no verification command (or "see spec" as a placeholder).
- Tasks are not ordered by dependency (a task depends on one defined after it).
- Status field is missing or is hardcoded to `done`.

## Verification

The skill is complete when ALL of the following evidence is present:

- `.guild/plans/<slug>/tasks.md` exists with one row per task.
- Every task row has: identifier, description, requirement ID(s), verification command, status.
- Every `REQ-NNN` ID in `spec.md` is covered by at least one task row.
- Tasks are ordered by dependency (no row depends on a row defined later).
- `state.md` reflects the post-planning status.

**"Seems right" is not evidence.** Every claim of "this feature is planned" cites the file path and the rows that were written.

## See also

- [guild-spec](guild-spec) — produces the `spec.md` this skill decomposes.
- [guild-scope](guild-scope) — classifies the artifact set (small / medium / large).
- [guild-execute](guild-execute) — consumes the `tasks.md` this skill produces.
- [guild-verify](guild-verify) — checks per-task criteria against actual evidence.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

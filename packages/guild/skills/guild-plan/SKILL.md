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

## Process

1. Read `spec.md` and capture the full set of `REQ-NNN` IDs.
2. For each requirement, decompose into one or more atomic tasks. Each task does one thing and has one verification command.
3. Order tasks by dependency: prerequisites first, parallel-safe tasks grouped, and integration / wiring tasks last.
4. For each task row, write: identifier (e.g., `T01`), description, requirement ID(s) it satisfies, verification command (or "manual" with a step), and a status (`pending`).
5. Use the artifact-scope rule: a small change can use `tasks.md` only; a medium change uses `spec.md` + `tasks.md`; a large change uses `spec.md` + `design.md` + `tasks.md` (+ extras). Match the artifact set to the scope (see `guild-scope`).
6. Update `state.md` to reflect the new plan status (`planned` or `in-progress` if execution starts immediately).
7. Save to `.guild/plans/<slug>/tasks.md`.

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

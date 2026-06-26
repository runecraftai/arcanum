---
name: guild-execute
description: >
  Execute approved Guild tasks with minimal scope and steady progress.
  Use when implementing tasks from `.guild/plans/<slug>/tasks.md`.
license: CC-BY-4.0
---

# guild-execute

Do the smallest correct implementation; verify every step.

## Overview

Execute the task list in `tasks.md` one item at a time, staying within the declared scope. Each step is small, atomic, and independently verifiable. Read the spec before starting; update state as you go; do not re-plan unless a dependency forces it.

## When to Use

- A `.guild/plans/<slug>/tasks.md` exists and the plan is in `in-progress` state.
- The user has approved the plan (or the plan says "auto-execute on approval").
- The next step is implementation, not planning, scope, or review.

**Do NOT use for**: spec authoring (use `guild-spec`), planning (use `guild-plan`), scope classification (use `guild-scope`), verification (use `guild-verify`), or shipping (use `guild-ship`).

## Primary inputs

- `.guild/plans/<slug>/tasks.md` — task list with verification criteria
- `.guild/plans/<slug>/spec.md` — feature requirements
- `.guild/plans/<slug>/state.md` — current plan status
- `.guild/knowledge/conventions.md` — coding standards

## Process

1. Read `state.md` to confirm the plan is in `in-progress` and identify the next pending task.
2. Read the corresponding `tasks.md` row; capture the verification criteria for the current task.
3. Read any `references/` in the plan that the task depends on.
4. Make the smallest change that satisfies the verification criteria. Stay within the declared scope.
5. Run the task's verification command (test, lint, typecheck, smoke). Capture the output.
6. Update `tasks.md` to mark the task done with the verification evidence recorded inline.
7. Update `state.md` to reflect the new status. Move to the next pending task.
8. On any failure, record the failure in `notes.md` with the exact error output. Do not silently skip.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "The change is small, I can skip reading the spec." | The spec is the contract. Skipping it produces drift between `spec.md` and `tasks.md`. Read it. |
| "Tests will slow me down, I'll add them later." | The Process step 5 requires running verification. "Later" is a rationalization that produces a failed Verification gate. |
| "It compiles, that proves it works." | Compilation proves syntax, not behaviour. Verification needs the task's specified command output. |
| "Multiple tasks in one commit is faster." | Atomic tasks are the audit trail. Bundling them hides which step broke when something fails. |
| "I can fix the lint warning in a follow-up." | If the warning is in your diff, fix it now. Follow-up commits are a rationalization, not a plan. |

## Red Flags

- `tasks.md` shows a task marked done with no verification evidence recorded.
- Multiple tasks edited in a single commit without per-task verification capture.
- `state.md` status still says `draft` while `tasks.md` shows tasks done.
- The implementation diverged from the spec; no `notes.md` entry explains why.
- `references/` in the plan exist but were never read.

## Verification

The skill is complete when ALL of the following evidence is present:

- Every task in `tasks.md` is marked `done` with the verification evidence (command + output) recorded next to it.
- `state.md` reflects the post-execution status (typically `ready-for-review` or `verifying`).
- `notes.md` captures any environment-specific failures or scope decisions.
- The test suite passes (`bun test` in the affected package, with output captured).
- Lint and typecheck pass (`bunx turbo lint`, `bun run typecheck`).

**"Seems right" is not evidence.** Every claim of "this task is done" cites a file path, a command, or a runtime observation.

## See also

- [guild-plan](guild-plan) — produces the `tasks.md` this skill consumes.
- [guild-verify](guild-verify) — runs after this skill to confirm per-task + project-wide criteria.
- [guild-review](guild-review) — runs after `guild-verify` to review behaviour, not just tests.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

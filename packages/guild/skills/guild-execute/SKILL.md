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

Execute the task list in `tasks.md` one item at a time by default, staying within the declared scope. Each step is small, atomic, and independently verifiable. Read the spec before starting; update state as you go; do not re-plan unless a dependency forces it. When `tasks.md` declares parallel groups, the opt-in Parallel Groups Execution procedure below applies instead.

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

## Parallel Groups Execution (opt-in)

> **⚠️ Known v1 limitation**: the `task` tool has no directory/cwd argument. Worktree isolation for a spawned subagent depends entirely on it obeying prompt instructions — this is experimental, not a code-enforced guarantee.

When `tasks.md` contains a `## Parallel Groups` section (see `guild-plan`), execution may proceed with parallel worktrees. If no `## Parallel Groups` section exists, proceed with the existing fully-sequential process unchanged.

1. **Check for Parallel Groups**: Read `tasks.md` for a `## Parallel Groups` section. If absent, skip this entire section and follow the default sequential Process above.

2. **Create worktrees**: For each declared group, create a worktree using the naming convention from the `git-worktree` spell (`packages/spells/skills/git-worktree/`):
   ```
   git worktree add -b <slug>-<group-name> ../<repo-name>-<slug>-<group-name>
   ```

3. **Spawn subagents**: For each group, spawn one subagent via the `task` tool (`subagent_type` appropriate to the work). The prompt must:
   - **State the subagent's assigned worktree absolute path** explicitly
   - **As its required first action**, instruct the subagent to confirm `git rev-parse --show-toplevel` matches the assigned worktree path before making any edit — this mitigates the tool's lack of native directory scoping
   - **Inline the full text of that group's task rows — description, files touched, and acceptance criteria — directly in the prompt** — the subagent must NOT be told to read `.guild/plans/<slug>/tasks.md` itself, since it resolves to a different directory (the worktree) and cannot be assumed to have or correctly resolve a path back to the primary session's plan files

4. **Wait for all groups**: The primary session waits for all spawned subagents to report completion (or failure) before proceeding.

5. **Verify each group**: For each group that reports completion, run verification for that group's worktree (`guild_verify_gate` if available, else manual `guild-verify`). **Do not proceed to merge a group that has not independently passed verification.**

6. **Cross-check before merge**: Before merging any group, run `git branch --no-merged` in the primary worktree and confirm its output matches exactly the set of groups still expected to be unmerged (every not-yet-merged group's branch appears; every already-merged group's branch does not). A mismatch is a stop-and-investigate signal — do not proceed past it silently.

7. **Merge one group at a time**: Merging happens only in the primary worktree, one verified group at a time, following `git-worktree`'s existing "Merge Strategy" section. Requires explicit confirmation before each merge.

8. **Clean up**: After all groups are merged, remove worktrees and prune (`git worktree remove`, `git worktree prune`) per `git-worktree`'s existing "Clean Up" section.

**A group's branch is never merged automatically — verification passing is necessary but not sufficient; an explicit confirmation step, backed by a `git branch --no-merged` check, is always required before merge.**

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

- See the `git-worktree` spell in `packages/spells/skills/git-worktree/` for the underlying git commands and safety rules (worktree creation, merge strategy, cleanup).
- [guild-plan](guild-plan) — produces the `tasks.md` this skill consumes.
- [guild-verify](guild-verify) — runs after this skill to confirm per-task + project-wide criteria.
- [guild-review](guild-review) — runs after `guild-verify` to review behaviour, not just tests.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

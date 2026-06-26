---
name: guild-review
description: >
  Review completed Guild work for correctness, regressions, and missing coverage.
  Use after implementation or before shipping a feature.
license: CC-BY-4.0
---

# guild-review

Review for behavior, not style alone.

## Overview

Compare the implementation against the spec, run the verification evidence, and check the diff against `knowledge/conventions.md`. Surface broken flows, missing tests, unintended coupling, and any weakening of Guild identity or future maintainability. Update `state.md` and record findings in `notes.md`.

## When to Use

- A `.guild/plans/<slug>/` exists and `guild-verify` has run and passed per-task + project-wide criteria.
- The next step is a Cleric-style review pass before `guild-ship`.
- The user wants a behaviour-focused review of completed work.

**Do NOT use for**: spec authoring (use `guild-spec`), implementation (use `guild-execute`), verification (use `guild-verify`), or shipping (use `guild-ship`).

## Primary inputs

- `.guild/plans/<slug>/spec.md` — acceptance criteria
- `.guild/plans/<slug>/tasks.md` — completed tasks
- `.guild/plans/<slug>/notes.md` — implementation decisions and DoD check status
- `.guild/knowledge/conventions.md` — coding standards
- `.guild/knowledge/gotchas.md` — known pitfalls

## Process

1. Read `state.md` to confirm `guild-verify` has run and the plan is in `ready-for-review`.
2. Read `spec.md` acceptance criteria and map them to `tasks.md` rows. Drift between spec and tasks is itself a finding.
3. Re-run the verification commands named in `tasks.md` (or read the captured output) and confirm they pass.
4. Read the diff (`git diff main...HEAD` or the relevant range) and trace the call graph for new functions. Flag broken flows, missing tests, and unintended coupling.
5. Compare the diff against `knowledge/conventions.md`. Flag style or convention violations, but do not block on style alone when behaviour is correct.
6. Confirm the DoD check status entry from `guild-verify` is present in `notes.md` and matches the actual `knowledge/definition-of-done.md` content.
7. Write findings to `notes.md` with file paths and line numbers. Update `state.md` to `reviewed` (no findings) or `blocked` (findings block ship).

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "Verify already passed, review is redundant." | Verify confirms per-task tests pass; review confirms the spec is actually satisfied, conventions are followed, and regressions are absent. Different gates. |
| "Reviewer signs off without running tests." | Step 3 requires re-running or reading the captured command output. Sign-off without that is a Red Flag, not a review. |
| "Spec drift is fine, we updated the spec mentally." | Step 2 requires spec and `tasks.md` to match. Drift is recorded in `notes.md`; a refactor of `spec.md` is the canonical fix, not memory. |
| "Style nitpicks can be follow-up." | Behaviour-blocking findings block ship (step 7). Style-only findings are recorded but do not block. |
| "I trust the implementer, no need to read the diff." | Step 4 requires reading the diff. Trust without evidence is the rationalization this table rebuts. |

## Red Flags

- Reviewer signs off without re-running (or reading) the verification commands in `tasks.md`.
- Spec acceptance criteria are paraphrased in `tasks.md` (drift not flagged).
- The diff introduces a dependency or call pattern that contradicts `knowledge/conventions.md` and the reviewer signs off anyway.
- The DoD check status from `guild-verify` is missing from `notes.md` and the reviewer does not flag it.
- Findings are recorded in chat but not in `notes.md` (no audit trail).

## Verification

The skill is complete when ALL of the following evidence is present:

- `state.md` is updated to `reviewed` (no blocking findings) or `blocked` (findings block ship) with a timestamp.
- `notes.md` lists every finding with file path and line number, plus a resolution or follow-up pointer.
- The verification commands from `tasks.md` were re-run (or their captured output read) and pass.
- The DoD check status from `guild-verify` is present in `notes.md` and matches `knowledge/definition-of-done.md`.
- No finding is "left for later" without a `notes.md` entry naming the plan that owns it.

**"Seems right" is not evidence.** Every claim of "this change is reviewed" cites a file path, a command, or a runtime observation.

## See also

- [guild-execute](guild-execute) — produces the diff this skill reviews.
- [guild-verify](guild-verify) — runs the per-task + project-wide check this skill relies on.
- [guild-ship](guild-ship) — runs after this skill; consumes the `reviewed` state.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

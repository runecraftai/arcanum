---
name: guild-verify
description: >
  Prove a Guild change works by running checks and comparing results
  against `.guild/plans/<slug>/tasks.md` acceptance criteria AND the
  project-wide bar in `.guild/knowledge/definition-of-done.md`.
  Use when verifying a change before review or ship.
license: CC-BY-4.0
---

# guild-verify

Verify the change against evidence, not intent — both per-task criteria and the project-wide bar.

## Overview

Run the smallest useful test set first, capture command output, and confirm the change clears BOTH the per-task criteria in `tasks.md` AND the project-wide standing bar in `knowledge/definition-of-done.md`. When the project-wide file is absent, log a note and continue with per-task only.

## When to Use

- A `.guild/plans/<slug>/tasks.md` exists and the plan is in `verifying` or `ready-for-review` state.
- The next step is verification (test, lint, typecheck, smoke) before review or ship.
- The user wants the per-task criteria and the project-wide bar compared against actual evidence.

**Do NOT use for**: spec authoring (use `guild-spec`), planning (use `guild-plan`), implementation (use `guild-execute`), review (use `guild-review`), or shipping (use `guild-ship`).

## Primary inputs

- `.guild/plans/<slug>/tasks.md` — per-task verification criteria
- `.guild/plans/<slug>/spec.md` — acceptance criteria
- `.guild/knowledge/definition-of-done.md` — project-wide standing bar (graceful fallback if absent)
- `.guild/plans/<slug>/notes.md` — verification notes (write to this for DoD check status)

## Process

1. Read `state.md` to confirm the plan is in `verifying` or `ready-for-review`.
2. Read `tasks.md` and capture the verification criteria for the current plan.
3. Read `spec.md` acceptance criteria; map them to the task rows.
4. Run the smallest useful test set first; capture full command output.
5. Run lint and typecheck for the affected package; capture output.
6. Per-task check: confirm every task is `done` with verification evidence recorded inline. If any task lacks evidence, mark it `blocked` and stop.
7. Project-wide check: read `.guild/knowledge/definition-of-done.md` (if present) and confirm every bar item is met for the current change. If absent, log a note in `plans/<slug>/notes.md` (`DoD project-wide bar: empty/absent; skipped`) and continue with per-task only.
8. If a project-wide bar item cannot be verified from the current change, mark it `unable to verify` in `notes.md` — do NOT auto-pass.
9. Update `tasks.md` and `state.md` to reflect the verification status. A failing project-wide item fails the overall verification with a clear pointer to the failing item.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "The build is green, that's enough." | Build proves compile, not behaviour. The per-task criteria and project-wide bar require named evidence (command + output). |
| "I'll add tests later." | Tests are part of step 4–5. "Later" produces a failed Verification gate when the next reviewer or `guild-ship` runs. |
| "The DoD file is empty, skip it." | The file is the project's standing bar. Log a note in `notes.md` and continue with per-task only; do NOT silently skip in `state.md`. |
| "It's a small change, no need to run the full suite." | The Process step 4 says "smallest useful test set first"; a small change still must clear the project-wide bar in step 7. |
| "I'll mark this bar item unable-to-verify, that's the same as passing." | `unable to verify` is recorded in `notes.md` and visible to the next reviewer. Auto-passing hides risk; that is the rationale this table rebuts. |

## Red Flags

- `tasks.md` shows tasks marked `done` with no verification evidence recorded.
- The project-wide bar in `knowledge/definition-of-done.md` is non-empty but no `notes.md` entry confirms the bar was read.
- A failing per-task or project-wide item is not reflected in `state.md` (status still `ready-for-review`).
- `notes.md` is missing the DoD check status entry for a plan that touched the project-wide bar.
- Test failures are recorded as "flaky" without a re-run and a passing second run.

## Verification

The skill is complete when ALL of the following evidence is present:

- `tasks.md` shows every task marked `done` with the verification command + output recorded inline.
- `notes.md` records the DoD check status: `read and cleared`, `read with failing item <name>`, or `absent/empty; skipped`.
- `state.md` reflects the post-verification status (`ready-for-review` when both checks pass, `blocked` when either fails).
- The test suite passes (`bun test` in the affected package, with output captured).
- Lint and typecheck pass (`bunx turbo lint`, `bun run typecheck`).
- When the project-wide file is present and non-empty: every bar item is either `met` or marked `unable to verify` in `notes.md`. No item is silently auto-passed.

**"Seems right" is not evidence.** Every claim of "this task is verified" or "this bar item is met" cites a file path, a command, or a runtime observation.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — knowledge/ slot layout and DoD placement.
- [guild-execute](guild-execute) — produces the diff this skill verifies.
- [guild-review](guild-review) — runs after this skill to review behaviour, not just tests.
- [guild-ship](guild-ship) — runs after review; consults the same project-wide bar.

---
name: guild-ship
description: >
  Finalize and ship a Guild change once implementation, verification, and review
  are complete. Confirms per-task criteria AND the project-wide bar in
  `.guild/knowledge/definition-of-done.md` before declaring the change shipped.
license: CC-BY-4.0
---

# guild-ship

Ship only when the per-task checks, the review, and the project-wide bar are all green.

## Overview

Run the ship gate after `guild-verify` and `guild-review` have both passed. The gate confirms per-task criteria in `tasks.md`, then reads the project-wide bar in `knowledge/definition-of-done.md` and confirms every item is met. If the project-wide file is absent, log a note and continue with per-task only. Never ship with an unmet bar item.

## When to Use

- A `.guild/plans/<slug>/tasks.md` exists and the plan is in `ready-for-review` or `reviewed` state.
- `guild-verify` has run and the per-task criteria are met.
- `guild-review` (Cleric) has run and findings are addressed.
- The next step is to declare the change shipped, archive the plan, and update global state.

**Do NOT use for**: implementation (use `guild-execute`), verification (use `guild-verify`), review (use `guild-review`), or re-shipping after a hotfix without re-running verify + review.

## Primary inputs

- `.guild/plans/<slug>/state.md` — must show `reviewed` (post-Cleric)
- `.guild/plans/<slug>/tasks.md` — every task must be `done` with evidence
- `.guild/plans/<slug>/notes.md` — verification + review + DoD status entries
- `.guild/knowledge/definition-of-done.md` — project-wide standing bar (graceful fallback if absent)
- `.guild/context/state.md` — global project-level readiness

## Process

1. Read `state.md`. If status is not `reviewed`, stop and call `guild-verify` and `guild-review` first.
2. Read `tasks.md`. If any task is not `done` with evidence, stop and call `guild-verify` first.
3. Per-task check: confirm every row in `tasks.md` is `done` and the verification evidence is recorded.
4. **DoD gate**: read `.guild/knowledge/definition-of-done.md`. If absent, log `DoD project-wide bar: absent; per-task only` in `notes.md` and continue. If present, confirm every bar item is met for the current change. Mark `unable to verify` items in `notes.md` — do NOT auto-pass.
5. If a project-wide bar item fails, the ship gate fails. Update `state.md` to `blocked` and stop. Do not ship.
6. Confirm release notes are written and small/clear.
7. Update `state.md` to `shipped`. Move the plan to `.guild/archive/<slug>/` if the plan is complete.
8. Update `context/state.md` with the new project status.
9. Write the handoff entry per `guild-handoff` rules.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "It's a small change, no need for a checklist." | The DoD gate is the standing bar, not a per-change checklist. Step 4 runs it on every ship. |
| "The merge button is right there." | Step 1 enforces `reviewed`; step 3 enforces per-task evidence; step 4 enforces the project-wide bar. Skipping any of them produces a ship gate failure. |
| "The DoD file is empty, so the project has no bar." | An empty file is a valid `absent/empty; per-task only` log entry. Empty ≠ skip the log; the log is the audit trail. |
| "Review is a formality, I'll just ship." | `guild-review` (Cleric) catches regressions the verify step cannot. Step 1 enforces `reviewed`. |
| "I'll archive later." | Archiving is step 7. Plans left in `plans/` after ship pollute the active-workspace list. |
| "Hotfixes don't need a full re-run." | Hotfixes still touch the standing bar. The DoD gate applies to every ship. |

## Red Flags

- `state.md` shows `verified` or `verifying` when ship is invoked (review skipped).
- The DoD file exists and is non-empty, but no `notes.md` entry records the DoD gate result.
- A `tasks.md` row is `done` with no verification evidence recorded.
- A failing project-wide bar item is not reflected in `state.md` (status still `shipped`).
- Release notes are missing or are a single "misc fixes" line.

## Verification

The skill is complete when ALL of the following evidence is present:

- `state.md` is updated to `shipped` (or `archived`) with a timestamp.
- `notes.md` records the DoD gate result for this ship: `read and cleared`, `read with failing item <name>`, or `absent/empty; per-task only`.
- The plan directory was moved to `.guild/archive/<slug>/` (when the plan is complete).
- `context/state.md` reflects the new global status.
- Release notes were written, are small, and describe user-visible changes.
- No bar item is auto-passed: every item is `met` or `unable to verify`.

**"Seems right" is not evidence.** Every claim of "this change is shipped" cites a file path, a command, or a runtime observation.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — knowledge/ slot layout and DoD placement.
- [guild-verify](guild-verify) — runs the per-task check this skill relies on.
- [guild-review](guild-review) — Cleric-style review that must precede ship.
- [guild-handoff](guild-handoff) — handoff format for the post-ship state update.

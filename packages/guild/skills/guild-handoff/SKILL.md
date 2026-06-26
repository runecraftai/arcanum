---
name: guild-handoff
description: >
  Capture pause/resume context for Guild work in `.guild/context/handoff.md`
  and `.guild/context/state.md`.
license: CC-BY-4.0
---

# guild-handoff

Capture and restore working context across sessions.

## Overview

Write a session summary (what changed, what remains, blockers, decisions) to `context/handoff.md`. Update `context/state.md` and `plans/<slug>/state.md` so the next session can resume without re-deriving context. Promote cross-cutting learnings to `knowledge/` (see `guild-commit-learning`).

## When to Use

- A session is ending and the next session needs to resume work.
- Work is being handed off between agents (human→agent or agent→agent).
- The user wants a structured pause/resume snapshot.

**Do NOT use for**: in-session commit-time knowledge capture (use `guild-commit-learning`); spec authoring (use `guild-spec`); planning (use `guild-plan`).

## Primary outputs

- `.guild/context/handoff.md` — session summary (what changed, what remains, blockers)
- `.guild/context/state.md` — global project-level state update
- `.guild/plans/<slug>/state.md` — plan-local state update
- `.guild/plans/<slug>/notes.md` — plan-local findings (updated freely)

## Process

1. Decide whether the handoff is **end of session** or **agent-to-agent mid-plan**. Both write to `context/handoff.md`; mid-plan handoffs also rewrite `plans/<slug>/state.md` so the next agent has plan-local context.
2. Use the destination routing table to decide what goes where. `context/state.md` for project-wide status; `plans/<slug>/state.md` for plan-local status; `notes.md` for findings.
3. Write the handoff entry: what changed this session, what remains, what is blocked (and why), key decisions, references to `.guild/plans/<slug>/` artifacts.
4. Update `context/state.md` with the new global status, active focus, and any blockers.
5. Update `plans/<slug>/state.md` with the plan-local status and the next action the next agent should take.
6. If a finding is cross-cutting, capture it in `notes.md` first, then promote to `knowledge/` by explicit decision (see `guild-commit-learning`).
7. Do NOT write to `.specs/`. Read `.specs/project/HANDOFF.md` or `.specs/project/STATE.md` only if the `.guild/` counterparts are absent.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I'll just tell them in the next turn." | Step 3 writes the handoff to disk. Verbal handoffs are not auditable and break if the next session is async. |
| "The handoff is overhead, just keep working." | Step 1 is the trigger. Sessions end; the handoff is the resume point. Skipping it forces the next agent to re-derive context. |
| "I updated `state.md`; that's enough." | Step 3 also writes `handoff.md` with the decision trail. `state.md` is current; `handoff.md` is the recent past. |
| "Notes from this plan can go straight to `knowledge/`." | Step 6 says write to `notes.md` first, then promote by explicit decision. Direct write to `knowledge/` bypasses the promotion gate. |
| "Legacy `.specs/HANDOFF.md` is the source of truth." | Step 7 says legacy is fallback only. The canonical handoff is `.guild/context/handoff.md`. |

## Red Flags

- `context/handoff.md` was not written at end of session.
- `context/state.md` and `plans/<slug>/state.md` are out of sync (one says `in-progress`, the other says `done`).
- A cross-cutting learning was written directly to `knowledge/` without a `notes.md` entry first.
- The handoff references `.specs/` paths instead of `.guild/`.
- Decisions made this session are recorded in chat but not in `handoff.md` or `notes.md`.

## Verification

The skill is complete when ALL of the following evidence is present:

- `.guild/context/handoff.md` is updated with: what changed, what remains, what is blocked, key decisions, references to plan artifacts.
- `.guild/context/state.md` reflects the new global status.
- `.guild/plans/<slug>/state.md` reflects the new plan-local status and the next action.
- Cross-cutting learnings are in `notes.md` (and promoted to `knowledge/` by decision, not by default).
- No content was written to `.specs/`.

**"Seems right" is not evidence.** Every claim of "this handoff is complete" cites the file paths that were updated and the sections that were written.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — state update rules and ownership summary.
- [guild-commit-learning](guild-commit-learning) — promotion rules from `notes.md` to `knowledge/`.
- [guild-load](guild-load) — consumes the handoff this skill produces.
- [guild-state-update](#) — implicit in `state.md` ownership rules.

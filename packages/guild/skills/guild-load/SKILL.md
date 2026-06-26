---
name: guild-load
description: >
  Load current Guild context, project state, and handoff notes before other work.
  Use to check `.guild/context/*`, active plans, and available working context.
license: CC-BY-4.0
---

# guild-load

Load only what is needed to continue safely.

## Overview

Read the canonical `.guild/` state in the documented loading order, surface blockers and open follow-ups, and stop before touching anything. Prefer the smallest useful context set and respect the token budget. Legacy `.specs/` is read-only fallback when `.guild/` is empty or stale.

## When to Use

- A new session starts and the agent needs the current state.
- The user asks "where are we?" or "what's the state of <plan>?".
- The next step is to load context, not to plan, spec, or execute.

**Do NOT use for**: spec authoring (use `guild-spec`), planning (use `guild-plan`), implementation (use `guild-execute`), or handoff (use `guild-handoff`).

## Primary inputs (canonical loading order)

1. `.guild/context/project.md` — project identity and tech stack
2. `.guild/context/roadmap.md` — high-level roadmap
3. `.guild/context/state.md` — current project state and blockers
4. `.guild/context/handoff.md` — last session summary
5. Active `.guild/plans/<slug>/state.md` — plan-local status
6. `.guild/knowledge/index.md` — relevant conventions map
7. `.guild/knowledge/definition-of-done.md` — project-wide standing bar (if present)

## Process

1. Read the canonical loading order top-to-bottom. Stop early if the token budget is tight and the early files already answer the question.
2. Surface blockers, decisions, and open follow-ups before making changes. Blockers in `context/state.md` outrank blockers in `plans/<slug>/state.md`.
3. Read the active plan's `state.md` before reading global state if the user named a specific plan.
4. Read `knowledge/index.md` and only the `knowledge/<file>.md` entries it points to. Do not scan the whole `knowledge/` directory.
5. If `.guild/context/project.md` is absent, read `.specs/project/PROJECT.md` as fallback. The same fallback rule applies to `state.md` and `handoff.md`.
6. Do NOT write anything. This skill is read-only. If writing is needed, hand off to the skill that owns the write (e.g., `guild-handoff`, `guild-execute`).

## Rationalizations

A read-only skill has no skip-rationalizations for the steps themselves. The Rationalizations table below applies to agents that mistake `guild-load` for an action skill.

| Excuse | Rebuttal |
| --- | --- |
| "I have enough context, I can skip loading." | Step 1 reads the canonical order. Skipping produces drift between the agent's mental model and the project's actual state. |
| "I'll also fix the typo in `state.md` while I'm here." | Step 6 says do NOT write. Fixes belong in `guild-handoff` (state update) or `guild-execute` (working change). |
| "Loading everything is safer than the smallest useful set." | Step 1 says stop early on tight budgets. Loading everything wastes tokens and dilutes attention. |
| "Legacy `.specs/` is the source of truth, skip `.guild/`." | Step 5 says `.specs/` is fallback only. The canonical state is `.guild/`. |

## Red Flags

- Agent writes to any `.guild/` file after `guild-load` runs (this skill is read-only).
- `.guild/context/project.md` is present but the agent reads `.specs/project/PROJECT.md` first.
- Token budget blown by reading all of `knowledge/` instead of following `index.md`.
- Blockers in `context/state.md` are not surfaced before the agent starts a new task.
- A plan-local `state.md` is read before the global `context/state.md`, missing project-wide blockers.

## Verification

The skill is complete when ALL of the following evidence is present:

- The canonical loading order was followed (or stopped early with a recorded reason).
- Blockers, decisions, and open follow-ups were surfaced in the agent's response.
- No `.guild/` or `.specs/` file was written.
- If `.guild/` files were absent, legacy `.specs/` was read and the absence was noted.

**"Seems right" is not evidence.** Every claim of "context is loaded" cites the file paths that were read.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — canonical loading order and state ownership.
- [guild-handoff](guild-handoff) — produces the `handoff.md` this skill reads.
- [guild-init](guild-init) — scaffolds the `context/` files this skill reads.
- [guild-verify](guild-verify) — consumes the `definition-of-done.md` this skill loads.

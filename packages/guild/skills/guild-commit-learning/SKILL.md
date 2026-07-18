---
name: guild-commit-learning
description: >
  Shape Git commits and Guild knowledge so future work can learn from them.
  Use when writing commit messages or promoting lessons to `.guild/knowledge/`.
license: CC-BY-4.0
---

# guild-commit-learning

Make commit history and institutional knowledge useful to the next run.

## Overview

Route every finding to the right destination: plan-local notes, the project-wide `knowledge/` tree, or the Git commit. Promote cross-cutting lessons from `notes.md` to `knowledge/` by explicit decision — never directly. Shape commit messages so the history is searchable and links back to plan artifacts.

## When to Use

- A commit is being written and the message needs to link to the plan.
- A cross-cutting finding is ready to be promoted from `notes.md` to `knowledge/`.
- The user wants to capture a reusable lesson from a session.

**Do NOT use for**: routine in-session file edits with no promotion; pure handoff (use `guild-handoff`).

## Primary outputs

- Git commits (via standard workflow)
- `.guild/plans/<slug>/notes.md` — plan-local findings (written first)
- `.guild/knowledge/decisions.md` — promoted architectural decisions
- `.guild/knowledge/conventions.md` — promoted coding standards
- `.guild/knowledge/gotchas.md` — promoted known pitfalls
- `.guild/knowledge/index.md` — updated on any knowledge addition

## Destination routing rules

| What was discovered | Write to | Why |
|--------------------|----------|-----|
| Plan-specific debug notes, code locations, temp decisions | `plans/<slug>/notes.md` | Ephemeral; only this plan needs it |
| Decision that applies to any future plan | `plans/<slug>/notes.md` → promote to `knowledge/decisions.md` | Cross-cutting; durable |
| Convention or pattern found during this plan | `plans/<slug>/notes.md` → promote to `knowledge/conventions.md` | Cross-cutting; durable |
| Pitfall or mistake encountered | `plans/<slug>/notes.md` → promote to `knowledge/gotchas.md` | Cross-cutting; durable |
| Project identity, roadmap, global status | — | Belongs in `context/` (see `guild-handoff`) |

## Process

1. Apply the destination routing rules: start at `notes.md`, then promote by explicit decision.
2. Use the decision tree below to pick the destination. Cross-cutting findings require an explicit promotion step.
3. Apply the promotion criteria before promoting. If the finding does not meet all four criteria, leave it in `notes.md`.
4. After any promotion, update `knowledge/index.md` to reflect the new entry.
5. Date every promoted knowledge entry with `YYYY-MM-DD` so future readers can assess currency.
6. Shape commit messages: conventional-commits scope, intent, scope, and validation in the body. Link to `.guild/plans/<slug>/` artifacts in extended descriptions.

## Knowledge promotion rules

1. **Write first** to `plans/<slug>/notes.md` — never write directly to `knowledge/`.
2. **Decide** whether the finding is truly cross-cutting before promoting.
3. **Promote** by explicit decision (explicitly decide it belongs in `knowledge/`).
4. **Index** — update `knowledge/index.md` on every addition.
5. **Never** overwrite a plan's local decisions with knowledge decisions.
6. **Separate Facts** (verified against the repo, with file/path citations) **from Inferences** (assumptions not yet verified). Mark inferences explicitly.

## Promotion criteria

A finding qualifies for promotion when **all** are true:

- It is not specific to one plan's scope or files.
- A future agent working on an unrelated plan would benefit from knowing it.
- It is not already documented elsewhere in `knowledge/`.
- It has enough context to be useful without the original plan.

## Archiving

When a `knowledge/*.md` file exceeds 500 lines, move the oldest ~20% of entries to `knowledge/archive/<filename>-YYYY-MM-DD.md`. Leave a tombstone comment in the original file pointing to the archive. Update `knowledge/index.md` to reflect the archive entry. This keeps knowledge files navigable without losing history.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "It's a one-liner, I'll just write it to `knowledge/` directly." | Rule 1 says write to `notes.md` first. The promotion gate is what keeps `knowledge/` durable. |
| "I know it's cross-cutting, no need to check the criteria." | Rule 3 says explicit decision. "I know" is the rationalization the criteria table rebuts. |
| "I'll update `index.md` later." | Rule 4 says update on every addition. `index.md` is the map; stale map is worse than no map. |
| "The commit message is fine without a plan link." | Step 5 requires the plan link. The link is how the next agent finds the artifact trail. |
| "The lesson is too specific to one change." | If the criteria in §Promotion criteria do not all hold, leave it in `notes.md`. Specificity is the right reason not to promote. |

## Red Flags

- A lesson is too specific to one change but was promoted to `knowledge/`.
- A lesson is captured in `notes.md` but never promoted (cross-cutting, durable, missed).
- `knowledge/index.md` is stale (no entry for a recently promoted item).
- A commit message has no link to the active plan artifacts.
- A promotion overwrote a prior entry without a `notes.md` record of the change.

## Verification

The skill is complete when ALL of the following evidence is present:

- Every finding is routed via the destination rules (plan-local first, promotion by decision).
- `knowledge/index.md` is updated on any promotion.
- Commit messages follow conventional commits, link to plan artifacts, and include intent + scope + validation.
- No `knowledge/` file was written directly from outside `notes.md`.
- The promotion criteria were checked before any promotion.

**"Seems right" is not evidence.** Every claim of "this is captured" cites the file path and the section that was written.

## Commit guidance

- Summarize intent, scope, implementation, and validation.
- Keep each commit atomic and searchable.
- Link to `.guild/plans/<slug>/` artifacts in extended descriptions.
- Use conventional-commits scopes (e.g., `feat(guild):`, `docs(guild):`, `chore(guild):`).

## See also

- [.guild/architecture.md](/.guild/architecture.md) — knowledge/ ownership and state update rules.
- [guild-handoff](guild-handoff) — produces the `notes.md` entries that feed promotion.
- [guild-spec](guild-spec) — when a finding should become a feature spec instead of a knowledge entry.

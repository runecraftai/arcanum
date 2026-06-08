---
name: guild-commit-learning
description: >
  Shape Git commits and Guild knowledge so future work can learn from them.
  Use when writing commit messages or promoting lessons to `.guild/knowledge/`.
license: CC-BY-4.0
---

# guild-commit-learning

Make commit history and institutional knowledge useful to the next run.

## Primary outputs

- Git commits (via standard workflow)
- `.guild/plans/<slug>/notes.md` — plan-local findings (written first)
- `.guild/knowledge/decisions.md` — promoted architectural decisions
- `.guild/knowledge/conventions.md` — promoted coding standards
- `.guild/knowledge/gotchas.md` — promoted known pitfalls
- `.guild/knowledge/index.md` — updated on any knowledge addition

---

## Destination routing rules

| What was discovered | Write to | Why |
|--------------------|----------|-----|
| Plan-specific debug notes, code locations, temp decisions | `plans/<slug>/notes.md` | Ephemeral; only this plan needs it |
| Decision that applies to any future plan | `plans/<slug>/notes.md` → promote to `knowledge/decisions.md` | Cross-cutting; durable |
| Convention or pattern found during this plan | `plans/<slug>/notes.md` → promote to `knowledge/conventions.md` | Cross-cutting; durable |
| Pitfall or mistake encountered | `plans/<slug>/notes.md` → promote to `knowledge/gotchas.md` | Cross-cutting; durable |
| Project identity, roadmap, global status | — | Belongs in `context/` (see guild-handoff) |

**Decision tree**:

1. Is this discovery useful **only to this plan**?
   → Yes → write to `plans/<slug>/notes.md`. Done.
   → No (applies to future plans) → go to step 2.

2. Is this a cross-cutting **decision with rationale**?
   → Yes → promote to `knowledge/decisions.md`.

3. Is this a **convention, pattern, or standard**?
   → Yes → promote to `knowledge/conventions.md`.

4. Is this a **known pitfall or common mistake**?
   → Yes → promote to `knowledge/gotchas.md`.

5. Update `knowledge/index.md` after any promotion.

---

## Knowledge promotion rules

1. **Write first** to `plans/<slug>/notes.md` — never write directly to `knowledge/`
2. **Decide** whether the finding is truly cross-cutting before promoting
3. **Promote** by explicit decision (explicitly decide it belongs in `knowledge/`)
4. **Index** — update `knowledge/index.md` on every addition
5. **Never** overwrite a plan's local decisions with knowledge decisions

## Promotion criteria

A finding qualifies for promotion when **all** are true:
- It is not specific to one plan's scope or files
- A future agent working on an unrelated plan would benefit from knowing it
- It is not already documented elsewhere in `knowledge/`
- It has enough context to be useful without the original plan

## Commit guidance

- Summarize intent, scope, implementation, and validation
- Keep each commit atomic and searchable
- Link to `.guild/plans/<slug>/` artifacts in extended descriptions

## Fallback rules

- Read existing `.specs/` content only to understand legacy context
- Never write to `.specs/` — write to `.guild/knowledge/` instead

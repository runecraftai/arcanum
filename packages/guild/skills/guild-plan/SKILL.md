---
name: guild-plan
description: >
  Break a Guild feature spec into atomic tasks and execution order.
  Use when creating `.guild/plans/<slug>/tasks.md` or sequencing work.
license: CC-BY-4.0
---

# guild-plan

Decompose work into small, ordered tasks.

## Primary inputs

- `.guild/plans/<slug>/spec.md` — feature requirements
- `.guild/plans/<slug>/tasks.md` — target artifact
- `.guild/plans/<slug>/state.md` — current plan status
- `.guild/knowledge/conventions.md` — coding standards

## Fallback rules

- Read `.specs/features/<feature>/tasks.md` only if `.guild/plans/<slug>/tasks.md` is absent
- Write only to `.guild/plans/<slug>/` — never to `.specs/`

## Task structure

Each task should have:
- Unique identifier (e.g., `TASK-001`)
- Description and verification criteria
- Traceable requirement ID from spec
- Status: pending | in-progress | done | blocked

## Guidance

- Each task should be independently verifiable
- Put prerequisites first
- Map every task back to a requirement ID from spec
- Keep the plan focused on delivery, not re-specification
- Update `.guild/plans/<slug>/state.md` when task order changes
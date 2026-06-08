---
name: guild-spec
description: >
  Write the problem statement, goals, user stories, and acceptance criteria for a Guild feature.
  Use when creating `.guild/plans/<slug>/spec.md`.
license: CC-BY-4.0
---

# guild-spec

Turn a request into a testable feature spec.

## Primary inputs

- `.guild/plans/<slug>/spec.md` — target artifact
- `.guild/context/project.md` — project identity
- `.guild/knowledge/decisions.md` — prior decisions
- `.guild/knowledge/conventions.md` — applicable conventions

## Fallback rules

- Read `.specs/features/<feature>/spec.md` only if `.guild/plans/<slug>/spec.md` is absent
- Write only to `.guild/plans/<slug>/` — never to `.specs/`

## Guidance

- State the problem clearly before proposing solutions
- Capture goals, non-goals, and user stories
- Assign traceable requirement IDs (e.g., `REQ-001`)
- Link acceptance criteria back to spec requirements
- Keep future-artifact guidance pointed at `.guild/plans/<slug>/`
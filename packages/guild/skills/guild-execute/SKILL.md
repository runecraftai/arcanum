---
name: guild-execute
description: >
  Execute approved Guild tasks with minimal scope and steady progress.
  Use when implementing tasks from `.guild/plans/<slug>/tasks.md`.
license: CC-BY-4.0
---

# guild-execute

Do the smallest correct implementation.

## Primary inputs

- `.guild/plans/<slug>/tasks.md` — task list with verification criteria
- `.guild/plans/<slug>/spec.md` — feature requirements
- `.guild/plans/<slug>/state.md` — current plan status
- `.guild/knowledge/conventions.md` — coding standards

## Fallback rules

- Read `.specs/features/<feature>/tasks.md` only if `.guild/plans/<slug>/tasks.md` is absent
- Write only to `.guild/plans/<slug>/` — never to `.specs/`

## Guidance

- Follow the task order and stay within the declared scope
- Change code directly and verify each step
- Update task status in `.guild/plans/<slug>/tasks.md` after each step
- Update `.guild/plans/<slug>/state.md` on handoff
- Avoid re-planning unless a dependency forces it
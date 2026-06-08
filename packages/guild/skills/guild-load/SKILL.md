---
name: guild-load
description: >
  Load current Guild context, project state, and handoff notes before other work.
  Use to check `.guild/context/*`, active plans, and available working context.
license: CC-BY-4.0
---

# guild-load

Load only what is needed to continue safely.

## Primary inputs (`.guild/`)

Load in canonical order:
1. `.guild/context/project.md` — project identity and tech stack
2. `.guild/context/roadmap.md` — high-level roadmap
3. `.guild/context/state.md` — current project state and blockers
4. `.guild/context/handoff.md` — last session summary
5. Active `.guild/plans/<slug>/state.md` — plan-local status
6. `.guild/knowledge/index.md` — relevant conventions

## Fallback rules

- If `.guild/context/project.md` is absent, read `.specs/project/PROJECT.md`
- If `.guild/context/state.md` is absent, read `.specs/project/STATE.md`
- If `.guild/context/handoff.md` is absent, read `.specs/project/HANDOFF.md`
- Write only to `.guild/` — never to `.specs/`

## Guidance

- Prefer the smallest useful context set and respect token budget
- Surface blockers, decisions, and open follow-ups before making changes
- Read plan-local state before touching global state
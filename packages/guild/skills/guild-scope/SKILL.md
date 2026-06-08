---
name: guild-scope
description: >
  Classify the work into init, feature, or plan scope. Use to choose which
  `.guild/` artifacts are appropriate and how deep the planning should go.
license: CC-BY-4.0
---

# guild-scope

Choose the lightest artifact set that still fits the work.

## Scope → artifact mapping

| scope | primary path | fallback path |
|-------|--------------|---------------|
| Init | `.guild/context/project.md`, `.guild/context/roadmap.md` | `.specs/project/*` |
| Feature | `.guild/plans/<slug>/` | `.specs/features/<feature>/*` |
| Quick task | `.guild/plans/<slug>/tasks.md` | `.specs/quick/<nnn-slug>/*` |
| Handoff | `.guild/context/handoff.md`, `.guild/context/state.md` | `.specs/project/HANDOFF.md` |

## Slug naming

Use lowercase, hyphenated slugs for plan directories:
- Good: `auth-redesign`, `api-v2-migration`
- Bad: `Auth Redesign`, `API v2`

## Guidance

- Do not create historical migration work as part of scope selection
- Defer detailed planning until scope is confirmed
- Point all new artifacts at `.guild/plans/<slug>/` — never `.specs/`
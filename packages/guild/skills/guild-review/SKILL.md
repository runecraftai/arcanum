---
name: guild-review
description: >
  Review completed Guild work for correctness, regressions, and missing coverage.
  Use after implementation or before shipping a feature.
license: CC-BY-4.0
---

# guild-review

Review for behavior, not style alone.

## Primary inputs

- `.guild/plans/<slug>/spec.md` — acceptance criteria
- `.guild/plans/<slug>/tasks.md` — completed tasks
- `.guild/plans/<slug>/notes.md` — implementation decisions

## Guidance

- Look for broken flows, missing tests, and unintended coupling
- Compare implementation against spec and task requirements
- Check against `.guild/knowledge/conventions.md` for standards
- Flag anything that weakens Guild identity or future maintainability

## Output

- Update `.guild/plans/<slug>/state.md` with review status
- Note findings in `.guild/plans/<slug>/notes.md` for handoff
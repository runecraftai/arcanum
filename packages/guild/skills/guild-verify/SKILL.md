---
name: guild-verify
description: >
  Prove a Guild change works by running checks and comparing results
  against `.guild/plans/<slug>/tasks.md` acceptance criteria.
license: CC-BY-4.0
---

# guild-verify

Verify the change against evidence, not intent.

## Primary inputs

- `.guild/plans/<slug>/tasks.md` — verification criteria per task
- `.guild/plans/<slug>/spec.md` — acceptance criteria

## Guidance

- Run the smallest useful test set first
- Check type errors, regressions, and acceptance criteria
- Record any environment-specific failures separately in `.guild/plans/<slug>/notes.md`

## Output

- Update `.guild/plans/<slug>/tasks.md` task status to done
- Update `.guild/plans/<slug>/state.md` with verification status
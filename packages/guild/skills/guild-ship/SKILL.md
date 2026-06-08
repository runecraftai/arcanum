---
name: guild-ship
description: >
  Prepare Guild work for release or publication once implementation and verification
  are complete.
license: CC-BY-4.0
---

# guild-ship

Ship only when the checks are green.

## Primary inputs

- `.guild/plans/<slug>/state.md` — verification status
- `.guild/plans/<slug>/tasks.md` — all tasks must be done
- `.guild/context/state.md` — project-level readiness

## Guidance

- Confirm verification evidence before release
- Prefer small, clear release notes
- Do not hide unfinished work behind a release

## Post-ship

- Update `.guild/plans/<slug>/state.md` to shipped
- Consider archiving to `.guild/archive/<slug>/` if plan is complete
- Update `.guild/context/state.md` with completion status
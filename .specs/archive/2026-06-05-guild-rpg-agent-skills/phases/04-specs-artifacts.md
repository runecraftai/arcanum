# Phase 4 Spec: `.specs/*` Artifact Guidance

## Objective

Change future artifact generation guidance from Guild/Weave-specific hidden directories to `.specs/*`, following scope-dependent behavior inspired by spec-driven.

## Requirements

- [ ] Project setup artifacts target `.specs/project/*`
- [ ] Quick work targets `.specs/quick/<nnn-slug>/*`
- [ ] Feature work targets `.specs/features/<feature>/*`
- [ ] Large/complex feature work can produce `spec.md`, `design.md`, and `tasks.md`
- [ ] Medium feature work may skip `design.md` and/or `tasks.md` when scope does not require them
- [ ] Handoff/session artifacts target `.specs/project/HANDOFF.md`, `.specs/project/STATE.md`, and `.specs/sessions/*`
- [ ] Existing `.specs`, `.guild`, or `.weave` artifacts are not automatically migrated

## Artifact Matrix

| Scope | Files |
| --- | --- |
| Init | `.specs/project/PROJECT.md`, `ROADMAP.md`, `STATE.md`, `HANDOFF.md` |
| Quick | `.specs/quick/<nnn-slug>/TASK.md`, optional `SUMMARY.md` |
| Medium feature | `.specs/features/<feature>/spec.md` |
| Large/Complex feature | `.specs/features/<feature>/spec.md`, `design.md`, `tasks.md` |
| Handoff | `.specs/project/HANDOFF.md`, `.specs/sessions/YYYY-MM-DD-<slug>.md` |

## Verification

- [ ] Prompts no longer instruct creation of `.weave/plans/*`
- [ ] Tests assert `.specs/*` output guidance
- [ ] No migration code is added

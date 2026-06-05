---
name: guild-scope
description: >
  Classify the work into init, quick task, feature, or session handoff scope.
  Use to choose which `.specs/*` artifacts are appropriate and how deep the
  planning should go.
license: CC-BY-4.0
---

# guild-scope

Choose the lightest artifact set that still fits the work.

- Init -> `.specs/project/*`
- Quick task -> `.specs/quick/<nnn-slug>/*`
- Feature -> `.specs/features/<feature>/*`
- Handoff -> `.specs/project/HANDOFF.md` and `.specs/sessions/*`
- Do not create historical migration work as part of scope selection.

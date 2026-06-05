# Phase 2 Spec: Mini-Skill Catalog

## Objective

Create the Guild-owned mini-skill catalog in `packages/guild/skills/` without modifying `packages/spells`.

## Requirements

- [ ] Create `guild-init`
- [ ] Create `guild-load`
- [ ] Create `guild-scope`
- [ ] Create `guild-spec`
- [ ] Create `guild-plan`
- [ ] Create `guild-execute`
- [ ] Create `guild-verify`
- [ ] Create `guild-review`
- [ ] Create `guild-security`
- [ ] Create `guild-research`
- [ ] Create `guild-handoff`
- [ ] Create `guild-ship`
- [ ] Create `guild-commit-learning`

## Skill Content Rules

- Each skill must have frontmatter with `name` and `description`.
- Each skill should be concise and role-focused.
- Each skill should avoid duplicating the full `spec-driven` skill.
- Each skill should reference `.specs/*` for future artifacts where relevant.

## `guild-init` Requirements

- [ ] Detect first-run/project setup use case
- [ ] Guide creation of `.specs/project/PROJECT.md`
- [ ] Guide creation of `.specs/project/ROADMAP.md`
- [ ] Guide creation/update of `.specs/project/STATE.md`
- [ ] Guide creation/update of `.specs/project/HANDOFF.md`
- [ ] Explicitly avoid historical artifact migration

## Verification

- [ ] All skills are discoverable by the builtin loader
- [ ] Frontmatter names match directory names
- [ ] No files under `packages/spells` are modified

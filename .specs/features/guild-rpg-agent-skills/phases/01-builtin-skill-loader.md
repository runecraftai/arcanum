# Phase 1 Spec: Builtin Skill Loader

## Objective

Teach `@runecraft/guild` to load package-local mini-skills from `packages/guild/skills/` as builtin skills.

## Requirements

- [ ] Load `packages/guild/skills/*/SKILL.md` as `scope: "builtin"`
- [ ] Keep OpenCode/API, user, project and configured skill directory loading intact
- [ ] Let external/project/user skills override builtin skills with the same name
- [ ] Apply `disabled_skills` to builtin skills
- [ ] Include `skills/` in package publication

## Out of Scope

- Creating skill content beyond minimal fixtures
- Changing `packages/spells`
- Changing agent prompts

## Affected Areas

- `packages/guild/src/features/skill-loader/loader.ts`
- `packages/guild/src/features/skill-loader/loader.test.ts`
- `packages/guild/package.json`

## Verification

- [ ] Unit test: builtin skills are returned when directory exists
- [ ] Unit test: external skill wins on name conflict
- [ ] Unit test: disabled builtin skill is filtered out
- [ ] Package manifest includes `skills/`

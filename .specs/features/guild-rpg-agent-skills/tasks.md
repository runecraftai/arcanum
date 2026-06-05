# Tasks: guild-rpg-agent-skills

**Spec**: `.specs/features/guild-rpg-agent-skills/spec.md`
**Design**: `.specs/features/guild-rpg-agent-skills/design.md`
**Status**: Draft

---

## Execution Plan

```text
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
```

Phase specs live in `.specs/features/guild-rpg-agent-skills/phases/`.

---

## Phase 1: Builtin Skill Loader

### T01: Add package-local builtin skill discovery

**What**: Extend the skill loader to scan `packages/guild/skills/` as builtin skills.
**Where**: `packages/guild/src/features/skill-loader/loader.ts`
**Depends on**: None
**Requirement**: GUILD-RPG-01

**Done when**:

- [ ] Loader scans package-local `skills/` with `scope: "builtin"`
- [ ] Missing builtin skill directory is tolerated
- [ ] Existing OpenCode/user/project/custom discovery still works

### T02: Preserve skill precedence and disabled filtering

**What**: Merge builtin skills after external sources and ensure `disabled_skills` applies to all sources.
**Where**: `packages/guild/src/features/skill-loader/loader.ts`, `packages/guild/src/features/skill-loader/loader.test.ts`
**Depends on**: T01
**Requirement**: GUILD-RPG-02

**Done when**:

- [ ] Project/user/custom/API skill with same name wins over builtin
- [ ] Unique builtin skills are included in result
- [ ] Disabled builtin skills are filtered out

### T03: Include builtin skills in package publication

**What**: Update package metadata so `skills/` ships with `@runecraft/guild`.
**Where**: `packages/guild/package.json`
**Depends on**: T01
**Requirement**: GUILD-RPG-01

**Done when**:

- [ ] `files` includes `skills/`
- [ ] Build output expectations remain valid

---

## Phase 2: Mini-Skill Catalog

### T04: Create `packages/guild/skills/` catalog

**What**: Add all approved `guild-*` skill directories with valid `SKILL.md` frontmatter.
**Where**: `packages/guild/skills/`
**Depends on**: T01
**Requirement**: GUILD-RPG-03, GUILD-RPG-04

**Done when**:

- [ ] All approved `guild-*` skills exist
- [ ] Each skill has `name` and `description` frontmatter
- [ ] Skill content is concise and role-specific

### T05: Write `guild-init` setup behavior

**What**: Define first-run setup guidance for `.specs/project/*`.
**Where**: `packages/guild/skills/guild-init/SKILL.md`
**Depends on**: T04
**Requirement**: GUILD-RPG-04

**Done when**:

- [ ] Skill explains when to initialize project state
- [ ] Skill lists `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `HANDOFF.md`
- [ ] Skill explicitly avoids migrating existing artifacts

### T06: Validate catalog discovery

**What**: Add or update tests ensuring all builtin skills load.
**Where**: `packages/guild/src/features/skill-loader/loader.test.ts`
**Depends on**: T04
**Requirement**: GUILD-RPG-03

**Done when**:

- [ ] Test confirms `guild-init` and representative `guild-*` skills are discoverable
- [ ] Test confirms frontmatter parsing extracts names correctly

---

## Phase 3: RPG Agent Roster and Skill Binding

### T07: Update display names to RPG roster

**What**: Change builtin display names to the approved class names.
**Where**: `packages/guild/src/shared/agent-display-names.ts`, tests
**Depends on**: T04
**Requirement**: GUILD-RPG-05

**Done when**:

- [ ] `loom` displays as `Bard (Guildmaster)`
- [ ] `tapestry` displays as `Fighter (Execution Lead)`
- [ ] Remaining agents match the approved roster
- [ ] Display-name reverse lookup tests pass

### T08: Bind role-specific skills to builtin agents

**What**: Attach approved `guild-*` skills to each builtin agent.
**Where**: `packages/guild/src/agents/*`, `packages/guild/src/agents/builtin-agents.ts`, tests
**Depends on**: T04, T07
**Requirement**: GUILD-RPG-06

**Done when**:

- [ ] Bard receives init/load/scope/spec/plan/handoff/ship skills
- [ ] Wizard receives load/scope/spec/plan skills
- [ ] Fighter receives load/execute/verify/handoff skills
- [ ] Reviewer/security/research agents receive their mapped skills
- [ ] Tests prove skill content is prepended/resolved for builtins

### T09: Rewrite agent prompt language for Guild classes

**What**: Update built-in prompts to describe class roles and Guild behavior.
**Where**: `packages/guild/src/agents/*/default.ts`, `packages/guild/src/agents/*/prompt-composer.ts`
**Depends on**: T07, T08
**Requirement**: GUILD-RPG-05, GUILD-RPG-06

**Done when**:

- [ ] Prompts refer to Guild identity
- [ ] Prompts use class names where user-facing
- [ ] Runtime config keys remain stable for task routing

---

## Phase 4: `.specs/*` Artifact Guidance

### T10: Update planning artifact paths to `.specs/*`

**What**: Replace future artifact instructions from `.guild`/`.weave` paths to `.specs/*` paths by scope.
**Where**: agent prompts, workflow prompts, tests
**Depends on**: T09
**Requirement**: GUILD-RPG-07, GUILD-RPG-08

**Done when**:

- [ ] Project init guidance targets `.specs/project/*`
- [ ] Quick task guidance targets `.specs/quick/<nnn-slug>/*`
- [ ] Feature guidance targets `.specs/features/<feature>/*`
- [ ] Handoff/session guidance targets `.specs/project/*` and `.specs/sessions/*`

### T11: Update workflow plan discovery if needed

**What**: Align any runtime plan discovery/execution assumptions with the new `.specs/*` future artifact paths.
**Where**: `packages/guild/src/features/workflow/*`, storage constants, tests
**Depends on**: T10
**Requirement**: GUILD-RPG-07

**Done when**:

- [ ] Runtime can find the plan/task artifact it expects after prompt changes
- [ ] Tests use `.specs/*` for new generated artifacts
- [ ] No historical migration behavior is added

### T12: Explicitly prevent migration behavior

**What**: Ensure docs/prompts/tests clarify that existing artifacts are not migrated automatically.
**Where**: prompts, README, tests where applicable
**Depends on**: T10
**Requirement**: GUILD-RPG-08

**Done when**:

- [ ] No code attempts to move `.guild`/`.weave` files into `.specs`
- [ ] Docs state the behavior applies to future artifacts only

---

## Phase 5: Complete Weave -> Guild Rebrand

### T13: Rename internal Guild types and utilities

**What**: Rename remaining Weave-branded internal types/functions where safe.
**Where**: `packages/guild/src/config/schema.ts`, `create-managers.ts`, `create-tools.ts`, `shared/version.ts`, imports/tests
**Depends on**: T12
**Requirement**: GUILD-RPG-09

**Done when**:

- [ ] Public/internal type names use `Guild*`
- [ ] Version utility uses `getGuildVersion` or equivalent
- [ ] Typecheck passes after import updates

### T14: Sweep logs, docs, schemas, comments and tests

**What**: Remove Weave branding from source text, docs, tests and generated schema surfaces.
**Where**: `packages/guild/**/*`
**Depends on**: T13
**Requirement**: GUILD-RPG-09

**Done when**:

- [ ] README and comments say Guild
- [ ] Logs and schema metadata say Guild
- [ ] Tests are updated to new names and paths

### T15: Review technical exceptions

**What**: Identify any remaining `weave` identifiers and document whether they are intentional.
**Where**: source search results, `.specs/project/STATE.md` if decisions are long-lived
**Depends on**: T14
**Requirement**: GUILD-RPG-09

**Done when**:

- [ ] Residual search is reviewed
- [ ] Any exception is justified with risk/reason
- [ ] No accidental Weave branding remains

---

## Phase 6: Verification and Closure

### T16: Run package verification

**What**: Run relevant tests and type checks for `packages/guild`.
**Where**: `packages/guild`
**Depends on**: T15
**Requirement**: GUILD-RPG-10

**Done when**:

- [ ] `bun test` result is recorded
- [ ] `bun run typecheck` result is recorded
- [ ] Known env-only failures, if any, are separated from regressions

### T17: Run residual searches

**What**: Search for old artifact paths and branding.
**Where**: repo root and `packages/guild`
**Depends on**: T15
**Requirement**: GUILD-RPG-10

**Done when**:

- [ ] Search for `Weave|weave|.weave` is reviewed
- [ ] Search for `.guild/plans` or obsolete generation paths is reviewed
- [ ] Exceptions are documented

### T18: Update project state

**What**: Record completion notes, decisions and residual concerns.
**Where**: `.specs/project/STATE.md`
**Depends on**: T16, T17
**Requirement**: GUILD-RPG-10

**Done when**:

- [ ] STATE.md records final status
- [ ] Any follow-up is explicit
- [ ] Feature can be archived later if desired

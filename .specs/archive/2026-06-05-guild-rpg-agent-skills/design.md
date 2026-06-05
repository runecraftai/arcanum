# Design: guild-rpg-agent-skills

## Overview

This feature changes `@runecraft/guild` from a Weave-branded orchestration plugin into a Guild-branded RPG agent system with package-local mini-skills. The design keeps the existing runtime shape where possible, but changes the identity, builtin skill source, agent prompt composition, and future artifact paths.

The implementation is intentionally phased:

1. Builtin skill loading
2. Mini-skill catalog creation
3. Agent roster and skill binding
4. `.specs/*` artifact guidance
5. Complete Weave -> Guild rebrand
6. Verification and documentation

## Current State

- `packages/guild` already supports skills discovered from OpenCode, user/project skill dirs, and configured `skill_directories`.
- `SkillScope` already includes `builtin`, but no package-local builtin skill scan is implemented.
- Builtin agents can receive `skills` through config overrides and prompt composition infrastructure.
- Prompts and tests still contain Weave language and `.weave` references.
- `.specs/` already exists at the repo root and is the desired artifact target for future generated planning output.

## Target State

- `packages/guild/skills/` is a package-local builtin skill catalog.
- The skill loader merges builtin skills with API/filesystem skills while preserving local override behavior.
- Builtin agents have RPG display names and role-specific `guild-*` skills.
- Agent prompts use Guild language and emit future planning/setup artifacts under `.specs/*`.
- `packages/spells` remains unchanged.

## Design Decisions

### D1. Builtin skills live at `packages/guild/skills/`

**Decision**: Store mini-skills outside `src/` in `packages/guild/skills/`.

**Why**:

- Mirrors `packages/spells/skills/` layout.
- Keeps authoring content separate from runtime TypeScript.
- Makes npm packaging explicit through `package.json#files`.

### D2. Use `guild-*` names for all builtin mini-skills

**Decision**: Prefix all new builtin skills with `guild-`.

**Why**:

- Avoids common-name collisions like `plan`, `review`, or `execute`.
- Keeps user/project overrides possible without accidental ambiguity.
- Makes catalog ownership obvious in prompts and diagnostics.

### D3. Project/user/custom skills override builtin by name

**Decision**: Builtin skills are the fallback source. Skills discovered from OpenCode/project/user/custom dirs keep precedence when names collide.

**Why**:

- Preserves user customizability.
- Keeps existing API-first behavior compatible.
- Builtin skills are defaults, not hard locks.

### D4. No changes to `packages/spells`

**Decision**: Treat `spec-driven` as conceptual reference only. Do not edit or split it in `packages/spells`.

**Why**:

- User explicitly scoped mini-skills to `guild`.
- Avoids changing public skill package behavior.
- Allows Guild-specific language and agent roles.

### D5. Future artifacts use `.specs/*`, no migration

**Decision**: Update prompts and generation guidance to `.specs/*`, but do not migrate historical files.

**Why**:

- Aligns with existing spec-driven convention.
- Avoids destructive or noisy history rewrites.
- Keeps this feature focused on future behavior.

### D6. Complete branding rename, with explicit technical exceptions only

**Decision**: Rename Weave to Guild across source, prompts, docs, exported type names, logs, and tests, except where a technical identifier cannot safely change in this feature.

**Why**:

- User requested complete branding change.
- Prior STATE deferred internal renames; this feature intentionally closes that gap.
- Any retained identifier must be justified and tracked.

## Builtin Skill Loading Design

Add a package-local scan step to the skill loader:

```text
apiSkills + filesystemSkills + builtinSkills -> merged result
```

Precedence target:

```text
api/project/custom/user skills > builtin skills
```

Implementation shape:

- Add a helper that resolves `packages/guild/skills/` from the package runtime location.
- Reuse `scanDirectory({ directory, scope: "builtin" })`.
- Merge builtin skills after external sources so existing names win.
- Include builtin skills in `availableSkills` for prompt/delegation display.

## Mini-Skill Catalog Design

Each mini-skill should be small and role-focused:

| Skill | Purpose |
| --- | --- |
| `guild-init` | first-run project setup and `.specs/project/*` scaffold guidance |
| `guild-load` | context loading, state/handoff awareness, budget discipline |
| `guild-scope` | scope classification and artifact-depth selection |
| `guild-spec` | requirements/spec generation |
| `guild-plan` | design/task breakdown and dependency planning |
| `guild-execute` | task execution discipline |
| `guild-verify` | tests, acceptance evidence, prove-it loop |
| `guild-review` | quality review gate |
| `guild-security` | security review gate |
| `guild-research` | internal/external research routing guidance |
| `guild-handoff` | pause/resume/session notes |
| `guild-ship` | release/shipping guidance |
| `guild-commit-learning` | commit pattern learning and commit narrative guidance |

## Artifact Routing Design

`guild-scope` owns the decision of which `.specs/*` artifacts are appropriate:

| Scope | Target |
| --- | --- |
| Project init | `.specs/project/PROJECT.md`, `ROADMAP.md`, `STATE.md`, `HANDOFF.md` |
| Quick task | `.specs/quick/<nnn-slug>/TASK.md`, optional `SUMMARY.md` |
| Medium feature | `.specs/features/<feature>/spec.md`; inline design/tasks if simple |
| Large/Complex feature | `.specs/features/<feature>/spec.md`, `design.md`, `tasks.md` |
| Session handoff | `.specs/project/HANDOFF.md`, `.specs/sessions/YYYY-MM-DD-<slug>.md` |

No automatic migration is part of this design.

## Agent Prompt Design

Prompt language should treat class names as display identity, while preserving config keys for runtime routing.

Examples:

- Bard coordinates intent and decides whether Wizard planning is needed.
- Wizard writes specs/design/tasks only, not source code.
- Fighter executes existing plans and does not re-plan mid-execution.
- Rogue scouts the local codebase.
- Warlock consults external references.
- Cleric performs quality review.
- Paladin performs security review.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Runtime cannot reliably locate package-local skills after build | Builtin skills not loaded in published package | Add tests and include `skills/` in `package.json#files` |
| Prompt inflation from too many skills | Higher token usage and worse behavior | Keep mini-skills concise; only bind relevant skills per agent |
| Complete Weave rename breaks internal references | Build/test failures | Rename in phases, run typecheck and targeted tests after each sweep |
| `.specs/*` guidance conflicts with existing workflow engine assumptions | Plans not discovered/executed | Update constants/prompts/tests together and avoid historical migration |
| `call_weave_agent` rename is unsafe | Tool routing breakage | Treat as explicit technical exception unless verified separately |

## Verification Strategy

- Unit tests for builtin skill loading and merge precedence.
- Snapshot/assertion tests for display names and prompt composition.
- Workflow tests for `.specs/*` artifact guidance.
- Source search for residual `Weave|weave|.weave`.
- `bun test` and `bun run typecheck` in `packages/guild`.

## Exit Criteria

The design is ready for implementation when phase specs and task breakdown cover all requirements and no open product decisions remain.

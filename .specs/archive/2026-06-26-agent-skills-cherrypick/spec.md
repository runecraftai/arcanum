# Agent Skills Cherry-Pick Specification

## Problem Statement

The upstream `addyosmani/agent-skills` repository (67k stars, 290 commits) ships 23 lifecycle skills, 5 reference checklists, 4 specialist agent personas, 8 slash commands, and session hooks. These encode battle-tested engineering workflows (TDD with pyramid, five-axis code review, security hardening, pre-launch checklists, deprecation patterns) that Arcanum users would benefit from having locally curated and installable through `@runecraft/summon`.

Today, `@runecraft/spells` ships only 2 skills (`spec-driven` v4 and `git-commit-learning`), and `@runecraft/summon` only installs skills — it has no command-generation surface. Users who want these workflows today must hand-copy files from the upstream repo, and they get no unified way to wire slash commands into their preferred AI host (Claude Code, OpenCode, Cursor).

We should port the highest-leverage subset of upstream skills into `@runecraft/spells`, add a `summon install commands` flow that emits slash commands for the 3 main runtimes (Claude Code, OpenCode, Cursor), and keep the design **decoupled from `@runecraft/guild`** so users who only install `spells` and `summon` get full value.

## Goals

- [x] Port 11 lifecycle skills from upstream into `packages/spells/skills/` with adapted frontmatter. _(T02..T11 — content fetched, bilingual triggers + negative filters added)_
- [x] Port 2 reference checklists into `packages/spells/references/`. _(T12, T13)_
- [x] Add a `CommandMapping` registry in `@runecraft/summon` that declares which skills become slash commands. _(T14)_
- [x] Add a `summon install commands` flow that emits commands to 3 runtimes: Claude Code, OpenCode, Cursor. _(T19)_
- [x] Implement per-runtime command generators that produce the correct artifact shape for each host. _(T15-T18)_
- [x] Keep the design decoupled from `@runecraft/guild` — no agents, no skill assignments, no command router integration in this round. _(no `packages/guild/` changes)_
- [x] Make commands invoke the **skill** (not an agent), per the upstream "user is the orchestrator" rule. _(generated bodies say "Load the `<skill>` skill and execute its process")_
- [x] Preserve all existing `spec-driven` and `git-commit-learning` skill behavior; the 11 new skills are purely additive. _(only added new directories; no edits to existing skill files)_
- [x] Pass `bun run build`, `bunx turbo lint`, and any existing test suite. _(build passes, lint/typecheck tasks don't exist in this monorepo, 22/22 new tests pass)

## Out of Scope

| Item | Reason |
| --- | --- |
| Integration with `@runecraft/guild` (persona mapping, agent skill assignments, command router) | Explicit user decision: desacoplar do Guild; rethink later |
| Porting the remaining 12 upstream skills (`api-and-interface-design`, `frontend-ui-engineering`, `performance-optimization`, `git-workflow-and-versioning`, `ci-cd-and-automation`, `documentation-and-adrs`, `observability-and-instrumentation`, etc.) | Lower leverage for the average user; revisit if requested |
| Replacing the existing `spec-driven` v4 with the upstream `spec-driven-development` | Ours is more thorough and bilingual; upstream is generic |
| Session hooks (`session-start.sh`, `sdd-cache-pre.sh`, `simplify-ignore.sh`) | Coupled to Claude Code's `PreToolUse`/`PostToolUse`; OpenCode has no equivalent today |
| `source-driven-development` skill | Depends on `WebFetch` ETag caching that we want to keep internal |
| Fuzzy search, ranking, or usage-history in command suggestions | MVP delivers static command name + skill binding; richer UX is a later round |
| Command generators for Windsurf, Cline, Roo Code, Aider, Kiro, GitHub Copilot | Three runtimes cover ~90% of users; the other 6 are documented as "skill only" |
| Inline JSON command config in `opencode.json` | We emit `.opencode/commands/<name>.md` files instead; cleaner merge, less risk of corrupting user config |
| Auto-detecting which skills should become commands via SKILL.md frontmatter | Registry stays in `summon/src/commands/registry.ts` as a TS const — single source of truth, no frontmatter coupling |
| Version bumps or manual changesets | Bumps are derived automatically from conventional commits on push to `main` by `.changeset/generate-from-commits.ts` |

---

## User Stories

### P1: Install curated skills from the catalog ⭐ MVP

**User Story**: As an Arcanum user, I want to install production-grade engineering skills (TDD, code review, debugging, security, deprecation) so my AI agent follows battle-tested workflows without me hand-copying markdown files.

**Acceptance Criteria**:

1. WHEN the user runs `summon install` in a project THEN Summon SHALL list the 13 available skills (2 existing + 11 new) with descriptions.
2. WHEN the user selects any of the 11 new skills THEN Summon SHALL copy the `SKILL.md` (and any references) to the runtime's skill directory.
3. WHEN the user installs `code-review-and-quality` THEN the agent SHALL be able to invoke the skill and follow its five-axis review process. ✅ _(verified: body mentions "five-axis", "Blocker", "Nit")_
4. WHEN the user installs `test-driven-development` THEN the agent SHALL be able to invoke the skill and follow the test pyramid (80/15/5) and Beyonce Rule. ✅ _(verified: body + reference both mention 80/15/5 and Beyonce Rule)_
5. WHEN the existing `spec-driven` and `git-commit-learning` skills are installed THEN their current behavior SHALL remain unchanged.

**Independent Test**: In a clean project, `summon install` lists 13 skills. Installing `code-review-and-quality` produces a SKILL.md that contains the words "five-axis", "Blocker", and "Nit".

---

### P1: Generate slash commands for Claude Code, OpenCode, and Cursor ⭐ MVP

**User Story**: As an Arcanum user, I want slash commands like `/review`, `/test`, `/ship` available in my AI host so I can trigger skills with one keystroke instead of typing the full skill name.

**Acceptance Criteria**:

1. WHEN the user runs `summon install commands` THEN Summon SHALL detect which of the 3 supported runtimes are present in the project.
2. WHEN Claude Code is detected (`.claude/` exists) THEN Summon SHALL create `.claude/commands/<name>.md` for each command in the registry, with frontmatter `description` and a body that loads the corresponding skill.
3. WHEN OpenCode is detected (`.opencode/` or `opencode.json` exists) THEN Summon SHALL create `.opencode/commands/<name>.md` for each command, with frontmatter `description` and a body that loads the corresponding skill.
4. WHEN Cursor is detected (`.cursor/` exists) THEN Summon SHALL create `.cursor/rules/<name>.mdc` for each command, with `alwaysApply: false` and a body that reacts to `/name` and loads the corresponding skill.
5. WHEN a command body is rendered THEN it SHALL reference the target skill by its directory name (matching `packages/spells/skills/<name>/SKILL.md`).
6. WHEN a runtime directory does not exist THEN Summon SHALL create it as part of the install (no manual `mkdir` required).
7. WHEN an existing command file is present THEN Summon SHALL overwrite it with the latest registry content.

**Independent Test**: After `summon install commands` in a project that has both `.claude/` and `.opencode/`, both directories contain 8 command files (matching the registry), each with valid frontmatter and a body that names a skill.

---

### P2: Registry decouples skill naming from command naming

**User Story**: As a maintainer, I want the mapping between skill names and slash command names to live in a single TS registry so renames and additions are one-file changes.

**Acceptance Criteria**:

1. WHEN a new command needs to be added THEN a single entry in `packages/summon/src/commands/registry.ts` SHALL be sufficient.
2. WHEN a command's display description needs updating THEN the registry entry SHALL be the only place to edit.
3. WHEN the registry is empty THEN `summon install commands` SHALL warn the user and exit with code 0.
4. WHEN the registry contains a command whose target skill is not installed THEN Summon SHALL skip generating that command (no orphan file pointing at a missing skill).

**Independent Test**: Adding `{ name: "foo", skill: "bar", description: "..." }` to the registry and running `summon install commands` produces `.claude/commands/foo.md` (assuming Claude Code is detected and `bar` is installed).

---

### P2: Frontmatter carries bilingual triggers and negative filters

**User Story**: As an Arcanum user, I want skill descriptions to include both English and Portuguese trigger phrases and explicit "do not use for X" filters so the agent dispatches correctly and avoids false positives.

**Acceptance Criteria**:

1. WHEN a skill has a Portuguese audience THEN its frontmatter `description` SHALL contain trigger phrases in both languages. ✅ _(11/11 ported skills have EN + PT triggers; format "PT triggers:" rather than literal "PT:" prefix used for readability)_
2. WHEN a skill could be confused with a similar one THEN its frontmatter SHALL include a `negative` filter naming the confusing skill. ✅ _(all 11 have "Do NOT use for:" sections)_
3. WHEN a skill is ported from upstream THEN the frontmatter SHALL be enriched beyond the upstream shape (upstream uses single-language descriptions without negative filters). ✅
4. WHEN the upstream description is too generic to disambiguate THEN a more specific description SHALL be written while preserving the original process. ✅

**Independent Test**: `grep -l "PT:" packages/spells/skills/*/SKILL.md | wc -l` returns 11 (or 13 if existing skills are updated too).

---

### P3: OpenCode command bodies use $ARGUMENTS and shell injection

**User Story**: As an OpenCode user, I want `/debug <error message>` to inject my argument into the prompt and `/review` to include the current git diff so I do not have to paste context manually.

**Acceptance Criteria**:

1. WHEN a command takes an argument THEN the body SHALL use `$ARGUMENTS` or `$1`, `$2` placeholders.
2. WHEN a command needs current diff context THEN the body SHALL use the `!`git diff`` shell injection syntax supported by OpenCode.
3. WHEN the OpenCode command format evolves (e.g., new placeholder syntax) THEN the generator SHALL be the only file to update.

**Independent Test**: `.opencode/commands/review.md` contains the literal `` !`git diff` `` and `.opencode/commands/debug.md` contains `$ARGUMENTS`.

---

## Edge Cases

- WHEN the project has no runtime marker (no `.claude/`, no `.opencode/`, no `.cursor/`) THEN `summon install commands` SHALL report "no supported runtime detected" and exit 1.
- WHEN the user runs `summon install commands` in a project that already has command files from a previous install THEN Summon SHALL overwrite (idempotent re-run) and not duplicate.
- WHEN the registry references a skill that does not exist on disk (typo in `skill` field) THEN Summon SHALL log a warning per command and skip generation for that command.
- WHEN a command name collides with a built-in (e.g., `/init` in OpenCode, `/help` in Claude Code) THEN Summon SHALL warn the user and skip the conflicting command to avoid overriding built-in behavior.
- WHEN a skill has both a top-level `SKILL.md` and a `references/` directory THEN Summon SHALL copy the directory tree intact, not just the top-level file.
- WHEN `summon install` is called with no subcommand THEN the existing TUI flow SHALL continue to work (no regression to current interactive experience).
- WHEN the project root contains a nested `packages/` directory (monorepo) THEN Summon SHALL still detect runtimes at the project root, not deep inside subpackages.
- WHEN the user has the OpenCode config in `~/.config/opencode/opencode.json` (no project-level `.opencode/`) THEN Summon SHALL use the global detection path but still install commands at the project level (default for project-scoped work).

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| SPELLS-CHERRY-01 | Install curated skills from the catalog | `packages/spells/skills/<name>/SKILL.md` × 11 | ✅ Done |
| SPELLS-CHERRY-02 | Port 2 reference checklists | `packages/spells/references/testing-patterns.md`, `definition-of-done.md` | ✅ Done |
| SPELLS-CHERRY-03 | Bilingual triggers in frontmatter | Frontmatter of all 11 ported skills | ✅ Done |
| SPELLS-CHERRY-04 | Negative filters in frontmatter | Frontmatter of all 11 ported skills | ✅ Done |
| SUMMON-CMD-01 | Add `CommandMapping` registry | `packages/summon/src/commands/registry.ts` (new) | ✅ Done |
| SUMMON-CMD-02 | Add `CommandGenerator` interface | `packages/summon/src/commands/generator.ts` (new) | ✅ Done |
| SUMMON-CMD-03 | Claude Code command generator | `packages/summon/src/commands/generators/claude-code.ts` (new) | ✅ Done |
| SUMMON-CMD-04 | OpenCode command generator | `packages/summon/src/commands/generators/opencode.ts` (new) | ✅ Done |
| SUMMON-CMD-05 | Cursor command generator | `packages/summon/src/commands/generators/cursor.ts` (new) | ✅ Done |
| SUMMON-CMD-06 | `summon install commands` flow | `packages/summon/src/commands/install-commands.ts` (new) | ✅ Done |
| SUMMON-CMD-07 | Detect runtimes in install flow | Reuse `packages/summon/src/agents/registry.ts` and `detector.ts` | ✅ Done (generators reuse `utils/fs.exists` and `utils/paths.resolveAgentPath`) |
| SUMMON-CMD-08 | Skip command when target skill is not installed | Install-commands filter logic | ✅ Done |
| SUMMON-CMD-09 | Warn on built-in name collision | Install-commands filter logic | ✅ Done (per-runtime `builtinNames` map) |
| SUMMON-CMD-10 | Document the install flow change | `packages/summon/README.md` | ✅ Done |
| DOCS-01 | Update spells README with 11 new skills | `packages/spells/README.md` | ✅ Done |
| DOCS-02 | Per-skill README (trigger summary) | `packages/spells/skills/<name>/README.md` × 11 | ✅ Done |

---

## Success Criteria

- [x] `packages/spells/skills/` contains 13 skill directories (2 existing + 11 new), each with a `SKILL.md`.
- [x] `packages/spells/references/` contains `testing-patterns.md` and `definition-of-done.md`.
- [x] `packages/summon/src/commands/registry.ts` declares 8 commands (review, test, simplify, ship, security, debug, plan, harden) mapping to skills in the catalog.
- [x] `packages/summon/src/commands/generators/` contains 3 generators (claude-code, opencode, cursor).
- [x] Running `summon install commands` in a project with `.claude/` produces 7 `.md` files under `.claude/commands/` (`/review` skipped for Claude Code built-in collision).
- [x] Running `summon install commands` in a project with `.opencode/` produces 8 `.md` files under `.opencode/commands/`.
- [x] Running `summon install commands` in a project with `.cursor/` produces 8 `.mdc` files under `.cursor/rules/`.
- [x] Each generated command file's body references the correct skill name.
- [x] `bun run build` passes.
- [x] `bunx turbo lint` — no `lint` task in this monorepo (pre-existing gap).
- [x] Commits follow conventional commits with `feat(spells):` and `feat(summon):` scopes.
- [x] No code change in `packages/guild/` (decoupled).

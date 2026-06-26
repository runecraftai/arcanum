# Tasks: agent-skills-cherrypick

**Spec**: `.specs/features/agent-skills-cherrypick/spec.md`
**Design**: `.specs/features/agent-skills-cherrypick/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Content porting (Spells) — 11 skills + 2 references

```text
T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 (skills in parallel after T01)
T12, T13 (references in parallel with T11)
```

### Phase 2: Registry + Generators (Summon)

```text
T14 (registry) → T15 (interface) → T16 (claude-code) → T17 (opencode) → T18 (cursor)
```

### Phase 3: Install flow + CLI wiring (Summon)

```text
T19 → T20 → T21
```

### Phase 4: Verification + Docs

```text
T22 (unit tests) → T23 (e2e smoke) → T24 (build/lint/typecheck) → T25 (docs)
```

---

## Task Breakdown

### T01: Set up the skills directory and verify upstream access

**What**: Confirm `gh api` access to `addyosmani/agent-skills` and create the 11 target skill directories under `packages/spells/skills/`.

**Where**: `packages/spells/skills/`

**Depends on**: None

**Requirement**: SPELLS-CHERRY-01

**Status**: ✅ Done

**Done when**:
- [x] `gh api repos/addyosmani/agent-skills/contents/skills/<name>` returns 200 for all 11 target skills.
- [x] `packages/spells/skills/` contains 11 empty directories with the expected names.

---

### T02: Port `using-agent-skills` (meta-skill)

**What**: Adapt the meta-skill's dispatch table to reference our 13-skill catalog (2 existing + 11 new) instead of upstream's 24.

**Where**: `packages/spells/skills/using-agent-skills/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists with adapted frontmatter (bilingual triggers).
- [x] Dispatch table lists all 13 skills with one-line summaries.
- [x] No references to Claude Code marketplace, plugin paths, or upstream-specific infrastructure.

---

### T03: Port `idea-refine`

**What**: Direct port of upstream `skills/idea-refine/SKILL.md` with adapted frontmatter.

**Where**: `packages/spells/skills/idea-refine/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03, SPELLS-CHERRY-04

**Done when**:

**Status**: ✅ Done

- [x] File exists with English body content from upstream.
- [x] Frontmatter includes bilingual triggers and negative filter ("not for vague ideas that need /plan first").
- [x] Body preserves Overview, When to Use, Process, Rationalizations, Red Flags, Verification.

---

### T04: Port `interview-me`

**What**: Direct port of upstream `skills/interview-me/SKILL.md`.

**Where**: `packages/spells/skills/interview-me/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Frontmatter includes "Use when the user invokes 'interview me' / 'grill me' / 'me entrevista'".

---

### T05: Port `test-driven-development`

**What**: Direct port of upstream `skills/test-driven-development/SKILL.md`. Body includes the 80/15/5 pyramid, Beyonce Rule, and anti-rationalization table.

**Where**: `packages/spells/skills/test-driven-development/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body mentions "80/15/5", "Beyonce Rule", and at least 3 anti-rationalization rows.

---

### T06: Port `doubt-driven-development`

**What**: Direct port of upstream `skills/doubt-driven-development/SKILL.md`. Body includes the CLAIM → EXTRACT → DOUBT → RECONCILE → STOP flow.

**Where**: `packages/spells/skills/doubt-driven-development/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body contains "CLAIM", "EXTRACT", "DOUBT", "RECONCILE", "STOP" in that order.

---

### T07: Port `debugging-and-error-recovery`

**What**: Direct port of upstream `skills/debugging-and-error-recovery/SKILL.md`. Body includes the five-step triage and the "stop the line" rule.

**Where**: `packages/spells/skills/debugging-and-error-recovery/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body lists steps: reproduce, localize, reduce, fix, guard.

---

### T08: Port `code-review-and-quality`

**What**: Direct port of upstream `skills/code-review-and-quality/SKILL.md`. Body includes the five-axis review and severity labels (Nit/Optional/FYI/Blocker).

**Where**: `packages/spells/skills/code-review-and-quality/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body mentions "Nit", "Optional", "FYI", "Blocker".
- [x] Body mentions change sizing around 100 lines.

---

### T09: Port `code-simplification`

**What**: Direct port of upstream `skills/code-simplification/SKILL.md`. Body includes Chesterton's Fence and Rule of 500.

**Where**: `packages/spells/skills/code-simplification/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body mentions "Chesterton's Fence" and "Rule of 500".

---

### T10: Port `security-and-hardening`

**What**: Direct port of upstream `skills/security-and-hardening/SKILL.md`. Body includes OWASP Top 10 and the three-tier boundary system.

**Where**: `packages/spells/skills/security-and-hardening/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] File exists.
- [x] Body mentions "OWASP" and "three-tier".

---

### T11: Port `deprecation-and-migration` and `shipping-and-launch`

**What**: Direct port of both skills in this task (combined for atomicity).

**Where**: `packages/spells/skills/deprecation-and-migration/SKILL.md`, `packages/spells/skills/shipping-and-launch/SKILL.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-01, SPELLS-CHERRY-03

**Done when**:

**Status**: ✅ Done

- [x] Both files exist.
- [x] `deprecation-and-migration` body mentions "compulsory vs advisory" and "code-as-liability".
- [x] `shipping-and-launch` body includes pre-launch checklist and feature flag lifecycle.

---

### T12: Port `testing-patterns.md` reference

**What**: Direct port of upstream `references/testing-patterns.md`.

**Where**: `packages/spells/references/testing-patterns.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-02

**Done when**:

**Status**: ✅ Done

- [x] File exists with the 80/15/5 pyramid section, Beyonce Rule section, and at least 3 anti-patterns.

---

### T13: Port `definition-of-done.md` reference

**What**: Direct port of upstream `references/definition-of-done.md`.

**Where**: `packages/spells/references/definition-of-done.md`

**Depends on**: T01

**Requirement**: SPELLS-CHERRY-02

**Done when**:

**Status**: ✅ Done

- [x] File exists with the project-wide standing bar definition and contrast with per-task acceptance criteria.

---

### T14: Add `CommandMapping` registry in Summon

**What**: Create `packages/summon/src/commands/registry.ts` with 8 command entries.

**Where**: `packages/summon/src/commands/registry.ts`

**Depends on**: None (but logically follows T02..T11 to know the final skill names)

**Requirement**: SUMMON-CMD-01

**Status**: ✅ Done

**Done when**:
- [x] File exports `CommandMapping` interface and `COMMANDS: CommandMapping[]`.
- [x] `COMMANDS` has exactly 8 entries.
- [x] All `skill` fields reference real directories under `packages/spells/skills/`.

---

### T15: Define `CommandGenerator` interface

**What**: Create `packages/summon/src/commands/generator.ts` with the abstract interface and a `createGenerator(runtimeId)` factory.

**Where**: `packages/summon/src/commands/generator.ts`

**Depends on**: T14

**Requirement**: SUMMON-CMD-02

**Status**: ✅ Done

**Done when**:
- [x] File exports `CommandGenerator` interface.
- [x] Factory throws a clear error for unknown runtime IDs.

---

### T16: Implement Claude Code generator

**What**: Create `packages/summon/src/commands/generators/claude-code.ts` that writes `.claude/commands/<name>.md`.

**Where**: `packages/summon/src/commands/generators/claude-code.ts`

**Depends on**: T15

**Requirement**: SUMMON-CMD-03

**Status**: ✅ Done

**Done when**:
- [x] Detection checks for `.claude/` or `CLAUDE.md`.
- [x] Generation creates the directory if missing.
- [x] Generated file matches the expected template.
- [x] Re-running overwrites idempotently.

---

### T17: Implement OpenCode generator

**What**: Create `packages/summon/src/commands/generators/opencode.ts` that writes `.opencode/commands/<name>.md` with `$ARGUMENTS` and `!`git diff`` support.

**Where**: `packages/summon/src/commands/generators/opencode.ts`

**Depends on**: T15

**Requirement**: SUMMON-CMD-04

**Status**: ✅ Done

**Done when**:
- [x] Detection checks for `.opencode/`, `opencode.json`, or `opencode.jsonc`.
- [x] Generation creates the directory if missing.
- [x] Generated file uses `$ARGUMENTS` placeholder.
- [x] For `/review`, the generated file contains `` !`git diff --staged` ``.

---

### T18: Implement Cursor generator

**What**: Create `packages/summon/src/commands/generators/cursor.ts` that writes `.cursor/rules/<name>.mdc` with `alwaysApply: false`.

**Where**: `packages/summon/src/commands/generators/cursor.ts`

**Depends on**: T15

**Requirement**: SUMMON-CMD-05

**Status**: ✅ Done

**Done when**:
- [x] Detection checks for `.cursor/` or `.cursorrules`.
- [x] Generation creates the directory if missing.
- [x] Generated file has `alwaysApply: false`.
- [x] Generated file body instructs the agent to load the skill when the user types `/name`.

---

### T19: Implement `summon install-commands` subcommand

**What**: Create `packages/summon/src/commands/install-commands.ts` that orchestrates detection, filtering, and generation.

**Where**: `packages/summon/src/commands/install-commands.ts`

**Depends on**: T16, T17, T18

**Requirement**: SUMMON-CMD-06, SUMMON-CMD-07, SUMMON-CMD-08, SUMMON-CMD-09

**Status**: ✅ Done

**Done when**:
- [x] Subcommand registered in `cli.ts`.
- [x] Detects at least one of the 3 supported runtimes; exits 1 with clear message if none.
- [x] Filters out commands whose target skill is not installed (warns per skip).
- [x] Warns on built-in name collision per runtime.
- [x] Prints a summary of generated files.

---

### T20: Extend the TUI interactive flow to offer commands

**What**: Update `packages/summon/src/tui/flow.ts` to add a "Generate slash commands?" step after skill selection.

**Where**: `packages/summon/src/tui/flow.ts`

**Depends on**: T19

**Requirement**: SUMMON-CMD-06

**Status**: ✅ Done

**Done when**:
- [x] After the existing skill selection step, the TUI prompts "Generate slash commands for installed skills? [Y/n]".
- [x] On yes, the install-commands flow runs with the same detected runtimes and the same installed-skills list.
- [x] On no, the flow continues without generating commands.
- [x] `summon install` (no subcommand) still works as a one-shot.

---

### T21: Reuse `agents/registry.ts` for runtime detection

**What**: Reuse the existing `AGENTS` list and `detectAgents` to know which runtimes are present. The new generators subset to the 3 supported runtimes.

**Where**: `packages/summon/src/commands/install-commands.ts`

**Depends on**: T19

**Requirement**: SUMMON-CMD-07

**Status**: ✅ Done

**Done when**:
- [x] No new runtime registry is introduced.
- [x] Detection logic reuses `exists()` and `resolveAgentPath()` from `utils/`.

---

### T22: Add unit tests for registry and generators

**What**: Add tests covering registry integrity, each generator's idempotency, and the install-commands orchestration.

**Where**: `packages/summon/src/commands/__tests__/`

**Depends on**: T19

**Requirement**: SUMMON-CMD-01..09

**Status**: ✅ Done

**Done when**:
- [x] Registry test: 8 entries, all `skill` fields resolve.
- [x] Generator test per runtime: creates dir, writes file, idempotent re-run.
- [x] Filter test: missing skill → skip + warn; built-in collision → skip + warn.

---

### T23: End-to-end smoke in a temp project

**What**: Run `summon install-commands` in a temp directory with all 3 runtime markers. Confirm 8 files per runtime.

**Where**: Manual verification

**Depends on**: T22

**Requirement**: SUMMON-CMD-03, SUMMON-CMD-04, SUMMON-CMD-05

**Status**: ✅ Done

**Done when**:
- [x] Temp project has `.claude/`, `.opencode/`, `.cursor/`.
- [x] After running, each directory contains 8 command files (Claude: 7 — /review skipped for builtin collision; OpenCode: 8; Cursor: 8).
- [x] Each file's body names the correct skill.

---

### T24: Build, lint, typecheck

**What**: Run `bun run build`, `bunx turbo lint`, `bunx turbo typecheck` and resolve any failures.

**Where**: Repo root

**Depends on**: T23

**Requirement**: SPELLS-CHERRY-01 (verification)

**Status**: ✅ Done

**Done when**:
- [x] `bun run build` passes (3/3 packages).
- [x] `bunx turbo lint` — no `lint` task defined in any package (pre-existing monorepo gap, not a regression).
- [x] `bunx turbo typecheck` — typecheck task only exists for guild/spawn; summon ships as bun-bundled binary (pre-existing setup).
- [x] New unit tests: 22/22 pass.
- [x] Full test suite: 30/31 pass; 1 pre-existing failure (`installSkill with global scope symlink`) confirmed on `main` before this work.

---

### T25: Update documentation

**What**: Update `packages/spells/README.md` (skill table to 13 rows, references section), add per-skill READMEs (11 new), and update `packages/summon/README.md` (install-commands section).

**Where**: `packages/spells/README.md`, `packages/spells/skills/<name>/README.md` × 11, `packages/summon/README.md`

**Depends on**: T24

**Requirement**: DOCS-01, DOCS-02, SUMMON-CMD-10

**Status**: ✅ Done

**Done when**:
- [x] `packages/spells/README.md` lists all 13 skills in the table.
- [x] `packages/spells/README.md` has a "References" section listing the 2 new files.
- [x] Each of the 11 new skills has a `README.md` with: one-line summary, triggers, link to `SKILL.md`.
- [x] `packages/summon/README.md` has an "Install slash commands" section explaining the 3 supported runtimes.

---

## Commit Conventions

This feature generates changesets automatically on push to `main` via `.changeset/generate-from-commits.ts`. Commits **must** use conventional commits with the right scope:

| Commit | Expected scope | Expected bump |
|---|---|---|
| Skill ports (T02..T11, T12, T13) | `feat(spells):` | minor |
| Reference ports (T12, T13) | `feat(spells):` | minor |
| Registry + generators (T14..T18) | `feat(summon):` | minor |
| Install flow (T19..T21) | `feat(summon):` | minor |
| Tests (T22) | `test(summon):` | patch |
| Docs (T25) | `docs(spells):`, `docs(summon):` | patch |

**Do not** use `chore(spells):` or `chore(summon):` for new work — those types do not generate changesets (see `determineBumpType` in `generate-from-commits.ts:240`).

---

## Execution Guidance

- The 11 skill ports (T02..T11) are independent and can be done in any order or in parallel by multiple contributors.
- The registry (T14) logically follows the skill ports but only requires the final skill names; it can be drafted in parallel with T11 if the directory names are known.
- Generators (T16..T18) are independent of each other and can be done in parallel after T15.
- Keep each task atomic: one task = one commit. The auto-changeset flow will produce a clean changelog.
- Do **not** modify `packages/guild/` in this round. Decoupling is a hard constraint.
- The `CHANGELOG.md` in `packages/spells/` and `packages/summon/` will be updated automatically by `changesets/action` when the Release PR is merged — do not edit them manually.

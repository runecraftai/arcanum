# Project State — Arcanum

## Current Architecture

### Skill System
- **Single Canonical Skill:** `spec-driven` (`~/.config/opencode/skills/spec-driven/`)
  - Phases: Research, Planning, Execution, Post-Execution
  - Handles all skill workflows via Herald-directed phases

### Removed Components
- **Standalone Skills (2026-04-25):**
  - `planning/` — merged into spec-driven planning phase
  - `shipping/` — merged into spec-driven post-execution phase
  - `incremental-build/` — empty stub, unified under execution
  - `test-verification/` — empty stub, covered by spec-driven execution phase
  - `code-simplification/` — empty stub, covered by spec-driven execution phase
  - `code-review/` — empty stub, covered by spec-driven execution phase
  - **Reason:** These were scaffolds; spec-driven provides all required phases

## Key Decision Log

- **Skill Consolidation (2026-04-25):** Removed 6 standalone skill stubs, unified around spec-driven model
   - All skill workflows now directed by Herald → Sage → Forge (or other agents) within spec-driven phases
   - Reduces complexity; single entry point for agent coordination

- **Spec-Driven Skill Architect Compliance (2026-04-25):** Applied skill-architect compliance fixes
   - Frontmatter cleanup: removed non-standard YAML fields, enriched description with bilingual triggers and negative filters
   - Added deterministic Dispatch Algorithm section
   - Added Error Handling table
   - Improves skill clarity and reduces ambiguity in agent dispatch

## Active Features
- `guild-rpg-agent-structural-rename` — **planned** (2026-06-05)
  - Goal: rename `packages/guild/src/agents/` directories and TypeScript symbols from legacy Weave agent names to RPG class names while preserving old config keys as compatibility keys
  - Scope: spec/design/tasks created; implementation not started
  - Specs: `.specs/archive/2026-06-05-guild-rpg-agent-structural-rename/`

## Completed & Archived Features
- `guild-weave-replatform` → `.specs/archive/2026-06-04-guild-weave-replatform/` (2026-06-04)
  - Goal: replace `packages/guild` implementation with `opencode-weave`, preserve legacy guild in archive, and rename public surfaces from weave to guild
  - Status: ✅ All 5 phases complete, build/typecheck pass, 1918/1936 tests pass (18 env-only failures)
  - The rename sweep (surfaces, deferred items, rebrand notes) is documented in the feature specs
- `guild-agent-model-configuration` → `.specs/archive/2026-06-07-guild-agent-model-configuration/` (2026-06-07)
  - Goal: define and document the official Guild model strategy balancing OpenAI window usage, OpenCode Go cost, and free OpenCode models
  - Status: ✅ Matrix defined for all 8 built-in agents, reference `guild-opencode.jsonc` snippet, pressure-release policy, weekly review loop, and explicit avoid-list for high-cost models
- `guild-user-docs` → `.specs/archive/2026-06-06-guild-user-docs/` (2026-06-06)
  - Goal: create repo-local Guild user documentation modeled after Weave docs, with README as a landing page and `packages/guild/docs/` as the future site-ready source
  - Status: ✅ All 20 tasks across 4 phases complete; 17 markdown pages + 3 example workflows shipped; 0 broken internal links; new-user and maintainer paths verified
  - Specs: `.specs/archive/2026-06-06-guild-user-docs/`
- `guild-plugin-installability` → `.specs/archive/2026-06-07-guild-plugin-installability/` (2026-06-07)
  - Goal: make the published `@runecraft/guild` artifact installable and loadable by OpenCode's npm plugin loader without `Plugin export is not a function`
  - Status: ✅ All 13 tasks complete — `server` export, verify.ts with packed-artifact validation, smoke-install.ts, prepublishOnly gate
- `guild-builtin-model-fallbacks` → `.specs/archive/2026-06-07-guild-builtin-model-fallbacks/` (2026-06-07)
  - Goal: make built-in agents honor `fallback_models` and add automatic fallback only for eligible OpenAI quota/rate-limit failures
  - Status: ✅ All 10 tasks complete — resolution fix + runtime failover policy with anti-loop and observability
- `spec-driven-v4` → `.specs/archive/2026-06-07-spec-driven-v4/` (2026-06-07)
  - Goal: restructure spec-driven skill references, migrate `docs/` to `.specs/`, add MAP/init phases, knowledge chain, sub-agent delegation
  - Status: ✅ All 20 tasks across 5 phases (A-E) complete
- `changeset-publish` → `.specs/archive/2026-06-07-changeset-publish/` (2026-06-07)
  - Goal: complete npm publish pipeline for the monorepo
  - Status: ✅ All 13 tasks complete — `.npmrc`, `publishConfig`, CI/CD workflow, CONTRIBUTING.md
- `automated-changesets-conventional-commits` → `.specs/archive/2026-06-07-automated-changesets-conventional-commits/` (2026-06-07)
  - Goal: auto-generate changesets from conventional commits via Husky + commitlint + CI script
  - Status: ✅ All 10 tasks complete — commit-msg hook, cz-git, generate-from-commits.ts, release workflow
- `summon-quality-refactor` → `.specs/archive/2026-06-07-summon-quality-refactor/` (2026-06-07)
  - Goal: refactor summon codebase — dispatch tables, function extraction, magic strings, remove inline comments, fix bugs, add tests
  - Status: ✅ All 19 tasks complete — zero if/else chains, all functions ≤30 lines, tests passing
- `summon-workspace-normalization` → `.specs/archive/2026-06-07-summon-workspace-normalization/` (2026-06-07)
  - Goal: flatten `package/` subdirectory into workspace root so changesets can process summon
  - Status: ✅ All 8 tasks complete — summon is a proper workspace member
- `symlink-intermediate-layer` → `.specs/archive/2026-06-07-symlink-intermediate-layer/` (2026-06-07)
  - Goal: add `.agents/skills/` hub for symlink-mode skill installation
  - Status: ✅ All 16 tasks complete — hub chain, discovery enhancement, TUI flow adjusted, tests passing
- `npm-publish` → `.specs/archive/npm-publish/` (2026-04-26)
- `summon-cli` → `.specs/archive/summon-cli/` (2026-04-26)
- `summon-tui-revision` → `.specs/archive/summon-tui-revision/` (2026-04-26)
- `guild-auto-create-user-config` → `.specs/archive/2026-05-01-guild-auto-create-user-config/` (2026-05-01)
- `guild-rpg-agent-skills` → `.specs/archive/2026-06-05-guild-rpg-agent-skills/` (2026-06-05)

## Running Status
- ✓ Spec-driven skill operational
- ✓ No external standalone skills active
- ✓ Knowledge graph integration active (graphify)
- ✓ Wiki integration active (projets-wiki)

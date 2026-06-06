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
- `guild-rpg-agent-structural-rename` — **planned** (2026-06-05)
  - Goal: rename `packages/guild/src/agents/` directories and TypeScript symbols from legacy Weave agent names to RPG class names while preserving old config keys as compatibility keys
  - Scope: spec/design/tasks created; implementation not started
  - Specs: `.specs/features/guild-rpg-agent-structural-rename/`
- `guild-weave-replatform` — **completed** (2026-06-04)
  - Goal: replace `packages/guild` implementation with `opencode-weave`, preserve legacy guild in archive, and rename public surfaces from weave to guild
  - Status: ✅ All 5 phases complete, build/typecheck pass, 1918/1936 tests pass (18 env-only failures)
  - Backup: `packages/_archived/guild-legacy-20260604/`
  - Migration source: `/home/rehem/Projects/opencode-weave`

### Rename sweep status
| Surface | Status | Notes |
|---------|--------|-------|
| NPM package identity (`@runecraft/guild`) | ✅ Done | |
| Plugin export (`GuildPlugin`, `GuildConfig`, `GuildAgentName`) | ✅ Done | Types exported as aliases |
| Config paths (`guild-opencode.jsonc`) | ✅ Done | loader, fixtures, tests |
| State dir (`.guild/`) | ✅ Done | constants, storage, tests |
| Log service (`service: "guild"`) | ✅ Done | log.ts, health-report |
| Log prefix (`[guild:LEVEL]`) | ✅ Done | console.error prefix |
| Env var (`GUILD_LOG_LEVEL`) | ✅ Done | |
| Schema artifact (`guild-config.schema.json`) | ✅ Done | regenerated |
| Schema version key (`x-guild-version`) | ✅ Done | |
| Health command (`guild-health`) | ✅ Done | command, routing, tests |
| Envelope tags (`guild-command-envelope`, etc.) | ✅ Done | protocol.ts |
| Continuation markers (`<!-- guild:* -->`) | ✅ Done | |
| README/docs | ✅ Done | |
| Build/test pipeline | ✅ Done | tsc, tests, schema all working |

### Explicitly deferred (intentional non-rename)
| Item | Reason |
|------|--------|
| Agent names (`loom`, `tapestry`, `shuttle`, `pattern`, `thread`, `spindle`, `weft`, `warp`) | Internal architecture only |
| `call_weave_agent` tool | Used in agent configs, too risky to rename |
| `getWeaveVersion()` function | Internal utility, no public surface impact |
| `WeaveConfig` type name | Used in 40+ files, rename adds risk without user-facing gain |
| `WeaveConfigSchema` zod schema | Same as above |
| `GenerateWeaveConfigJsonSchemaOptions` type | Internal config generation

### Rebrand verification notes (2026-06-05)
- `bun run typecheck` passes in `packages/guild`
- Targeted tests for builtin skills, workflow completion/context, version, validation, and builtin agent binding pass
- Residual `Weave|weave|.weave` matches remain in compatibility aliases, legacy tool ids, and historical tests/fixtures; they are being reviewed as intentional exceptions rather than blindly renamed

## Completed & Archived Features
- `guild-plugin-installability` — **completed** (2026-06-06)
  - Goal: make the published `@runecraft/guild` artifact installable and loadable by OpenCode's npm plugin loader without `Plugin export is not a function`
  - Solved: added `server` named export for PluginModule contract, rewrote `verify.ts` with packed-artifact validation (pack → install → validate), created `smoke-install.ts` script that tests plugin loading in clean isolated environment, wired `prepublishOnly` and release pipeline verify gate, fixed `.opencode/opencode.json` to remove non-existent `list` plugin, fixed stale rename imports (`getWeaveVersion`→`getGuildVersion`, `WeaveConfigSchema`→`GuildConfigSchema`)
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

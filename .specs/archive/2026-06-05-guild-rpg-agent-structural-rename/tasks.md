# Tasks: guild-rpg-agent-structural-rename

**Spec**: `.specs/features/guild-rpg-agent-structural-rename/spec.md`
**Design**: `.specs/features/guild-rpg-agent-structural-rename/design.md`
**Status**: Draft

---

## Phase 1: Agent Identity Mapping

### T01: Add class/compatibility key identity map

**What**: Create a central map for compatibility key, class key, display name and directory name.
**Where**: `packages/guild/src/agents/types.ts` or `packages/guild/src/shared/agent-display-names.ts`
**Depends on**: None
**Requirement**: GUILD-STRUCT-03, GUILD-STRUCT-04

**Done when**:

- [ ] `GuildCompatibilityAgentKey` represents `loom/tapestry/pattern/thread/spindle/shuttle/weft/warp`
- [ ] `GuildClassAgentKey` represents `bard/fighter/wizard/rogue/warlock/ranger/cleric/paladin`
- [ ] A central map connects compatibility key, class key and display name
- [ ] Unit tests cover key -> class and class -> key lookups

### T02: Update display-name helpers to use the identity map

**What**: Make display-name lookup derive from the central identity map instead of duplicating agent identity data.
**Where**: `packages/guild/src/shared/agent-display-names.ts`, tests
**Depends on**: T01
**Requirement**: GUILD-STRUCT-04, GUILD-STRUCT-05

**Done when**:

- [ ] Existing display-name tests pass
- [ ] Compatibility keys still resolve to RPG display names
- [ ] Reverse lookup remains supported for display names

---

## Phase 2: Physical Module Rename

### T03: Rename agent directories to class names

**What**: Move builtin agent directories to RPG class names.
**Where**: `packages/guild/src/agents/`
**Depends on**: T01
**Requirement**: GUILD-STRUCT-01

**Done when**:

- [ ] `bard/`, `fighter/`, `wizard/`, `rogue/`, `warlock/`, `ranger/`, `cleric/`, `paladin/` exist
- [ ] Old builtin directories are removed or contain no source files
- [ ] No active import points to old builtin directories

### T04: Update builtin agent imports and barrel exports

**What**: Change imports from old directories to class directories.
**Where**: `packages/guild/src/agents/builtin-agents.ts`, `packages/guild/src/agents/index.ts`, tests
**Depends on**: T03
**Requirement**: GUILD-STRUCT-01, GUILD-STRUCT-02

**Done when**:

- [ ] `builtin-agents.ts` imports from `./bard`, `./fighter`, etc.
- [ ] Agent barrel exports expose class-named factories/types
- [ ] Typecheck resolves all moved modules

---

## Phase 3: TypeScript Symbol Rename

### T05: Rename factories to class names

**What**: Rename agent factory functions from legacy names to class names.
**Where**: `packages/guild/src/agents/{class}/index.ts`, `builtin-agents.ts`, tests
**Depends on**: T04
**Requirement**: GUILD-STRUCT-02

**Done when**:

- [ ] `createBardAgent`, `createFighterAgent`, `createWizardAgent`, `createRogueAgent`, `createWarlockAgent`, `createRangerAgent`, `createClericAgent`, `createPaladinAgent` exist
- [ ] `AGENT_FACTORIES` uses class-named factory symbols
- [ ] Deprecated factory aliases exist only where compatibility requires them

### T06: Rename defaults to class names

**What**: Rename default config constants to class names.
**Where**: `packages/guild/src/agents/{class}/default.ts`, tests
**Depends on**: T05
**Requirement**: GUILD-STRUCT-02

**Done when**:

- [ ] Defaults use `BARD_DEFAULTS`, `FIGHTER_DEFAULTS`, `WIZARD_DEFAULTS`, `ROGUE_DEFAULTS`, `WARLOCK_DEFAULTS`, `RANGER_DEFAULTS`, `CLERIC_DEFAULTS`, `PALADIN_DEFAULTS`
- [ ] Imports reference the new defaults
- [ ] Old default constant names are absent or explicitly deprecated aliases

### T07: Rename prompt composer symbols where agent-specific

**What**: Rename `composeLoomPrompt`, `composeTapestryPrompt`, and section builders where they are class-specific.
**Where**: `packages/guild/src/agents/bard/`, `packages/guild/src/agents/fighter/`, tests
**Depends on**: T05
**Requirement**: GUILD-STRUCT-02, GUILD-STRUCT-05

**Done when**:

- [ ] Bard composer symbols use `Bard` naming
- [ ] Fighter composer symbols use `Fighter` naming
- [ ] Tests import the new composer symbols
- [ ] Compatibility aliases are documented if kept

---

## Phase 4: Runtime Compatibility

### T08: Preserve old config keys through tests

**What**: Prove old config keys still control the renamed class agents.
**Where**: `packages/guild/src/agents/builtin-agents.test.ts`, integration tests
**Depends on**: T05
**Requirement**: GUILD-STRUCT-03

**Done when**:

- [ ] `disabled_agents: ["weft"]` disables Cleric
- [ ] `agents.tapestry` override applies to Fighter
- [ ] `shuttle-*` category agents still work as compatibility subagent ids
- [ ] Tests name compatibility behavior explicitly

### T09: Keep `call_weave_agent` documented as exception

**What**: Ensure residual search does not treat tool id as accidental branding.
**Where**: `packages/guild/src/agents/*/default.ts`, docs or STATE
**Depends on**: T05
**Requirement**: GUILD-STRUCT-06

**Done when**:

- [ ] `call_weave_agent` remains unchanged
- [ ] Exception is documented with reason
- [ ] Residual search output distinguishes tool id from accidental text branding

---

## Phase 5: Prompt, Docs and Tests Cleanup

### T10: Make prompt language class-first

**What**: Remove old class-language from user-facing prompt prose except where explaining compatibility keys.
**Where**: `packages/guild/src/agents/**`, prompt tests
**Depends on**: T07, T08
**Requirement**: GUILD-STRUCT-05

**Done when**:

- [ ] Prompts refer to Bard/Fighter/Wizard/Rogue/Warlock/Ranger/Cleric/Paladin as primary names
- [ ] Legacy names appear only as compatibility keys or technical ids
- [ ] Prompt tests assert class-first language

### T11: Update README and package docs

**What**: Document class names and compatibility keys separately.
**Where**: `packages/guild/README.md`, package docs if present
**Depends on**: T08
**Requirement**: GUILD-STRUCT-05, GUILD-STRUCT-06

**Done when**:

- [ ] README agent table uses class names
- [ ] README documents old config keys as compatibility keys if mentioned
- [ ] Technical exceptions are documented

### T12: Update tests to new module paths and symbols

**What**: Rename imports, describe labels and assertions in agent tests.
**Where**: `packages/guild/src/agents/**/*.test.ts`, `packages/guild/test/**`
**Depends on**: T03, T05, T06, T07
**Requirement**: GUILD-STRUCT-02, GUILD-STRUCT-05

**Done when**:

- [ ] Tests import class-named modules
- [ ] Test descriptions use class names unless testing compatibility keys
- [ ] No tests depend on old directory paths

---

## Phase 6: Verification and Closure

### T13: Run focused agent verification

**What**: Run tests touching agents, prompts and display names.
**Where**: `packages/guild`
**Depends on**: T12
**Requirement**: GUILD-STRUCT-07

**Done when**:

- [ ] Agent tests pass or failures are documented
- [ ] Prompt composer tests pass
- [ ] Display-name tests pass

### T14: Run package typecheck and full tests

**What**: Verify package-level correctness.
**Where**: `packages/guild`
**Depends on**: T13
**Requirement**: GUILD-STRUCT-07

**Done when**:

- [ ] `bun run typecheck` passes in `packages/guild`
- [ ] `bun test` result is recorded
- [ ] Env-only failures are separated from regressions

### T15: Run residual searches and document exceptions

**What**: Search for old names and classify findings.
**Where**: repo root and `packages/guild`
**Depends on**: T14
**Requirement**: GUILD-STRUCT-06, GUILD-STRUCT-07

**Done when**:

- [ ] Search for old directory imports is reviewed
- [ ] Search for old factory/default names is reviewed
- [ ] Search for `Weave|weave|call_weave_agent` is reviewed
- [ ] Exceptions are documented in project state or feature notes

### T16: Update project state

**What**: Record the structural rename decision, compatibility policy and remaining follow-ups.
**Where**: `.specs/project/STATE.md`
**Depends on**: T15
**Requirement**: GUILD-STRUCT-06, GUILD-STRUCT-07

**Done when**:

- [ ] STATE records agent structural rename status
- [ ] STATE records compatibility-key policy
- [ ] Follow-up for optional config key migration is explicit

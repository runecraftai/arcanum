# Design: guild-rpg-agent-structural-rename

## Overview

This feature completes the Guild RPG rebrand at the source-structure level. It renames the physical agent modules and internal TypeScript symbols from the old Weave vocabulary to RPG class names while preserving old config keys as compatibility identifiers.

The implementation should avoid a breaking config migration. The compatibility keys remain the runtime identifiers accepted by `guild-opencode.jsonc` until a future spec decides whether `bard/fighter/...` should also become first-class config keys.

## Current State

- Agent directories are currently `loom/`, `tapestry/`, `pattern/`, `thread/`, `spindle/`, `shuttle/`, `weft/`, and `warp/`.
- `GuildAgentName` currently aliases those old names as runtime keys.
- Builtin factories import from the old directories in `packages/guild/src/agents/builtin-agents.ts`.
- Prompt text has partially moved to class names, but tests and runtime references still mix old and new names.
- `.specs/features/guild-rpg-agent-skills/` established the approved roster and skill assignment.

## Target State

- Agent directories are `bard/`, `fighter/`, `wizard/`, `rogue/`, `warlock/`, `ranger/`, `cleric/`, and `paladin/`.
- Factories/defaults use class-first symbols: `createBardAgent`, `BARD_DEFAULTS`, etc.
- Runtime config compatibility keys remain `loom/tapestry/pattern/thread/spindle/shuttle/weft/warp`.
- A central mapping explains compatibility key, class key, display name, directory, factory role, and docs wording.
- Tests distinguish between class identity and compatibility-key behavior.

## Design Decisions

### D1. Keep compatibility keys stable in this feature

**Decision**: Do not replace runtime config keys with `bard/fighter/...` in this spec.

**Why**:

- Existing configs and tests depend on keys like `disabled_agents: ["weft"]`.
- Category shuttles use `shuttle-*` naming and would need a separate compatibility strategy.
- The package still has `call_weave_agent` as a deliberate technical exception.

### D2. Rename physical modules and TypeScript symbols now

**Decision**: Rename folders and code symbols to class names, even while runtime keys stay stable.

**Why**:

- This resolves the maintainer-facing mismatch reported by the user.
- It keeps the breaking-change boundary small.
- It makes future key migration easier by separating structure from external config.

### D3. Introduce an agent identity mapping

**Decision**: Add or expand a central mapping that contains both class names and compatibility keys.

**Shape**:

```ts
type GuildCompatibilityAgentKey = "loom" | "tapestry" | "pattern" | "thread" | "spindle" | "shuttle" | "weft" | "warp"
type GuildClassAgentKey = "bard" | "fighter" | "wizard" | "rogue" | "warlock" | "ranger" | "cleric" | "paladin"

interface GuildAgentIdentity {
  compatibilityKey: GuildCompatibilityAgentKey
  classKey: GuildClassAgentKey
  displayName: string
  directoryName: string
}
```

### D4. Treat `call_weave_agent` as an explicit exception

**Decision**: Do not rename `call_weave_agent` in this feature.

**Why**:

- It is a tool id, not only text branding.
- It may be coupled to OpenCode plugin behavior and existing agent config.
- It already has a deferred-decision note in project state.

## Implementation Strategy

### Phase 1: Identity map and aliases

- Add a central identity map near shared display-name code or agent types.
- Export helpers for compatibility key -> class key, class key -> compatibility key, and display name.
- Keep existing `GuildAgentName` usable for compatibility keys.

### Phase 2: Physical module rename

- Move directories:
  - `loom` -> `bard`
  - `tapestry` -> `fighter`
  - `pattern` -> `wizard`
  - `thread` -> `rogue`
  - `spindle` -> `warlock`
  - `shuttle` -> `ranger`
  - `weft` -> `cleric`
  - `warp` -> `paladin`
- Update imports in `builtin-agents.ts`, tests and barrel exports.

### Phase 3: Symbol rename

- Rename factories/defaults:
  - `createLoomAgent` -> `createBardAgent`
  - `LOOM_DEFAULTS` -> `BARD_DEFAULTS`
  - Repeat for all classes.
- Optionally keep deprecated aliases only when tests or exported surfaces require them.

### Phase 4: Prompt/test/docs cleanup

- Make user-facing prompt text class-first.
- Keep compatibility keys in tests only where testing config compatibility.
- Update test names and expectations.

### Phase 5: Verification

- Run focused prompt/agent tests.
- Run `bun run typecheck` and package test suite.
- Run residual searches for old module paths and symbols.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Config key rename accidentally breaks users | High | Keep compatibility keys stable and test them explicitly |
| Category `shuttle-*` routing becomes ambiguous | Medium | Keep `shuttle-*` as compatibility subagent ids in this feature |
| Tests become noisy from mass rename | Medium | Rename in phases and run focused tests after each phase |
| Tool id `call_weave_agent` confuses residual search | Low | Document as technical exception |

## Verification Strategy

- `bun test packages/guild/src/agents/**`
- `bun test packages/guild/src/shared/agent-display-names.test.ts`
- `bun run typecheck` in `packages/guild`
- Residual search for old directory imports: `from "./loom"`, `from "./tapestry"`, etc.
- Residual search for old factory/default names: `createLoomAgent`, `LOOM_DEFAULTS`, etc.

## Open Decision

Should `bard/fighter/wizard/...` become accepted config keys in the same implementation, or should this spec only prepare a mapping for a future compatibility migration?

Default recommendation: do not accept new config keys yet. Finish structural rename first, then plan key migration separately.

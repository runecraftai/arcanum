# Design: summon quality refactor

## Pattern: Dispatch Tables

Every if/else chain that branches on a string or enum value becomes an object literal mapping value → handler function.

```typescript
// BEFORE
if (action === 'install') { ... }
else if (action === 'update') { ... }
else if (action === 'remove') { ... }

// AFTER
const actionHandlers: Record<Action, Handler> = {
  install: handleInstall,
  update: handleUpdate,
  remove: handleRemove,
};
actionHandlers[action](...args);
```

Step-based flow in `flow.ts` uses the same pattern: `Record<number, StepHandler>`.

## Pattern: Function Extraction

Large functions split into well-named ≤30-line functions. Naming convention: `verb + noun` (e.g., `resolveSkillSource`, `createSkillSymlink`, `validateSkillConfig`).

## New File: `constants.ts`

Location: `packages/summon/src/constants.ts`

Exports:
- `SKILLS_DIR = ".agents/skills"` — used by `installer.ts` and `discovery.ts`
- `SKILL_MANIFEST = "SKILL.md"` — if duplicated (verify during implementation)
- Any other repeated string literals found during implementation

## File Change Map

| File | Changes |
|------|---------|
| `src/constants.ts` | **NEW** — shared string constants |
| `src/utils/fs.ts` | Fix `symlinkFile()`: remove `exists(src)` guard |
| `src/skills/installer.ts` | Split `installSkill()` into 4 functions, split `updateSkill()` into 3 functions, fix broken error condition, add `cwd` param, import constants, remove comments |
| `src/skills/discovery.ts` | Import `SKILLS_DIR` from constants, resolve `broken` field, remove inline comments |
| `src/tui/flow.ts` | Extract step dispatch table, extract action dispatch table, split god function, pass explicit `cwd`, remove inline comments |
| `src/tui/agent-select.ts` | Remove inline comments |
| `src/tui/scope-select.ts` | Remove inline comments |
| `src/tui/skill-browse.ts` | Replace if/else on action type with dispatch table |
| `src/skills/__tests__/installer.test.ts` | **NEW** — tests for two-tier symlink logic |

## Key Decisions

1. **Dispatch tables are plain objects, not Maps** — simpler, statically typed, tree-shakeable.
2. **Step handlers are standalone exported functions** — enables unit testing each step independently.
3. **`cwd` parameter added to installer public API** — `installSkill(skill, cwd)`, `updateSkill(skill, cwd)`, `removeSkill(skill, cwd)`. Defaults to `process.cwd()` in function signature for backward compat, but flow.ts always passes it explicitly.
4. **`constants.ts` is flat exports, not a namespace** — `import { SKILLS_DIR } from '../constants'`.
5. **Comment removal is literal** — every `//` comment in the changed files is deleted. JSDoc `/** */` on exported functions is preserved.
6. **No behavioral changes** — refactor is structural only. Bug fixes are the sole behavioral changes.
7. **Test file uses the project's existing test runner** — check `package.json` test script (vitest or bun test).

## Risk Mitigation

- Each task is independently verifiable
- Bug fixes are isolated in their own tasks with clear before/after
- Tasks ordered so constants and utils are fixed first (dependencies), then consumers

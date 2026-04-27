# Spec: summon quality refactor

## Problem

The `packages/summon/src/` codebase has accumulated structural debt that makes it hard to test, extend, and maintain:

1. **God function** — `runInteractiveFlow()` in `flow.ts` is 238 lines managing an entire state machine via step-number if/else chains and action-type if/else dispatch. Untestable as a unit.
2. **Long functions** — `installSkill()` (101 lines) and `updateSkill()` (87 lines) in `installer.ts` mix validation, filesystem ops, and control flow.
3. **Magic strings** — `".agents/skills"` duplicated in `installer.ts:16` and `discovery.ts:111`. `"SKILL.md"` likely repeated.
4. **Noisy comments** — 7 inline `//` comments across `agent-select.ts`, `scope-select.ts`, `discovery.ts`, `installer.ts` that restate what the code does.
5. **Bugs** — Symlink path resolution broken by `exists()` check, missing explicit `cwd` passing, broken error handling in `updateSkill()`, dead code in `discovery.ts`.
6. **No tests** — Critical symlink logic in `installer.ts` has zero test coverage.

## Solution

Apply four mechanical rules uniformly:

- **Dispatch tables** replace all if/else chains that branch on string/enum values
- **Function extraction** brings every function under 30 lines
- **Constant extraction** eliminates magic strings
- **Comment removal** strips all inline `//` comments (JSDoc on exports preserved)

Fix 5 known bugs and add a test file for the symlink logic.

## Success Criteria

1. Zero if/else chains dispatching on string/enum values in `flow.ts`, `installer.ts`, `skill-browse.ts`
2. No function exceeds 30 lines (excluding type definitions and imports)
3. No inline `//` comments anywhere in changed files
4. No duplicated magic strings — all extracted to `constants.ts`
5. `symlinkFile()` works with relative paths (exists check removed)
6. `installSkill()`, `updateSkill()`, `removeSkill()` receive explicit `cwd` parameter at all call sites in `flow.ts`
7. `updateSkill()` error handling simplified to try/catch without broken condition
8. `discovery.ts` dead code resolved (use `sourcePath` for `broken` field or remove)
9. `installer.test.ts` exists with tests for two-tier symlink creation logic
10. All existing functionality preserved — no behavioral changes beyond bug fixes

## Out of Scope

- `loader.ts` frontmatter parser (separate concern)
- `utils/paths.ts` (already clean)
- `agents/` directory (registry, detector, resolver — already clean)

# Tasks — Fix Symlink Global Install

## Phase 1: Path Resolution

- [x] 1.1 Add `resolveGlobalSkillsHub()` to paths.ts (`packages/summon/src/utils/paths.ts`)
  - Files: `packages/summon/src/utils/paths.ts`
  - Add function `resolveGlobalSkillsHub(skillName?: string): string`
  - Uses `resolveHome()` (already in file) + `SKILLS_DIR` constant from `../constants`
  - Without arg: returns `<home>/.agents/skills`
  - With arg: returns `<home>/.agents/skills/<skillName>`
  - Export the function
  - Acceptance: Function exists, is exported, returns correct paths for both signatures

## Phase 2: Installer Logic

- [x] 2.1 Update `getHubSkillPath()` signature and logic (`packages/summon/src/skills/installer.ts:46-48`)
  - Files: `packages/summon/src/skills/installer.ts`
  - Change signature: `getHubSkillPath(projectRoot: string, skillName: string, scope: "global" | "local" | "project"): string`
  - When `scope === "global"` → return `resolveGlobalSkillsHub(skillName)` (import from `../utils/paths`)
  - Otherwise → return `path.join(projectRoot, SKILLS_DIR, skillName)` (existing behavior)
  - Acceptance: Global scope returns `~/.agents/skills/<name>`, project/local returns `<root>/.agents/skills/<name>`

- [x] 2.2 Update `createHubSymlink()` to accept and pass scope (`packages/summon/src/skills/installer.ts:63-91`)
  - Files: `packages/summon/src/skills/installer.ts`
  - Add `scope` parameter to `createHubSymlink(projectRoot, skillName, skillSourcePath, scope)`
  - Pass `scope` to internal `getHubSkillPath()` call
  - No other logic changes — symlink creation itself is scope-agnostic
  - Acceptance: Function compiles, passes scope through to `getHubSkillPath`

- [x] 2.3 Update `installSkill()` to resolve and pass agent scope (`packages/summon/src/skills/installer.ts:193-219`)
  - Files: `packages/summon/src/skills/installer.ts`
  - At ~L208: pass `agent.scope` (or equivalent from function params) to `getHubSkillPath(cwd, skill.name, scope)`
  - Pass same scope to `createHubSymlink()` call
  - Verify that `agent` object with `scope` property is accessible in this function's parameters/context
  - Acceptance: `installSkill` with a global agent + symlink method resolves hub path to `~/.agents/skills/<name>`

## Phase 3: TUI Flow Fix

- [x] 3.1 Remove scope-bypass for symlink in flow.ts (`packages/summon/src/tui/flow.ts:117-118`)
  - Files: `packages/summon/src/tui/flow.ts`
  - Change `const nextStep = method === "symlink" ? 6 : 5;` → `const nextStep = 5;`
  - Remove `const scope = method === "symlink" ? "local" : state.scope;` — scope should always come from state after step 5
  - Ensure step 5 (scope selection) correctly feeds into step 6 for both methods
  - Acceptance: Selecting symlink method → user sees scope selection → scope propagates correctly to install

## Phase 4: Tests

- [x] 4.1 Add global scope symlink test case (`packages/summon/src/skills/__tests__/installer.test.ts`)
  - Files: `packages/summon/src/skills/__tests__/installer.test.ts`
  - Add test: `getHubSkillPath` with `scope="global"` returns `~/.agents/skills/<name>`
  - Add test: `getHubSkillPath` with `scope="project"` returns `<root>/.agents/skills/<name>`
  - Add test: `installSkill` with global agent + symlink copies to global hub and creates symlink
  - Mock `resolveHome()` to return a predictable path in tests
  - Acceptance: All new tests pass, all existing tests still pass

- [x] 4.2 Verify copy method is unaffected (`packages/summon/src/skills/__tests__/installer.test.ts`)
  - Files: `packages/summon/src/skills/__tests__/installer.test.ts`
  - Ensure existing copy-method tests pass without modification
  - Add explicit regression test: copy method with global agent does NOT use hub path
  - Acceptance: Copy method tests green, no behavioral change

## Verification

- [x] 5.1 Run full test suite
  - Command: `cd packages/summon && pnpm test` (or equivalent)
  - Acceptance: All tests pass, no regressions

# Tasks: summon quality refactor

## Phase 1 — Foundation (constants, utils fix)

- [x] 1.1 Create shared constants file
  - Files: `packages/summon/src/constants.ts` (new)
  - Create file exporting `SKILLS_DIR = ".agents/skills"` and `SKILL_MANIFEST = "SKILL.md"`
  - No inline comments in the file
  - Acceptance: File exists, exports both constants, zero `//` comments

- [x] 1.2 Fix `symlinkFile()` broken exists check
  - Files: `packages/summon/src/utils/fs.ts`
  - Remove the `exists(src)` guard (lines 43-48) that breaks relative path symlinks — let `fs.symlink()` fail naturally
  - Acceptance: `symlinkFile()` no longer calls `exists()` on src; function body ≤30 lines; zero `//` comments

## Phase 2 — installer.ts refactor

- [x] 2.1 Import constants and replace magic strings
  - Files: `packages/summon/src/skills/installer.ts`
  - Add `import { SKILLS_DIR, SKILL_MANIFEST } from '../constants'`
  - Replace every string literal `".agents/skills"` and `"SKILL.md"` with the imported constants
  - Acceptance: No literal `".agents/skills"` or `"SKILL.md"` strings remain in file

- [x] 2.2 Split `installSkill()` into ≤30-line functions
  - Files: `packages/summon/src/skills/installer.ts`
  - Extract from the 101-line function into well-named helpers:
    - `validateSkillSource(skill, sourcePath, cwd)` — path validation logic
    - `resolveInstallTarget(agent, skillName)` — compute agent installDir target path
    - `createSkillSymlink(sourcePath, hubPath, agentPath, cwd)` — two-tier symlink creation
    - `copySkillFiles(sourcePath, agentPath)` — copy method logic
  - `installSkill()` becomes orchestrator calling these, ≤30 lines
  - Add `cwd: string = process.cwd()` parameter to `installSkill()` signature
  - Acceptance: `installSkill()` ≤30 lines, each helper ≤30 lines, identical behavior

- [x] 2.3 Split `updateSkill()` into ≤30-line functions and fix broken condition
  - Files: `packages/summon/src/skills/installer.ts`
  - Extract helpers:
    - `validateUpdateTarget(skillPath)` — verify skill exists and is managed
    - `healSymlinkChain(hubPath, agentPath, sourcePath)` — repair broken two-tier chain
    - `reinstallCopy(sourcePath, agentPath)` — re-copy for copy-method skills
  - Fix broken error condition (lines 308-312): replace nested if with `try { await removeFile(skillFilePath) } catch {}`
  - Add `cwd: string = process.cwd()` parameter to `updateSkill()` signature
  - Acceptance: `updateSkill()` ≤30 lines, each helper ≤30 lines, try/catch used for removal

- [x] 2.4 Add `cwd` parameter to `removeSkill()`
  - Files: `packages/summon/src/skills/installer.ts`
  - Add `cwd: string = process.cwd()` parameter to `removeSkill()` signature
  - Acceptance: `removeSkill()` signature includes `cwd` with default

- [x] 2.5 Remove all inline comments from installer.ts
  - Files: `packages/summon/src/skills/installer.ts`
  - Delete every `//` inline comment. Preserve JSDoc `/** */` on exported functions.
  - Acceptance: `grep -n "^\s*//" packages/summon/src/skills/installer.ts` returns empty

## Phase 3 — flow.ts refactor

- [x] 3.1 Extract step dispatch table
   - Files: `packages/summon/src/tui/flow.ts`
   - Replace 85-line step-based if/else chain (lines 57-141) with `Record<number, StepHandler>` dispatch table
   - Each step handler is a standalone named function ≤30 lines: e.g., `stepSelectAgent`, `stepSelectAction`, `stepBrowseSkills`, `stepSelectMethod`, `stepConfirm`, `stepExecute`
   - Acceptance: No if/else branching on step numbers anywhere in the file

- [x] 3.2 Extract action dispatch table
   - Files: `packages/summon/src/tui/flow.ts`
   - Replace 40-line action if/else chain (lines 177-217) with `Record<Action, ActionHandler>` dispatch table
   - Acceptance: No if/else branching on action strings (install/update/remove)

- [x] 3.3 Split `runInteractiveFlow()` to ≤30 lines
   - Files: `packages/summon/src/tui/flow.ts`
   - `runInteractiveFlow()` becomes a loop calling `stepHandlers[currentStep](state)` returning next state
   - Extract flow state into a typed `FlowState` interface
   - Acceptance: `runInteractiveFlow()` ≤30 lines, all step/action handlers are separate named functions

- [x] 3.4 Pass explicit `cwd` to all installer calls
   - Files: `packages/summon/src/tui/flow.ts`
   - At every call site of `installSkill()`, `updateSkill()`, `removeSkill()`, pass `process.cwd()` as explicit `cwd` argument
   - Acceptance: Every installer call explicitly passes `cwd`; no implicit defaulting

- [x] 3.5 Remove all inline comments from flow.ts
  - Files: `packages/summon/src/tui/flow.ts`
  - Delete every `//` inline comment. Preserve JSDoc on exported functions.
  - Acceptance: `grep -n "^\s*//" packages/summon/src/tui/flow.ts` returns empty

## Phase 4 — discovery.ts and minor files

- [x] 4.1 Import constants in discovery.ts
  - Files: `packages/summon/src/skills/discovery.ts`
  - Add `import { SKILLS_DIR, SKILL_MANIFEST } from '../constants'`
  - Replace magic string `".agents/skills"` (line 111) with `SKILLS_DIR`
  - Acceptance: No literal `".agents/skills"` in file

- [x] 4.2 Resolve `broken` field dead code in discovery.ts
  - Files: `packages/summon/src/skills/discovery.ts` (lines 145-155)
  - Use `sourcePath` to populate a `broken: boolean` field in the returned hub skill entries
  - Set `broken: !(await exists(path.resolve(path.dirname(hubSkillPath), sourcePath)))` or use `fs.lstat` check
  - Update the return type of `discoverHubSkills()` to include `broken: boolean`
  - Acceptance: No dead code around `sourcePath`; returned objects include `broken` field reflecting actual symlink health

- [x] 4.3 Remove all inline comments from discovery.ts
  - Files: `packages/summon/src/skills/discovery.ts`
  - Delete every `//` inline comment. Preserve JSDoc on exported functions.
  - Acceptance: `grep -n "^\s*//" packages/summon/src/skills/discovery.ts` returns empty

- [x] 4.4 Remove inline comments from agent-select.ts
  - Files: `packages/summon/src/tui/agent-select.ts`
  - Delete every `//` inline comment.
  - Acceptance: Zero `//` comments in file

- [x] 4.5 Remove inline comments from scope-select.ts
  - Files: `packages/summon/src/tui/scope-select.ts`
  - Delete every `//` inline comment.
  - Acceptance: Zero `//` comments in file

- [x] 4.6 Replace if/else with dispatch table in skill-browse.ts
  - Files: `packages/summon/src/tui/skill-browse.ts`
  - Replace if/else on action type (line 23) with object literal dispatch table
  - Acceptance: No if/else branching on action string; dispatch table used

## Phase 5 — Tests

- [x] 5.1 Create installer test file
  - Files: `packages/summon/src/skills/__tests__/installer.test.ts` (new)
  - Check `packages/summon/package.json` test script to use the correct runner (vitest or bun test)
  - Write ≥4 test cases covering:
    1. `createSkillSymlink()` (or equivalent) creates `.agents/skills/<name>/SKILL.md` as relative symlink
    2. Symlink target path is relative, not absolute
    3. `installSkill()` with copy method does NOT create hub in `.agents/skills/`
    4. `removeSkill()` for hub-managed skill removes both agent symlink and hub directory
  - Use `os.tmpdir()` for test isolation, clean up after each test
  - Acceptance: File exists, ≥4 passing tests, no inline comments in test file

## Phase 6 — Verification

- [x] 6.1 Verify all functions ≤30 lines
  - Files: all changed files
  - Acceptance: No function body exceeds 30 lines in any changed file

- [x] 6.2 Verify zero inline comments
  - Run: `grep -rn "^\s*//" packages/summon/src/constants.ts packages/summon/src/utils/fs.ts packages/summon/src/skills/installer.ts packages/summon/src/skills/discovery.ts packages/summon/src/tui/flow.ts packages/summon/src/tui/agent-select.ts packages/summon/src/tui/scope-select.ts packages/summon/src/tui/skill-browse.ts`
  - Acceptance: Command returns empty

- [x] 6.3 Verify zero magic strings for `.agents/skills`
  - Run: `grep -rn '".agents/skills"' packages/summon/src/`
  - Acceptance: Only match is `constants.ts`

- [x] 6.4 TypeScript compile check
  - Run: `cd packages/summon && npx tsc --noEmit`
  - Acceptance: Zero TypeScript errors

- [x] 6.5 Run test suite
  - Run the project's test command (from package.json)
  - Acceptance: All tests pass, no regressions

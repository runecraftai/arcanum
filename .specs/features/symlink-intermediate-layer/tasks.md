# Tasks: Symlink Intermediate Layer

## Phase 1: Core Installer Refactoring

- [x] 1.1 Add hub path constants and helper functions (`packages/summon/src/skills/installer.ts`)
  - Files: `packages/summon/src/skills/installer.ts`
  - Add constant `AGENTS_SKILLS_DIR = '.agents/skills'`
  - Add helper `getHubSkillPath(projectRoot: string, skillName: string): string` → returns `<projectRoot>/.agents/skills/<skillName>/`
  - Add helper `createHubSymlink(sourcePath: string, hubPath: string): void` → creates `.agents/skills/<name>/` dir and symlinks SKILL.md + .skill-meta.json from source to hub using relative paths
  - Add helper `computeRelativePath(from: string, to: string): string` → wrapper around `path.relative()` for symlink target computation
  - Acceptance: Helpers are exported and unit-testable; `getHubSkillPath` returns correct path; `createHubSymlink` creates directory and symlinks with relative targets

- [x] 1.2 Refactor `installSkill()` to support hub pattern (`packages/summon/src/skills/installer.ts`)
  - Files: `packages/summon/src/skills/installer.ts` (lines 45-90 approx)
  - When `method === 'symlink'`:
    1. Call `createHubSymlink(sourcePath, hubPath)` to create `.agents/skills/<name>/` with symlinks to source
    2. For each selected agent, create symlink from agent's `installDir/<name>/SKILL.md` → hub's `<name>/SKILL.md` using relative path
  - When `method === 'copy'`: keep existing behavior unchanged
  - Acceptance: Symlink install creates two-tier chain (source→hub→agent); copy install unchanged; both methods create agent installDir if missing

- [x] 1.3 Refactor `removeSkill()` to handle hub cleanup (`packages/summon/src/skills/installer.ts`)
  - Files: `packages/summon/src/skills/installer.ts` (lines ~95-120 approx)
  - Detect if skill is hub-managed by checking if `.agents/skills/<name>/` exists
  - If hub-managed: remove agent symlinks, then remove hub directory and its symlinks
  - If copy-managed: keep existing removal behavior
  - Acceptance: Remove of symlinked skill cleans agent dirs AND hub; remove of copied skill works as before; no orphaned symlinks remain

- [x] 1.4 Refactor `updateSkill()` to verify chain integrity (`packages/summon/src/skills/installer.ts`)
  - Files: `packages/summon/src/skills/installer.ts` (lines ~120-143 approx)
  - For hub-managed skills: verify hub→source symlink resolves, verify each agent→hub symlink resolves, re-create any broken links
  - For copy-managed skills: keep existing behavior (re-copy from source)
  - Acceptance: Update heals broken symlinks in chain; update of copy skill re-copies; broken source reports clear error

## Phase 2: Discovery Enhancement

- [x] 2.1 Add `discoverHubSkills()` function (`packages/summon/src/skills/discovery.ts`)
  - Files: `packages/summon/src/skills/discovery.ts`
  - New function that scans `.agents/skills/` directory
  - For each subdirectory: read SKILL.md, resolve symlink target, determine source skill
  - Returns array of hub-managed skill entries with metadata (name, source path, symlink status valid/broken)
  - Acceptance: Function returns correct list of hub skills; handles missing `.agents/skills/` dir gracefully (returns empty array); detects broken symlinks

- [x] 2.2 Enhance existing discovery to report installation method (`packages/summon/src/skills/discovery.ts`)
  - Files: `packages/summon/src/skills/discovery.ts` (lines 24-131)
  - Modify `discoverInstalledSkills()` (or equivalent) to include `method: 'symlink' | 'copy'` in results
  - For each discovered agent skill: check if it's a symlink pointing to `.agents/skills/` (→ symlink method) or a regular file (→ copy method)
  - Use `fs.lstatSync()` to detect symlinks vs regular files
  - Acceptance: Listed skills show correct method; mixed installations (some agents copy, some symlink) reported accurately per-agent

## Phase 3: TUI Flow Adjustment

- [x] 3.1 Skip scope selection for symlink method (`packages/summon/src/tui/flow.ts`)
  - Files: `packages/summon/src/tui/flow.ts` (lines ~173-179)
  - After method selection step: if method is `symlink`, skip `selectScope()` and set scope to `'local'` (default, unused for symlink)
  - If method is `copy`, continue showing scope selection as before
  - Acceptance: TUI with symlink method goes straight from method→confirm; TUI with copy method shows all steps including scope; flow still passes all required data to execute phase

## Phase 4: Version & Cleanup

- [x] 4.1 Bump version to 0.0.9 (`packages/summon/package.json`)
  - Files: `packages/summon/package.json`
  - Change `"version": "0.0.8"` → `"version": "0.0.9"`
  - Acceptance: `package.json` version field is `0.0.9`

- [x] 4.2 Add `.agents/skills/.gitkeep` awareness to installer (`packages/summon/src/skills/installer.ts`)
  - Files: `packages/summon/src/skills/installer.ts`
  - When creating `.agents/skills/` for the first time, do NOT create a `.gitkeep` — the skill subdirectories themselves serve as content
  - Ensure `mkdirSync` uses `{ recursive: true }` so nested paths work
  - Acceptance: First symlink install creates `.agents/skills/<name>/` without errors; no `.gitkeep` file created

## Phase 5: Verification

- [x] 5.1 Manual test: symlink install creates two-tier chain
  - Run TUI, select symlink method, install spec-driven skill for claude-code agent
  - Verify `.agents/skills/spec-driven/SKILL.md` exists and is symlink to source
  - Verify `~/.claude/skills/spec-driven/SKILL.md` exists and is symlink to `.agents/skills/spec-driven/SKILL.md`
  - Verify `readlink` on both symlinks shows relative paths
  - Acceptance: Both symlinks resolve correctly; `cat` on agent path shows skill content

- [x] 5.2 Manual test: copy install unchanged
  - Run TUI, select copy method, install spec-driven skill for cursor agent
  - Verify `.cursor/rules/spec-driven/SKILL.md` exists as regular file (not symlink)
  - Verify `.agents/skills/` is NOT created or modified
  - Acceptance: Copy behavior identical to pre-refactor

- [x] 5.3 Manual test: remove cleans both tiers
  - After 5.1, run remove for the symlink-installed skill
  - Verify agent symlink removed
  - Verify `.agents/skills/spec-driven/` directory removed
  - Acceptance: No orphaned files or directories

- [x] 5.4 Manual test: TUI flow skips scope for symlink
  - Run TUI, select symlink method
  - Verify scope selection step is NOT shown
  - Select copy method in separate run
  - Verify scope selection step IS shown
  - Acceptance: Conditional step display works correctly

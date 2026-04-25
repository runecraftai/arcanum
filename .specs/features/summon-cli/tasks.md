# Tasks: summon-cli

**Feature**: Summon CLI
**Scope**: Large
**Status**: complete
**Date**: 2026-04-24

---

## Phase 1: Foundation — Utils & Agent Registry

- [x] 1.1 Create path utilities (`packages/summon/src/utils/paths.ts`)
  - Files: new file
  - Acceptance: `resolveHome()` expands `~/` to `os.homedir()`, works on macOS/Linux/Windows. `resolveAgentPath()` resolves agent config paths based on scope (global=home-relative, project=cwd-relative). Exported and unit-testable.

- [x] 1.2 Create filesystem utilities (`packages/summon/src/utils/fs.ts`)
  - Files: new file
  - Acceptance: Exports `exists()`, `isSymlink()`, `copyFile()`, `symlinkFile()`, `removeFile()`, `ensureDir()`. All async. Uses `node:fs/promises`. Cross-platform path handling.

- [x] 1.3 Create agent registry (`packages/summon/src/agents/registry.ts`)
  - Files: new file
  - Acceptance: Exports `AGENTS: AgentConfig[]` with all 9 agents defined. Each has id, name, detectPaths, installDir, scope. Exports `AgentConfig` type.

- [x] 1.4 Create agent detector (`packages/summon/src/agents/detector.ts`)
  - Files: new file, `agents/registry.ts`, `utils/paths.ts`, `utils/fs.ts`
  - Acceptance: `detectAgents()` returns `DetectedAgent[]` with detection status for all 9 agents. Uses `exists()` to check paths. Exports `DetectedAgent` type.

- [x] 1.5 Create agent path resolver (`packages/summon/src/agents/resolver.ts`)
  - Files: new file, `agents/registry.ts`, `utils/paths.ts`
  - Acceptance: `resolveInstallPath(agent: AgentConfig): string` returns the resolved absolute path for the agent's skill install directory. Handles both global and project scope.

## Phase 2: Skill System

- [x] 2.1 Add YAML frontmatter to `spec-driven` SKILL.md (`packages/spells/skills/spec-driven/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: File starts with `---\nname: spec-driven\ndescription: ...\ncategory: Architecture\nversion: "1.0.0"\ntags: [planning, lifecycle, specs]\n---`. Existing content preserved after frontmatter. (Note: spec-driven already has frontmatter — verify and normalize to match schema.)

- [x] 2.2 Add YAML frontmatter to `incremental-build` SKILL.md (`packages/spells/skills/incremental-build/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: incremental-build, category: Development, version: "1.0.0", tags: [build, iteration, tdd]. Existing content preserved.

- [x] 2.3 Add YAML frontmatter to `code-review` SKILL.md (`packages/spells/skills/code-review/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: code-review, category: Quality, version: "1.0.0", tags: [review, feedback, standards]. Existing content preserved.

- [x] 2.4 Add YAML frontmatter to `code-simplification` SKILL.md (`packages/spells/skills/code-simplification/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: code-simplification, category: Quality, version: "1.0.0", tags: [refactoring, simplicity, cleanup]. Existing content preserved.

- [x] 2.5 Add YAML frontmatter to `test-verification` SKILL.md (`packages/spells/skills/test-verification/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: test-verification, category: Quality, version: "1.0.0", tags: [testing, verification, coverage]. Existing content preserved.

- [x] 2.6 Add YAML frontmatter to `planning` SKILL.md (`packages/spells/skills/planning/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: planning, category: Architecture, version: "1.0.0", tags: [planning, tasks, breakdown]. Existing content preserved.

- [x] 2.7 Add YAML frontmatter to `shipping` SKILL.md (`packages/spells/skills/shipping/SKILL.md`)
  - Files: existing file (prepend frontmatter)
  - Acceptance: Frontmatter with name: shipping, category: Operations, version: "1.0.0", tags: [release, deploy, changelog]. Existing content preserved.

- [x] 2.8 Create skill loader (`packages/summon/src/skills/loader.ts`)
  - Files: new file
  - Acceptance: `loadSkillCatalog(spellsDir: string)` reads all `*/SKILL.md` files, parses YAML frontmatter, returns `SkillMeta[]`. Exports `SkillMeta` type. Handles missing/malformed frontmatter gracefully (skip with warning).

- [x] 2.9 Create skill discovery (`packages/summon/src/skills/discovery.ts`)
  - Files: new file, `skills/loader.ts`, `agents/detector.ts`, `utils/fs.ts`
  - Acceptance: `discoverInstalledSkills()` scans detected agents' install dirs for skill files matching catalog names. Returns `InstalledSkill[]` with method detection (symlink vs copy). Exports `InstalledSkill` type.

- [x] 2.10 Create skill installer (`packages/summon/src/skills/installer.ts`)
  - Files: new file, `skills/loader.ts`, `agents/resolver.ts`, `utils/fs.ts`
  - Acceptance: `installSkill()` copies or symlinks SKILL.md to agent dir. `removeSkill()` deletes installed file. `updateSkill()` re-copies or re-links. All return `InstallResult` with success/error. Creates install directory if missing.

## Phase 3: TUI Components

- [x] 3.1 Create ASCII art banner (`packages/summon/src/tui/banner.ts`)
  - Files: new file
  - Acceptance: `showBanner()` prints styled ASCII art with "ARCANUM" / "AGENT SKILLS" text. Uses `clack.intro()` or direct console output.

- [x] 3.2 Create agent selection TUI (`packages/summon/src/tui/agent-select.ts`)
  - Files: new file, `agents/detector.ts`
  - Acceptance: `selectAgents(detected: DetectedAgent[])` shows multi-select with "✓ detected" badges on found agents. Returns selected `DetectedAgent[]`. Handles cancel (Ctrl+C). Pre-selects detected agents.

- [x] 3.3 Create action menu TUI (`packages/summon/src/tui/action-menu.ts`)
  - Files: new file
  - Acceptance: `selectAction()` shows select prompt with Install/Update/Remove options. Returns action string. Handles cancel.

- [x] 3.4 Create skill browse TUI (`packages/summon/src/tui/skill-browse.ts`)
  - Files: new file, `skills/loader.ts`
  - Acceptance: `browseSkills(catalog: SkillMeta[])` shows `clack.groupMultiselect()` grouped by category. Returns selected `SkillMeta[]`. Handles cancel. Shows skill description in label.

- [x] 3.5 Create method selection TUI (`packages/summon/src/tui/method-select.ts`)
  - Files: new file
  - Acceptance: `selectMethod()` shows select prompt with Copy (recommended) and Symlink options. Returns `'copy' | 'symlink'`. Handles cancel.

- [x] 3.6 Create progress display (`packages/summon/src/tui/progress.ts`)
  - Files: new file, `skills/installer.ts`
  - Acceptance: `showProgress(results: InstallResult[])` displays spinner during operations and summary table after. Shows per-skill/per-agent success/failure status using `clack.spinner()` and `clack.log`.

## Phase 4: Commands & CLI Wiring

- [x] 4.1 Implement install command (`packages/summon/src/commands/install.ts`)
  - Files: existing file (rewrite), all `tui/*`, `agents/*`, `skills/*`
  - Acceptance: Orchestrates full TUI flow: banner → detect → select agents → action menu → (branch to install/update/remove sub-flows) → execute → progress. Handles cancel at each step gracefully. Exports citty command definition.

- [x] 4.2 Implement update command (`packages/summon/src/commands/update.ts`)
  - Files: new file, `skills/discovery.ts`, `skills/installer.ts`, `tui/agent-select.ts`, `tui/progress.ts`
  - Acceptance: Detects installed skills → shows confirmation → updates all. Uses `discoverInstalledSkills()` + `updateSkill()`. Non-interactive confirmation via clack.confirm(). Exports citty command definition.

- [x] 4.3 Implement remove command (`packages/summon/src/commands/remove.ts`)
  - Files: new file, `skills/discovery.ts`, `skills/installer.ts`, `tui/progress.ts`
  - Acceptance: Detects installed skills → multi-select which to remove → confirm → remove. Uses `discoverInstalledSkills()` + `removeSkill()`. Exports citty command definition.

- [x] 4.4 Implement list command (`packages/summon/src/commands/list.ts`)
  - Files: existing file (rewrite), `skills/discovery.ts`, `agents/detector.ts`
  - Acceptance: Non-interactive. Prints formatted table: Agent | Skill | Method | Path. No TUI prompts. Exits cleanly. Exports citty command definition.

- [x] 4.5 Wire CLI entry point (`packages/summon/src/cli.ts`)
  - Files: existing file (rewrite)
  - Acceptance: Registers all 4 subcommands (install, update, remove, list). Default action (no subcommand) runs install flow. Uses citty `defineCommand` with lazy imports. `meta` has name, version, description.

## Phase 5: Build & Package

- [x] 5.1 Update package.json for npm publishing (`packages/summon/package.json`)
  - Files: existing file
  - Acceptance: `bin` field maps `summon` to correct entry. `files` includes `dist/` and source. `main`/`module` fields set. `publishConfig` set for public access. `scripts` includes build command.

- [x] 5.2 Verify build compiles (`packages/summon/`)
  - Files: `package.json`, `src/cli.ts`
  - Acceptance: `bun build src/cli.ts --compile --target bun --outfile dist/summon` completes without errors. Also verify non-compiled build works: `bun run src/cli.ts` launches CLI.

## Phase 6: Integration & Polish

- [x] 6.1 Handle edge case — no agents detected
  - Files: `commands/install.ts`, `tui/agent-select.ts`
  - Acceptance: When no agents found, shows helpful message listing supported agents and their expected config paths. Does not crash. Offers to proceed anyway (for pre-setup).

- [x] 6.2 Handle edge case — no skills catalog found
  - Files: `skills/loader.ts`, `commands/install.ts`
  - Acceptance: When spells directory not found or empty, shows clear error message with expected path. Exits gracefully.

- [x] 6.3 Handle edge case — permission errors on install
  - Files: `skills/installer.ts`, `tui/progress.ts`
  - Acceptance: Permission denied errors are caught per-file, reported in progress output, and don't halt other installations. Summary shows which failed and why.

- [x] 6.4 Handle cancel (Ctrl+C) at every TUI step
  - Files: all `tui/*.ts`, all `commands/*.ts`
  - Acceptance: `clack.isCancel()` checked after every prompt. Clean exit with `clack.outro('Cancelled.')`. No orphan processes or partial state.

---

## Dependency Order

```
Phase 1 (Foundation) → Phase 2 (Skills) → Phase 3 (TUI) → Phase 4 (Commands) → Phase 5 (Build) → Phase 6 (Polish)
```

Within phases:
- 1.1, 1.2 → 1.3 → 1.4, 1.5 (utils before registry, registry before detector/resolver)
- 2.1–2.7 can be parallel (frontmatter additions are independent)
- 2.8 → 2.9 → 2.10 (loader before discovery before installer)
- 3.1–3.6 can be parallel (TUI components are independent)
- 4.1–4.4 depend on Phase 3 + Phase 2. 4.5 depends on 4.1–4.4.
- 5.1–5.2 depend on 4.5
- 6.1–6.4 depend on Phase 4

## Summary

| Phase | Tasks | Estimated files |
|-------|-------|----------------|
| 1. Foundation | 5 | 5 new |
| 2. Skills | 10 | 7 modified + 3 new |
| 3. TUI | 6 | 6 new |
| 4. Commands | 5 | 2 rewritten + 2 new + 1 rewritten |
| 5. Build | 2 | 1 modified |
| 6. Polish | 4 | ~6 modified |
| **Total** | **32** | **16 new + ~16 modified** |

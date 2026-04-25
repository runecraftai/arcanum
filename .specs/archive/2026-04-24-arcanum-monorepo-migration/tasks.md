---
feature: arcanum-monorepo-migration
status: DONE
scope: large
created: 2026-04-24
phases: 7
total_tasks: 19
---

# Tasks: Arcanum Monorepo Migration

## Phase 1 — Root Infrastructure

- [x] 1.1 Update root `package.json` for monorepo
  - Files: `package.json`
  - What: Update `"name"` to `"arcanum"`, add `"private": true`, add `"workspaces": ["packages/*"]`. Keep existing devDependencies (`@changesets/cli`). Remove old `@runecraft/skills` reference if present. Ensure `"packageManager"` field references bun.
  - Depends on: nothing
  - Requirement: ARC-01
  - Acceptance:
    - [ ] `"name": "arcanum"`
    - [ ] `"private": true`
    - [ ] `"workspaces": ["packages/*"]`
    - [ ] `@changesets/cli` still in devDependencies

- [x] 1.2 Create `turbo.json`
   - Files: `turbo.json` (new)
   - What: Create Turborepo v2 configuration with `$schema` pointing to `https://turbo.build/schema.json`. Define three tasks: `build` with `outputs: ["dist/**"]`, `lint` with no special config, `test` with `dependsOn: ["build"]`.
   - Depends on: nothing
   - Requirement: ARC-02
   - Acceptance:
     - [x] `$schema` is `https://turbo.build/schema.json`
     - [x] `tasks.build.outputs` is `["dist/**"]`
     - [x] `tasks.lint` exists
     - [x] `tasks.test.dependsOn` is `["build"]`

- [x] 1.3 Update `.gitignore`
   - Files: `.gitignore`
   - What: Ensure the following entries exist (append if missing): `node_modules/`, `dist/`, `.turbo/`, `.changeset/*.md` (not config.json). Do not remove existing entries.
   - Depends on: nothing
   - Requirement: (infrastructure)
   - Acceptance:
     - [x] `node_modules/` in .gitignore
     - [x] `dist/` in .gitignore
     - [x] `.turbo/` in .gitignore

- [x] 1.4 Create root `README.md`
   - Files: `README.md`
   - What: Create (or replace) root README with project name "Arcanum", tagline, and a table listing all 4 packages with columns: Package, npm name, Description, Status. Include brief "Getting Started" section with `bun install` and `bunx turbo build`.
   - Depends on: nothing
   - Requirement: US-08
   - Acceptance:
     - [x] README has "Arcanum" heading
     - [x] Table lists all 4 packages with npm names
     - [x] Getting Started section present

## Phase 2 — Migrate Spells Package

- [x] 2.1 Execute `git mv` for skills directory
   - Files: `skills/` → `packages/spells/skills/`
   - What: Create `packages/spells/` directory. Run `git mv skills/ packages/spells/skills/`. This stages the move automatically. Do NOT modify any SKILL.md content.
   - Depends on: nothing
   - Requirement: ARC-03
   - Acceptance:
     - [x] `packages/spells/skills/` contains all 7 skill directories
     - [x] `skills/` no longer exists at root
     - [x] `git log --follow --oneline -3 packages/spells/skills/spec-driven/SKILL.md` shows prior commits
     - [x] No SKILL.md content was modified

- [x] 2.2 Create spells `package.json`
   - Files: `packages/spells/package.json` (new)
   - What: Create package.json with `"name": "@runecraftai/spells"`, `"version": "0.0.1"`, `"description": "Agent skill definitions for Arcanum"`, `"license": "MIT"`, no dependencies, no build script. Add `"files": ["skills/"]` for future publishing.
   - Depends on: 2.1
   - Requirement: ARC-04
   - Acceptance:
     - [x] `"name": "@runecraftai/spells"`
     - [x] `"version": "0.0.1"`
     - [x] No dependencies section (or empty)
     - [x] `"files": ["skills/"]`

- [x] 2.3 Create spells `README.md`
   - Files: `packages/spells/README.md` (new)
   - What: Create README describing the spells package. List all 7 skills with brief descriptions. Note that skills are SKILL.md markdown files consumed by AI agents.
   - Depends on: 2.1
   - Requirement: ARC-04
   - Acceptance:
     - [x] README lists all 7 skills by name
     - [x] Description explains purpose

## Phase 3 — Bootstrap Grimoire Package

- [x] 3.1 Create grimoire `package.json`
   - Files: `packages/grimoire/package.json` (new)
   - What: Create package.json with `"name": "@runecraftai/grimoire"`, `"version": "0.0.1"`, `"private": false`, `"description": "Shared configurations for Arcanum packages"`, `"license": "MIT"`. No build script. Add `"files": ["biome.json", "tsconfig.base.json"]`.
   - Depends on: nothing
   - Requirement: ARC-13
   - Acceptance:
     - [x] `"name": "@runecraftai/grimoire"`
     - [x] `"version": "0.0.1"`
     - [x] `"private": false`
     - [x] `"files"` includes config files

- [x] 3.2 Create grimoire `biome.json`
   - Files: `packages/grimoire/biome.json` (new)
   - What: Create shared Biome configuration. Include `$schema` reference, `organizeImports` enabled, `formatter` with indent style tabs and line width 100, `linter` with recommended rules enabled. This serves as the base config other packages extend.
   - Depends on: nothing
   - Requirement: ARC-05
   - Acceptance:
     - [x] Valid biome.json with `$schema`
     - [x] `organizeImports` enabled
     - [x] `formatter` configured
     - [x] `linter.rules.recommended` is true

- [x] 3.3 Create grimoire `tsconfig.base.json`
   - Files: `packages/grimoire/tsconfig.base.json` (new)
   - What: Create shared TypeScript base config with `"strict": true`, `"target": "ESNext"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"resolveJsonModule": true`, `"declaration": true`, `"declarationMap": true`, `"sourceMap": true`, `"types": ["bun-types"]`.
   - Depends on: nothing
   - Requirement: ARC-06
   - Acceptance:
     - [x] `"strict": true`
     - [x] `"target": "ESNext"`
     - [x] `"moduleResolution": "bundler"`
     - [x] `"types"` includes `"bun-types"`

- [x] 3.4 Create grimoire `README.md`
   - Files: `packages/grimoire/README.md` (new)
   - What: Create README explaining grimoire is the shared config package. Document how to extend biome.json and tsconfig.base.json from other packages. Include example `"extends"` snippets.
   - Depends on: nothing
   - Requirement: ARC-13
   - Acceptance:
     - [x] README explains purpose
     - [x] Usage examples for extending configs

## Phase 4 — Bootstrap Summon Package

- [x] 4.1 Create summon `package.json`
   - Files: `packages/summon/package.json` (new)
   - What: Create package.json with `"name": "@runecraftai/summon"`, `"version": "0.0.1"`, `"description": "CLI installer for Arcanum agent skills"`, `"license": "MIT"`, `"type": "module"`. Dependencies: `"citty"` and `"@clack/prompts"`. Scripts: `"build": "bun build src/cli.ts --compile --target bun --outfile dist/summon"`. Bin: `"summon": "dist/summon"`.
   - Depends on: nothing
   - Requirement: ARC-09
   - Acceptance:
     - [x] `"name": "@runecraftai/summon"`
     - [x] `"dependencies"` has `citty` and `@clack/prompts`
     - [x] `"build"` script uses `bun build --compile`
     - [x] `"bin"` maps `"summon"` to `"dist/summon"`

- [x] 4.2 Create summon `src/cli.ts`
   - Files: `packages/summon/src/cli.ts` (new)
   - What: Create main CLI entry using citty. Import `defineCommand` and `runMain` from `citty`. Define main command with name `"summon"`, version `"0.0.1"`, description `"Arcanum skill installer"`. Add `install` as a lazy subcommand: `subCommands: { install: () => import("./commands/install").then(m => m.default) }`. Call `runMain(main)`.
   - Depends on: nothing
   - Requirement: ARC-07
   - Acceptance:
     - [x] Imports `defineCommand`, `runMain` from `citty`
     - [x] Main command defined with name, version, description
     - [x] `install` subcommand is lazy-loaded
     - [x] `runMain` called at module level

- [x] 4.3 Create summon `src/commands/install.ts`
   - Files: `packages/summon/src/commands/install.ts` (new)
   - What: Create install subcommand. Import `defineCommand` from `citty` and `outro` from `@clack/prompts`. Define and default-export a command with name `"install"`, description `"Install agent skills"`. In the `run` handler, call `outro("⏳ Not yet implemented. Coming soon.")`.
   - Depends on: nothing
   - Requirement: ARC-08
   - Acceptance:
     - [x] Imports from `citty` and `@clack/prompts`
     - [x] Default export is a `defineCommand` result
     - [x] Run handler calls `outro` with "not yet implemented" message

- [x] 4.4 Create summon `tsconfig.json`
   - Files: `packages/summon/tsconfig.json` (new)
   - What: Create tsconfig that extends grimoire's base: `"extends": "@runecraftai/grimoire/tsconfig.base.json"`. Set `"compilerOptions": { "outDir": "dist", "rootDir": "src" }`, `"include": ["src/**/*.ts"]`.
   - Depends on: 3.3
   - Requirement: ARC-06 (integration)
   - Acceptance:
     - [x] Extends `@runecraftai/grimoire/tsconfig.base.json`
     - [x] `include` covers `src/**/*.ts`

- [x] 4.5 Create summon `README.md`
   - Files: `packages/summon/README.md` (new)
   - What: Create README describing summon as the Arcanum CLI installer. Note it's currently a scaffold. Document build command (`bun run build`) and usage (`./dist/summon install`). Mention citty + @clack/prompts stack.
   - Depends on: nothing
   - Requirement: ARC-07
   - Acceptance:
     - [x] README describes purpose and current scaffold status
     - [x] Build and usage instructions included

## Phase 5 — Bootstrap Guild Package

- [x] 5.1 Create guild `package.json`
   - Files: `packages/guild/package.json` (new)
   - What: Create package.json with `"name": "@runecraftai/guild"`, `"version": "0.0.1"`, `"private": false`, `"description": "Agent party and swarm configurations for Arcanum"`, `"license": "MIT"`. No dependencies, no build script, no main/exports.
   - Depends on: nothing
   - Requirement: ARC-10
   - Acceptance:
     - [x] `"name": "@runecraftai/guild"`
     - [x] `"version": "0.0.1"`
     - [x] No `src/` directory created
     - [x] No `index.ts` created

- [x] 5.2 Create guild `README.md`
   - Files: `packages/guild/README.md` (new)
   - What: Create README stating this package will contain agent party/swarm configurations. Include note: "Researching swarm architecture (inspired by Weave.io). Implementation coming soon." Mention that the package is intentionally a placeholder.
   - Depends on: nothing
   - Requirement: ARC-10
   - Acceptance:
     - [x] README describes future intent
     - [x] Mentions Weave.io inspiration
     - [x] States "implementation coming soon"
     - [x] Does NOT reference any src files or imports

## Phase 6 — Monorepo Configuration

- [x] 6.1 Create `.changeset/config.json`
   - Files: `.changeset/config.json` (new)
   - What: Create Changesets config directory and file. Config: `"$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json"`, `"changelog": "@changesets/cli/changelog"`, `"commit": false`, `"fixed": []`, `"linked": []`, `"access": "public"`, `"baseBranch": "main"`, `"updateInternalDependencies": "patch"`, `"ignore": []`.
   - Depends on: nothing
   - Requirement: ARC-11
   - Acceptance:
     - [x] `.changeset/` directory exists
     - [x] `config.json` has `"fixed": []` (independent versioning)
     - [x] `"access": "public"`
     - [x] `"baseBranch": "main"`

- [x] 6.2 Update git remote
   - Files: (git config)
   - What: Run `git remote set-url origin https://github.com/runecraftai/arcanum.git`. User must have created the GitHub repo beforehand. Verify with `git remote get-url origin`.
   - Depends on: nothing (but should be done last logically)
   - Requirement: ARC-12
   - Acceptance:
     - [x] `git remote get-url origin` returns URL containing `runecraftai/arcanum`

## Phase 7 — Verification

- [x] 7.1 Run `bun install` and verify workspace resolution
   - Files: `bun.lock` (regenerated)
   - What: Run `bun install` at repo root. Verify it completes without errors. Check that `node_modules/@runecraftai` contains symlinks to local packages.
   - Depends on: 1.1, 2.2, 3.1, 4.1, 5.1
   - Requirement: ARC-01, ARC-02
   - Acceptance:
     - [x] `bun install` exits 0
     - [x] `node_modules/@runecraftai/spells` is a symlink
     - [x] `node_modules/@runecraftai/summon` is a symlink

- [x] 7.2 Run `bunx turbo build --dry-run` and verify package discovery
   - Files: (none modified)
   - What: Run `bunx turbo build --dry-run` to verify Turborepo discovers all packages. Summon should appear (has build script). Spells, grimoire, guild should be discovered but have no build task.
   - Depends on: 7.1, 1.2
   - Requirement: ARC-02
   - Acceptance:
     - [x] Command exits without error
     - [x] Summon's build task is listed in dry-run output

- [x] 7.3 Verify git history preservation
   - Files: (none modified)
   - What: Run `git log --follow --oneline -5 packages/spells/skills/spec-driven/SKILL.md` and verify commits from before the migration appear.
   - Depends on: 2.1
   - Requirement: ARC-03
   - Acceptance:
     - [x] Output shows commits prior to the migration commit
     - [x] At least 2 historical commits visible

- [x] 7.4 Commit migration
   - Files: (all staged)
   - What: Do NOT commit — Herald will propose the commit separately after reviews pass. Just verify `git status` shows only expected changes.
   - Depends on: 7.1, 7.2, 7.3
   - Requirement: (all)
   - Acceptance:
     - [x] `git status` shows all migration files staged or modified
     - [x] No unexpected files changed

## Requirement Coverage

| Requirement | Covered by Tasks |
|-------------|-----------------|
| ARC-01 | 1.1, 7.1 |
| ARC-02 | 1.2, 7.2 |
| ARC-03 | 2.1, 7.3 |
| ARC-04 | 2.2, 2.3 |
| ARC-05 | 3.2 |
| ARC-06 | 3.3, 4.4 |
| ARC-07 | 4.2, 4.5 |
| ARC-08 | 4.3 |
| ARC-09 | 4.1 |
| ARC-10 | 5.1, 5.2 |
| ARC-11 | 6.1 |
| ARC-12 | 6.2 |
| ARC-13 | 3.1, 3.4 |

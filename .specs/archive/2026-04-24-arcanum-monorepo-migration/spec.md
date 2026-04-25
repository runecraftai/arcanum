---
feature: arcanum-monorepo-migration
status: DONE
scope: large
created: 2026-04-24
---

# Spec: Arcanum Monorepo Migration

## Problem Statement

The `90sRehem/agent-skills` repository is a flat project containing 7 agent skill definitions (SKILL.md files), a Node.js installer script (`install.js`), and minimal tooling. As the project evolves into a multi-package ecosystem — with shared configs, a CLI installer, and future swarm/party capabilities — the flat structure cannot support independent versioning, isolated builds, or clear package boundaries.

The repository needs to be restructured in-place into a Bun workspaces + Turborepo v2 monorepo under the new identity `runecraftai/arcanum`, with 4 distinct packages, while preserving full git history for migrated files.

## Goals

1. Restructure the repository into a monorepo with 4 packages under `packages/`
2. Preserve git history for all migrated files using `git mv`
3. Establish monorepo tooling (Bun workspaces, Turborepo v2, Changesets)
4. Scaffold a CLI installer (`summon`) with citty + @clack/prompts
5. Create shared configuration package (`grimoire`) with biome.json and tsconfig.base.json
6. Create a placeholder package (`guild`) for future swarm/party research
7. Update git remote to `runecraftai/arcanum`

## Out of Scope

- Implementing guild functionality (placeholder only)
- Full port of install.js logic to summon (scaffold only — prints "not yet implemented")
- CI/CD pipelines or GitHub Actions
- npm publishing or registry configuration
- Modifying any skill SKILL.md content
- Creating the GitHub repository (user does manually)

## User Stories

### P1 — Must Have

- **US-01**: As a maintainer, I want skills organized under `packages/spells/` so they live in a proper monorepo package with independent versioning.
- **US-02**: As a maintainer, I want Bun workspaces and Turborepo v2 configured so I can run tasks across all packages efficiently.
- **US-03**: As a maintainer, I want a shared config package (`grimoire`) with biome.json and tsconfig.base.json so all packages use consistent linting, formatting, and TypeScript settings.
- **US-04**: As a developer, I want a scaffolded `summon` CLI built with citty and @clack/prompts so the installer framework is ready for future implementation.

### P2 — Should Have

- **US-05**: As a maintainer, I want a `guild` placeholder package with a README describing future plans so the namespace is reserved and intent is documented.
- **US-06**: As a maintainer, I want Changesets configured for independent versioning so each package can be released separately.
- **US-07**: As a maintainer, I want the git remote updated to `runecraftai/arcanum` so pushes go to the correct upstream.

### P3 — Nice to Have

- **US-08**: As a contributor, I want a root README with a table of all packages so I can quickly understand the monorepo structure.

## Acceptance Criteria

| ID     | Criterion | Verification |
|--------|-----------|--------------|
| ARC-01 | Root `package.json` has `"name": "arcanum"`, `"private": true`, `"workspaces": ["packages/*"]` | Inspect package.json |
| ARC-02 | `turbo.json` exists with v2 schema, `build` task with `outputs: ["dist/**"]`, `lint` task, `test` task with `dependsOn: ["build"]` | Inspect turbo.json |
| ARC-03 | All 7 skill directories moved via `git mv` from `skills/` to `packages/spells/skills/`; `git log --follow` shows prior history | Run `git log --follow --oneline -3 packages/spells/skills/spec-driven/SKILL.md` |
| ARC-04 | `packages/spells/package.json` has `"name": "@runecraftai/spells"`, `"version": "0.0.1"` | Inspect file |
| ARC-05 | `packages/grimoire/biome.json` exists with shared linting/formatting config | Inspect file |
| ARC-06 | `packages/grimoire/tsconfig.base.json` exists with shared TypeScript base config | Inspect file |
| ARC-07 | `packages/summon/src/cli.ts` uses citty `defineCommand` + `runMain`, has lazy `install` subcommand | Inspect file |
| ARC-08 | Summon install command imports `@clack/prompts` and prints "not yet implemented" message | Inspect `packages/summon/src/commands/install.ts` |
| ARC-09 | `packages/summon/package.json` has `"build": "bun build src/cli.ts --compile --target bun --outfile dist/summon"` | Inspect file |
| ARC-10 | `packages/guild/` contains only `package.json` and `README.md` — no `src/` directory, no `index.ts` | `ls packages/guild/` shows exactly 2 files |
| ARC-11 | `.changeset/config.json` exists with `"fixed": []`, independent versioning, `"access": "public"` | Inspect file |
| ARC-12 | `git remote get-url origin` returns a URL containing `runecraftai/arcanum` | Run command |
| ARC-13 | `packages/grimoire/package.json` has `"name": "@runecraftai/grimoire"`, `"version": "0.0.1"`, `"private": false` | Inspect file |

## Success Criteria

1. `bun install` at root resolves all workspaces without errors
2. `bunx turbo build --dry-run` discovers all packages with build tasks
3. `git log --follow` confirms history preservation for migrated skill files
4. All 4 packages have valid `package.json` files
5. No skill SKILL.md content was modified during migration

## Traceability Matrix

| Requirement | User Story | Tasks |
|-------------|-----------|-------|
| ARC-01 | US-02 | 1.1 |
| ARC-02 | US-02 | 1.2 |
| ARC-03 | US-01 | 2.1 |
| ARC-04 | US-01 | 2.2 |
| ARC-05 | US-03 | 3.2 |
| ARC-06 | US-03 | 3.3 |
| ARC-07 | US-04 | 4.2 |
| ARC-08 | US-04 | 4.3 |
| ARC-09 | US-04 | 4.1 |
| ARC-10 | US-05 | 5.1, 5.2 |
| ARC-11 | US-06 | 6.1 |
| ARC-12 | US-07 | 6.2 |
| ARC-13 | US-03 | 3.1 |

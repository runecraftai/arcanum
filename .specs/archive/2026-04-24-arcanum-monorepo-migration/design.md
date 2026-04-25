---
feature: arcanum-monorepo-migration
status: DONE
scope: large
created: 2026-04-24
---

# Design: Arcanum Monorepo Migration

## Architecture Overview

```
arcanum/                          (repo root)
├── .changeset/
│   └── config.json               (changesets independent versioning)
├── packages/
│   ├── spells/                    (@runecraftai/spells)
│   │   ├── package.json
│   │   ├── README.md
│   │   └── skills/               ← git mv'd from root skills/
│   │       ├── spec-driven/
│   │       │   └── SKILL.md
│   │       ├── planning/
│   │       │   └── SKILL.md
│   │       ├── incremental-build/
│   │       │   └── SKILL.md
│   │       ├── test-verification/
│   │       │   └── SKILL.md
│   │       ├── code-review/
│   │       │   └── SKILL.md
│   │       ├── code-simplification/
│   │       │   └── SKILL.md
│   │       └── shipping/
│   │           └── SKILL.md
│   ├── grimoire/                  (@runecraftai/grimoire)
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── biome.json
│   │   └── tsconfig.base.json
│   ├── summon/                    (@runecraftai/summon)
│   │   ├── package.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── cli.ts             (citty main entry)
│   │       └── commands/
│   │           └── install.ts     (stub with @clack/prompts)
│   └── guild/                     (@runecraftai/guild)
│       ├── package.json
│       └── README.md              (placeholder — no src/)
├── package.json                   (root — workspaces config)
├── turbo.json                     (Turborepo v2)
├── bun.lock                       (auto-generated)
├── .gitignore
└── README.md                      (monorepo overview)
```

## Key Design Decisions

### D1: Bun Workspaces

**Decision**: Use Bun's native workspace support via `"workspaces": ["packages/*"]` in root `package.json`.

**Rationale**: Already using Bun (bun.lock exists), native workspace support eliminates additional tooling. Bun workspaces auto-link local packages via symlinks in `node_modules`.

**Consequence**: All packages discovered automatically. `bun install` at root resolves everything. No hoisting configuration needed.

### D2: Turborepo v2

**Decision**: Use Turborepo v2 for task orchestration (`turbo.json` with `$schema` pointing to v2).

**Rationale**: Provides parallel task execution, dependency-aware ordering, and build caching. V2 schema is simpler (no `pipeline` wrapper — tasks are top-level).

**Consequence**: `turbo build` runs build across all packages respecting `dependsOn`. Packages without a `build` script are skipped gracefully.

### D3: git mv for History Preservation

**Decision**: Use `git mv skills/ packages/spells/skills/` to relocate skill files in-place.

**Rationale**: `git mv` preserves history accessible via `git log --follow`. Same repository, no subtree import needed.

**Consequence**: Must create `packages/spells/` directory before `git mv`. The `git mv` command stages changes automatically. One atomic commit for the migration.

### D4: citty for Summon CLI

**Decision**: Use citty (UnJS) as the CLI framework for the `summon` package.

**Rationale**: Functional API, lazy subcommand loading, tree-shakeable, zero-config TypeScript support with Bun. Lighter than commander/yargs with better DX.

**Structure**:
- `src/cli.ts` — main entry using `defineCommand` + `runMain`
- `src/commands/install.ts` — lazy-loaded subcommand using `defineCommand`
- Install subcommand prints "not yet implemented" using `@clack/prompts` outro

### D5: bun build --compile for Standalone Binary

**Decision**: Build summon as a standalone binary using `bun build src/cli.ts --compile --target bun --outfile dist/summon`.

**Rationale**: Single binary distribution, no runtime dependencies needed for end users. Bun's compile produces fast-starting executables.

**Consequence**: Build script in package.json. Output goes to `dist/summon`. The `dist/` directory is gitignored but captured by Turborepo's `outputs: ["dist/**"]`.

### D6: Changesets for Independent Versioning

**Decision**: Use Changesets with independent versioning (not fixed).

**Rationale**: Each package evolves at its own pace. Spells has content updates, summon has CLI updates, grimoire has config updates — different release cadences.

**Configuration**: `.changeset/config.json` with `"fixed": []`, `"access": "public"`, `"baseBranch": "main"`.

## Component Specifications

### Spells Package (`@runecraftai/spells`)

- **Source**: Migrated from root `skills/` via `git mv`
- **Contents**: 7 skill directories, each containing `SKILL.md`
- **package.json**: name `@runecraftai/spells`, version `0.0.1`, no build step, no dependencies
- **Exports**: None (markdown-only package, consumed by file path)
- **Note**: SKILL.md files are NOT modified — content migration only

### Grimoire Package (`@runecraftai/grimoire`)

- **Purpose**: Shared configurations consumed by other packages
- **biome.json**: Linting and formatting rules (standard config with organizeImports, formatter, linter sections)
- **tsconfig.base.json**: TypeScript base config with strict mode, ESNext target, Bun module resolution
- **package.json**: name `@runecraftai/grimoire`, version `0.0.1`, private `false`, no build step
- **Consumption**: Other packages reference via `"extends": "@runecraftai/grimoire/tsconfig.base.json"`

### Summon Package (`@runecraftai/summon`)

- **Purpose**: CLI installer (scaffold only)
- **Dependencies**: `citty`, `@clack/prompts`
- **Entry**: `src/cli.ts` — defines main command with `install` subcommand
- **Build**: `bun build src/cli.ts --compile --target bun --outfile dist/summon`
- **Behavior**: Running `summon install` prints "⏳ Not yet implemented. Coming soon." via @clack/prompts outro
- **bin**: `"summon": "dist/summon"` in package.json

### Guild Package (`@runecraftai/guild`)

- **Purpose**: Placeholder for future agent party/swarm configurations
- **Contents**: `package.json` + `README.md` ONLY
- **No**: src/ directory, index.ts, or any source files
- **README**: Describes intent, mentions Weave.io inspiration, states "implementation coming soon"

## Error Handling Notes

- `git mv` will fail if target directory doesn't exist → create `packages/spells/` first
- `bun install` may warn about packages without `main` or `exports` → acceptable for spells (markdown-only) and guild (placeholder)
- `turbo build --dry-run` will skip packages without a `build` script → expected for spells, grimoire, guild

## Tech Decisions Table

| Area | Choice | Alternative Considered | Why |
|------|--------|----------------------|-----|
| Package manager | Bun | pnpm, yarn | Already in use, native workspaces |
| Task runner | Turborepo v2 | Nx, Lerna | Simpler config, Vercel ecosystem |
| Git strategy | git mv | git subtree, fresh repo | Same repo, preserves history |
| CLI framework | citty | commander, yargs, oclif | UnJS ecosystem, lazy commands, functional API |
| CLI UI | @clack/prompts | inquirer, prompts | Beautiful defaults, composable |
| CLI build | bun compile | esbuild, tsup | Native Bun, standalone binary |
| Versioning | Changesets | semantic-release, lerna | Independent versioning, PR workflow |
| Shared config | grimoire package | Root-level configs | Publishable, explicit dependency |

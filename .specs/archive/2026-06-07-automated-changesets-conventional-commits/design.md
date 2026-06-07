# Technical Design: Automated Changesets from Conventional Commits

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                     │
│                                                         │
│  Developer writes code                                  │
│       │                                                 │
│       ▼                                                 │
│  git commit -m "feat(spells): add fireball"             │
│       │                                                 │
│       ├──► .husky/commit-msg ──► commitlint             │
│       │         (validates conventional format)          │
│       │                                                 │
│  OR: bun run commit                                     │
│       │                                                 │
│       └──► commitizen + cz-git (interactive prompt)     │
│                                                         │
└───────────────────────┬─────────────────────────────────┘
                        │ git push
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   CI (GitHub Actions)                    │
│                   push to main                          │
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │  Step 1: generate-changesets            │            │
│  │                                         │            │
│  │  1. Get last release tag                │            │
│  │  2. Read commits since tag              │            │
│  │  3. Parse with conventional-commits-    │            │
│  │     parser                              │            │
│  │  4. Filter: only feat/fix/perf/refactor │            │
│  │  5. Detect affected packages via        │            │
│  │     git diff per commit                 │            │
│  │  6. Exclude ignored packages            │            │
│  │  7. Generate .changeset/<hash>.md       │            │
│  │  8. git add + commit if changes         │            │
│  └─────────────┬───────────────────────────┘            │
│                │                                        │
│                ▼                                        │
│  ┌─────────────────────────────────────────┐            │
│  │  Step 2: changesets/action@v1.4.7       │            │
│  │  (existing — unchanged)                 │            │
│  │                                         │            │
│  │  • Creates Version PR                   │            │
│  │    (bun changeset:version)              │            │
│  │  • OR publishes                         │            │
│  │    (bun run publish:packages)           │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## New Files to Create

### 1. `.husky/commit-msg`
```sh
bunx --no -- commitlint --edit $1
```

### 2. `commitlint.config.ts`
Extends `@commitlint/config-conventional`, defines scopes matching workspace package short names, configures cz-git prompt options.

### 3. `.changeset/generate-from-commits.ts`
CI script that reads conventional commits and generates changeset files.
- **Runtime:** `bun run .changeset/generate-from-commits.ts`
- Uses `conventional-commits-parser` and Bun's native `Bun.spawnSync` for git commands

## Existing Files to Modify

### 1. `package.json` (root)
- Add `"prepare": "husky"` to scripts
- Add `"commit": "cz"` to scripts
- Add `config.commitizen.path` pointing to `cz-git`
- Add devDependencies: `husky ^9.1.0`, `@commitlint/cli ^19.8.0`, `@commitlint/config-conventional ^19.8.0`, `commitizen ^4.3.0`, `cz-git ^1.13.0`, `conventional-commits-parser ^6.1.0`

### 2. `.github/workflows/release.yml`
- Change checkout to `fetch-depth: 0`
- Add `HUSKY: "0"` to install step env
- Add generate-changesets steps BEFORE existing changesets/action step
- Add `createGithubReleases: true` explicitly to changesets/action

## Changeset Auto-Generation Script Design

### Tag Format
Tags created by `changesets/action`: `@runecraft/<package>@<version>` (e.g., `@runecraft/summon@1.2.3`)
Script finds last release via: `git tag --list '@runecraft/*@*' --sort=-version:refname`

### Bump Type Mapping

| Commit Type | Breaking? | Bump |
|-------------|-----------|------|
| `feat` | No | `minor` |
| `feat` | Yes (`!` or BREAKING CHANGE footer) | `major` |
| `fix`, `perf`, `refactor` | No | `patch` |
| `fix`, `perf`, `refactor` | Yes | `major` |
| `chore`, `docs`, `style`, `test`, `ci`, `build` | Any | skip |

### Package Path Mapping
Built at runtime from filesystem — reads `packages/*/package.json`:
```
packages/summon  → @runecraft/summon
packages/spells  → @runecraft/spells
packages/familiar → @runecraft/familiar
packages/guild   → @runecraft/guild
packages/grimoire → @runecraft/grimoire
```

### Edge Cases Handled
1. No tags yet → fallback to first commit
2. No releasable commits → exit 0, no files written
3. Commits touch only root files → no packages affected, no changeset
4. Commits touch only ignored packages → filtered out
5. Multiple commits affect same package → aggregated, highest bump wins
6. Manual changesets already exist → coexist without conflict

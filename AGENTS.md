# AGENTS.md — arcanum monorepo

Instructions for any AI agent working in this repository.

## What this repo is

Arcanum is a TypeScript/Bun monorepo that ships AI tooling for the OpenCode editor. Core artifacts:

| Package | Description |
| --- | --- |
| `@runecraft/guild` | Multi-agent orchestration plugin (8 RPG-themed agents, hooks, evals, analytics) |
| `@runecraft/runes` | Persistent cross-session memory plugin (SQLite-backed, 10 agent tools) |
| `@runecraft/spells` | Agent skill scrolls (SKILL.md files for Cursor, Claude, Copilot) |
| `@runecraft/summon` | CLI installer for spells |
| `@runecraft/spawn` | tmux subagent pane manager plugin |
| `@runecraft/grimoire` | Shared Biome + TypeScript base configs |
| `@runecraft/familiar` | Internal Pi multi-agent runtime (private, not published) |

## Repository structure

```
packages/
  guild/        # Multi-agent orchestration plugin
  runes/        # Persistent memory plugin
  spells/       # Skill scroll library
  summon/       # CLI skill installer
  spawn/        # tmux pane manager plugin
  grimoire/     # Shared configs (Biome, TypeScript)
  familiar/     # Internal runtime (private)
.guild/         # Working memory: plans, context, knowledge, analytics
.changeset/     # Changesets versioning config
.github/        # CI/CD workflows (release.yml)
.husky/         # Git hooks (commit-msg, pre-commit)
```

## Tech stack

- **Runtime**: Bun 1.3.5 (primary), Node.js ≥ 18 (compatibility target for published packages)
- **Language**: TypeScript (strict, ESNext, ESM modules)
- **Monorepo**: Bun workspaces + Turborepo v2
- **Build**: `bun build` → `dist/` per package
- **Lint/format**: Biome 1.9.2 (unified, configured via `packages/grimoire/biome.json`)
- **Tests**: `bun test` (built-in runner)
- **Commits**: Commitizen + cz-git + commitlint (conventional commits)
- **Versioning**: Changesets (independent semver per package)

## Conventions

### Code style

- Biome enforces formatting and linting. Run `bun run lint` before marking any task done.
- Tabs for indentation, 100-char line limit.
- No `eslint-disable` comments — fix the rule instead.
- `packages/runes/` has an additional rule: **no comments in source files**. Code must be self-explanatory through naming and types.

### Naming

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Test files: colocated with source or under `tests/` / `src/__tests__/`, named `*.test.ts`

### Testing

```bash
# Run all tests (from repo root)
bun test

# Run tests for a single package
bun test --cwd packages/guild
bun test --cwd packages/runes
bun test --cwd packages/spawn

# Run a single test file
bun test packages/guild/src/hooks/start-work-hook.test.ts
```

Tests use `bun test` built-in runner. Use `os.tmpdir()` for filesystem fixtures — never write inside the package tree.

### Commits

Conventional commits enforced by commitlint. Use `bun run commit` (Commitizen) for interactive prompts. Format: `type(scope): description`. Valid scopes are the package names (guild, runes, spells, summon, spawn, grimoire, familiar).

### Versioning and releases

Add a changeset file for any user-facing change: `bun run changeset`. Patch for fixes, minor for new features. `familiar` and `grimoire` are excluded from public releases.

## Tool permissions

**Allowed without asking:**
- Read and edit files under `packages/`, `.guild/`, `docs/`, `.changeset/`
- Run `bun test`, `bun run lint`, `bun run build`
- Run `bun run commit` / `bun run changeset`

**Ask before proceeding:**
- Modifying `turbo.json`, `package.json` (root), `.github/workflows/`
- Adding new dependencies to any package
- Modifying `packages/grimoire/` (affects all packages)
- Any change to `packages/familiar/` (private, sensitive)

**Not allowed:**
- `git reset --hard`, `git checkout --`, or mass deletion
- Committing, pushing, or creating PRs unless explicitly requested
- Publishing packages (`bun run changeset:publish`) unless explicitly requested
- Modifying CI/CD pipeline without explicit instruction

## Per-package rules

Each package has its own `AGENTS.md` with package-specific rules. Read it before editing that package:

| Package | Rules file |
| --- | --- |
| `packages/runes/` | `packages/runes/AGENTS.md` |
| `packages/guild/` | `packages/guild/AGENTS.md` |
| `packages/spawn/` | `packages/spawn/AGENTS.md` |
| `packages/familiar/` | `packages/familiar/CLAUDE.md` |

## Known constraints

- Bun workspaces: use `workspace:*` for cross-package deps, not relative paths.
- `packages/runes/dist/index.js` must be importable by Node.js (`node -e "import('./dist/index.js')"`), not just Bun.
- `packages/guild/` uses Zod v4; `packages/spawn/` uses Zod v3 — do not mix.
- `.guild/` is gitignored. Never commit files from it.
- `packages/familiar/` is private and not published to npm.

## Verification gates

Before marking any task complete:

- [ ] `bun test` passes (or scoped `bun test --cwd packages/<name>`)
- [ ] `bun run lint` passes with no new warnings
- [ ] `bun run build` succeeds for affected packages
- [ ] Changed files are within the permitted scope above
- [ ] No secrets, tokens, or credentials introduced
- [ ] If new dependencies added: explicit approval obtained first

## Escalation

If you cannot proceed without a decision outside your permitted scope, stop and describe the blocker clearly. Do not assume or guess at architectural decisions — ask.

# AGENTS.md — `@runecraft/runes`

Behavioral rules for any AI agent (or human) editing this package.

## Code style

- **No comments in source files.** Code must be self-explanatory through clear naming, small functions, and types. If a block needs explanation, refactor until it doesn't.
- The only allowed exceptions: the `#!/usr/bin/env node` shebang at the top of `src/bin/runes.ts` and the SQL header in `src/db/schema.sql` (because the comments in the SQL are *part* of the data, not commentary on code).
- `eslint-disable` comments are forbidden; fix the lint rule instead of disabling it.
- Prefer extracting a well-named function over a comment that explains what the next block does.

## Tests

- `bun test` is the runner. Tests live under `tests/` mirroring `src/`.
- Use temp directories under `os.tmpdir()` for filesystem fixtures — never write inside the package tree.
- Set `process.env.RUNES_DATA_DIR` (and clean up) when a test opens a DB, to keep each test isolated.

## Architectural rules

- `src/db/sqlite.ts` is the only place that touches `node:sqlite` / `bun:sqlite` directly. All other code uses the `Database` type re-exported from `src/db/client.ts`.
- Tools under `src/tools/` are pure factories: `createXTool(deps) → ToolDefinition`. They take a `ToolDeps` (repository, projectSlug, projectId) and must not read globals.
- The plugin entry (`src/index.ts`) is the orchestration layer; it owns config loading, DB open, project resolution, and hands the rest off to `createPluginInterface`.

## Build & release

- `bun run build` produces `dist/index.js` and `dist/bin/runes.js` (the latter is executable and has a shebang).
- `node -e "import('./dist/index.js')"` must succeed — the plugin is a Node ESM module, not a Bun-only artifact.
- Public releases go through changesets: add a file under `.changeset/` and bump the package minor for new features, patch for fixes.

# Spec: summon-workspace-normalization

## Problem

`@runecraft/summon` is not a proper workspace member. The publishable `package.json` lives at `packages/summon/package/package.json` instead of `packages/summon/package.json`. This causes:

1. **Changesets failure** — `changeset version` errors with "Found changeset for @runecraft/summon which is not in the workspace"
2. **publish.mjs silent skip** — The publish script iterates `packages/*`, looks for `packages/<name>/package.json`, and skips summon because it doesn't exist there
3. **generate-from-commits.ts** — Generated changeset with nested path detection, but changesets still can't apply it

## Goal

Make `@runecraft/summon` a first-class workspace member by flattening the `package/` subdirectory into `packages/summon/` root.

## Constraints

- `bun publish` must still work from `packages/summon/`
- `dist/summon.js` must remain the binary entry point
- `scripts/patch-clack.mjs` postinstall must still resolve
- `changeset version` must successfully bump `@runecraft/summon`
- Build script must still find source at `./src/cli.ts`
- No changes to other packages

## Success Criteria

1. `packages/summon/package.json` exists and is the `@runecraft/summon` manifest
2. `bun install` resolves summon as a workspace member
3. `changeset version` processes summon changesets without error
4. `bun run build` from `packages/summon/` produces `dist/summon.js`
5. `bun publish` from `packages/summon/` publishes correctly
6. `publish.mjs` no longer silently skips summon

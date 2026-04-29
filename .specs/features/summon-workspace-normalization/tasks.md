# Tasks: summon-workspace-normalization

## Phase 1 — Flatten package/ into workspace root

- [x] T01 Move package.json to workspace root
  - Files: `packages/summon/package/package.json` → `packages/summon/package.json`
  - Instructions: Copy content of `packages/summon/package/package.json` to new file `packages/summon/package.json`. Delete the original.
  - Acceptance: `packages/summon/package.json` exists with name `@runecraft/summon`

- [x] T02 Move dist/summon.js to workspace dist/
  - Files: `packages/summon/package/dist/summon.js` → `packages/summon/dist/summon.js`
  - Instructions: Check if `packages/summon/dist/` exists. Copy `packages/summon/package/dist/summon.js` to `packages/summon/dist/summon.js`. Delete original.
  - Acceptance: `packages/summon/dist/summon.js` exists and is executable

- [x] T03 Move scripts/patch-clack.mjs to workspace scripts/
  - Files: `packages/summon/package/scripts/patch-clack.mjs` → `packages/summon/scripts/patch-clack.mjs`
  - Instructions: Check if `packages/summon/scripts/` exists. Copy `packages/summon/package/scripts/patch-clack.mjs` to `packages/summon/scripts/patch-clack.mjs`. Delete original.
  - Acceptance: `packages/summon/scripts/patch-clack.mjs` exists

- [x] T04 Move README.md
  - Files: `packages/summon/package/README.md` → `packages/summon/README.md`
  - Instructions: If `packages/summon/README.md` already exists, keep the existing one (it may be more up-to-date). Otherwise copy from `packages/summon/package/README.md`. Delete `packages/summon/package/README.md`.
  - Acceptance: `packages/summon/README.md` exists

- [x] T05 Remove packages/summon/package/ directory
  - Files: `packages/summon/package/` (entire directory)
  - Instructions: After T01–T04, the `packages/summon/package/` directory should be empty. Remove it entirely.
  - Acceptance: `packages/summon/package/` no longer exists

## Phase 2 — Verify paths (no changes expected)

- [x] T06 Verify build script path is correct
  - Files: `packages/summon/package.json` (read-only verification)
  - Instructions: The build script is `bun build ./src/cli.ts --target node --outfile dist/summon.js`. Now that package.json is at `packages/summon/`, `./src/cli.ts` resolves to `packages/summon/src/cli.ts` which is correct. Run `bun run build` from `packages/summon/` to confirm.
  - Acceptance: Build succeeds, `packages/summon/dist/summon.js` is produced with `#!/usr/bin/env node` shebang

- [x] T07 Run bun install at root
  - Instructions: Run `bun install` from repo root to register summon as workspace member
  - Acceptance: No errors, bun.lock updated

- [x] T08 Verify changeset version can process summon
  - Instructions: Run `bunx changeset status` to verify changesets recognizes `@runecraft/summon`. Do NOT run `changeset version` (would modify version files).
  - Acceptance: `changeset status` output includes `@runecraft/summon` without "not in workspace" error

## Execution Order

T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08

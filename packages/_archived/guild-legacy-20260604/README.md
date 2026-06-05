# Guild Legacy — Archived Snapshot

**Frozen at**: 2026-06-04
**Reason**: Guild-Weave Replatform — `packages/guild` was replaced with `opencode-weave` as its new technical base.

This directory preserves the original `@runecraft/guild` v0.3.0 implementation before the replatform.

## What's here

- Complete source tree (`src/`)
- Build scripts and schema generation (`scripts/`)
- `package.json` with original `@runecraft/guild` identity
- `README.md`, `CHANGELOG.md`, `tsconfig.json`, `.gitignore`
- `dist/` — last built artifacts
- `node_modules/` — frozen dependency snapshot

## Context

Refer to `.specs/features/guild-weave-replatform/` for the full migration plan and decisions.

This backup is intentionally stored outside the `packages/*` workspace glob to avoid being registered as an active workspace in the arcanum monorepo.

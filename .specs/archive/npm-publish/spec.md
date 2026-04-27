# npm-publish

## Overview
Make `@runecraft/summon` and `@runecraft/spells` publishable to npm.
After publish, `npx @runecraft/summon` must work on any machine with Node.js — no Bun required.

## Scope
Medium

## Problem
- `summon` currently builds via `bun build --compile` producing a 103MB Bun-native binary — not distributable via npm/npx
- `summon` uses one Bun-specific API (`import.meta.dir`) that won't work in Node.js
- `spells` is missing `publishConfig: { access: "public" }`, blocking npm publish
- No shebang in build output, so `npx` can't execute the entry point

## Goals
1. `npx @runecraft/summon` works with Node.js ≥18 (no Bun on user machine)
2. `npm publish` succeeds for both `@runecraft/summon` and `@runecraft/spells`
3. Build output is a single JS bundle with `#!/usr/bin/env node` shebang
4. Dev tooling (Bun) stays unchanged — only the build OUTPUT changes

## Non-Goals
- CI/CD publish workflow (deferred)
- Changing dev tooling from Bun to anything else
- Adding tests for the build (deferred)
- Versioning strategy or changeset automation

## Acceptance Criteria
- [ ] `bun run build` in `packages/summon` produces `dist/summon.js` (not a compiled binary)
- [ ] `dist/summon.js` starts with `#!/usr/bin/env node`
- [ ] `dist/summon.js` runs correctly with `node dist/summon.js`
- [ ] `package.json` `bin` points to `dist/summon.js`
- [ ] No `import.meta.dir` usage remains in source
- [ ] `npm publish --dry-run` succeeds for `@runecraft/summon`
- [ ] `npm publish --dry-run` succeeds for `@runecraft/spells`

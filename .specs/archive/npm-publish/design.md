# npm-publish — Design

## Decision 1: Build Target Change
**Choice:** Change `bun build --compile --target bun` → `bun build --target node`
**Rationale:** `--target node` emits a standard JS bundle compatible with Node.js runtime. Bun remains the build tool (dev dependency), but the output runs on Node.js. This matches the `@tech-leads-club/agent-skills` pattern.

## Decision 2: Shebang Injection
**Choice:** Shell one-liner in build script prepends `#!/usr/bin/env node`
```
printf '#!/usr/bin/env node\n' | cat - dist/summon.js > dist/_tmp.js && mv dist/_tmp.js dist/summon.js && chmod +x dist/summon.js
```
**Rationale:** `bun build` does not support `--banner` natively. This approach requires no new dependencies and works inline in package.json scripts.

## Decision 3: import.meta.dir Replacement
**Choice:** Replace `import.meta.dir` with `dirname(fileURLToPath(import.meta.url))`
**Rationale:** `import.meta.url` is standard ESM, works in both Node.js and Bun. `fileURLToPath` + `dirname` from `node:url` and `node:path` are stable Node.js APIs. Pattern already used in `packages/summon/scripts/patch-clack.mjs`.

## Decision 4: Output File Name
**Choice:** `dist/summon.js` (not `dist/summon`)
**Rationale:** The `.js` extension is conventional for Node.js executables distributed via npm. The `bin` field in package.json will point to this file.

## Decision 5: spells publishConfig
**Choice:** Add `"publishConfig": { "access": "public" }` to `packages/spells/package.json`
**Rationale:** Required for scoped packages (`@runecraftai/*`) to publish publicly on npm. No other changes needed — spells has no build step (ships `skills/` directory only).

## Risks
- **bun build --target node** may not bundle all dependencies correctly. Mitigation: verify with `node dist/summon.js --help` after build.
- **Shebang + Windows:** `#!/usr/bin/env node` is ignored on Windows; npm handles this via `.cmd` wrapper automatically. No action needed.

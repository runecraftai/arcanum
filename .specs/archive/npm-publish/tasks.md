# npm-publish — Tasks

## Phase 1: Fix Bun-specific API

- [x] 1.1 Replace `import.meta.dir` with Node.js-compatible equivalent
  - File: `packages/summon/src/utils/paths.ts`
  - Change: At line 28, replace `import.meta.dir` with `dirname(fileURLToPath(import.meta.url))`. Add imports: `import { dirname } from "node:path"` and `import { fileURLToPath } from "node:url"` if not already present.
  - Acceptance: `grep -r "import.meta.dir" packages/summon/src/` returns empty

## Phase 2: Change Build Configuration

- [x] 2.1 Update build script in summon package.json
  - File: `packages/summon/package.json`
  - Change: Replace the `"build"` script value.
    - Old: `"bun build --compile --target bun --outfile dist/summon"`
    - New: `"bun build ./src/cli.ts --target node --outfile dist/summon.js && printf '#!/usr/bin/env node\n' | cat - dist/summon.js > dist/_tmp.js && mv dist/_tmp.js dist/summon.js && chmod +x dist/summon.js"`
  - Acceptance: `bun run build` produces `dist/summon.js` with shebang as first line (`head -1 dist/summon.js` → `#!/usr/bin/env node`)

- [x] 2.2 Update `bin` field in summon package.json
  - File: `packages/summon/package.json`
  - Change: `"bin": { "summon": "dist/summon" }` → `"bin": { "summon": "dist/summon.js" }`
  - Acceptance: `grep -A1 '"bin"' packages/summon/package.json` shows `dist/summon.js`

- [x] 2.3 Verify `files` array covers dist output
  - File: `packages/summon/package.json`
  - Change: Confirm `"dist/"` is already in the `files` array — no change needed if present.
  - Acceptance: `dist/summon.js` is included in `npm pack` output

## Phase 3: Fix spells Package

- [x] 3.1 Add publishConfig to spells package.json
  - File: `packages/spells/package.json`
  - Change: Add `"publishConfig": { "access": "public" }` to the top-level object
  - Acceptance: `grep -A1 publishConfig packages/spells/package.json` shows `"access": "public"`

## Phase 4: Verify

- [x] 4.1 Build and test summon output
  - Run: `cd packages/summon && bun run build`
  - Verify: `head -1 dist/summon.js` shows `#!/usr/bin/env node`
  - Verify: `node dist/summon.js --help` runs without error
  - Verify: `file dist/summon.js` shows text file (not binary)

- [x] 4.2 Dry-run publish for summon
  - Run: `cd packages/summon && npm publish --dry-run`
  - Acceptance: Command succeeds, output includes `dist/summon.js`

- [x] 4.3 Dry-run publish for spells
  - Run: `cd packages/spells && npm publish --dry-run`
  - Acceptance: Command succeeds, output includes `skills/` directory

## Summary
- **3 files touched**: `packages/summon/src/utils/paths.ts`, `packages/summon/package.json`, `packages/spells/package.json`
- **4 phases, 7 tasks** — all atomic and independently verifiable

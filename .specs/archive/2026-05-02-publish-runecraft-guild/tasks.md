# Tasks: Publish @runecraft/guild v0.1.0 to npm

> **Publishing model:** The package is published **automatically via the CI pipeline** on merge to `main`. No manual `bun publish` or `npm publish` is needed. The changeset pipeline (`publish.mjs`) handles auth, versioning, and publishing.

## Phase 1 — Pre-Publish Fixes (metadata & config)

- [x] 1.1 Fix CHANGELOG.md org name inconsistency (`packages/guild/CHANGELOG.md`)
  - Files: `packages/guild/CHANGELOG.md`
  - Change: Replace `@runecraftai/guild` with `@runecraft/guild` in the title (line 1)
  - Acceptance: `head -1 packages/guild/CHANGELOG.md` shows `# @runecraft/guild`

- [x] 1.2 Add missing metadata to package.json (`packages/guild/package.json`)
  - Files: `packages/guild/package.json`
  - Change: Add the following fields:
    - `"repository": { "type": "git", "url": "https://github.com/runecraft/guild.git" }`
    - `"author": "Runecraft <hello@runecraft.ai>"`
    - `"keywords": ["guild", "runecraft", "opencode", "plugin", "ai", "agent"]`
    - `"homepage": "https://github.com/runecraft/guild#readme"`
    - `"bugs": { "url": "https://github.com/runecraft/guild/issues" }`
    - `"engines": { "bun": ">=1.3.0" }`
  - Acceptance: All 6 fields present in package.json

- [x] 1.3 Add prepublishOnly script to package.json (`packages/guild/package.json`)
  - Files: `packages/guild/package.json`
  - Change: Add `"prepublishOnly": "bun run build && bun run build:schema"` to the `"scripts"` block
  - Acceptance: Script exists; running `bun run prepublishOnly` from `packages/guild/` completes without error

- [x] 1.4 **REMOVE** `@runecraft/guild` from changeset ignore array (`.changeset/config.json`)
  - Files: `.changeset/config.json`
  - Change: **Remove** `"@runecraft/guild"` from the `"ignore"` array entirely.
  - **Why this is necessary:** If `@runecraft/guild` stays in the ignore array, the changeset pipeline will SKIP it and it will never be published automatically. The pipeline needs the package to be tracked so it can bump versions and publish on merge to `main`.
  - Acceptance: `@runecraft/guild` is NOT present in the ignore array

- [x] 1.5 Verify `publishConfig.access` is `"public"` (`packages/guild/package.json`)
  - Files: `packages/guild/package.json`
  - Action: Confirm `"publishConfig": { "access": "public" }` is set. Scoped packages default to restricted access, which would block public consumption.
  - Acceptance: `publishConfig.access` is `"public"`

- [x] 1.6 Verify changeset publish script exists and handles scoped packages
  - Files: `.changeset/publish.mjs` (or equivalent pipeline script)
  - Action: Confirm the script exists and is configured to handle `@runecraft/*` scoped packages. Verify it runs `changeset publish` (or equivalent) with proper auth for scoped packages.
  - Acceptance: Script exists, is executable, and references or handles `@runecraft` scope

- [x] 1.7 Address @opencode-ai/plugin peerDep question (NO CHANGE)
  - Files: N/A (no change needed)
  - Decision: Keep `@opencode-ai/plugin` as regular dependency (Decision D2)
  - Acceptance: `@opencode-ai/plugin` remains in `dependencies`, NOT `peerDependencies`

## Phase 2 — Build Verification

- [x] 2.1 Clean build from scratch (`packages/guild/`)
  - Files: `packages/guild/dist/` (cleaned, then regenerated)
  - Action: Remove `dist/`, then run `bun run build && bun run build:schema`
  - Acceptance: `dist/` contains all 17 `.js` + `.d.ts` file pairs, plus `dist/schema.json`

- [x] 2.2 Verify files field correctness (`packages/guild/package.json`)
  - Files: `packages/guild/package.json`
  - Action: Confirm `"files": ["dist/"]` includes only `dist/`
  - Acceptance: Running `npm pack --dry-run` shows only `dist/` contents + `package.json` + `README.md` + `CHANGELOG.md`

## Phase 3 — Post-Merge Verification (pipeline handles publish)

- [ ] 3.1 Update README badge (`packages/guild/README.md`)
  - Files: `packages/guild/README.md`
  - Change: Update the npm badge to point to the live package: `[![npm version](https://img.shields.io/npm/v/@runecraft/guild)](https://www.npmjs.com/package/@runecraft/guild)`
  - Acceptance: Badge renders correctly on npmjs.com package page

- [ ] 3.2 Commit the changes
  - Action:
    1. `git add` all changed files
    2. `git commit -m "chore(guild): prepare v0.1.0 for pipeline publish"`
  - Acceptance: Commit contains only the publish-related changes. The version bump and tag will be handled by the changeset pipeline on merge to `main`.

## Dependency Graph

```
1.1 (CHANGELOG)  ──┐
1.2 (metadata)   ──┼──→ 2.1 (clean build) ──→ 2.2 (verify files) ──┐
1.3 (prepublish) ──┤                                              │
1.4 (changeset)  ──┤                                              │
1.5 (publishCfg) ──┤                                              │
1.6 (publish.mjs)──┤                                              │
1.7 (peerDep)    ──┘                                              ▼
                                                         3.1 (badge) ──→ 3.2 (commit)
                                                                              │
                                                                              ▼
                                                                    Merge to main → CI pipeline publishes
```

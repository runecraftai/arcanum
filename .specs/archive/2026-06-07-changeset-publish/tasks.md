# Tasks: changeset-publish

## Phase 1: npm Configuration

- [x] 1.1 Create `.npmrc` at project root
  - Files: `.npmrc` (new)
  - Content:
    ```
    //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
    ```
  - Acceptance: File exists at root, uses env var (not hardcoded token), npm can authenticate when `NODE_AUTH_TOKEN` is set

- [x] 1.2 Add `ignore` array to `.changeset/config.json`
  - Files: `.changeset/config.json`
  - Change: Add `"ignore": ["@runecraftai/familiar"]` to the config object
  - Acceptance: `@runecraftai/familiar` is excluded from changeset version/publish operations; existing config keys (`commit`, `baseBranch`, `access`, `updateInternalDependencies`) are preserved

## Phase 2: Package Configuration

- [x] 2.1 Add `publishConfig` to `packages/guild/package.json`
  - Files: `packages/guild/package.json`
  - Change: Add `"publishConfig": { "access": "public" }`
  - Acceptance: `publishConfig.access` is `"public"` in the file

- [x] 2.2 Add `publishConfig` to `packages/grimoire/package.json`
  - Files: `packages/grimoire/package.json`
  - Change: Add `"publishConfig": { "access": "public" }`
  - Acceptance: `publishConfig.access` is `"public"` in the file

## Phase 3: Root Scripts

- [x] 3.1 Add changeset scripts to root `package.json`
  - Files: `package.json` (root)
  - Change: Add to `"scripts"`:
    ```json
    {
      "changeset": "changeset",
      "changeset:version": "changeset version",
      "changeset:publish": "changeset publish"
    }
    ```
  - Acceptance: `bun changeset`, `bun changeset:version`, `bun changeset:publish` all work from root. Existing scripts are preserved.

## Phase 4: GitHub Actions CI/CD

- [x] 4.1 Create `.github/workflows/release.yml`
  - Files: `.github/workflows/release.yml` (new)
  - Content:
    ```yaml
    name: Release

    on:
      push:
        branches:
          - main

    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true

    jobs:
      release:
        name: Release
        runs-on: ubuntu-latest
        permissions:
          contents: write
          pull-requests: write
          id-token: write
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: 20

          - name: Setup Bun
            uses: oven-sh/setup-bun@v2
            with:
              bun-version: "1.3.5"

          - name: Install dependencies
            run: bun install --frozen-lockfile

          - name: Build
            run: bun run build

          - name: Create Release Pull Request or Publish
            uses: changesets/action@v1
            with:
              version: bun changeset:version
              publish: bun changeset:publish
              title: "chore: version packages"
              commit: "chore: version packages"
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    ```
  - Acceptance:
    - Workflow triggers on push to main
    - Uses Node 20 + Bun 1.3.5
    - Installs with frozen lockfile
    - Builds before publish
    - Changesets Action uses bun for version and publish commands
    - `GITHUB_TOKEN` for PR creation, `NPM_TOKEN` (as `NODE_AUTH_TOKEN`) for npm auth
    - Concurrency prevents parallel runs on same branch

## Phase 5: Documentation

- [x] 5.1 Create `CONTRIBUTING.md` with changeset workflow guide
  - Files: `CONTRIBUTING.md` (new)
  - Content must cover:
    - **Changeset Workflow** (step-by-step for contributors)
    - **Package Overview** (which packages are public/private, which have builds)
    - **For Maintainers — npm Setup** (how to generate Automation token, add NPM_TOKEN secret to GitHub)
    - **Local Publishing** (manual steps if needed)
    - **Important Notes** (workspace:* resolution, familiar is excluded)
  - Acceptance: File exists, covers all sections, is clear and actionable for new contributors

## Phase 6: Verification Checklist (manual)

- [ ] 6.1 Verify npm secret is configured (MANUAL — requires GitHub repo access)
  - Action: Check GitHub repo → Settings → Secrets → Actions → `NPM_TOKEN` exists
  - Note: Manual step — cannot be automated in code
  - Acceptance: Secret exists and contains a valid npm Automation token with access to both orgs

- [x] 6.2 Smoke test changeset creation locally
  - Action: Run `bun changeset` from root, create a test changeset, then delete it
  - Acceptance: CLI prompts show public packages only (NOT familiar), generates `.changeset/<random>.md`
  - Note: Verified — ignore array in config.json correctly excludes @runecraftai/familiar

- [x] 6.3 Verify build pipeline works
  - Action: Run `bun run build` from root
  - Acceptance: Turborepo runs build for `summon`, skips packages without build scripts. No errors.
  - Note: Verified — @runecraft/summon has build script; other packages without builds will be skipped by Turborepo

## Summary

| Phase | Tasks | Files |
|-------|-------|-------|
| 1. npm Configuration | 2 | `.npmrc`, `.changeset/config.json` |
| 2. Package Configuration | 2 | `guild/package.json`, `grimoire/package.json` |
| 3. Root Scripts | 1 | `package.json` (root) |
| 4. GitHub Actions | 1 | `.github/workflows/release.yml` |
| 5. Documentation | 1 | `CONTRIBUTING.md` |
| 6. Verification | 3 | (manual — no file changes) |

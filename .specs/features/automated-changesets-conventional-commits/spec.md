# Feature Spec: Automated Changesets from Conventional Commits

## Problem Statement

The arcanum monorepo currently relies on manual `bun changeset` invocations to create changeset files before releases. While developers already write conventional commit messages (`feat:`, `fix:`, `chore:`, etc.), this information is not leveraged for automated changeset generation. This creates friction:

1. **Manual step forgotten** — Contributors forget to run `bun changeset`, leading to missed version bumps or release delays.
2. **No commit message enforcement** — Despite convention, nothing prevents malformed commit messages from landing on `main`.
3. **No interactive commit helper** — New contributors have no guided way to write correctly formatted commits.
4. **Duplicated intent** — The commit message already describes what changed and its severity; re-entering this in a changeset is redundant.

## Solution Overview

A three-layer automated release pipeline:

### Layer 1: Local Commit Quality (Husky + Commitlint + Commitizen)
- **Husky v9** — Git hooks manager, initialized with `bunx husky init`, `prepare` script in root `package.json`.
- **Commitlint** (`@commitlint/cli` + `@commitlint/config-conventional`) — `commit-msg` hook validates every commit message against conventional commits spec.
- **Commitizen** (`commitizen` + `cz-git` adapter) — Interactive commit helper via `bun run commit` (or `git cz`). `cz-git` is chosen over `cz-conventional-changelog` because it is actively maintained, supports monorepo scopes, integrates with commitlint config, and has better Bun compatibility.

### Layer 2: CI Changeset Auto-Generation (Custom Script)
- A custom TypeScript script (`.changeset/generate-from-commits.ts`) runs in CI on push to `main`, BEFORE the changesets/action step.
- It reads commits since the last changeset version tag, parses them with `conventional-commits-parser`, determines affected packages via `git diff --name-only`, maps file paths to workspace packages, and generates `.changeset/*.md` files with the correct bump type (`feat:` → minor, `fix:` → patch, `feat!:` / `BREAKING CHANGE` → major).
- Skips packages in the changeset ignore list (`@runecraft/familiar`, `@runecraft/guild`, `@runecraft/grimoire`).
- Commits the generated changeset files back to the branch if any were created.
- **Decision: Custom script over existing npm packages** — `changeset-conventional-commits` (the only relevant npm package) requires Node >=22 and pnpm >=10, incompatible with our Node 20 CI environment and Bun package manager. A custom script (~150 lines) using `conventional-commits-parser` gives full control over the monorepo mapping logic and ignore-list handling.

### Layer 3: Existing Release Flow (Preserved)
- `changesets/action@v1.4.7` continues to manage the Version PR and publish flow.
- `.changeset/publish.mjs` is NOT modified.
- `.changeset/config.json` ignore list is respected by the auto-generation script.
- The CI workflow gains new steps that run BEFORE the changesets action.

## Acceptance Criteria

1. Running `git commit -m "bad message"` locally is rejected by commitlint with a clear error.
2. Running `git commit -m "feat: add new spell"` locally passes commitlint validation.
3. Running `bun run commit` launches the cz-git interactive prompt with monorepo scope selection.
4. Pushing conventional commits to `main` triggers CI that auto-generates `.changeset/*.md` files.
5. `feat:` commits produce `minor` bump changesets for affected packages only.
6. `fix:` commits produce `patch` bump changesets for affected packages only.
7. `feat!:` or commits with `BREAKING CHANGE` footer produce `major` bump changesets.
8. Commits affecting only ignored packages (`@runecraft/familiar`, `@runecraft/guild`, `@runecraft/grimoire`) generate NO changeset.
9. Commits with type `chore:`, `docs:`, `style:`, `test:`, `ci:`, `build:` generate NO changeset (non-releasable).
10. If no releasable commits exist since last release, the script exits cleanly with no changeset generated.
11. The existing `changesets/action` Version PR flow continues to work unchanged.
12. The existing `bun run publish:packages` flow continues to work unchanged.
13. `bun install` at root triggers `prepare` script which sets up husky hooks.
14. CI environments skip husky installation (via `HUSKY=0` env).

## Out of Scope

- Modifying `.changeset/publish.mjs`
- Modifying `.changeset/config.json` ignore list
- Changelog generation customization (changesets handles this)
- Branch protection rules or GitHub settings
- Pre-push hooks (only commit-msg hook)
- Automated testing in this feature (existing CI handles that)
- Scope validation against actual workspace package names (optional future enhancement)
- Commit message rewriting or squash-merge enforcement

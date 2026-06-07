# Tasks: Automated Changesets from Conventional Commits

## Phase 1: Local Commit Enforcement (Husky + Commitlint)

- [x] T01 Install husky and initialize hooks
  - Files: `package.json`
  - Instructions:
    1. Add `"prepare": "husky"` to `scripts` in root `package.json`
    2. Add `"husky": "^9.1.0"` to `devDependencies`
    3. Run `bun install` then `bunx husky init`
    4. Remove or empty the default `.husky/pre-commit` file
  - Acceptance: `bun run prepare` completes; `.husky/` directory exists

- [x] T02 Install and configure commitlint
  - Files: `package.json`, `commitlint.config.ts` (new)
  - Instructions:
    1. Add to `devDependencies`: `"@commitlint/cli": "^19.8.0"`, `"@commitlint/config-conventional": "^19.8.0"`
    2. Run `bun install`
    3. Create `commitlint.config.ts` at project root:
      ```typescript
      import type { UserConfig } from "@commitlint/types";
      import type { Options as CzGitOptions } from "cz-git";

      const config: UserConfig & { prompt: CzGitOptions } = {
        extends: ["@commitlint/config-conventional"],
        rules: {
          "scope-enum": [
            2,
            "always",
            ["summon", "spells", "familiar", "guild", "grimoire", "deps", "release"],
          ],
          "scope-case": [2, "always", "kebab-case"],
        },
        prompt: {
          alias: { fd: "docs: fix typos" },
          messages: {
            type: "Select the type of change that you're committing:",
            scope: "Denote the SCOPE of this change (optional):",
            customScope: "Denote the SCOPE of this change:",
            subject: "Write a SHORT, IMPERATIVE tense description of the change:\n",
            body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
            breaking: 'List any BREAKING CHANGES (optional). Use "|" to break new line:\n',
            footerPrefixesSelect: "Select the ISSUES type of changeList by this change (optional):",
            footer: "List any ISSUES by this change. E.g.: #31, #34:\n",
            confirmCommit: "Are you sure you want to proceed with the commit above?",
          },
          types: [
            { value: "feat", name: "feat:     ✨  A new feature", emoji: "✨" },
            { value: "fix", name: "fix:      🐛  A bug fix", emoji: "🐛" },
            { value: "docs", name: "docs:     📝  Documentation only changes", emoji: "📝" },
            { value: "style", name: "style:    💄  Markup, white-space, formatting", emoji: "💄" },
            { value: "refactor", name: "refactor: ♻️   A code change that neither fixes nor adds", emoji: "♻️" },
            { value: "perf", name: "perf:     ⚡️  A code change that improves performance", emoji: "⚡️" },
            { value: "test", name: "test:     ✅  Adding missing tests", emoji: "✅" },
            { value: "build", name: "build:    📦️  Changes affecting build system or deps", emoji: "📦️" },
            { value: "ci", name: "ci:       🎡  Changes to CI configuration", emoji: "🎡" },
            { value: "chore", name: "chore:    🔧  Other changes that don't modify src", emoji: "🔧" },
            { value: "revert", name: "revert:   ⏪️  Reverts a previous commit", emoji: "⏪️" },
          ],
          useEmoji: false,
          allowCustomScopes: true,
          allowBreakingChanges: ["feat", "fix"],
          breaklineNumber: 100,
          breaklineChar: "|",
          confirmColorize: true,
        },
      };

      export default config;
      ```
  - Acceptance: `bunx commitlint --from HEAD~1` validates correctly

- [x] T03 Create commit-msg husky hook
  - Files: `.husky/commit-msg` (new)
  - Instructions:
    1. Create `.husky/commit-msg` with content:
      ```sh
      bunx --no -- commitlint --edit $1
      ```
  - Acceptance: `git commit -m "bad"` fails; `git commit -m "feat: test"` passes

- [x] T04 Install and configure commitizen with cz-git
  - Files: `package.json`
  - Instructions:
    1. Add to `devDependencies`: `"commitizen": "^4.3.0"`, `"cz-git": "^1.13.0"`
    2. Add to `scripts`: `"commit": "cz"`
    3. Add `config.commitizen` section to root `package.json`:
      ```json
      "config": {
        "commitizen": {
          "path": "node_modules/cz-git"
        }
      }
      ```
    4. Run `bun install`
  - Acceptance: `bun run commit` opens interactive prompt

## Phase 2: CI Changeset Auto-Generation

- [x] T05 Install conventional-commits-parser
  - Files: `package.json`
  - Instructions:
    1. Add to `devDependencies`: `"conventional-commits-parser": "^6.1.0"`
    2. Run `bun install`
  - Acceptance: package resolves in Bun

- [x] T06 Create changeset generation script
  - Files: `.changeset/generate-from-commits.ts` (new)
  - Instructions: Create script that:
    a. Reads `.changeset/config.json` for ignore list
    b. Builds package map from `packages/*/package.json`
    c. Finds last release via `git tag --list '@runecraft/*@*' --sort=-version:refname` (first result); fallback to first commit if no tags
    d. Reads commits since that tag via `git log --format="%H|||%s|||%b" <ref>..HEAD`
    e. Parses with conventional-commits-parser
    f. Filters: keep feat, fix, perf, refactor only
    g. Detects affected packages via `git diff-tree --no-commit-id --name-only -r <sha>` mapped to package dirs
    h. Removes ignored packages
    i. Determines bump: major if breaking/!, minor if feat, patch otherwise
    j. Aggregates by package (highest bump wins)
    k. Writes `.changeset/<uuid-8chars>.md` files
    l. Always exits 0
  - Note: Tag format `@runecraft/<package>@<version>` used in step (c) matches exactly what `changesets/action` creates via `createGithubReleases: true` (T07b). This coupling is intentional.
  - Acceptance: Script runs without error; produces valid changeset files for feat/fix commits; produces nothing for chore commits; exits 0

- [x] T07 Update release workflow
  - Files: `.github/workflows/release.yml`
  - Instructions:
    1. Change `actions/checkout` step to use `fetch-depth: 0` (full history for commit and tag reading)
    2. Add `HUSKY: "0"` to the `bun install` step's env block
    3. Add these two steps BEFORE the existing `changesets/action` step:
      ```yaml
      - name: Generate changesets from conventional commits
        run: bun run .changeset/generate-from-commits.ts

      - name: Commit generated changesets
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .changeset/
          git diff --staged --quiet || git commit -m "chore: auto-generate changesets [skip ci]"
          git push
      ```
    4. Preserve all existing steps unchanged after the new ones
  - Acceptance: Push with feat commits → changeset files committed → Version PR created

- [x] T07b Verify permissions and add createGithubReleases
  - Files: `.github/workflows/release.yml`, `CONTRIBUTING.md`
  - Instructions:
    1. Add `createGithubReleases: true` explicitly to the `changesets/action` step `with:` block
    2. Verify `permissions` block has all three: `contents: write`, `pull-requests: write`, `id-token: write`
    3. Document tag lifecycle in CONTRIBUTING.md:
       - Tags created automatically by `changesets/action` when Version PR merges and packages publish
       - Tag format: `@runecraft/<package>@<version>`
       - Tags serve as anchors for `generate-from-commits.ts` to find the last release
       - **Do not manually create or delete tags** matching `@runecraft/*@*`
       - First-run bootstrap: if no tags exist, script reads all commits (handled in T06)
  - Acceptance: `createGithubReleases: true` present in workflow; permissions block complete; CONTRIBUTING.md documents tag lifecycle

## Phase 3: Documentation & Polish

- [x] T08 Update CONTRIBUTING.md
  - Files: `CONTRIBUTING.md`
  - Instructions: Add/update sections:
    1. **Committing** — conventional commits format, valid types, valid scopes (`summon`, `spells`, `familiar`, `guild`, `grimoire`, `deps`, `release`)
    2. **Interactive commits** — use `bun run commit` for guided prompt
    3. **Automated release flow** — commit → CI generates changesets → Version PR → merge → publish + tag + GitHub Release
    4. **Tag lifecycle** — format, purpose, warning against manual manipulation (expand T07b content into cohesive section)
  - Acceptance: Documentation accurately describes the full commit and release workflow

- [x] T09 Verify full integration
  - Files: none (verification task)
  - Instructions:
    1. Run `bun install` — verify `prepare` runs and `.husky/` is configured
    2. Test: `echo "bad" | bunx commitlint` — should fail
    3. Test: `echo "feat: test" | bunx commitlint` — should pass
    4. Test: `bun run commit` — should launch interactive prompt
    5. Test locally: `bun run .changeset/generate-from-commits.ts` — should run without errors
    6. Make a test commit with `feat: test` — commit-msg hook should pass
    7. Make a test commit with `nope` — commit-msg hook should fail
  - Acceptance: All 7 verification steps pass

## Task Dependency Graph

```
T01 ──► T03 (husky must exist before adding hook)
T02 ──► T03 (commitlint must be installed before hook references it)
T02 ──► T04 (cz-git config lives in commitlint config)
T05 ──► T06 (parser must be installed before script uses it)
T06 ──► T07 (script must exist before workflow references it)
T07 ──► T07b (workflow must have generate step before adding createGithubReleases)
T01-T07b ──► T08 (document after implementation)
T01-T08 ──► T09 (verify everything at end)
```

## Execution Order

T01 → T02 → T03 → T04 → T05 → T06 → T07 → T07b → T08 → T09

Parallelizable: T01+T02 can run together; T04+T05 can run together.

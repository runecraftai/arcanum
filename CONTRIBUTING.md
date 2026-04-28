# Contributing to Arcanum

Thank you for your interest in contributing to Arcanum! This guide covers the changeset workflow and publishing process.

## Changeset Workflow

Changesets help us manage semantic versioning and changelog generation across our monorepo packages.

### Creating a Changeset

When making changes that affect public packages, you'll need to create a changeset:

1. **From the project root**, run:
   ```bash
   bun changeset
   ```

2. **Select affected packages** — You'll be prompted to select which packages are affected by your changes:
     - ✓ `@runecraft/guild` (public)
     - ✓ `@runecraft/grimoire` (public)
     - ✓ `@runecraft/summon` (public)
     - ✗ `@runecraft/familiar` (private — automatically excluded)

3. **Choose a change type** — Select the appropriate semver bump:
   - `patch` — Bug fixes, small improvements
   - `minor` — New features (backward-compatible)
   - `major` — Breaking changes

4. **Add a summary** — Write a brief description of the change (this appears in the changelog)

5. **Commit the changeset file** — Git will show a new file in `.changeset/<random>.md`:
   ```bash
   git add .changeset/<random>.md
   git commit -m "chore: add changeset"
   ```

### Example Changeset File

```markdown
---
"@runecraft/guild": minor
"@runecraft/grimoire": patch
"@runecraft/summon": patch
---

Add new agent configuration schema and fix typo in grimoire docs.
```

## Package Overview

| Package | Status | Built | Published |
|---------|--------|-------|-----------|
| `@runecraft/guild` | Public | Yes | Yes (npm) |
| `@runecraft/grimoire` | Public | Yes | Yes (npm) |
| `@runecraft/summon` | Public | Yes | Yes (npm) |
| `@runecraft/spells` | Public | Yes | Yes (npm) |
| `@runecraft/familiar` | **Private** | Yes | No |

- **Built packages** have a `build` script and produce dist/ artifacts
- **Published packages** are pushed to npm registry on release
- **Private packages** are excluded from publishing and version management

## For Maintainers — npm Setup

### Generate NPM Automation Token

To set up publishing, you need an npm Automation token:

1. Go to [npmjs.com](https://npmjs.com) → Sign in
2. Click your avatar → **Access Tokens**
3. Click **Generate New Token** → Choose **Automation**
4. Copy the token (e.g., `npm_XXXXXXXXXXXXXXXXXXXXXXXX`)

### Add NPM_TOKEN to GitHub Secrets

1. Go to your GitHub repository → **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Create secret named `NPM_TOKEN` and paste your token
5. Verify the token has access to the `@runecraft` org

### Release Process (Automated)

When you push to `main`, GitHub Actions will:

1. **Run tests and build** — Ensure everything compiles
2. **Check for changesets** — If present:
   - Create a Release PR updating versions and changelogs
   - Merge the PR to trigger publish
3. **Publish to npm** — Uses the `NPM_TOKEN` for authentication
4. **Create GitHub Release** — With auto-generated changelog

## Local Publishing (Advanced)

If you need to manually publish locally (not recommended for normal workflow):

```bash
# Set your npm token (interactive prompt or env var)
export NODE_AUTH_TOKEN=npm_XXXXXXXXXXXXXXXXXXXXXXXX

# Bump versions and update changelogs
bun changeset:version

# Publish to npm
bun changeset:publish
```

## Important Notes

### Workspace Dependencies

All packages use `workspace:*` to reference each other:

```json
{
  "dependencies": {
    "@runecraft/grimoire": "workspace:*"
  }
}
```

This ensures they stay in sync during development. The `@changesets/cli` automatically converts these to proper semver ranges during publishing.

### Package Scope

The monorepo uses the `@runecraft` scope for all packages:
- **`@runecraft`** — guild, grimoire, summon, spells, familiar

### Familiar is Excluded

`@runecraft/familiar` is configured in `.changeset/config.json` as an ignored package:

```json
{
  "ignore": ["@runecraft/familiar"]
}
```

This means:
- ✗ It will NOT appear in `bun changeset` prompts
- ✗ It will NOT be versioned by `changeset version`
- ✗ It will NOT be published by `changeset publish`
- ✓ It can still be built and used internally

### Build Pipeline

The monorepo uses Turborepo for building:

```bash
bun run build
```

This respects:
- `build` scripts in each `package.json`
- Task caching for faster rebuilds
- Proper dependency ordering across packages

## Questions?

Refer to:
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Turborepo Docs](https://turbo.build/)
- Project README and `.specs/` for architecture details

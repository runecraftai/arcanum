# Releases

This page documents how to cut a release of Guild. It is written for maintainers, not for users — for end-user documentation, start with [Getting started](getting-started.md).

## Versioning

Guild follows [semantic versioning](https://semver.org):

- **Patch** (e.g. `1.2.3` → `1.2.4`): bug fixes that do not change the config schema, the file format, or the workflow JSON schema.
- **Minor** (e.g. `1.2.0` → `1.3.0`): additive features. New config fields with defaults, new commands, new built-in agents, new skill bundles. The schema may be extended.
- **Major** (e.g. `1.0.0` → `2.0.0`): breaking changes. Removed config fields, changed merge semantics, renamed built-in commands, breaking changes to the workflow JSON schema, changes to on-disk file formats.

The version lives in `packages/guild/package.json` as the `version` field.

## Pre-release checklist

Before cutting a release:

1. **All open issues are triaged.** Anything labeled `release-blocker` is closed or deferred.
2. **CI is green on `main`.** The publish job is gated on the build job.
3. **The schema is in sync.** Run `bun run schema:config:check` to verify the committed JSON schema matches what the Zod schema would produce. If it does not, run `bun run schema:config` and commit the result.
4. **The CHANGELOG is up to date.** `packages/guild/CHANGELOG.md` has an entry for the new version with the format below.
5. **The docs are reviewed.** Any new public config field, command, agent, or workflow control has a docs page. Any breaking change is called out in the CHANGELOG with a migration note.

## Cutting a release

The release is a single PR that bumps the version, updates the CHANGELOG, and (if needed) updates the schema. The PR title follows the repo convention; the body lists the highlights.

```sh
# From the repo root
git checkout main
git pull

# Inside packages/guild
cd packages/guild

# 1. Bump the version
# Edit package.json: set version to the next semver.
# 2. Update the CHANGELOG
# Move the "Unreleased" section under the new version with a date.
# 3. Verify the schema is in sync
bun run schema:config:check
# 4. Commit
git add package.json CHANGELOG.md schema/
git commit -m "release(guild): v1.3.0"
```

The release pipeline picks up the version bump and publishes.

## CHANGELOG format

The CHANGELOG groups changes by type. Use the categories below in this order.

```md
## v1.3.0 — 2026-06-15

### Breaking
- Removed the legacy `recovery.idle` config field. Use `continuation.idle` instead.

### Added
- New `ranger-<category>` agent registration via the `categories` field.
- `/metrics` now reports per-agent token usage.

### Changed
- Default Bard model updated to `openai/gpt-5-mini`.

### Fixed
- Compaction recovery no longer injects a resume prompt twice when OpenCode restores in quick succession.

### Migration
- If you used `recovery.idle`, move its value under `continuation.idle` and remove the old field.
```

Keep entries short. The CHANGELOG is a summary, not a release log. Detail belongs in the PR description and the issue tracker.

## Schema regeneration

Guild's published JSON schema is generated from the Zod schema. After any change to `packages/guild/src/config/schema.ts`:

```sh
# Regenerate
bun run schema:config

# Verify the committed file matches
bun run schema:config:check
```

The check command exits non-zero if the committed schema is out of date. CI runs the check on every PR.

The published schema is referenced from documentation as `<release-tag>`:

```text
https://raw.githubusercontent.com/anomalyco/arcanum/<release-tag>/packages/guild/schema/guild-config.schema.json
```

A new release does not require a manual edit to the docs — the tag is updated automatically on the next push to `main`.

## Rolling out

Guild is published to npm as `@runecraft/guild`. OpenCode plugins are pulled from npm by the `opencode.json` `plugin` field in the user's project. The rollout flow is:

1. The release is published to npm with a `latest` tag.
2. Users pick it up on the next OpenCode startup.
3. The schema URL inside the package points at the matching release tag, so `$schema` references resolve correctly.

For a major version, publish under a `next` tag first and let early adopters exercise it. Promote to `latest` after a week with no regressions.

## Hotfixing

For an urgent fix, the path is the standard hotfix flow:

1. Branch from the latest release tag.
2. Land the minimal fix. Bump the patch version.
3. Run the pre-release checklist in compressed form: tests, schema check, CHANGELOG entry.
4. Publish. The fix reaches `latest` on the next `npm publish`.

A hotfix does not require a release PR through the normal review queue. The CI publish job still gates on green tests.

## See also

- [Architecture](architecture.md) — for the components a release touches.
- [Configuration](configuration.md) — the schema a release must keep in sync.
- [Troubleshooting](troubleshooting.md)

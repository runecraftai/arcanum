# Spec: Publish @runecraft/guild v0.1.0 to npm

## What

Publish the `@runecraft/guild` package (currently at `packages/guild/`, version 0.1.0, fully built with `.js` + `.d.ts` pairs) to the public npm registry so it can be consumed as a dependency by other projects.

Publishing happens **automatically via the CI pipeline** on merge to `main` — not manually. The changeset pipeline detects the version bump and publishes to npm.

## Why

The package has a complete API (17 source files), a well-structured `dist/` output, a quality README, and runtime dependencies that are all resolvable. It is blocked from publication by:

1. **Missing metadata** — npm requires or strongly suggests `repository`, `author`, `keywords`, `homepage`, `bugs`, `engines` for discoverability and provenance.
2. **CHANGELOG inconsistency** — Title says `@runecraftai/guild` instead of `@runecraft/guild`, which will confuse consumers.
3. **No prepublish hook** — The schema JSON file (`dist/schema.json`) is not auto-regenerated before publish. If `build:schema` is not run manually, a stale schema could ship.
4. **Changeset ignore** — `.changeset/config.json` lists `@runecraft/guild` in its `ignore` array, blocking the automated changeset pipeline from ever publishing it.
5. **Peer dependency ambiguity** — `@opencode-ai/plugin` is a regular dependency. If consumers already have it, this could cause duplicate installations.

## Success Criteria

- [ ] `@runecraft/guild` is removed from `.changeset/config.json` ignore array
- [ ] CI pipeline successfully publishes the package on merge to `main`
- [ ] `npm view @runecraft/guild` returns v0.1.0 metadata after pipeline publish
- [ ] Package metadata is complete (repository, author, keywords, homepage, bugs, engines)
- [ ] `npm install @runecraft/guild` succeeds for a fresh consumer
- [ ] `dist/schema.json` is shipped (verified via `npm pack --dry-run`)
- [ ] No stale or broken references remain in the published tarball

## Non-Goals

- Manual publish workflows (pipeline handles it)
- Keeping `@runecraft/guild` in the changeset ignore array (must be removed for pipeline to work)
- Setting up changeset-based versioning for this package (deferred until post-1.0)
- Adding tests or changing runtime code

## Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| D1 | Remove from changeset ignore? | **REMOVE from ignore** | The CI pipeline publishes automatically on merge to `main`. If `@runecraft/guild` stays in the ignore array, the changeset pipeline will SKIP it and it will never be published automatically. |
| D2 | Move `@opencode-ai/plugin` to peerDependencies? | **Keep as regular dependency** for v0.1.0 | Safer default. Consumers of `@runecraft/guild` don't necessarily install `@opencode-ai/plugin` independently. Re-evaluate if duplicate installs become a problem. |
| D3 | How does publishing happen? | **CI pipeline on merge to `main`** | The changeset pipeline (`publish.mjs`) handles auth, versioning, and publishing. No manual `bun publish` or `npm publish` needed. |
| D4 | Add `prepublishOnly` script? | **Yes** — `"prepublishOnly": "bun run build && bun run build:schema"` | Ensures dist/ and schema.json are always fresh before publish. Prevents stale artifacts. |
| D5 | Add `engines` field? | **Yes** — `{ "bun": ">=1.3.0" }` | The package is built with Bun; consumers should know the minimum Bun version. Compatible with Node 18+ but Bun is the intended runtime. |

## Risk Register

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|------------|
| Stale schema.json | Low | Medium | `prepublishOnly` script regenerates it |
| Wrong files published | Low | High | `npm pack --dry-run` previews exactly what ships |
| Pipeline publish fails | Low | High | Verify changeset config and `publishConfig.access` before merge |

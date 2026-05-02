# Session Log — publish-runecraft-guild

| Field | Value |
|-------|-------|
| **Feature** | publish-runecraft/guild |
| **Status** | completed |
| **Date** | 2026-05-02 |
| **Commit** | `7edaf48` |
| **Tag** | `v0.1.0-guild` |

## Summary

Phase 1 (7 tasks) + Phase 2 (2 tasks) — all approved by Ward + Arbiter.

All tasks completed successfully. Specs archived to `.specs/archive/2026-05-02-publish-runecraft-guild/`.

## Next Steps

- Merge to main → pipeline publishes automatically

## Knowledge Graph

Rebuilt: 196 nodes, 244 edges, 26 communities.

---

# Session Log — changeset-generator-fix

| Field | Value |
|-------|-------|
| **Feature** | changeset-generator-fix |
| **Status** | completed |
| **Date** | 2026-05-02 |
| **Commit** | `79ab6c9` |
| **Type** | quick fix (no spec) |

## Summary

Quick fix for the changeset generator (`.changeset/generate-from-commits.ts`):

- **Tag matching**: Added `v*` fallback glob in `findLastReleaseRef()` to match tags like `v0.1.0-guild`
- **Path prefix bug**: Added trailing slash to `dirPrefix` check to prevent false matches (e.g., `packages/spells-extra` matching `packages/spells`)
- **Duplicate changesets**: Skip packages that already have pending changeset files

## Knowledge Graph

Rebuilt: 196 nodes, 244 edges, 26 communities.

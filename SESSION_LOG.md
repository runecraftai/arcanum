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

## 2026-06-07: guild-agent-model-configuration ✅

**Spec:** `.specs/features/guild-agent-model-configuration/`
**Status:** Completed

Executed T01-T07:

- Collected real model inventory via `opencode models` (28 models across 3 providers)
- Captured 7-day usage evidence via `opencode stats` (41 sessions, $1.95 cost, 2,234 messages)
- Identified top cost drivers: `qwen3.6-plus` ($1.04/wk), `deepseek-v4-pro` ($0.77/wk)
- Defined official matrix for 8 built-in agents balancing OpenAI window vs Go cost vs free models
- Produced reference `guild-opencode.jsonc` snippet
- Documented pressure-release order (cleric → fighter → bard/wizard preserved)
- Documented weekly review loop with `opencode stats`
- Listed avoided models (qwen3.7-plus, qwen3.6-plus, deepseek-v4-pro)

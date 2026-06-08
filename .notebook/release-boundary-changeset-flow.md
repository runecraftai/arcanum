# Release boundary for generated changesets

- Source: `.changeset/generate-from-commits.ts:findLastReleaseRef()`
- Current rule: prefer the nearest reachable package tag via `git describe --tags --abbrev=0 --match '@runecraft/*@*'`
- Fallback: latest `chore: version packages` commit hash when tags are unavailable
- Why: semver-sorted tag lookup could pick an older release boundary from another package and re-include already published commits in the next changelog/version run

# Tasks: guild-user-docs

**Spec**: `.specs/features/guild-user-docs/spec.md`
**Design**: `.specs/features/guild-user-docs/design.md`
**Status**: All 20 tasks complete. P1, P2, P3, P4 shipped.

---

## Execution Plan

### Phase 1: User MVP Docs

```text
T01 -> T02 -> T03 -> T04 -> T05 -> T06 -> T07
```

### Phase 2: Product Behavior Docs

```text
T07 -> T08 -> T09 -> T10 -> T11
```

### Phase 3: Advanced Docs and Examples

```text
T11 -> T12 -> T13 -> T14 -> T15 -> T16 -> T17 -> T18
```

### Phase 4: Verification and Site Readiness

```text
T18 -> T19 -> T20
```

---

## Task Breakdown

### T01: Rewrite Guild README as a landing page ✅

**What**: Refactor `packages/guild/README.md` so it stays concise and links into detailed docs instead of becoming the full manual.
**Where**: `packages/guild/README.md`
**Depends on**: None
**Requirement**: GUILD-DOCS-01, GUILD-DOCS-08

**Done when**:

- [x] README explains what Guild is in one short section
- [x] README includes install snippet for `@runecraft/guild`
- [x] README links to `docs/README.md`, getting started, configuration, commands, and troubleshooting
- [x] README no longer tries to cover deep config or troubleshooting details
- [x] README uses accurate Guild paths and package names

### T02: Create docs index ✅

**What**: Add a docs landing page that maps all available and planned documentation pages.
**Where**: `packages/guild/docs/README.md`
**Depends on**: T01
**Requirement**: GUILD-DOCS-01, GUILD-DOCS-08

**Done when**:

- [ ] Docs index groups pages by Getting Started, Customization, Reference, and Maintainers
- [ ] All links are relative and point to planned file paths
- [ ] It tells users where to start based on their goal

### T03: Write getting started guide ✅

**What**: Create a first-run guide for installing and verifying Guild in OpenCode.
**Where**: `packages/guild/docs/getting-started.md`
**Depends on**: T02
**Requirement**: GUILD-DOCS-01

**Done when**:

- [ ] Includes prerequisites for OpenCode and provider setup at a high level
- [ ] Shows `opencode.json` plugin configuration
- [ ] Explains restart behavior and automatic npm plugin install
- [ ] Includes verification steps for agent availability and `/guild-health`
- [ ] Links to troubleshooting for install failures

### T04: Write configuration reference ✅

**What**: Document Guild config files, merge behavior, schema usage, and common config examples.
**Where**: `packages/guild/docs/configuration.md`
**Depends on**: T03
**Requirement**: GUILD-DOCS-02

**Done when**:

- [ ] Lists project and user config paths with priority
- [ ] Explains JSONC support
- [ ] Explains merge behavior for nested objects, arrays, and scalars
- [ ] Documents top-level config sections from the schema
- [ ] Explains schema file and raw GitHub URL/pinning strategy
- [ ] Includes short examples for agents, skills, categories, continuation, and analytics

### T05: Write commands reference ✅

**What**: Document all user-facing Guild commands.
**Where**: `packages/guild/docs/commands.md`
**Depends on**: T04
**Requirement**: GUILD-DOCS-03

**Done when**:

- [ ] Documents `/start-work`
- [ ] Documents `/run-workflow`
- [ ] Documents `/guild-health`
- [ ] Documents `/metrics`
- [ ] Documents `/token-report`
- [ ] Notes analytics requirements for analytics-dependent commands
- [ ] Includes common command failure modes

### T06: Write troubleshooting guide ✅

**What**: Create symptom-based troubleshooting for install, config, commands, workflows, skills, analytics, and logs.
**Where**: `packages/guild/docs/troubleshooting.md`
**Depends on**: T05
**Requirement**: GUILD-DOCS-04

**Done when**:

- [ ] Covers Guild did not load
- [ ] Covers config not applied
- [ ] Covers agents not appearing
- [ ] Covers `/start-work` not finding a plan
- [ ] Covers `/run-workflow` not finding a workflow
- [ ] Covers analytics/metrics not enabled
- [ ] Covers skill loading issues
- [ ] Points to `/guild-health` and OpenCode logs

### T07: Verify P1 docs against source ✅

**Verification record (2026-06-06)**:

- Config paths match `packages/guild/src/infrastructure/fs/config-fs-loader.ts` lines 118-119 (user and project bases).
- Command names match `packages/guild/src/features/builtin-commands/commands.ts` and `command-router.ts` (`start-work`, `run-workflow`, `guild-health`, `metrics`, `token-report`).
- Schema publish note matches `packages/guild/package.json` `files` field, which only ships `dist/`.
- All P1→P1 relative links resolve; cross-refs to P2/P3 pages are forward-compatible and will land with later tasks.
- No P1 doc promises unsupported behavior.

**What**: Review README and P1 docs against the current Guild source of truth.
**Where**: `packages/guild/README.md`, `packages/guild/docs/*.md`, relevant source files
**Depends on**: T06
**Requirement**: GUILD-DOCS-01, GUILD-DOCS-02, GUILD-DOCS-03, GUILD-DOCS-04

**Done when**:

- [ ] Config paths match the loader implementation
- [ ] Commands match command routing/source names
- [ ] Schema notes match package publish behavior
- [ ] README/docs links resolve
- [ ] No P1 doc promises unsupported behavior

### T08: Write agents reference ✅

**What**: Document the 8 built-in Guild agents, their roles, modes, and how users should think about direct use versus delegation.
**Where**: `packages/guild/docs/agents.md`
**Depends on**: T07
**Requirement**: GUILD-DOCS-05

**Done when**:

- [x] Includes Bard, Fighter, Ranger, Wizard, Rogue, Warlock, Cleric, and Paladin
- [x] Explains primary, subagent, and all modes
- [x] Explains category-specialist behavior for Ranger
- [x] Explains reviewer/security read-only expectations
- [x] Links to configuration and skills docs

### T09: Write skills guide ✅

**What**: Document built-in skills, custom skill discovery, assignment to agents, and disabling skills.
**Where**: `packages/guild/docs/skills.md`
**Depends on**: T08
**Requirement**: GUILD-DOCS-05

**Done when**:

- [x] Explains `SKILL.md` structure and frontmatter expectations
- [x] Lists or summarizes bundled Guild skills
- [x] Explains project/user skill locations or Guild-specific skill directories accurately
- [x] Shows assigning skills through config
- [x] Explains `disabled_skills`

### T10: Write continuation guide ✅

**What**: Document manual resume, compaction recovery, idle prompts, and todo continuation behavior.
**Where**: `packages/guild/docs/continuation.md`
**Depends on**: T09
**Requirement**: GUILD-DOCS-06

**Done when**:

- [x] Distinguishes manual resume from automatic continuation
- [x] Explains compaction recovery behavior
- [x] Explains idle continuation defaults
- [x] Explains todo preservation/finalization behavior
- [x] Includes config examples and troubleshooting links

### T11: Write analytics guide ✅

**What**: Document opt-in analytics, session tracking, local storage, metrics reports, fingerprinting, and related commands.
**Where**: `packages/guild/docs/analytics.md`
**Depends on**: T10
**Requirement**: GUILD-DOCS-06

**Done when**:

- [x] Clearly states analytics is opt-in
- [x] Shows how to enable analytics
- [x] Explains `use_fingerprint` separately from analytics enablement
- [x] Explains what `/metrics` and `/token-report` report
- [x] Describes local storage paths and privacy implications at a high level

### T12: Write workflow overview ✅

**What**: Explain what Guild workflows are and how they relate to agents, plans, commands, and continuation.
**Where**: `packages/guild/docs/workflows/overview.md`
**Depends on**: T11
**Requirement**: GUILD-DOCS-06

**Done when**:

- [x] Defines workflows in user-facing terms
- [x] Explains where workflow definitions live
- [x] Explains `/run-workflow` at a conceptual level
- [x] Links to authoring and controls

### T13: Write workflow authoring guide ✅

**What**: Document workflow file format, step types, artifacts, completion methods, and examples.
**Where**: `packages/guild/docs/workflows/authoring.md`
**Depends on**: T12
**Requirement**: GUILD-DOCS-06

**Done when**:

- [x] Shows a minimal workflow definition
- [x] Explains supported step types accurately
- [x] Explains completion and artifact behavior
- [x] Mentions safe relative workflow directories if relevant
- [x] Links to example workflows

### T14: Write workflow controls guide ✅

**What**: Document workflow pause, skip, abort, and status controls.
**Where**: `packages/guild/docs/workflows/controls.md`
**Depends on**: T13
**Requirement**: GUILD-DOCS-06

**Done when**:

- [x] Lists supported workflow control phrases/commands
- [x] Explains expected effect of each control
- [x] Includes troubleshooting for controls not applying

### T15: Write architecture overview ✅

**What**: Add a maintainer-oriented overview of Guild plugin initialization and major components.
**Where**: `packages/guild/docs/architecture.md`
**Depends on**: T14
**Requirement**: GUILD-DOCS-07

**Done when**:

- [x] Explains plugin entrypoint and initialization flow
- [x] Explains config loading, managers, hooks, tools, and plugin interface
- [x] Includes a simple component map
- [x] Links to agents, configuration, workflows, and releases

### T16: Write model guide and background agents docs ✅

**What**: Document model selection guidance and background-agent concurrency behavior.
**Where**: `packages/guild/docs/model-guide.md`, `packages/guild/docs/background-agents.md`
**Depends on**: T15
**Requirement**: GUILD-DOCS-07

**Done when**:

- [x] Model guide explains practical model selection by agent/use case
- [x] Background-agent docs explain concurrency settings and stale timeout
- [x] Both docs include small config examples

### T17: Write releases guide ✅

**What**: Document package verification and release expectations for maintainers.
**Where**: `packages/guild/docs/releases.md`
**Depends on**: T16
**Requirement**: GUILD-DOCS-07

**Done when**:

- [x] Lists build, test, typecheck, verify, schema, and smoke-install expectations
- [x] Explains generated schema update/check behavior
- [x] Explains high-level release checklist without duplicating CI internals unnecessarily

### T18: Add workflow examples ✅

**What**: Add example workflow definitions that users can adapt.
**Where**: `packages/guild/docs/examples/workflows/release.json`, `packages/guild/docs/examples/workflows/weekly-review.json`, `packages/guild/docs/examples/workflows/refactor-prep.json`, `packages/guild/docs/examples/workflows/README.md`
**Depends on**: T17
**Requirement**: GUILD-DOCS-06, GUILD-DOCS-07

**Done when**:

- [x] Examples are valid workflow JSON according to current workflow schema
- [x] Examples are referenced from workflow docs (overview, authoring, examples README)
- [x] Examples are small enough to understand quickly

### T19: Verify links and docs consistency ✅

**What**: Perform a scripted pass over docs links, source references, and naming consistency.
**Where**: `packages/guild/README.md`, `packages/guild/docs/`
**Depends on**: T18
**Requirement**: GUILD-DOCS-08

**Done when**:

- [x] All relative docs links resolve (scripted check: 17 pages, 0 broken links)
- [x] Guild naming is consistent across README and docs
- [x] Paths use `.guild/` and `guild-opencode` where appropriate
- [x] No stale Weave paths remain

### T20: Final documentation review ✅

**Verification record (2026-06-06)**:

- 17 markdown pages + 3 example JSON files produced under `packages/guild/docs/`.
- 0 broken internal links across all docs (scripted check).
- New-user path: README → docs/README.md → getting-started → configuration → commands → troubleshooting (all reachable from the docs index).
- Maintainer path: docs/README.md → architecture → model-guide → background-agents → releases (all reachable from the docs index).
- All public config fields, commands, agents, and workflow controls documented; cross-references are mutual where appropriate.
- Docs are ready to be the source for a future static site: relative links, stable headings, grouped index, narrow page scopes.

**What**: Review the complete docs set as both a new user and a maintainer.
**Where**: `packages/guild/README.md`, `packages/guild/docs/`
**Depends on**: T19
**Requirement**: GUILD-DOCS-01 through GUILD-DOCS-08

**Done when**:

- [x] New-user path is clear: README -> getting started -> configuration -> commands -> troubleshooting
- [x] Maintainer path is clear: docs index -> architecture -> releases
- [x] Docs are ready to become the source for a future site
- [x] Remaining gaps, if any, are explicitly listed for follow-up

# Tasks: guild-docs-customization-recipes

**Design**: `.specs/features/guild-docs-customization-recipes/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Discovery and Schema Guardrails (Sequential)

```text
T01 -> T02
```

### Phase 2: Core Recipe Pages (Sequential)

```text
T02 -> T03 -> T04 -> T05
```

### Phase 3: Supporting Recipe Pages (Sequential)

```text
T05 -> T06 -> T07
```

### Phase 4: Cross-links and Validation (Sequential)

```text
T07 -> T08 -> T09 -> T10
```

---

## Task Breakdown

### T01: Confirm schema-supported fields for examples

**What**: Review `packages/guild/schema/guild-config.schema.json` and note which fields are valid for `agents`, `categories`, and `custom_agents`.
**Where**: `packages/guild/schema/guild-config.schema.json`
**Depends on**: None
**Requirement**: GUILD-DOCS-CUSTOM-08

**Done when**:

- [ ] Supported fields for `agents` are confirmed, including `prompt_append`.
- [ ] Supported fields for `categories` are confirmed, including `patterns` and `prompt_append`.
- [ ] Supported fields for `custom_agents` are confirmed, including `prompt` and `prompt_file`.
- [ ] Any example using `review_models` uses provider-qualified model names.

### T02: Update docs index for customization discovery

**What**: Add a discovery-oriented customization section to the docs index with links to the new recipe pages.
**Where**: `packages/guild/docs/README.md`
**Depends on**: T01
**Requirement**: GUILD-DOCS-CUSTOM-02

**Done when**:

- [ ] The index links to `prompt-append.md`, `skills.md`, `categories.md`, `custom-agents.md`, `disabling-features.md`, and `full-example.md`.
- [ ] Existing reference and maintainer links remain intact.
- [ ] The section is written as user intent, not schema jargon only.

### T03: Add prompt append recipe page

**What**: Create a dedicated guide for additive prompt customization with examples by agent.
**Where**: `packages/guild/docs/prompt-append.md`
**Depends on**: T02
**Requirement**: GUILD-DOCS-CUSTOM-01

**Done when**:

- [ ] The page explains what `prompt_append` does.
- [ ] The page compares `prompt_append`, `skills`, and `prompt`.
- [ ] Examples cover Bard, Fighter, Rogue, Wizard, Cleric, Paladin, and Ranger/category.
- [ ] The page states that `custom_agents` use `prompt` or `prompt_file`, not `prompt_append`.
- [ ] All snippets validate against the schema.

### T04: Add custom agents recipe page

**What**: Create a practical guide for defining custom agents with supported fields and realistic examples.
**Where**: `packages/guild/docs/custom-agents.md`
**Depends on**: T03
**Requirement**: GUILD-DOCS-CUSTOM-03

**Done when**:

- [ ] The page explains when to create a custom agent versus overriding a built-in agent.
- [ ] The page lists supported `custom_agents` fields.
- [ ] Examples include docs-writer, release-manager, migration-planner, and qa-specialist.
- [ ] No custom agent example uses unsupported `prompt_append`.
- [ ] Inline `prompt` and `prompt_file` guidance is included.

### T05: Add categories recipe page

**What**: Create a guide for category-based Ranger specialists and routing patterns.
**Where**: `packages/guild/docs/categories.md`
**Depends on**: T04
**Requirement**: GUILD-DOCS-CUSTOM-04

**Done when**:

- [ ] The page explains `ranger-<category>` agent creation.
- [ ] The page explains `patterns` routing guidance.
- [ ] Examples cover frontend, backend, infra, and docs.
- [ ] The page shows how categories complement skills.
- [ ] The page explains how to disable a category Ranger.

### T06: Add disabling features guide

**What**: Create a guide for disabling agents, tools, hooks, and skills safely.
**Where**: `packages/guild/docs/disabling-features.md`
**Depends on**: T05
**Requirement**: GUILD-DOCS-CUSTOM-05

**Done when**:

- [ ] The page covers `disabled_agents`, `disabled_tools`, `disabled_hooks`, and `disabled_skills`.
- [ ] The page covers `agents.<name>.disable` if confirmed by schema support.
- [ ] The page explains user/project union behavior for disabled-list keys.
- [ ] Examples include minimal setup, security-conscious setup, and category Ranger disabling.

### T07: Add full configuration example

**What**: Create a complete copy/paste `.opencode/guild-opencode.jsonc` example.
**Where**: `packages/guild/docs/full-example.md`
**Depends on**: T06
**Requirement**: GUILD-DOCS-CUSTOM-06

**Done when**:

- [ ] The page states where to place the config file.
- [ ] The example includes `$schema`, `agents`, `categories`, `custom_agents`, `background`, `continuation`, `analytics`, and `log_level` where supported.
- [ ] Comments are JSONC-compatible.
- [ ] The page tells users to run `/guild-health` after editing.

### T08: Add cross-links from existing docs

**What**: Update existing documentation to point to the new recipe pages where users naturally need them.
**Where**: `packages/guild/docs/configuration.md`, `packages/guild/docs/agents.md`, `packages/guild/docs/skills.md`, `packages/guild/docs/model-guide.md`, `packages/guild/docs/troubleshooting.md`
**Depends on**: T07
**Requirement**: GUILD-DOCS-CUSTOM-07

**Done when**:

- [ ] `configuration.md` links to recipes from examples/reference sections.
- [ ] `agents.md` links to prompt append, categories, and custom agents pages.
- [ ] `skills.md` links to prompt append for the comparison.
- [ ] `model-guide.md` links to categories/custom agents where model overrides are discussed.
- [ ] `troubleshooting.md` links to disabling/config pages where relevant.

### T09: Validate snippets and terminology

**What**: Perform an editorial validation pass against the schema and Guild naming conventions.
**Where**: All modified docs and `packages/guild/schema/guild-config.schema.json`
**Depends on**: T08
**Requirement**: GUILD-DOCS-CUSTOM-08

**Done when**:

- [ ] No snippet uses Weave agent names such as Loom, Tapestry, Shuttle, Pattern, Thread, Spindle, Weft, or Warp.
- [ ] `prompt_append` appears only where schema-supported.
- [ ] `custom_agents` examples use `prompt` or `prompt_file`.
- [ ] Disabled-list merge behavior is described consistently.
- [ ] The docs do not include a public gaps/limitations section.

### T10: Run lightweight verification

**What**: Run available lightweight checks for docs/config consistency.
**Where**: `packages/guild` and repository root as appropriate
**Depends on**: T09
**Requirement**: GUILD-DOCS-CUSTOM-08

**Done when**:

- [ ] Run schema generation/check if relevant, e.g. `bun run schema:config:check` from `packages/guild`.
- [ ] Optionally run targeted tests if docs changes expose schema assumptions.
- [ ] Manually inspect docs links for obvious broken relative paths.
- [ ] Summarize verification results before completion.

---

## Execution Guidance

- Execute this plan with `/start-work`.
- Keep implementation documentation-only.
- Do not add a public "gaps" or "known issues" section.
- If a desired example cannot be verified against the schema, omit it or replace it with a safer supported example.

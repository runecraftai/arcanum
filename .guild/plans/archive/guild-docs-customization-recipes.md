# Guild Docs Customization Recipes

## TL;DR
> **Summary**: Add recipe-oriented documentation pages (prompt_append, custom_agents, categories, disabling, full example) and cross-links so users can discover and apply Guild customization features without spelunking the schema.
> **Estimated Effort**: Medium

## Context

### Original Request
Guild exposes substantial customization features (built-in agent overrides, `prompt_append`, skills, categories, custom agents, disabling controls), but the discovery path is reference-oriented. Users need recipe-oriented pages to answer practical questions.

### Key Findings
- All customization features already exist in runtime — this is docs-only
- Schema at `packages/guild/schema/guild-config.schema.json` is source of truth
- Design doc at `.specs/features/guild-docs-customization-recipes/design.md`
- Spec at `.specs/features/guild-docs-customization-recipes/spec.md`

## Objectives

### Core Objective
Make Guild customization discoverable through recipe pages without changing runtime behavior.

### Definition of Done
- [ ] 6 new recipe pages exist under `packages/guild/docs/`
- [ ] Docs index has a customization discovery section
- [ ] 5 existing docs pages cross-link to new recipes
- [ ] All config snippets validate against the schema
- [ ] Zero Weave agent names in docs
- [ ] No "gaps" or "known issues" section published

## TODOs

- [x] 1. Confirm schema-supported fields for examples
  **What**: Review `packages/guild/schema/guild-config.schema.json` and note which fields are valid for `agents` (including `prompt_append`), `categories` (including `patterns` and `prompt_append`), and `custom_agents` (including `prompt` and `prompt_file`). Check `review_models` for provider qualification.
  **Files**: `packages/guild/schema/guild-config.schema.json`
  **Acceptance**: Supported fields documented; any `review_models` example uses provider-qualified names like `anthropic/claude-sonnet-4`

- [x] 2. Update docs index for customization discovery
  **What**: Add a discovery-oriented customization section to `packages/guild/docs/README.md` linking to prompt-append.md, skills.md, categories.md, custom-agents.md, disabling-features.md, and full-example.md. Keep existing reference/maintainer links intact.
  **Files**: `packages/guild/docs/README.md`
  **Acceptance**: Index links to all 6 new pages; existing links preserved; section written as user intent

- [x] 3. Add prompt_append recipe page
  **What**: Create `packages/guild/docs/prompt-append.md` explaining additive prompt customization. Cover what it does, compare with skills/prompt, show examples per agent (Bard, Fighter, Rogue, Wizard, Cleric, Paladin, Ranger/category), and warn about common mistakes (using prompt when append suffices, putting prompt_append under custom_agents).
  **Files**: `packages/guild/docs/prompt-append.md`
  **Acceptance**: Examples cover all built-in agent groups; page states custom_agents use prompt/prompt_file not prompt_append; all snippets validate against schema

- [x] 4. Add custom_agents recipe page
  **What**: Create `packages/guild/docs/custom-agents.md` explaining when to create a custom agent vs override a built-in. List supported fields (prompt, prompt_file, model, display_name, mode, fallback_models, category, cost, temperature, top_p, maxTokens, modelOptions, tools, skills, triggers, description). Provide docs-writer, release-manager, migration-planner, and qa-specialist examples.
  **Files**: `packages/guild/docs/custom-agents.md`
  **Acceptance**: No example uses unsupported prompt_append; supported fields listed; 4 practical agent examples; prompt vs prompt_file guidance included

- [x] 5. Add categories recipe page
  **What**: Create `packages/guild/docs/categories.md` explaining categories as `ranger-<category>` specializations. Cover how patterns guide routing, how categories complement skills, and how to disable a category Ranger. Examples for frontend, backend, infra, and docs.
  **Files**: `packages/guild/docs/categories.md`
  **Acceptance**: Explains ranger-<category> registration; patterns routing documented; 4 domain examples; disabling documented

- [x] 6. Add disabling features guide
  **What**: Create `packages/guild/docs/disabling-features.md` centralizing safe surface-area reduction. Cover disabled_agents, disabled_tools, disabled_hooks, disabled_skills, and agents.<name>.disable if schema-supported. Explain user/project union merge behavior. Include minimal, security-conscious, and category-Ranger examples.
  **Files**: `packages/guild/docs/disabling-features.md`
  **Acceptance**: All disabling keys covered; merge behavior explained; 3 example setups

- [x] 7. Add full configuration example
  **What**: Create `packages/guild/docs/full-example.md` with a complete copy/paste `.opencode/guild-opencode.jsonc`. Include $schema, agents, categories, custom_agents, background, continuation, analytics, log_level. Comments must be JSONC-compatible.
  **Files**: `packages/guild/docs/full-example.md`
  **Acceptance**: Valid JSONC; covers all major sections; tells user to run `/guild-health` after editing

- [x] 8. Add cross-links from existing docs
  **What**: Update configuration.md, agents.md, skills.md, model-guide.md, and troubleshooting.md to link to the new recipe pages where natural.
  **Files**: `packages/guild/docs/configuration.md`, `packages/guild/docs/agents.md`, `packages/guild/docs/skills.md`, `packages/guild/docs/model-guide.md`, `packages/guild/docs/troubleshooting.md`
  **Acceptance**: Each existing page links to relevant recipe pages; no broken relative paths

- [x] 9. Validate snippets and terminology
  **What**: Editorial validation pass across all changed docs. Check: no Weave agent names (Loom, Tapestry, Shuttle, etc.), prompt_append only where schema-supported, custom_agents use prompt/prompt_file, disabled-list merge behavior consistent, no public gaps/limitations section.
  **Files**: All modified doc files + `packages/guild/schema/guild-config.schema.json`
  **Acceptance**: Zero Weave agent names; prompt_append only under supported sections; no gaps section published

- [x] 10. Run lightweight verification
  **What**: Run schema generation/check (`bun run schema:config:check` from packages/guild if available). Optionally run targeted tests. Manually inspect all doc links for broken relative paths. Summarize results.
  **Files**: `packages/guild`
  **Acceptance**: Schema check passes; no broken links; verification summary documented

## Verification
- [ ] T01: Schema fields confirmed and documented
- [ ] T02: Docs index updated with customization section
- [ ] T03: prompt-append.md created with per-agent examples
- [ ] T04: custom-agents.md created with 4 practical examples
- [ ] T05: categories.md created with domain examples
- [ ] T06: disabling-features.md created with 3 example setups
- [ ] T07: full-example.md created with valid JSONC
- [ ] T08: 5 existing docs pages cross-link to new recipes
- [ ] T09: Editorial validation passes (no Weave names, schema-safe)
- [ ] T10: Schema check passes, no broken links

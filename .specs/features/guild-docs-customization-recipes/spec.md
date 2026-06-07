# Guild Docs Customization Recipes Specification

## Problem Statement

Guild already exposes substantial customization features through its OpenCode plugin configuration: built-in agent overrides, `prompt_append`, skills, categories, custom agents, disabling controls, workflows, continuation, analytics, and background execution. The current documentation describes these capabilities, but the discovery path is more reference-oriented than recipe-oriented.

Users who want to answer practical questions like "how do I add project-specific instructions?", "how do I create a docs specialist?", or "how do I route frontend/backend work differently?" need more examples and clearer entry points.

We should improve the documentation first, without changing runtime behavior, by adding focused recipe pages and cross-links that make existing capabilities easier to discover and copy.

## Goals

- [ ] Make `prompt_append` easy to understand and apply safely.
- [ ] Show when to use `prompt_append`, `skills`, or full `prompt` replacement.
- [ ] Document categories as a practical routing mechanism for `ranger-<category>` specialists.
- [ ] Document `custom_agents` with realistic examples and correct schema usage.
- [ ] Document safe feature disabling through existing config fields.
- [ ] Provide one complete copy/paste Guild config example.
- [ ] Update the docs index so users discover customization capabilities quickly.
- [ ] Validate all examples against the current Guild config schema.

## Out of Scope

| Item | Reason |
| --- | --- |
| Runtime changes to agent registration, routing, or skill loading | This is a documentation-first improvement. |
| Adding new config fields | Examples must use behavior supported by the current schema. |
| Publicly listing product gaps or missing features | Docs should present reliable supported paths, not internal audit notes. |
| Rebranding Guild back to Weave terminology | Weave is used only as structural inspiration. |
| Publishing or hosting a new docs site | This scope updates repository documentation only. |

---

## User Stories

### P1: Add instructions with `prompt_append` ⭐ MVP

**User Story**: As a Guild user, I want a dedicated `prompt_append` guide so I can add project-specific instructions to built-in agents without replacing their base prompts.

**Acceptance Criteria**:

1. WHEN a user opens the `prompt_append` guide THEN it SHALL explain what `prompt_append` does and why it preserves base behavior.
2. WHEN the guide compares customization mechanisms THEN it SHALL distinguish `prompt_append`, `skills`, and `prompt`.
3. WHEN examples are shown THEN they SHALL include Bard, Fighter, Rogue, Wizard, Cleric, Paladin, and Ranger/category use cases.
4. WHEN custom agents are mentioned THEN the guide SHALL state that `custom_agents` use `prompt` or `prompt_file`, not `prompt_append`, unless schema support changes.

**Independent Test**: Read the page and copy at least one `agents.<name>.prompt_append` example into a Guild config; the example validates against the schema.

---

### P1: Discover customization from the docs index ⭐ MVP

**User Story**: As a new user, I want the docs index to guide me toward common customization tasks instead of only listing reference pages.

**Acceptance Criteria**:

1. WHEN a user opens `packages/guild/docs/README.md` THEN it SHALL include a "Customize Guild" or equivalent discovery section.
2. WHEN the user wants to customize prompts, skills, categories, custom agents, disabling, or full config THEN the index SHALL link to the appropriate page.
3. WHEN existing reference links remain THEN they SHALL still point to their current pages.

**Independent Test**: Starting from the docs README, a user can reach every new recipe page in one click.

---

### P1: Configure custom agents correctly ⭐ MVP

**User Story**: As a Guild user, I want examples of `custom_agents` so I can add project-specific specialists without guessing which fields are supported.

**Acceptance Criteria**:

1. WHEN the custom agents page lists fields THEN it SHALL include supported fields such as `prompt`, `prompt_file`, `mode`, `description`, `skills`, `tools`, `triggers`, and `display_name` where supported by the schema.
2. WHEN examples are provided THEN they SHALL include practical agents such as docs writer, release manager, migration planner, and QA specialist.
3. WHEN custom agents are compared with built-in overrides THEN the page SHALL explain when to customize a built-in agent versus creating a new custom agent.

**Independent Test**: Each `custom_agents` example validates against the schema and does not use unsupported `prompt_append` fields.

---

### P2: Route work with categories

**User Story**: As a user in a multi-domain repo, I want category examples so frontend, backend, infra, or docs work can be routed to category-specific Ranger agents.

**Acceptance Criteria**:

1. WHEN a user opens the categories page THEN it SHALL explain that categories create `ranger-<category>` agents.
2. WHEN `patterns` are documented THEN the page SHALL explain that they guide routing by path.
3. WHEN examples are provided THEN they SHALL cover frontend, backend, infra, and docs categories.
4. WHEN skills are mentioned THEN the page SHALL show how category routing can complement agent skill assignment.

**Independent Test**: Category examples validate against the schema and include realistic `patterns` arrays.

---

### P2: Disable features safely

**User Story**: As a user, I want a clear disabling guide so I can reduce the plugin surface area without breaking unrelated configuration.

**Acceptance Criteria**:

1. WHEN disabling options are documented THEN the guide SHALL cover `disabled_agents`, `disabled_tools`, `disabled_hooks`, `disabled_skills`, and `agents.<name>.disable` if supported by the schema.
2. WHEN merge behavior matters THEN the guide SHALL explain that disabled-list keys are unioned across user and project config.
3. WHEN examples are provided THEN they SHALL include a minimal setup, safer setup, and category-agent disabling.

**Independent Test**: Disabling examples validate against the schema and align with documented merge behavior.

---

### P2: Provide a complete copy/paste example

**User Story**: As a user, I want one complete config example so I can start from a working `.opencode/guild-opencode.jsonc` and edit it.

**Acceptance Criteria**:

1. WHEN a user opens the full example page THEN it SHALL include a complete `.opencode/guild-opencode.jsonc` snippet.
2. WHEN the example includes sections THEN it SHALL cover `$schema`, `agents`, `categories`, `custom_agents`, `background`, `continuation`, `analytics`, and `log_level` where supported.
3. WHEN comments are included THEN they SHALL remain JSONC-compatible.

**Independent Test**: Removing comments if necessary leaves a config shape that validates against the schema.

---

## Edge Cases

- WHEN a desired example requires unsupported schema fields THEN omit or rewrite the example using supported fields.
- WHEN `prompt_append` is discussed around custom agents THEN explicitly redirect users to `prompt`/`prompt_file`.
- WHEN disabling fields overlap (`disabled_agents` and `agents.<name>.disable`) THEN explain the safest supported usage without overpromising runtime details.
- WHEN examples use `review_models` THEN ensure models are provider-qualified, e.g. `anthropic/claude-sonnet-4`.
- WHEN docs mention Weave-inspired concepts THEN translate them to Guild names: Bard, Fighter, Ranger, Wizard, Rogue, Warlock, Cleric, Paladin.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-DOCS-CUSTOM-01 | Add instructions with `prompt_append` | `packages/guild/docs/prompt-append.md` | Planned |
| GUILD-DOCS-CUSTOM-02 | Discover customization from index | `packages/guild/docs/README.md` | Planned |
| GUILD-DOCS-CUSTOM-03 | Configure custom agents correctly | `packages/guild/docs/custom-agents.md` | Planned |
| GUILD-DOCS-CUSTOM-04 | Route work with categories | `packages/guild/docs/categories.md` | Planned |
| GUILD-DOCS-CUSTOM-05 | Disable features safely | `packages/guild/docs/disabling-features.md` | Planned |
| GUILD-DOCS-CUSTOM-06 | Provide complete copy/paste example | `packages/guild/docs/full-example.md` | Planned |
| GUILD-DOCS-CUSTOM-07 | Keep existing docs connected | Existing docs cross-links | Planned |
| GUILD-DOCS-CUSTOM-08 | Validate examples against schema | Editorial validation pass | Planned |

---

## Success Criteria

- [ ] New users can find customization recipes from the docs index.
- [ ] `prompt_append` has a dedicated, example-rich page.
- [ ] `custom_agents` are documented without unsupported fields.
- [ ] Categories are documented as Ranger routing recipes.
- [ ] Disabling controls are documented with merge behavior caveats.
- [ ] A complete config example exists and is copy/pasteable.
- [ ] Existing docs link to the new recipe pages.
- [ ] Examples align with `packages/guild/schema/guild-config.schema.json`.

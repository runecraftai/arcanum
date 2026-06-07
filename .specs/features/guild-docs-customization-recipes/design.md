# Design: Guild Docs Customization Recipes

## Overview

This feature improves Guild documentation discoverability by adding recipe-oriented pages inspired by the structure of the Weave documentation, while preserving Guild terminology and documenting only supported behavior.

The implementation is documentation-only. It adds focused pages under `packages/guild/docs/` and updates existing pages with cross-links. No runtime, schema, or tests are required unless example validation reveals a documentation/schema mismatch.

## Design Principles

1. **Docs as product surface**: Present Guild's existing customization features as user-facing capabilities, not only schema fields.
2. **Supported behavior only**: Do not publish speculative gaps or roadmap items.
3. **Recipe first, reference second**: Start with common user intentions, then link to reference pages.
4. **Additive customization bias**: Prefer `skills` and `prompt_append` over full `prompt` replacement.
5. **Schema-safe examples**: Every config snippet must be compatible with `packages/guild/schema/guild-config.schema.json`.
6. **Guild names, not Weave names**: Use Bard/Fighter/Ranger/Wizard/Rogue/Warlock/Cleric/Paladin consistently.

## Information Architecture

### Existing docs index update

`packages/guild/docs/README.md` should gain a discovery-oriented customization block:

- Add instructions with `prompt_append` → `prompt-append.md`
- Inject expertise with skills → `skills.md`
- Route work with categories → `categories.md`
- Create custom agents → `custom-agents.md`
- Disable features safely → `disabling-features.md`
- Start from a full config → `full-example.md`

The existing "Customization", "Reference", and "Maintainers" sections should remain, but cross-links should be adjusted so new users do not have to infer recipes from the schema reference.

### New page: `prompt-append.md`

Purpose: teach safe additive prompt customization.

Proposed sections:

1. What `prompt_append` does
2. Basic usage
3. `prompt_append` vs `skills` vs `prompt`
4. Examples by agent
   - Bard: planning rules and acceptance criteria
   - Fighter: verification before completion
   - Rogue: concise file:line exploration
   - Wizard: plan structure and risk surfacing
   - Cleric: review strictness without bikeshedding
   - Paladin: security-sensitive escalation
   - Ranger/category: domain-specific instructions
5. Common mistakes
   - using `prompt` when append is enough
   - putting `prompt_append` under `custom_agents`
   - writing overly broad instructions
6. See also links

### New page: `categories.md`

Purpose: explain categories as `ranger-<category>` specializations.

Proposed sections:

1. What categories are
2. How `ranger-<category>` agents are registered
3. How `patterns` guide routing
4. Example: frontend/backend/infra/docs monorepo
5. Combining categories with skills
6. Disabling category Rangers
7. See also links

### New page: `custom-agents.md`

Purpose: make new agent creation understandable without requiring schema spelunking.

Proposed sections:

1. When to create a custom agent
2. Built-in override vs custom agent
3. Supported fields
   - `prompt`
   - `prompt_file`
   - `model`
   - `display_name`
   - `mode`
   - `fallback_models`
   - `category`
   - `cost`
   - `temperature`
   - `top_p`
   - `maxTokens`
   - `modelOptions`
   - `tools`
   - `skills`
   - `triggers`
   - `description`
4. Examples
   - docs-writer
   - release-manager
   - migration-planner
   - qa-specialist
5. Prompt source guidance
   - inline `prompt` for short agents
   - `prompt_file` for longer prompts
6. See also links

### New page: `disabling-features.md`

Purpose: centralize safe surface-area reduction.

Proposed sections:

1. Why disable features
2. Disable built-in agents
3. Disable tools globally
4. Disable hooks
5. Disable skills
6. Disable an individual agent via `agents.<name>.disable` if schema-supported
7. Merge behavior: disabled-list keys are unioned across user/project configs
8. Examples
   - minimal setup
   - security-conscious setup
   - disabling a category Ranger
9. See also links

### New page: `full-example.md`

Purpose: provide one complete copy/paste config.

Proposed sections:

1. Where to put this file
2. Complete `.opencode/guild-opencode.jsonc`
3. How to trim it down
4. Validate with `/guild-health`
5. See also links

The full example should include comments sparingly and avoid fields that are hard to explain confidently.

## Existing Pages to Update

| File | Change |
| --- | --- |
| `packages/guild/docs/README.md` | Add discovery-first customization links. |
| `packages/guild/docs/configuration.md` | Link from examples and top-level sections to recipe pages. |
| `packages/guild/docs/agents.md` | Move or cross-link deep customization details to `prompt-append.md`, `categories.md`, and `custom-agents.md`. |
| `packages/guild/docs/skills.md` | Cross-link to `prompt-append.md` for the comparison between reusable skills and project-specific instructions. |
| `packages/guild/docs/model-guide.md` | Cross-link categories/custom agents where model overrides are discussed. |
| `packages/guild/docs/troubleshooting.md` | Link disabling/config pages where relevant. |

## Example Validation Strategy

Validation is editorial and schema-driven:

1. Check every config field against `packages/guild/schema/guild-config.schema.json`.
2. Confirm `prompt_append` appears only under supported sections: `agents` and `categories`.
3. Confirm `custom_agents` examples use `prompt` or `prompt_file`, not `prompt_append`.
4. Confirm `review_models`, if used, are provider-qualified.
5. Confirm JSON snippets are valid JSONC and can be converted to JSON if comments are removed.
6. Restart OpenCode and run `/guild-health` after implementation if practical.

## Editorial Risk Controls

- Avoid publishing a "known gaps" section.
- If a field is supported by the schema but runtime behavior is unclear, either omit the field from recipes or present it only in a reference-style list with a link to configuration docs.
- Keep examples small enough to copy.
- Prefer positive supported paths over warnings, except for high-risk mistakes like replacing base prompts unnecessarily.

## Execution Notes

This plan should be executed via `/start-work` after review. The implementation should be documentation-only and should not modify runtime code unless the user explicitly expands scope.

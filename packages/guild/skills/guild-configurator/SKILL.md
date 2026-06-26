---
name: guild-configurator
description: "Configure Guild/OpenCode: agents, custom_agents, categories, prompts, skills, validation and docs; use when the context is Guild/OpenCode and the request is to configurar um workflow, montar um agente, ajustar a configuração do Guild, arrumar a config do OpenCode, criar agente customizado, adicionar custom agent, nova categoria, corrigir config, update docs, fix invalid JSONC; do not use for app features, runtime logic, or non-config tasks outside Guild/OpenCode."
license: CC-BY-4.0
---

# guild-configurator

Configure Guild/OpenCode agents, custom_agents, categories, prompts, skills, and docs without touching runtime.

## Overview

Adjust the configuration surface of Guild/OpenCode — agents, `custom_agents`, categories, `prompt` / `prompt_file` / `prompt_append`, skill assignments, validation, and the docs that describe them. Do not change runtime code in `packages/guild/src/`. Use the four primary flows below to keep changes scoped and verifiable.

## When to Use

- The request is about Guild/OpenCode configuration, validation, or documentation.
- The user wants a `custom_agents` entry, a new category, a fix to `guild-opencode.jsonc`, or an update to config docs / examples.
- The next step is a config change plus its docs, not an app feature or runtime edit.

**Do NOT use for**: app features, runtime logic in `packages/guild/src/`, or non-config tasks outside Guild/OpenCode. Use `guild-spec` for feature specs, `guild-plan` for execution planning, `guild-execute` for implementation, and `guild-verify` for verification.

## Primary inputs

- `.opencode/guild-opencode.jsonc` (and the fallback `.opencode/guild-opencode.json`)
- `packages/guild/schema/guild-config.schema.json` — schema for validation
- `packages/guild/docs/configuration.md` — current configuration reference
- `packages/guild/docs/custom-agents.md` — custom_agents reference
- `packages/guild/docs/categories.md` — categories reference
- `packages/guild/docs/full-example.md` — full config example
- `packages/guild/docs/troubleshooting.md` — config troubleshooting
- `.guild/knowledge/decisions.md` — prior config decisions to honour

## Primary outputs

- Updated `.opencode/guild-opencode.jsonc`
- Updated config docs and examples (when the documented behaviour changes)
- Updated `packages/guild/schema/guild-config.schema.json` (only on structural change)

## Process

1. Confirm the request is in scope (configuration, validation, or documentation of Guild/OpenCode). If not, hand off to `guild-scope` first.
2. Classify the request into one of the four primary flows below (custom agent, category, fix invalid JSONC, update docs). Each flow has a deterministic sequence.
3. Read the relevant reference file (`references/config-map.md`, `references/validation.md`, `references/examples.md`) when the request mentions schema keys, validation errors, or examples.
4. Make the smallest config change that satisfies the request. Stay within the declared scope. Do not reflow unrelated keys.
5. Validate the file (schema + JSONC syntax) and confirm the change does not break `agents`, `custom_agents`, or `categories` references.
6. Update docs and examples only when the documented behaviour changed. Do not edit docs for purely local config tweaks.
7. Update `schema/guild-config.schema.json` only on structural change (new field, removed field, rename, type change, enum, restriction, validation rule). Do not touch the schema for text, examples, or local config fixes.
8. Update `knowledge/decisions.md` by explicit decision if the change introduces a new config convention.

## Primary flows

### 1) Add a `custom_agents` entry

1. Confirm the agent's name, role, and target category.
2. Define the smallest set of fields needed (name, prompt or prompt_file, optional skills, optional category).
3. If the agent specializes an existing category, link it via `categories` without touching runtime.
4. Validate the JSONC and update `docs/custom-agents.md` and `full-example.md` if the example flow changed.

### 2) Create a category

1. Identify the grouping goal and the agents / `custom_agents` affected.
2. Define the category and its links to the agents.
3. Update `docs/categories.md` and the routing examples.
4. Confirm the new category is consistent with the existing taxonomy (no duplicate, no overlap).

### 3) Fix invalid `guild-opencode.jsonc`

1. Locate the structural error (missing key, wrong type, problematic comma / comment, inconsistent reference).
2. Fix only the invalid portion, preserving original intent.
3. Revalidate syntax and the cross-references between `agents`, `categories`, and prompts.
4. Update example or troubleshooting docs if the expected format changed.

### 4) Update config docs and examples

1. Identify which section or example drifted from reality.
2. Rewrite with focus on the configuration surface, not on runtime.
3. Keep examples short and aligned with the schema and the four primary flows.
4. Confirm the doc still distinguishes this skill from `guild-scope`, `guild-load`, `guild-plan`, and `guild-verify`.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I'll just edit the config and skip docs." | Step 6 updates docs when behaviour changes. Skipping docs produces drift between config and reference. |
| "Schema update is overkill for a small change." | Step 7 limits schema edits to structural changes. A small text change should not touch the schema. |
| "I'll rewrite the whole `guild-opencode.jsonc` for clarity." | Step 4 says smallest change. Reflows hide the actual change in a noisy diff. |
| "I can edit `packages/guild/src/` while I'm here." | Scope: configuration, not runtime. Step 4 enforces the boundary. |
| "Validation can wait; I'll ship the config first." | Step 5 validates before declaring done. Unvalidated config is the failure mode this table rebuts. |
| "I can edit the user's `~/.config/opencode/` to make this work." | Scope: project-level config. The user-level config is the user's; do not edit it without explicit request. |

## Red Flags

- A change to `packages/guild/src/` was made under the guise of "config".
- The schema was edited for a non-structural change (text, example, local fix).
- Docs were updated for a purely local config tweak with no behaviour change.
- `guild-opencode.jsonc` was rewritten with a noisy reflow that hides the actual change.
- The user's `~/.config/opencode/` was edited without explicit request.
- A new `custom_agents` entry duplicates an existing agent or category.

## Verification

The skill is complete when ALL of the following evidence is present:

- The config change matches one of the four primary flows and follows its sequence.
- The JSONC validates (schema + syntax). The command + output are captured.
- Docs and examples are updated only when the documented behaviour changed.
- The schema is updated only on structural change.
- `knowledge/decisions.md` records any new config convention (by explicit decision).
- No `packages/guild/src/` file was modified.

**"Seems right" is not evidence.** Every claim of "this config is correct" cites the file path, the validation command, and the captured output.

## See also

- [guild-scope](guild-scope) — classifies the request before this skill runs.
- [guild-load](guild-load) — loads context, state, and handoff before changing config.
- [guild-plan](guild-plan) — breaks larger config adjustments into verifiable steps.
- [guild-verify](guild-verify) — confirms schema, merge, and the final result.

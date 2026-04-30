# @runecraft/guild — V1 Plugin Spec

**Version:** 1.0.0-alpha
**Scope:** Medium
**Date:** 2026-04-29

---

## 1. Problem

The arcanum multi-agent system (Herald, Scout, Sage, Forge, Ward, Arbiter) currently relies on
static markdown files in `~/.config/opencode/` and a manual graphify.js plugin. There is no
unified, distributable package that:

- Bootstraps the agent system into any OpenCode workspace
- Loads hierarchical configuration (user + project level)
- Injects runtime context (prompts, graphify reminders, agent status)
- Validates the environment on session start

Users must manually copy agent files and wire plugins. This is fragile and non-portable.

## 2. Solution

`@runecraft/guild` — a public npm OpenCode plugin that packages the multi-agent system as a
single installable dependency. It follows the Weave plugin architecture and provides:

- **Hierarchical JSONC config** — user-level (`~/.config/opencode/guild-opencode.jsonc`) merged
  with project-level (`.opencode/guild-opencode.jsonc`), project wins on conflict.
- **Three hooks** — prompt injection, graphify context, session validation.
- **One custom tool** — `agent_status` to introspect enabled/disabled agents.
- **Typed config schema** — Zod definitions with JSON Schema generation.

## 3. Goals (V1)

| # | Goal | Metric |
|---|------|--------|
| G1 | npm-publishable package | `npm publish` succeeds, ESM entry resolves |
| G2 | Plugin loads in OpenCode | `session.created` hook fires without errors |
| G3 | Config merges correctly | Project-level overrides user-level values |
| G4 | Prompt append works | Agent system reminders appear in TUI prompt |
| G5 | Graphify context injected | `tool.execute.before` adds graph reminder |
| G6 | Session validation | Warning emitted if `agent-variants.json` missing |
| G7 | Agent status tool | `agent_status` returns enabled/disabled map |
| G8 | Types exported | Consumers can `import type { GuildConfig }` |

## 4. Out of Scope (V1)

- Declarative JSONC workflow engine
- Custom agents block (`custom_agents` in config)
- Skills discovery API integration
- Auto-generation of agent markdown files
- GUI / TUI configuration interface

## 5. User Stories

**US-1: Install & activate**
As a developer, I run `bun add @runecraft/guild` and add `"plugin": ["@runecraft/guild"]` to
`opencode.json`. On next OpenCode session, the guild plugin loads and validates my environment.

**US-2: Configure per-project**
As a developer, I create `.opencode/guild-opencode.jsonc` in my project to override default
agent settings (e.g., disable Ward for a prototype repo). The project config merges over my
user-level config.

**US-3: Check agent status**
As a developer, I invoke the `agent_status` tool in OpenCode to see which agents are
enabled/disabled and their assigned models.

**US-4: Graphify integration**
As a developer using graphify, the plugin automatically injects a context reminder before
tool executions so agents consider the knowledge graph.

## 6. Constraints

- **Monorepo:** `packages/guild/` within arcanum workspace (bun@1.3.5, changesets)
- **Build:** Bun build (bundle) + tsc (declarations only) — no Vite/Rollup
- **Runtime:** Node ESM (`"type": "module"`)
- **Dependencies:** `@opencode-ai/plugin`, `jsonc-parser`, `zod`, `picocolors`
- **Dev deps:** `bun`, `typescript`, `zod-to-json-schema`, `@opencode-ai/sdk`
- **Config locations:** Fixed paths, no env-var overrides in V1

## 7. Acceptance Criteria

- [ ] `bun run build` in `packages/guild/` produces `dist/index.js` + `dist/index.d.ts`
- [ ] Package exports resolve: `import { GuildPlugin } from "@runecraft/guild"`
- [ ] JSONC config files parsed with comments support, merged project-over-user
- [ ] `tui.prompt.append` injects ≤500 char agent coordination reminder
- [ ] `tool.execute.before` checks for graphify-out/ and injects context if present
- [ ] `session.created` warns (via console) if agent-variants.json not found
- [ ] `agent_status` tool returns JSON with agent name → {enabled, model} map
- [ ] All public types exported from package entry point
- [ ] README documents installation, config, and usage

---

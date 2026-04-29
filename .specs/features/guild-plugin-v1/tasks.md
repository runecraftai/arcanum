# @runecraft/guild — V1 Implementation Tasks

**Scope:** Medium
**Date:** 2026-04-29

---

## Execution Order

```
1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 4.2 → 4.1 → 5.1 → 6.1 → 7.1 → 7.2 → 8.1 → 8.2
```

## Phase 1: Package Setup

- [x] 1.1 Update `packages/guild/package.json` from stub to full config
  - Files: `packages/guild/package.json`
  - Acceptance: Has name `@runecraft/guild`, version `0.1.0`, `"type": "module"`,
    `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports"` block with
    `.` and `./schema` entries, `"files": ["dist/"]`, `"publishConfig"` with registry
    and access public, all dependencies listed (see design.md §3), build/typecheck/
    build:schema scripts defined.

- [x] 1.2 Create `packages/guild/tsconfig.json`
  - Files: `packages/guild/tsconfig.json`
  - Acceptance: `"compilerOptions"` with `"declaration": true`, `"emitDeclarationOnly": true`,
    `"outDir": "dist"`, `"rootDir": "src"`, `"module": "ESNext"`,
    `"moduleResolution": "bundler"`, `"target": "ESNext"`, `"strict": true`,
    `"include": ["src/"]`.

## Phase 2: Types & Schema

- [x] 2.1 Create type definitions (`packages/guild/src/types.ts`)
  - Files: `packages/guild/src/types.ts`
  - Acceptance: Exports `GuildConfig` type (inferred from Zod schema), `AgentVariant`
    type, `AgentName` literal union (`"herald" | "scout" | "sage" | "forge" | "ward" |
    "arbiter"`), `AgentStatusResult` type for tool output. All types use `export type`.

- [x] 2.2 Create Zod schema (`packages/guild/src/schema.ts`)
  - Files: `packages/guild/src/schema.ts`
  - Acceptance: Exports `GuildConfigSchema` (Zod object as designed in D3),
    `AgentVariantSchema`. Schema has defaults for all fields so empty config is valid.
    Exports `generateJsonSchema()` function using `zod-to-json-schema`.

## Phase 3: Config Loading

- [x] 3.1 Create config loader (`packages/guild/src/config.ts`)
  - Files: `packages/guild/src/config.ts`
  - Acceptance: Exports `loadConfig(projectDir: string): Promise<GuildConfig>`.
    Reads user config from `~/.config/opencode/guild-opencode.jsonc` and project
    config from `<projectDir>/.opencode/guild-opencode.jsonc`. Uses `jsonc-parser`
    `parse()`. Implements `deepMerge()` (project over user, arrays replace, objects
    recurse). Validates merged result with `GuildConfigSchema.parse()`. Returns
    defaults if both files missing. Wraps file reads in try/catch with `picocolors`
    warnings on parse errors. Exports `deepMerge` for testing.

## Phase 4: Hooks

- [x] 4.1 Create hooks module (`packages/guild/src/hooks.ts`)
  - Files: `packages/guild/src/hooks.ts`
  - Acceptance: Exports `buildHooks(config: GuildConfig, ctx: PluginContext)` returning
    object with three hooks:

    **`tui.prompt.append`**: Returns static coordination reminder string (≤500 chars)
    covering Herald routing, gate enforcement, JSON envelope output. Returns empty
    string if `config.prompt.appendCoordination` is false.

    **`tool.execute.before`**: Async. If `config.graphify.enabled`, checks if
    `config.graphify.reportPath` exists relative to `ctx.worktree`. If yes, returns
    graphify context reminder object. If no, returns undefined. Handles file check
    errors silently.

    **`session.created`**: Async. Checks for `.agents/agent-variants.json` in
    `ctx.directory`. If missing, warns via `console.warn` with picocolors yellow
    `[guild]` prefix and dim suggestion line. If present, logs dim `[guild] Agent
    system ready` confirmation.

- [x] 4.2 Define prompt and reminder constants in hooks module
  - Files: `packages/guild/src/hooks.ts` (top of file, internal consts)
  - Acceptance: `COORDINATION_REMINDER` const ≤500 chars covering Herald routing,
    gates, JSON envelope. `GRAPHIFY_REMINDER` const about checking graph report.
    Neither exported.

## Phase 5: Custom Tool

- [x] 5.1 Create tools module (`packages/guild/src/tools.ts`)
  - Files: `packages/guild/src/tools.ts`
  - Acceptance: Exports `buildTools(config: GuildConfig, ctx: PluginContext)` returning
    array with one tool. The `agent_status` tool: no parameters (empty Zod object),
    description "Shows which agents are enabled/disabled and their assigned models".
    Execute reads `.agents/agent-variants.json`, merges with `config.agents`, returns:
    `{ agents: { [name]: { enabled: boolean, model?: string } } }`.
    If variants file missing, returns config-only data with `warning` field.

## Phase 6: Plugin Entry Point

- [x] 6.1 Create plugin entry (`packages/guild/src/index.ts`)
  - Files: `packages/guild/src/index.ts`
  - Acceptance: Exports `GuildPlugin` as named export matching `Plugin` type from
    `@opencode-ai/plugin`. Async factory: (1) calls `loadConfig(ctx.directory)`,
    (2) returns `{ hooks: buildHooks(config, ctx), tools: buildTools(config, ctx) }`.
    Re-exports all types from `./types.ts`. Re-exports `GuildConfigSchema` from
    `./schema.ts`.

## Phase 7: Build & Schema

- [x] 7.1 Create JSON Schema generation script (`packages/guild/scripts/generate-schema.ts`)
  - Files: `packages/guild/scripts/generate-schema.ts`
  - Acceptance: Bun-executable script. Imports `GuildConfigSchema` and
    `zod-to-json-schema`. Generates JSON Schema, writes to `dist/schema.json`.
    Outputs success message to stdout. Adds `$schema` and `$id` fields.

- [x] 7.2 Verify build pipeline works
  - Files: `packages/guild/package.json` (scripts), `packages/guild/.gitignore`
  - Acceptance: `bun run build` produces `dist/index.js` + `dist/index.d.ts`.
    `bun run build:schema` produces `dist/schema.json`.
    `bun run typecheck` passes with no errors.
    `.gitignore` contains `dist/`, `node_modules/`, `*.tsbuildinfo`.

## Phase 8: Documentation

- [x] 8.1 Update README (`packages/guild/README.md`)
  - Files: `packages/guild/README.md`
  - Acceptance: Sections: Overview, Installation (bun add + opencode.json config),
    Configuration (JSONC locations, example with all options and defaults),
    Hooks (describe each), Tools (document agent_status), Types (list exported),
    Development (build commands). npm version badge.

- [x] 8.2 Add `packages/guild/.gitignore`
  - Files: `packages/guild/.gitignore`
  - Acceptance: Contains `dist/`, `node_modules/`, `*.tsbuildinfo`.

---

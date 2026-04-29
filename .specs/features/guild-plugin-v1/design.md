# @runecraft/guild — V1 Technical Design

**Scope:** Medium
**Date:** 2026-04-29

---

## 1. Architecture Overview

```
packages/guild/
├── src/
│   ├── index.ts          # Plugin entry point — exports GuildPlugin
│   ├── config.ts         # JSONC config loading + merging
│   ├── schema.ts         # Zod schemas + JSON Schema generation
│   ├── hooks.ts          # Hook implementations (prompt, graphify, session)
│   ├── tools.ts          # Custom tool definitions (agent_status)
│   └── types.ts          # Exported TypeScript types
├── scripts/
│   └── generate-schema.ts # Build-time JSON Schema generation
├── package.json          # Updated from stub
├── tsconfig.json         # TypeScript config (declarations only)
├── .gitignore            # dist/, node_modules/
├── README.md             # Updated from stub
└── CHANGELOG.md          # Existing (managed by changesets)
```

## 2. Key Decisions

### D1: Plugin entry pattern

```typescript
// src/index.ts
export const GuildPlugin: Plugin = async (ctx) => {
  const config = await loadConfig(ctx.directory);
  return {
    hooks: buildHooks(config, ctx),
    tools: buildTools(config, ctx),
  };
};
```

The plugin factory receives `ctx` with `{ project, directory, worktree, client, $ }`.
Config is loaded once at plugin init. Hooks and tools receive the resolved config via closure.

**Rationale:** Matches Weave's pattern exactly. Single async factory, config resolved eagerly,
hooks/tools are pure functions of config.

### D2: Hierarchical config loading

```typescript
// src/config.ts
import { parse as parseJSONC } from "jsonc-parser";

const USER_CONFIG = join(homedir(), ".config/opencode/guild-opencode.jsonc");
const PROJECT_CONFIG_NAME = "guild-opencode.jsonc";

async function loadConfig(projectDir: string): Promise<GuildConfig> {
  const userRaw = await tryReadFile(USER_CONFIG);
  const projectRaw = await tryReadFile(join(projectDir, ".opencode", PROJECT_CONFIG_NAME));

  const userConfig = userRaw ? parseJSONC(userRaw) : {};
  const projectConfig = projectRaw ? parseJSONC(projectRaw) : {};

  const merged = deepMerge(userConfig, projectConfig); // project wins
  return GuildConfigSchema.parse(merged);  // validate with Zod
}
```

**Merge strategy:** Shallow-then-deep. Top-level keys merged, nested objects recursively
merged, arrays replaced (not concatenated). Project-level values override user-level.

**Rationale:** Matches Weave's documented merge behavior. `jsonc-parser` handles comments
and trailing commas. Zod validates + provides defaults for missing fields.

### D3: Config schema (Zod)

```typescript
// src/schema.ts
import { z } from "zod";

const AgentVariantSchema = z.object({
  enabled: z.boolean().default(true),
  model: z.string().optional(),
});

export const GuildConfigSchema = z.object({
  agents: z.object({
    herald:  AgentVariantSchema.default({}),
    scout:   AgentVariantSchema.default({}),
    sage:    AgentVariantSchema.default({}),
    forge:   AgentVariantSchema.default({}),
    ward:    AgentVariantSchema.default({ enabled: false }),
    arbiter: AgentVariantSchema.default({ enabled: false }),
  }).default({}),

  graphify: z.object({
    enabled: z.boolean().default(true),
    reportPath: z.string().default("graphify-out/GRAPH_REPORT.md"),
  }).default({}),

  prompt: z.object({
    appendCoordination: z.boolean().default(true),
    maxLength: z.number().default(500),
  }).default({}),
});
```

JSON Schema generated at build time via `zod-to-json-schema` and included in dist
for editor autocompletion.

### D4: Hook — `tui.prompt.append`

Injects a short agent coordination reminder into the TUI prompt. Content is static text
reminding the active agent about Herald routing, gate enforcement, and JSON envelope output.

```typescript
"tui.prompt.append": () => {
  if (!config.prompt.appendCoordination) return "";
  return COORDINATION_REMINDER; // ≤500 chars, defined as const
}
```

**Rationale:** Lightweight, no async. Config toggle allows disabling.

### D5: Hook — `tool.execute.before`

Ported from existing `graphify.js` (22 lines). Checks if `graphify-out/` exists in worktree,
and if so, injects a context reminder into the tool execution.

```typescript
"tool.execute.before": async ({ tool, input }) => {
  if (!config.graphify.enabled) return;
  const reportPath = join(ctx.worktree, config.graphify.reportPath);
  const exists = await fileExists(reportPath);
  if (exists) {
    return { context: GRAPHIFY_REMINDER };
  }
}
```

**Rationale:** Direct port of proven graphify.js logic. Config allows custom report path.

### D6: Hook — `session.created`

Validates that `agent-variants.json` exists in the expected location. Emits a warning
via `console.warn` with picocolors formatting if missing.

```typescript
"session.created": async () => {
  const variantsPath = join(ctx.directory, ".agents/agent-variants.json");
  if (!(await fileExists(variantsPath))) {
    console.warn(pc.yellow("[guild]"), "agent-variants.json not found at", variantsPath);
    console.warn(pc.dim("  → Agent routing may not work correctly."));
  }
}
```

### D7: Custom tool — `agent_status`

Reads `agent-variants.json` and merges with guild config to produce a status report.

```typescript
// src/tools.ts
import { tool } from "@opencode-ai/plugin";

export const agentStatusTool = tool({
  name: "agent_status",
  description: "Shows which agents are enabled/disabled and their assigned models",
  parameters: z.object({}),
  execute: async () => {
    // Read agent-variants.json from .agents/
    // Merge with guild config agent overrides
    // Return { agents: { herald: { enabled, model }, ... } }
  },
});
```

### D8: Build pipeline

```json
{
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node --format esm && tsc --emitDeclarationOnly",
    "build:schema": "bun run scripts/generate-schema.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Two-step: Bun bundles to `dist/index.js`, then tsc emits `dist/index.d.ts`.
Schema generation is a separate script for build-time JSON Schema output.

### D9: Package exports

```json
{
  "name": "@runecraft/guild",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./schema": {
      "import": "./dist/schema.json"
    }
  },
  "files": ["dist/"],
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public"
  }
}
```

## 3. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@opencode-ai/plugin` | ^1.3.15 | Plugin types + `tool()` helper |
| `jsonc-parser` | ^3.3.1 | Parse JSONC config files |
| `zod` | ^4.0.0 | Config schema validation |
| `picocolors` | ^1.1.1 | Colored console output |
| `@opencode-ai/sdk` | ^1.3.15 | (dev) SDK types |
| `typescript` | ^6.0.2 | (dev) Type declarations |
| `zod-to-json-schema` | ^3.25.2 | (dev) JSON Schema generation |

## 4. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Plugin API breaking changes | Hook signatures change | Pin `@opencode-ai/plugin` minor version |
| JSONC parse errors in user config | Plugin fails to load | Wrap in try/catch, fall back to defaults, warn |
| `graphify-out/` not present | Hook does nothing | Guard with existence check (already planned) |
| Zod v4 API differences | Schema code breaks | Test with exact pinned version |
| Bun build output format | ESM not compatible | Test import in Node.js ESM context |

---

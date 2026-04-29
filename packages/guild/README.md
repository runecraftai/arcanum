# @runecraft/guild

[![npm version](https://img.shields.io/npm/v/@runecraft/guild?label=@runecraft/guild)](https://www.npmjs.com/package/@runecraft/guild)

OpenCode plugin for hierarchical agent coordination with multi-level configuration loading.

## Overview

**Guild** brings the Arcanum multi-agent system (Herald, Scout, Sage, Forge, Ward, Arbiter) into any OpenCode workspace as a single, distributable npm package. It provides:

- **Hierarchical JSONC config** — user-level and project-level merged configuration
- **Agent system validation** — warns if agent-variants.json is missing
- **Graphify integration** — automatically injects knowledge graph context before tool execution
- **Custom tool** — `agent_status` to introspect enabled/disabled agents
- **Typed exports** — Full TypeScript support with Zod schema validation

## Installation

```bash
# Using bun
bun add @runecraft/guild

# Using npm
npm install @runecraft/guild

# Using pnpm
pnpm add @runecraft/guild
```

Then add to your `opencode.json`:

```json
{
  "plugins": ["@runecraft/guild"]
}
```

## Configuration

Guild loads configuration from two locations (merged with project-level overriding user-level):

1. **User-level:** `~/.config/opencode/guild-opencode.jsonc`
2. **Project-level:** `.opencode/guild-opencode.jsonc`

### Example Configuration

```jsonc
{
  // Agent enabled/disabled status and model overrides
  agents: {
    herald: { enabled: true },
    scout: { enabled: true },
    sage: { enabled: true },
    forge: { enabled: true },
    ward: { enabled: false },
    arbiter: { enabled: false }
  },
  
  // Graphify integration
  graphify: {
    enabled: true,
    reportPath: "graphify-out/GRAPH_REPORT.md"
  },
  
  // TUI prompt coordination reminder
  prompt: {
    appendCoordination: true,
    maxLength: 500
  }
}
```

### Defaults

All configuration sections are optional. Defaults:

```jsonc
{
  agents: {
    herald: { enabled: true },
    scout: { enabled: true },
    sage: { enabled: true },
    forge: { enabled: true },
    ward: { enabled: false },
    arbiter: { enabled: false }
  },
  graphify: {
    enabled: true,
    reportPath: "graphify-out/GRAPH_REPORT.md"
  },
  prompt: {
    appendCoordination: true,
    maxLength: 500
  }
}
```

## Hooks

Guild registers the following hooks in OpenCode:

### `tool.execute.before`

When graphify is enabled and `graphify-out/GRAPH_REPORT.md` exists, injects a context reminder to check the knowledge graph before tool execution.

### `event`

Listens for session start events and validates that `.agents/agent-variants.json` exists. Emits a warning if missing with instructions for fixing agent routing.

## Tools

### `agent_status`

Displays the current agent configuration (enabled/disabled status and optional model overrides):

```bash
$ opencode --tool agent_status
```

Output:
```json
{
  "agents": {
    "herald": { "enabled": true },
    "scout": { "enabled": true },
    ...
  }
}
```

## Types

The package exports the following TypeScript types:

```typescript
import type {
  GuildConfig,      // Full config object
  AgentName,        // Union: "herald" | "scout" | "sage" | "forge" | "ward" | "arbiter"
  AgentVariant,     // { enabled: boolean; model?: string }
  AgentStatusResult // Tool output type
} from "@runecraft/guild";

import { GuildConfigSchema, generateJsonSchema } from "@runecraft/guild";
```

## Development

### Building

```bash
# TypeScript compilation
bun run build

# Generate JSON schema
bun run build:schema

# Type checking
bun run typecheck
```

### Project Structure

```
packages/guild/
├── src/
│   ├── index.ts      # Plugin entry point
│   ├── config.ts     # JSONC loading + merging
│   ├── schema.ts     # Zod schema + JSON schema generation
│   ├── hooks.ts      # OpenCode hooks
│   ├── tools.ts      # Custom tools (agent_status)
│   └── types.ts      # Exported TypeScript types
├── scripts/
│   └── generate-schema.ts # Build-time schema generation
├── dist/             # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Integration with Agent System

Guild assumes the following directory structure for the Arcanum agent system:

```
project-root/
├── .agents/
│   ├── agent-variants.json    # Agent configuration
│   └── skills/
├── .opencode/
│   └── guild-opencode.jsonc   # Project-level config
└── graphify-out/
    ├── GRAPH_REPORT.md        # Knowledge graph summary
    └── graph.json
```

See the [Arcanum documentation](https://github.com/yourusername/arcanum) for full setup instructions.

## License

MIT

---

**Part of Arcanum** — Multi-agent system for OpenCode

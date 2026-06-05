<p align="center">
  <img src="assets/weave_logo.png" alt="Guild" width="400">
</p>

# Guild

Guild is a multi-agent orchestration plugin for OpenCode. It provides a cohesive framework for coordinating agents, tools, and skills into structured workflows. By delegating complex tasks to specialized agents and monitoring execution state through hooks, Guild ensures reliable and efficient project development.

## Overview

- **8 specialized agents** designed for specific roles in the development lifecycle.
- **Category-based task dispatch** to route work to domain-optimized models and configurations.
- **Skill system** for injecting domain-specific expertise that modifies agent behavior via prompt orchestration.
- **Background agent management** for parallel asynchronous sub-agent execution with concurrency control.
- **Context window monitoring** to track token usage and suggest recovery strategies when limits are approached.
- **Tool permissions** enforced per-agent to ensure safety and prevent unauthorized file modifications.
- **JSONC configuration** supporting comments and trailing commas with hierarchical user and project-level merging.

## Documentation

Refer to the [Arcanum monorepo](https://github.com/anomalyco/arcanum) for build, test, and publishing instructions.

### Config schema

Guild ships a generated config schema at `schema/guild-config.schema.json`.

- Regenerate it: `bun run schema:config`

Runtime config supports JSONC comments and trailing commas even though the published schema artifact is plain JSON.

## Agents

| Agent | Role | Mode | Description |
| :--- | :--- | :--- | :--- |
| **Bard (Guildmaster)** | main orchestrator | primary | The central team lead that plans tasks, coordinates work, and delegates to specialized agents. |
| **Fighter (Execution Lead)** | execution orchestrator | primary | Manages todo-list driven execution of multi-step plans, focusing on sequential implementation without subagent spawning. |
| **Ranger (Specialist)** | category worker | all | Domain-specific specialist worker with full tool access, dispatched dynamically via the category system. |
| **Wizard (Planner)** | strategic planner | subagent | Analyzes requirements and produces detailed implementation plans with research and dependency mapping. |
| **Rogue (Scout)** | codebase explorer | subagent | Fast, read-only codebase navigation and analysis using grep, glob, and read tools. |
| **Warlock (Researcher)** | external researcher | subagent | Performs external documentation lookups and reference searches, providing synthesized answers with source citations. |
| **Cleric (Reviewer)** | reviewer/auditor | subagent | Reviews completed work and plans with a critical but fair eye, rejecting only for true blocking issues. |
| **Paladin (Security)** | security auditor | subagent | Audits code changes for security vulnerabilities and specification compliance with a skeptical bias. |

## Installation

This package is published on [npm](https://www.npmjs.com/package/@runecraft/guild).

### Prerequisites

- [OpenCode](https://opencode.ai)

### Step 1: Add to opencode.json

Add the plugin to your `opencode.json` file:

```json
{
  "plugin": ["@runecraft/guild"]
}
```

### Step 2: Restart OpenCode

OpenCode automatically installs npm plugins at startup — no manual `bun add` or `npm install` required. The plugin loads automatically upon restart and works with zero configuration out of the box.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `404 Not Found` | Ensure the package name is correct: `@runecraft/guild`. |
| Package not found after publish | npm can take a few minutes to propagate. Wait and retry. |

## Uninstalling

To fully remove Guild from your project:

### Step 1: Remove from opencode.json

Delete the `@runecraft/guild` entry from the `plugin` array in your `opencode.json`:

```json
{
  "plugin": []
}
```

### Step 2: Clean up project artifacts (optional)

Guild may have created plan and state files during usage. Remove them if no longer needed:

```bash
rm -rf .guild/
```

You can also remove any project-level configuration if present:

```bash
rm -f .opencode/guild-opencode.jsonc .opencode/guild-opencode.json
```

### Step 3: Clean up user-level configuration (optional)

If you no longer use Guild in any project, remove the global configuration:

```bash
rm -f ~/.config/opencode/guild-opencode.jsonc ~/.config/opencode/guild-opencode.json
```

## Development

- **Build**: `bun run build`
- **Test**: `bun test`
- **Typecheck**: `bun run typecheck`
- **Clean**: `bun run clean`

## Acknowledgments

Guild's technical foundation is based on [opencode-guild](https://github.com/pgermishuys/opencode-guild) by [@pgermishuys](https://github.com/pgermishuys). The agent architecture, skill system, and workflow engine were adapted from Guild's implementation.

## License

MIT

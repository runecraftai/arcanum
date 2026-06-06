# Getting started

This page walks a new user from zero to a verified Guild install. It assumes a working [OpenCode](https://opencode.ai) environment and a model provider that OpenCode is already configured to call.

## Prerequisites

- **OpenCode** installed and runnable in your terminal.
- **A model provider** configured in OpenCode (the host CLI, not Guild). OpenCode must be able to send chat requests to your provider before any plugin can run.
- **Node.js / Bun** for occasional debugging. Guild itself is installed by OpenCode as an npm plugin, so you do not need to run `bun add @runecraft/guild` yourself.

You do not need to create any Guild config files before first use. Guild works with zero configuration out of the box.

## Install

### Step 1 — Add the plugin to `opencode.json`

In your project root (or globally), edit your `opencode.json`:

```json
{
  "plugin": ["@runecraft/guild"]
}
```

If you already have a `plugin` array, append `@runecraft/guild` instead of replacing it.

### Step 2 — Restart OpenCode

OpenCode auto-installs npm plugins at startup. There is no manual `bun add` or `npm install` step. After the first restart:

- OpenCode fetches `@runecraft/guild` from the npm registry.
- The plugin loads automatically and registers its built-in agents and commands.

If npm propagation is slow, restart OpenCode once more after a few minutes.

## Verify

Run the built-in health command from any OpenCode session:

```text
/guild-health
```

A healthy install prints a short report showing:

- The config files that were loaded (project and/or user level).
- The list of built-in agents that were registered.
- Any config warnings or validation errors.

If the command returns nothing or the response looks wrong, see [Troubleshooting](troubleshooting.md).

### Quick agent check

In any OpenCode session, ask for one of the built-in agents by name. For example, request planning help that needs the **Wizard** agent:

```text
use wizard to draft an implementation plan for adding dark mode
```

If Guild loaded correctly, OpenCode will route the request to the Wizard agent. If agents do not appear, run `/guild-health` and review the output.

## Next steps

- Read [Configuration](configuration.md) to learn where config files live, how they merge, and which top-level sections are supported.
- Read [Commands](commands.md) for the full list of built-in slash commands.
- Read [Agents](agents.md) to understand what each built-in agent does and when to delegate.

## Uninstalling

To remove Guild, see the [README](../README.md#uninstall).

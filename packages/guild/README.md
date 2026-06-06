<p align="center">
  <img src="assets/weave_logo.png" alt="Guild" width="400">
</p>

# Guild

Guild is a multi-agent orchestration plugin for OpenCode. It provides a cohesive framework for coordinating agents, tools, and skills into structured workflows. By delegating complex tasks to specialized agents and monitoring execution state through hooks, Guild ensures reliable and efficient project development.

## Highlights

- **8 specialized agents** designed for specific roles in the development lifecycle.
- **Category-based task dispatch** to route work to domain-optimized models and configurations.
- **Skill system** for injecting domain-specific expertise that modifies agent behavior via prompt orchestration.
- **Background agent management** for parallel asynchronous sub-agent execution with concurrency control.
- **Context window monitoring** to track token usage and suggest recovery strategies when limits are approached.
- **Tool permissions** enforced per-agent to ensure safety and prevent unauthorized file modifications.
- **JSONC configuration** supporting comments and trailing commas with hierarchical user and project-level merging.

## Install

Guild is published on [npm](https://www.npmjs.com/package/@runecraft/guild).

```json
{
  "plugin": ["@runecraft/guild"]
}
```

Restart OpenCode — npm plugins are auto-installed and loaded at startup. No `bun add` or `npm install` required.

## Where to go next

| If you want to… | Read |
| --- | --- |
| Get a working install step-by-step | [docs/getting-started.md](docs/getting-started.md) |
| Configure agents, skills, and categories | [docs/configuration.md](docs/configuration.md) |
| See all slash commands | [docs/commands.md](docs/commands.md) |
| Diagnose a problem | [docs/troubleshooting.md](docs/troubleshooting.md) |
| Browse the full docs index | [docs/README.md](docs/README.md) |

## Config at a glance

- **Project config**: `.opencode/guild-opencode.jsonc` (or `.json`)
- **User config**: `~/.config/opencode/guild-opencode.jsonc` (or `.json`)
- **State directory**: `.guild/` (plans, runtime, analytics)
- **Schema artifact**: `schema/guild-config.schema.json` in this repository

See [docs/configuration.md](docs/configuration.md) for the full reference.

## Built-in commands

- `/start-work` — execute a plan created by Wizard
- `/run-workflow` — run a multi-step workflow
- `/guild-health` — show config health and validation issues
- `/metrics` — analytics and plan metrics (opt-in)
- `/token-report` — token usage report across sessions

See [docs/commands.md](docs/commands.md) for syntax, behaviour, and failure modes.

## Development

- **Build**: `bun run build`
- **Test**: `bun test`
- **Typecheck**: `bun run typecheck`
- **Schema**: `bun run schema:config`
- **Clean**: `bun run clean`

## Uninstall

Remove the plugin entry from `opencode.json`, then optionally clean up state:

```bash
rm -rf .guild/
rm -f .opencode/guild-opencode.jsonc .opencode/guild-opencode.json
rm -f ~/.config/opencode/guild-opencode.jsonc ~/.config/opencode/guild-opencode.json
```

## Acknowledgments

Guild's technical foundation is based on [opencode-guild](https://github.com/pgermishuys/opencode-guild) by [@pgermishuys](https://github.com/pgermishuys). The agent architecture, skill system, and workflow engine were adapted from Guild's implementation.

## License

MIT

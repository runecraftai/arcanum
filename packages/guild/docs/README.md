# Guild Documentation

Welcome to the Guild documentation. Guild is a multi-agent orchestration plugin for OpenCode. This index maps every documentation page so you can jump straight to what you need.

## Where to start

| If you are… | Start here |
| --- | --- |
| A new user setting up Guild for the first time | [Getting started](getting-started.md) |
| Looking up a config file, schema field, or merge rule | [Configuration](configuration.md) |
| Searching for a slash command and what it does | [Commands](commands.md) |
| Diagnosing a failure with a clear symptom | [Troubleshooting](troubleshooting.md) |
| A maintainer extending or releasing the package | [Architecture](architecture.md) → [Releases](releases.md) |

## Getting started

- [Getting started](getting-started.md) — install, verify, and run your first command.

## Customization

- [Agents](agents.md) — the eight built-in agents, their modes, and how to think about delegation.
- [Skills](skills.md) — bundled skills, custom skill locations, and how to assign or disable them.
- [Configuration](configuration.md) — config files, merge rules, schema, and reference examples.
- [Continuation](continuation.md) — resume, compaction recovery, idle prompts, and todos.

## Customize how agents think and act

Want to shape agent behavior without replacing the whole system? Start with the layer that fits your goal:

| If you want to… | Read this |
| --- | --- |
| Append guidance to any agent's prompt | [Prompt append](prompt-append.md) |
| Teach agents new skills or workflows | [Skills](skills.md) |
| Route work to domain specialists by file pattern | [Categories](categories.md) |
| Create your own agents with custom behavior | [Custom agents](custom-agents.md) |
| Pick an orchestration pattern and avoid anti-patterns | [Orchestration](orchestration.md) |
| Turn off built-in agents or features you don't need | [Disabling features](disabling-features.md) |
| See all customization options in a single config | [Full example](full-example.md) |

## Reference

- [Commands](commands.md) — `/start-work`, `/run-workflow`, `/guild-health`, `/metrics`, `/token-report`.
- [Analytics](analytics.md) — opt-in analytics, fingerprinting, and reports.
- [Workflows — overview](workflows/overview.md) — what workflows are and how they execute.
- [Workflows — authoring](workflows/authoring.md) — workflow file format, step types, and completion.
- [Workflows — controls](workflows/controls.md) — pause, skip, abort, and resume controls.
- [Examples — workflows](examples/workflows/) — copy-pasteable workflow definitions.
- [Troubleshooting](troubleshooting.md) — symptom-based diagnosis for install, config, commands, workflows, and analytics.

## Project state

- [Definition of done](definition-of-done.md) — the project-wide standing bar `guild-verify` and `guild-ship` check against in addition to per-task `tasks.md` criteria.

## Maintainers

- [Architecture](architecture.md) — plugin entrypoint, config loading, managers, hooks, and tools.
- [Model guide](model-guide.md) — practical model selection by agent and use case.
- [Background agents](background-agents.md) — concurrency and stale-timeout behavior.
- [Releases](releases.md) — package verification and release checklist.

## Canonical workspace

Guild's canonical workspace is `.guild/` at the project root. See `.guild/architecture.md` for the full layout (context, knowledge, plans, archive), state update rules, and migration notes for legacy `.specs/` and `.notebook/` paths.

## Documentation conventions

- **Relative links** — every cross-reference uses a relative path so the tree can be moved or rendered as a static site without changes.
- **One question per page** — pages are scoped narrowly so a future site can map them to URLs directly.
- **Implemented behavior only** — pages describe what the package does today, not roadmap items. Preview and experimental features are marked explicitly.
- **Additive customization** — examples prefer `prompt_append` and `skills` over full prompt replacement.

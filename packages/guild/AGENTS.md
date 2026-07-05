# AGENTS.md — `@runecraft/guild`

Behavioral rules for any AI agent (or human) editing this package.

## What this package is

Guild is the multi-agent orchestration plugin for OpenCode. It ships 8 RPG-themed agents (Bard, Fighter, Wizard, Rogue, Warlock, Cleric, Ranger, Paladin), a hooks pipeline, a workflow engine, an analytics recorder, and an eval framework. It is loaded by OpenCode as a plugin via `src/index.ts`.

## Source layout

```
src/
  index.ts                  # Plugin entry — registers everything with OpenCode
  config/                   # Zod schema, merge logic, continuation config
  domain/                   # Plans, workflows — pure domain logic, no I/O
  features/                 # Agent registry, analytics, skill loader, workflow runner, work-state
  hooks/                    # All lifecycle hooks (start-work, continuation, guards, etc.)
  infrastructure/           # Filesystem adapters (plan repo, config loader)
  runtime/                  # OpenCode protocol types and command envelope parser
  shared/                   # Logger (log.ts), shared utilities
evals/
  cases/                    # Individual eval cases (.jsonc)
  scenarios/                # Multi-turn mock conversations (.jsonc)
  suites/                   # Eval suite definitions (.jsonc)
```

## Architectural rules

- **Dependency direction is one-way**: `hooks/` and `features/` depend on `domain/` and `infrastructure/`; `domain/` never imports from `hooks/`, `features/`, or `infrastructure/`.
- **Hooks are stateless functions or thin closures** — they must not hold mutable state outside of what `createHooks()` explicitly constructs (e.g., `writeGuardState`).
- **All hook registration goes through `create-hooks.ts`** — never wire a hook directly in `index.ts`. Adding a hook means: (1) implement the hook file, (2) add it to `createHooks()`, (3) guard it with `isHookEnabled(name)`.
- **Zod v4 only** — this package uses `zod ^4.0.0`. Do not import from `zod/v3` or mix schemas.
- **Logger**: use `debug`, `info`, `warn`, `error` from `src/shared/log.ts`. Never use `console.log` in production code. `console.error` is allowed only as a fallback inside `log.ts` itself.
- **No new globals** — all state must be passed explicitly through function arguments or closures constructed at plugin init time.

## Hooks

Hooks live in `src/hooks/`. Each hook:
- Has a corresponding `*.test.ts` colocated in the same directory.
- Is enabled/disabled via `isHookEnabled(name)` in `create-hooks.ts`.
- Must not throw — errors should be caught and logged, returning a safe no-op result.

Current hooks and their config keys:

| Hook | Config key |
| --- | --- |
| `start-work-hook.ts` | `start-work` |
| `work-continuation.ts` | `work-continuation` |
| `compaction-recovery.ts` | `work-continuation` (shared) |
| `context-window-monitor.ts` | `context-window-monitor` |
| `write-existing-file-guard.ts` | `write-existing-file-guard` |
| `rules-injector.ts` | `rules-injector` |
| `keyword-detector.ts` | `keyword-detector` |
| `verification-reminder.ts` | `verification-reminder` |
| `ranger-md-only.ts` | `ranger-md-only` |
| `todo-description-override.ts` | `todo-description-override` |
| `todo-continuation-enforcer.ts` | `todo-continuation-enforcer` |
| `compaction-todo-preserver.ts` | `compaction-todo-preserver` |

## Tools

Tools live in `src/tools/`. Each guild-owned tool:
- Has a corresponding `*.test.ts` colocated in the same directory.
- Is registered in `src/create-tools.ts` and guarded by a config flag check.
- Must not throw — errors must be caught and returned as `{ ok: false, warnings }`.

Current tools and their config keys:

| Tool file | Config key | Tool name |
| --- | --- | --- |
| `compact-context.ts` | `tools.compact_context` | `guild_compact_context` |

## Evals

Evals live in `evals/`. Three layers:

- **`scenarios/`** — multi-turn mock conversations (`.jsonc`). Define the agent sequence and message content.
- **`cases/`** — executable eval units referencing a scenario + evaluator spec.
- **`suites/`** — groups of cases by phase (`routing`, `trajectory`, `prompt`).

Evaluator kinds: `trajectory-assertion`, `llm-judge`, `contains-all`, `prompt-render`.

When adding a new eval case:
1. Create the scenario in `scenarios/` if it doesn't exist.
2. Create the case in `cases/` referencing the scenario.
3. Add the case to the appropriate suite in `suites/`.

## Tests

```bash
# All guild tests
bun test --cwd packages/guild

# Single file
bun test packages/guild/src/hooks/start-work-hook.test.ts

# Integration tests
bun test packages/guild/test/integration/

# E2E tests
bun test packages/guild/test/e2e/
```

Test fixtures: use `os.tmpdir()` for any filesystem state. Never write inside the package tree.

The `test/testkit/` directory contains shared test utilities — use them before writing new helpers.

## Build

```bash
bun run build --cwd packages/guild
```

Output goes to `dist/`. The build must succeed before marking any task complete.

## Known constraints

- `src/index.ts` is the only file OpenCode loads — all exports must be reachable from there.
- The plugin must not crash on startup if config is missing or malformed — the config loader is tolerant by design.
- `evals/` are not part of the published package — they are dev-only artifacts.
- Analytics writes to `.guild/analytics/` — never to `src/` or `dist/`.

## Verification gates

Before marking any task complete:

- [ ] `bun test --cwd packages/guild` passes
- [ ] `bun run lint` passes with no new warnings
- [ ] `bun run build --cwd packages/guild` succeeds
- [ ] New hooks are registered in `create-hooks.ts` and guarded by `isHookEnabled`
- [ ] New eval cases are added to the appropriate suite
- [ ] No `console.log` introduced in production code
- [ ] No Zod v3 imports introduced

## Escalation

Stop and ask before:
- Adding new dependencies to `package.json`
- Changing the plugin entry contract (`src/index.ts` exports)
- Modifying the Zod config schema in a breaking way
- Adding a new agent archetype (requires prompt design + eval coverage)

# AGENTS.md — `@runecraft/spawn`

Behavioral rules for any AI agent (or human) editing this package.

## What this package is

Spawn is the tmux subagent pane manager plugin for OpenCode. When a child session is created (subagent spawned), Spawn opens a tmux pane for it and keeps it open until the session is deleted from the OpenCode server. It also runs a `ZombieReaper` that cleans up orphaned `opencode attach` processes.

## Source layout

```
src/
  index.ts                  # Plugin entry — wires TmuxSessionManager to OpenCode events
  config.ts                 # Zod v3 schema for plugin config (TmuxConfigSchema, PluginConfigSchema)
  types.ts                  # PluginInput / PluginOutput / Plugin types
  layout.ts                 # tmux layout helpers
  tmux-session-manager.ts   # Core: tracks sessions, spawns/closes panes, polls lifecycle
  spawn-queue.ts            # Serialized spawn queue with retry and coalescing
  zombie-reaper.ts          # Detects and kills orphaned opencode attach processes
  utils/                    # logger, process utils, tmux shell helpers, config loader
  bin/                      # CLI entry (reap command)
  scripts/                  # Dev/test scripts
  __tests__/                # All test files
```

## Session lifecycle

A pane is opened when `session.created` fires with a `parentID` (child session). The pane stays open until the session is **deleted** from the OpenCode server — not when it goes idle. The poll loop (`pollSessions`) checks `client.session.status()` on each tick; a session is closed only when it disappears from the status map for longer than `SESSION_MISSING_GRACE_MS`.

**Do not close panes on idle.** The `idleSince` field exists for monitoring only. Closing on idle was the previous behavior and has been intentionally removed.

## Architectural rules

- **Zod v3 only** — this package uses `zod ^3.x`. Do not import from `zod/v4` or mix with guild's schemas.
- **No shared state between plugin instances** — the `isInitialized` guard in `index.ts` prevents duplicate initialization; do not remove it.
- **`TmuxSessionManager` owns all session state** — do not track sessions outside of it.
- **`SpawnQueue` serializes all pane spawns** — never call `spawnTmuxPane` directly from `TmuxSessionManager`; always go through the queue.
- **`ZombieReaper` is independent** — it does not share state with `TmuxSessionManager`. It scans for orphaned `opencode attach` processes system-wide.
- **Logger**: use `log` from `src/utils/logger.ts`. Never use `console.log` in production code (only `console.log`/`console.error` in `zombie-reaper.ts` CLI paths is acceptable).
- **Shell commands** (tmux, ps, kill) go through `src/utils/` helpers — never call `execSync`/`spawnSync` directly in `TmuxSessionManager` or `SpawnQueue`.

## Config

Plugin config is loaded from `spawn-opencode.jsonc` (project) or `~/.config/opencode/spawn-opencode.jsonc` (user) via `src/utils/config-loader.ts`. The Zod schema is in `src/config.ts`.

Key config fields:

| Field | Default | Description |
| --- | --- | --- |
| `enabled` | `true` | Enable/disable the plugin |
| `layout` | `main-vertical` | tmux layout |
| `main_pane_size` | `60` | Main pane size % |
| `spawn_delay_ms` | `300` | Delay between spawns |
| `reaper_enabled` | `true` | Enable zombie reaper |
| `session_missing_grace_ms` | `30000` | Grace period before closing a missing session |

## Tests

```bash
# All spawn tests
bun test --cwd packages/spawn

# Single file
bun test packages/spawn/src/__tests__/tmux-session-manager.test.ts
```

Test fixtures: use `os.tmpdir()` for filesystem state. Never write inside the package tree.

Mock tmux shell calls in tests — do not require a live tmux session.

## Build

```bash
bun run build --cwd packages/spawn
```

Output goes to `dist/`. The build must succeed before marking any task complete.

## Known constraints

- The plugin runs inside the OpenCode process — it must not block the event loop. All tmux shell calls are async.
- `SESSION_TIMEOUT_MS` (10 min) is a hard safety cap — a pane will never live longer than this regardless of session state. This is intentional.
- The `ZombieReaper` uses `process.exit(0)` for self-destruct when the server is abandoned — this is intentional and must not be removed.
- `proper-lockfile` is used in `SpawnQueue` for cross-process spawn serialization — do not replace with an in-memory lock.

## Verification gates

Before marking any task complete:

- [ ] `bun test --cwd packages/spawn` passes
- [ ] `bun run lint` passes with no new warnings
- [ ] `bun run build --cwd packages/spawn` succeeds
- [ ] Pane lifecycle: panes open on `session.created`, close on session deletion (not on idle)
- [ ] No Zod v4 imports introduced
- [ ] No direct `execSync`/`spawnSync` calls outside `src/utils/`

## Escalation

Stop and ask before:
- Adding new dependencies to `package.json`
- Changing the plugin entry contract (`index.ts` exports)
- Modifying `SESSION_TIMEOUT_MS` or `SESSION_MISSING_GRACE_MS` defaults
- Any change that affects the `ZombieReaper` self-destruct logic

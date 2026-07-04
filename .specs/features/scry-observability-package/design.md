# Scry Observability Package Design

**Spec:** `.specs/features/scry-observability-package/spec.md`
**Status:** Draft — pending user confirmation
**Started:** 2026-06-28
**Last Updated:** 2026-06-28
**Decisions:** See AD-100 through AD-108 in `.specs/project/STATE.md`

---

## Architecture Overview

Scry is a **standalone OpenCode plugin** (`@runecraft/scry`) and **not** a Guild submodule. It works with or without Guild installed. It subscribes to OpenCode events directly, writes to a per-user global SQLite store, renders a live TUI sidebar, and optionally exports OTel. It also self-registers four slash-commands (`/scry-summary`, `/scry-ls`, `/scry-budget`, `/scry-budget-set`) by mutating `input.command` inside its `Hooks.config` — the same pattern Guild uses at `packages/guild/src/runtime/opencode/plugin-adapter.ts:109-110`.

Guild's existing `.guild/analytics/` JSONL is left untouched. Scry consumes events directly; ingestion of Guild JSONL into the global DB is deferred to v0.2 per AD-107.

```mermaid
graph TD
    OC[OpenCode runtime] -->|chat.params, message.updated, message.part.updated, tool.execute.*, session.*, command.execute.before| PE[Plugin Entry]
    PE --> CN[Capture Normalizer]
    CN --> MEM[(In-Memory Current Session)]
    MEM -->|on session end| DB[(Global SQLite ~/.runecraft/scry/scry.db)]
    CN --> TUI[Live TUI Sidebar]
    CN --> BW[Budget Watcher]
    BW --> TUI
    DB --> T[Hooks.tool: scry_summary / scry_ls / scry_budget]
    DB --> TUI
    T --> AGENT[Agent / Chat]
    AGENT -->|natural-language or slash| PE
    SC[Hooks.config] -->|mutate input.command| INJ[/scry-summary, /scry-ls, ... injected]
    INJ --> PE
    CN -->|if SCRY_OTEL_ENDPOINT| OTEL[OTel Exporter dynamic import]
    OTEL --> COL[OTLP Collector]
```

### Key architectural invariants

1. **Scry is a plugin-only artifact.** No `bin` field, no `bunx scry` UX.
2. **Scry auto-registers slash-commands via `Hooks.config`** — user only needs to add `"@runecraft/scry"` to `opencode.json#plugin`.
3. **User override wins** on `config.command` (inverse of Guild; see AD-108).
4. **Scry never reads or writes `.guild/analytics/`.** That belongs to Guild. v0.2 adds a read-only `scry_guild_sync` tool.
5. **Scry never fabricates cost.** When `AssistantMessage.cost === 0` and tokens > 0, `cost_usd = NULL` (AD-104).
6. **No external dependencies for the core path** — `Bun.TOML.parse` for config, `node:sqlite` for storage.

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| Guild `event-router.ts` shape references | `packages/guild/src/runtime/opencode/event-router.ts` | **Read-only reference** for the exact event payloads Scry subscribes to. The `PluginInterface` at `packages/guild/src/plugin/types.ts:6-22` documents the same hook surface Scry uses. |
| Guild `SessionTracker.token fields` | `packages/guild/src/features/analytics/session-tracker.ts` | Reference its token field shape (`input`, `output`, `reasoning`, `cacheRead`, `cacheWrite`) so Scry's types don't drift from Guild's. |
| Guild `MetricsTokenUsage` / `TokenUsage` types | `packages/guild/src/features/analytics/types.ts:36-49, 167-178` | Document the field mapping (`inputTokens` in Guild vs `input` in Scry's `TurnRecord`). |
| Runes SQLite isolation pattern | `packages/runes/src/db/sqlite.ts` | **Direct template** — same `node:sqlite` isolation, WAL, prepared statements. Critical for consistency across Arcanum plugins. |
| Runes migration runner | `packages/runes/src/db/migrations.ts` | Reuse approach (numbered SQL migration files applied in order). |
| Runes per-repo data dir resolution | `packages/runes/src/lib/paths.ts` | Reference for cross-platform path conventions (`~/.runes/` pattern). |
| Grimoire Biome/tsconfig presets | `packages/grimoire/{biome.json,tsconfig.base.json}` | Inherit via devDep `workspace:*` like the other packages. |
| Guild `BUILTIN_COMMANDS` template pattern | `packages/guild/src/features/builtin-commands/commands.ts` | **Direct template** for Scry's `slash-commands.ts` — same envelope, same template, same `$ARGUMENTS`/`$SESSION_ID` placeholders. |
| Guild `routeCommandExecuteBefore` pattern | `packages/guild/src/application/commands/command-router.ts` | **Direct template** for Scry's command router. |
| Guild `plugin-adapter.ts:78-110` config mutation | `packages/guild/src/runtime/opencode/plugin-adapter.ts:78-110` | **Direct template** for the `config(input)` hook that injects commands. Scry applies **inverse** priority (user override wins). |
| Guild `plugin-interface.ts` hooks map | `packages/guild/src/plugin/plugin-interface.ts:33-48` | **Direct template** for the `Hooks` returned by Scry's plugin entry. |

### Integration Points

| System | Integration Method |
| --- | --- |
| OpenCode plugin events | `Hooks.event({event: Event})` for all events + `chat.params` for model/agent + `command.execute.before` for slash-commands + `Hooks.config` for self-registration. Exact shapes verified at `@opencode-ai/sdk` v2 `types.gen.d.ts:763-770, 487-520, 1235-1241`. |
| Global store | `~/.runecraft/scry/scry.db` (`node:sqlite`, WAL, FTS not needed for v1). |
| Config | `scry.toml` parsed via `Bun.TOML.parse` (zero deps). Resolution order: `<repo>/scry.toml` → `~/.config/runecraft/scry.toml`. |
| OTel | `@opentelemetry/api` + `@opentelemetry/sdk-node` + `@opentelemetry/exporter-otlp-grpc` — **dynamic import** only when `SCRY_OTEL_ENDPOINT` is set. Optional deps. |
| Guild analytics JSONL | **Not touched in v0.1**. v0.2 adds a read-only `scry_guild_sync` `Hooks.tool`. |

---

## Components

### 1. Plugin Entry (`src/index.ts`)

- **Purpose**: OpenCode plugin entry; registers all hooks, wires capture loop, TUI, OTel, and `Hooks.config` self-registration.
- **Location**: `packages/scry/src/index.ts`
- **Interfaces**:
  - `export default definePlugin({ id: "scry", hooks: { event, config, "chat.params", "tool.execute.before", "tool.execute.after", "command.execute.before", tool: { scry_summary, scry_ls, scry_budget, scry_budget_set } } })`
- **Dependencies**: Capture Normalizer, Plugin Tools, Slash Commands registry, TUI handle, OTel sink, Config loader, Budget watcher.
- **Reuses**: `packages/guild/src/plugin/plugin-interface.ts:33-48` structural template; `packages/guild/src/runtime/opencode/plugin-adapter.ts:78-110` `config` hook pattern (with inverse priority per AD-108).

### 2. Capture Normalizer (`src/capture/normalizer.ts`)

- **Purpose**: Convert heterogeneous OpenCode events into a single `TurnRecord` shape; guard against missing fields.
- **Location**: `packages/scry/src/capture/normalizer.ts`
- **Interfaces**:
  - `normalizeMessageUpdated(event: EventMessageUpdated): TurnRecord | null`
  - `normalizeMessagePartUpdated(event: EventMessagePartUpdated): { ttftMs: number | null, tps: number | null }`
  - `normalizeToolBefore(event: "tool.execute.before", input): { tool, callId, startedAt }`
  - `normalizeToolAfter(event: "tool.execute.after", input): { tool, callId, durationMs }`
- **Dependencies**: Shared types.
- **Reuses**: Guild `safeNum()` helper pattern from `packages/guild/src/features/analytics/session-tracker.ts:13-16`. **Note**: replicate inline (no cross-package runtime dep).

### 3. Global Store (`src/db/`)

- **Purpose**: Persistent SQLite at `~/.runecraft/scry/scry.db`. Tables: `repos`, `models`, `sessions`, `turns`, `tool_calls`. Concurrency-safe via WAL + busy timeout.
- **Location**: `packages/scry/src/db/{sqlite.ts,client.ts,migrations.ts,repository.ts,schema.sql,types.ts}`
- **Interfaces**:
  - `openScryDb(path: string): ScryDb`
  - `ScryDb.upsertRepo(path: string): number`
  - `ScryDb.upsertModel(modelId: string): number`
  - `ScryDb.insertTurn(rec: TurnRecord): void`
  - `ScryDb.insertSession(rec: SessionRecord): void`
  - `ScryDb.querySummary(filter: QueryFilter): Aggregates`
  - `ScryDb.querySessions(filter: QueryFilter): SessionRow[]`
- **Dependencies**: `node:sqlite` (Node 22+, matching Runes/Arcanum floor).
- **Reuses**: `packages/runes/src/db/sqlite.ts` (template), `packages/runes/src/db/migrations.ts` (template).

### 4. Live TUI Sidebar (`src/tui/sidebar.ts`)

- **Purpose**: Minimal non-blocking ANSI sidebar showing current session's agent role, model, tokens, cost, context %, last TTFT, last TPS (or `—`).
- **Location**: `packages/scry/src/tui/sidebar.ts`
- **Interfaces**:
  - `startTui(store: LiveStore): TuiHandle`
  - `TuiHandle.update(rec: TurnRecord | ToolCallRecord): void`
  - `TuiHandle.alert(line: string): void`
  - `TuiHandle.stop(): void`
- **Dependencies**: Pure ANSI escapes (zero deps). Auto-disables when `!process.stdout.isTTY`.
- **Reuses**: Spawn's pane concept as inspiration only (no tmux dep).

### 5. Budget Watcher (`src/budget/watcher.ts`)

- **Purpose**: Compares cumulative cost against `scry.toml:[budget]`; emits one alert per threshold crossing (80% warn, 100% alert).
- **Location**: `packages/scry/src/budget/watcher.ts`
- **Interfaces**:
  - `createBudgetWatcher(cfg: BudgetConfig): BudgetWatcher`
  - `BudgetWatcher.observe(costDelta: number): BudgetAlert | null`
  - `BudgetWatcher.reset(): void` (on new week)
- **Dependencies**: Config loader.
- **Reuses**: None directly; pure functions.

### 6. Config Loader (`src/config/loader.ts`)

- **Purpose**: Load `scry.toml` from `<repo>/scry.toml` or `~/.config/runecraft/scry.toml`. `Bun.TOML.parse`, zero deps.
- **Location**: `packages/scry/src/config/{loader.ts,schema.ts}`
- **Interfaces**: `loadConfig(): ScryConfig`
- **Dependencies**: `Bun.TOML.parse` (runtime guard for non-Bun).
- **Reuses**: None (no `@iarna/toml` per AD-105).

### 7. OTel Exporter (`src/export/otel.ts`)

- **Purpose**: Lazily load OpenTelemetry SDK and emit one span per turn + metric counters per token stream.
- **Location**: `packages/scry/src/export/otel.ts`
- **Interfaces**:
  - `maybeStartOtel(endpoint: string | undefined): OtelSink | null`
  - `OtelSink.emitTurn(rec: TurnRecord): void`
- **Dependencies**: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/exporter-otlp-grpc` — **dynamic imports only**, declared as `optionalDependencies` in `package.json`.
- **Reuses**: None.

### 8. Plugin Tools (`src/plugin/tools.ts`)

- **Purpose**: Four `Hooks.tool` definitions the agent (or slash-command template) can call. Each returns a markdown table string.
- **Location**: `packages/scry/src/plugin/tools.ts`
- **Interfaces**:
  - `scry_summary({ by?: "model"|"agent"|"repo"|"day"|"week", since?: string, repo?: string, agent?: string }): string` — markdown table
  - `scry_ls({ limit?: number }): string` — list recent sessions
  - `scry_budget({}): string` — show current budget state
  - `scry_budget_set({ weekly_usd?: number, daily_usd?: number }): string` — update budget config (writes back to the resolved `scry.toml`)
- **Dependencies**: DB client, budget watcher.
- **Reuses**: None directly; the markdown table format follows existing Arcanum table conventions (e.g. `scry ls` output mimics `git status`-style alignment).

### 9. Slash Commands (`src/plugin/slash-commands.ts`)

- **Purpose**: Slash-command templates registered via `Hooks.config` mutation. Each is a `Record<name, {template, description, agent}>` consumed by `command.execute.before`.
- **Location**: `packages/scry/src/plugin/slash-commands.ts`
- **Interfaces**:
  - `SCRY_SLASH_COMMANDS: Record<"scry-summary"|"scry-ls"|"scry-budget"|"scry-budget-set", ScryCommand>`
  - `renderSlashTemplate(command: ScryCommandName, args: string, sessionId: string, timestamp: string): { envelope: string, body: string }`
- **Dependencies**: Plugin Tools (the template instructs the agent to call them).
- **Reuses**: `packages/guild/src/features/builtin-commands/commands.ts:9-118` — direct template. The envelope renderer is `renderBuiltinCommandEnvelope` at `packages/guild/src/runtime/opencode/protocol.ts`; re-implement inline (no runtime dep).

### 10. Command Router (`src/plugin/command-router.ts`)

- **Purpose**: Handles `command.execute.before` for `/scry-*` by injecting the template body (same effect as Guild's `routeCommandExecuteBefore`).
- **Location**: `packages/scry/src/plugin/command-router.ts`
- **Interfaces**:
  - `routeScryCommand(input: { command: string, arguments: string, sessionID: string }, output: { parts: Array<{type: string, text: string}> }): void`
- **Dependencies**: Slash Commands registry.
- **Reuses**: `packages/guild/src/application/commands/command-router.ts` (template).

### 11. Skill (`skills/using-scry/SKILL.md`)

- **Purpose**: Markdown skill the agent loads to understand when/how to use Scry's `Hooks.tool` definitions. Mirrors Runes' `using-runes` skill pattern.
- **Location**: `packages/scry/skills/using-scry/SKILL.md`
- **Dependencies**: None.
- **Reuses**: `packages/runes/skills/using-runes/SKILL.md` (template).

---

## Data Models

### `TurnRecord` (in-memory, then persisted into `turns` table)

```typescript
interface TurnRecord {
  id: string                    // ulid
  sessionId: string
  repoPath: string              // absolute; from AssistantMessage.path.cwd
  agentName: string | null      // from AssistantMessage.agent (e.g., "Bard (Main Orchestrator)")
  agentRole: AgentRole          // parsed from agentName; falls back to "unknown"
  modelId: string               // from AssistantMessage.modelID
  providerId: string            // from AssistantMessage.providerID
  startedAt: number             // epoch ms — AssistantMessage.time.created
  endedAt: number | null        // AssistantMessage.time.completed ?? null
  ttftMs: number | null         // first message.part.updated.time − created
  tps: number | null            // output_tokens / (TextPart.time.end − start); null when end absent
  tokens: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number }
  costUsd: number | null        // AssistantMessage.cost when > 0; otherwise null (never fabricated)
}
```

### `SessionRecord` (persisted on `session.idle` or `session.deleted`)

```typescript
interface SessionRecord {
  sessionId: string
  repoPath: string
  agentName: string | null
  agentRole: AgentRole
  modelId: string
  startedAt: number
  endedAt: number
  durationMs: number
  totalCostUsd: number | null       // sum of TurnRecord.costUsd, ignoring nulls
  totalTokens: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number }
  turnCount: number
  toolCallCount: number
}
```

### `AgentRole` enum (matches Arcanum matrix + `unknown`)

```typescript
type AgentRole = "bard" | "wizard" | "fighter" | "cleric" | "paladin" | "rogue" | "warlock" | "ranger" | "unknown"
```

Mapping rule: if `agentName` contains a known key (lowercased first word), use it; else `unknown`. Documented in `src/agent-roles.ts`.

### SQLite schema (full SQL in `src/db/schema.sql`)

```sql
-- Schema version 1
CREATE TABLE repos (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  first_seen INTEGER NOT NULL
);

CREATE TABLE models (
  id INTEGER PRIMARY KEY,
  model_id TEXT UNIQUE NOT NULL,
  provider_id TEXT,
  first_seen INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  repo_id INTEGER NOT NULL,
  agent_name TEXT,
  agent_role TEXT NOT NULL DEFAULT 'unknown',
  model_id TEXT NOT NULL,
  provider_id TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  cost_usd REAL,
  in_tokens INTEGER NOT NULL DEFAULT 0,
  out_tokens INTEGER NOT NULL DEFAULT 0,
  reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read INTEGER NOT NULL DEFAULT 0,
  cache_write INTEGER NOT NULL DEFAULT 0,
  turn_count INTEGER NOT NULL DEFAULT 0,
  tool_call_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);

CREATE TABLE turns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  ttft_ms INTEGER,
  tps REAL,
  cost_usd REAL,
  in_tokens INTEGER NOT NULL,
  out_tokens INTEGER NOT NULL,
  reasoning_tokens INTEGER NOT NULL,
  cache_read INTEGER NOT NULL,
  cache_write INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  call_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_ms INTEGER,
  agent TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_repo ON sessions(repo_id, started_at);
CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_turns_session ON turns(session_id, started_at);
CREATE INDEX idx_tool_calls_session ON tool_calls(session_id);
```

### `QueryFilter` (for `scry_summary` and `scry_ls`)

```typescript
interface QueryFilter {
  by?: "model" | "agent" | "repo" | "day" | "week"
  sinceMs?: number       // epoch ms; --since 7d → Date.now() - 7 * 86400_000
  repoPath?: string
  agentRole?: AgentRole
  limit?: number         // for scry_ls
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| `message.updated` carries no `info` or no `tokens` | Skip increment; debug-log once per session. | TUI shows `—` for cost; tokens counter unchanged. |
| `info.cost === 0` while `info.tokens` > 0 | Store `cost_usd = NULL`. | TUI shows `cost: unknown` (per AD-104). |
| `TextPart.time.end` absent | `tps = null`. | TUI shows `tps: —` (per AD-103). |
| Global DB locked | Retry busy timeout 3× with WAL; on persistent failure drop and warn to `$SCRY_LOG`. | One lost session row; no crash. |
| `command.execute.before` for unknown `/scry-*` | Pass-through (do nothing). | OpenCode falls back to default behavior. |
| User-defined `config.command["scry-*"]` collision | User version wins (AD-108). | No change. |
| TTY is not interactive | TUI auto-disables; capture + store still run. | Silent no-TUI mode. |
| OTel collector unreachable | Catch + warn once; continue. | No telemetry downstream; no crash. |
| `Bun` undefined (running under node) | Loader throws `"Scry requires Bun 1.2+ (Bun.TOML)"`. | Hard fail with actionable message. |
| Node < 22 | Plugin entry throws `"Scry requires Node 22+ for node:sqlite"`. | Hard fail with actionable message. |

---

## Tech Decisions (only non-obvious ones)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Where Scry captures events | Subscribe to OpenCode events directly via `Hooks.event`, **not** via Guild. | Decouples Scry from Guild; usable by non-Guild users; avoids duplicate SessionTracker instances. |
| Storage location | Global per-user (`~/.runecraft/scry/scry.db`), not per-repo. | Cross-repo rollup is a P2 success criterion. Per-repo is Guild's job. |
| Storage engine | `node:sqlite` (Node 22+) with WAL. | Matches Runes exactly (AD-002); keeps Arcanum dependency-free of `better-sqlite3`. |
| Slash-command registration | `Hooks.config` mutates `input.command` (mirrors Guild). | Self-registration on plugin add — no Summon, no installer, no manual `opencode.json#command`. |
| Slash-command priority on collision | **User override wins** (inverse of Guild). | AD-108: user is the final authority on their config. |
| OTel loading | Dynamic `import()` only when `SCRY_OTEL_ENDPOINT` is set. | Keeps the install lean for the 90% who never use OTel (AD-106). |
| TUI v1 strategy | Inline ANSI render, no tmux dependency. | Removes a runtime dep; can be promoted to tmux later if Spawn is also present. |
| Pricing source | `AssistantMessage.cost` directly; never fabricate (AD-104). | Same approach as Guild; if provider returns 0, store NULL. `models.dev` not in Scry's scope. |
| TOML parser | `Bun.TOML.parse` (no `@iarna/toml`) | AD-105: zero deps; runtime guard for non-Bun. |
| CLI / `bin/scry.js` | **Not shipped** (AD-106). | Plugin-only distribution per user decision. |
| Cross-plugin ingestion of Guild JSONL | Deferred to v0.2 (AD-107). | Keep v0.1 surface focused on capture + self-registration. |
| Repository integration | Read-only ingestion of Guild JSONL via `scry_guild_sync` `Hooks.tool` in v0.2. | No dual-write; keeps Guild as owner of plan-level metrics. |

---

## Resolved Uncertainties (previously flagged)

1. **OpenCode event payload shape** — RESOLVED via `node_modules/.bun/@opencode-ai+sdk@1.14.29/.../v2/gen/types.gen.d.ts` (lines 487-520 for `AssistantMessage`, 763-770 for `EventMessagePartUpdated`, 1235-1241 for `Config.command`).
2. **TTFT/TPS availability** — RESOLVED: TTFT always available via envelope `time` on `message.part.updated`; TPS best-effort via optional `TextPart.time.end` (display `—` when absent). Per AD-103.
3. **TOML parser** — RESOLVED: `Bun.TOML.parse` works end-to-end (probe verified). Per AD-105.
4. **Slash-command registration** — RESOLVED: `Hooks.config` mutation of `input.command` works (proven by Guild at `plugin-adapter.ts:109-110`).

---

## Open Risks (accepted, not zeroed)

1. **`command.execute.before` template-injection requires the agent to have tool calling enabled.** For tool-less agents, the slash-command template includes a `tool-less` variant that prints a pre-rendered result. T9 covers both variants; smoke test (T12) validates the agent path.
2. **No empirical proof that every OpenCode provider populates `AssistantMessage.cost`.** Mitigation: when `cost === 0 && tokens > 0`, store NULL and display "unknown" (per AD-104). Better than fabrication.
3. **`TextPart.time.end` is optional in the SDK type.** Mitigation: TPS field nullable, displays `—` per AD-103.
4. **User-override priority on `config.command`** is the inverse of Guild's convention. Mitigation: documented in AD-108; mismatch with Guild is a known, deliberate trade-off.

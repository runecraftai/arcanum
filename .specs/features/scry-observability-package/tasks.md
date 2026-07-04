# Scry Observability Package Tasks

**Design:** `.specs/features/scry-observability-package/design.md`
**Status:** Draft — pending user confirmation
**Started:** 2026-06-28
**Last Updated:** 2026-06-28
**Decisions:** See AD-100 through AD-108 in `.specs/project/STATE.md`

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 ──→ T2 ──→ T3
```

T1 establishes the workspace and TOML config loader. T2 defines the canonical types. T3 builds the SQLite store (depends on T2 types for schema).

### Phase 2: Core Implementation (Parallel OK)

After T3 completes, the following run in parallel (each depends only on T2 or T3):

```
T3 done ──┬→ T4  [P]  Capture Normalizer
         ├→ T5  [P]  Budget Watcher
         ├→ T6  [P]  Live TUI Sidebar
         ├→ T7  [P]  OTel Exporter
         └→ T9  [P]  Slash Commands + Tool Definitions
```

### Phase 3: Integration (Sequential)

```
T4, T5, T6, T7, T9 ──→ T8 (Plugin Entry wiring)
T8 ──→ T10 (Skill + README + package.json)
```

### Phase 4: Release

```
T10 ──→ T11 (Changeset) ──→ T12 (Smoke)
```

---

## Task Breakdown

### T1: Scaffold package and config loader

**What**: Create `packages/scry/` with `package.json` (`@runecraft/scry` private v0.0.0, no `bin`, `engines.node: ">=22"`, `engines.bun: ">=1.3.0"`), inherit `@runecraft/grimoire` Biome/tsconfig, add to root workspaces. Implement `src/config/{loader.ts,schema.ts}` loading `scry.toml` from `<repo>/scry.toml` or `~/.config/runecraft/scry.toml` via `Bun.TOML.parse`. Guard for non-Bun runtime.

**Where**: `packages/scry/{package.json,tsconfig.json,biome.json,src/config/loader.ts,src/config/schema.ts,tests/config.test.ts}`

**Depends on**: none

**Reuses**: `packages/runes/package.json` template; `packages/summon/package.json` template.

**Requirement**: SCRY-04, SCRY-13, SCRY-16

**Tools**:
- MCP: `filesystem`
- Skill: none

**Done when**:
- [ ] `bun install` resolves the new workspace with no changes to other packages.
- [ ] `bun run --filter @runecraft/scry build` produces `dist/`.
- [ ] `loadConfig()` reads a sample `scry.toml` and returns a typed object in `tests/config.test.ts`.
- [ ] Loader throws `"Scry requires Bun 1.3+ (Bun.TOML)"` when run under `node`.
- [ ] `bun test --filter @runecraft/scry` passes.
- [ ] `bun run lint` clean.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/config.test.ts
node --input-type=module -e "import('./packages/scry/dist/config/loader.js').then(m => m.loadConfig()).catch(e => console.error('EXPECTED:', e.message))"
```

Expected: `bun test` green; `node` execution prints `EXPECTED: Scry requires Bun 1.3+ (Bun.TOML)`.

**Commit**: `feat(scry): scaffold package and config loader (T1)`

---

### T2: Define shared types (turn/session/tool) mirroring Guild

**What**: Create `src/types.ts` exporting `TurnRecord`, `SessionRecord`, `ToolCallRecord`, `AgentRole`, `QueryFilter`, `Aggregates`, `BudgetConfig`, `ScryConfig`. Field names must match Guild's `TokenUsage` semantics (`input`, `output`, `reasoning`, `cacheRead`, `cacheWrite`). Document Guild↔Scry field mapping in a `mapping.md` snippet.

**Where**: `packages/scry/src/{types.ts,agent-roles.ts,tests/types.test.ts}`

**Depends on**: T1

**Reuses**: `packages/guild/src/features/analytics/types.ts:36-178`.

**Requirement**: SCRY-01, SCRY-03, SCRY-13, SCRY-15

**Done when**:
- [ ] All types exported and documented.
- [ ] `tests/types.test.ts` (type-only) compiles via `tsc --noEmit`.
- [ ] Agent-role parser: `"Bard (Main Orchestrator)" → "bard"`, `"Witch" → "unknown"`.

**Verify**:
```bash
tsc --noEmit -p packages/scry/tsconfig.json
bun test --filter @runecraft/scry tests/types.test.ts
```

**Commit**: `feat(scry): define shared types mirroring Guild analytics (T2)`

---

### T3: Implement global SQLite store with migrations

**What**: Create `src/db/{sqlite.ts,client.ts,migrations.ts,schema.sql,repository.ts,types.ts}`. SQLite is isolated exactly like `packages/runes/src/db/sqlite.ts` (WAL, busy timeout, prepared statements). Provide `openScryDb(path)`, `upsertRepo`, `upsertModel`, `insertTurn`, `insertSession`, `querySummary(filter)`, `querySessions(filter)`.

**Where**: `packages/scry/src/db/*`, `packages/scry/tests/db.test.ts`

**Depends on**: T2

**Reuses**: `packages/runes/src/db/sqlite.ts` (template), `packages/runes/src/db/migrations.ts` (template), `packages/runes/src/lib/paths.ts` (path resolution).

**Requirement**: SCRY-03, SCRY-04, SCRY-09, SCRY-10, SCRY-11

**Done when**:
- [ ] `tests/db.test.ts` opens a tmp DB, inserts 3 sessions across 2 repos, queries by model and by repo.
- [ ] Concurrent inserts from two `Worker` instances both succeed (WAL + busy timeout).
- [ ] Migration v1 applies idempotently on a fresh DB and on a DB already at v1.
- [ ] `querySummary({by: "model", sinceMs: ...})` returns the expected aggregation.
- [ ] `bun test --filter @runecraft/scry tests/db.test.ts` passes.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/db.test.ts
sqlite3 "$TMP/scry.db" ".schema"
```

Expected: `bun test` green; `sqlite3 .schema` prints all 5 tables and the indexes.

**Commit**: `feat(scry): global SQLite store with migrations (T3)`

---

### T4: Implement Capture Normalizer [P]

**What**: Create `src/capture/normalizer.ts` with `normalizeMessageUpdated`, `normalizeMessagePartUpdated`, `normalizeToolBefore`, `normalizeToolAfter`. Use `Bun.TOML.parse`-style strict field checking via a `safeNum` helper. Return `null` when essential fields are absent (never throw). Apply AD-104: `cost = (info.cost > 0) ? info.cost : null` whenever `tokens > 0`. Apply AD-103: `tps = (TextPart.time.end != null) ? outputTokens / (end - start) : null`.

**Where**: `packages/scry/src/capture/{normalizer.ts,parser.ts,tests/capture.test.ts}`

**Depends on**: T3

**Reuses**: Guild `safeNum` pattern (`session-tracker.ts:13-16`) — replicate inline. Event shapes verified at `node_modules/.bun/@opencode-ai+sdk@1.14.29/.../v2/gen/types.gen.d.ts:487-520, 763-770`.

**Requirement**: SCRY-01, SCRY-02, SCRY-04, SCRY-05, SCRY-13, SCRY-14, SCRY-15

**Tools**:
- MCP: `filesystem`
- Skill: none

**Done when**:
- [ ] `tests/capture.test.ts` feeds 10 fixtures (missing tokens, unknown model, task delegation, partial `TextPart.time.end`) and asserts correct `TurnRecord` / `null` outputs.
- [ ] No fixture throws.
- [ ] `EVENTS.md` doc lists every event Scry subscribes to with the verified payload shape.
- [ ] Cost-NULL behavior verified by fixture: `info.cost === 0 && info.tokens.input === 100` → `costUsd === null`.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/capture.test.ts
```

**Commit**: `feat(scry): capture normalizer with strict field guards (T4)`

---

### T5: Budget Watcher (pure functions) [P]

**What**: Create `src/budget/watcher.ts` implementing `createBudgetWatcher(cfg)` + `observe(costDelta)` returning `BudgetAlert | null` exactly once per threshold crossing (warn at 80%, alert at 100%). Pure functions; no DB access. Provide `reset()` for the next period.

**Where**: `packages/scry/src/budget/{watcher.ts,tests/budget.test.ts}`

**Depends on**: T2

**Reuses**: none.

**Requirement**: SCRY-11, SCRY-12

**Done when**:
- [ ] `tests/budget.test.ts` covers: under budget, 80% warn, 100% alert, no double alert on subsequent observations, reset on new week, `costUsd = null` deltas ignored.
- [ ] 100% branch coverage for `watcher.ts`.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/budget.test.ts
```

**Commit**: `feat(scry): budget watcher with single-alert-per-threshold (T5)`

---

### T6: Live TUI Sidebar [P]

**What**: Create `src/tui/sidebar.ts` rendering a non-blocking ANSI sidebar: agent role badge, current turn tokens/cost, cumulative session cost, context %, last TTFT (always), last TPS (or `—`). Auto-disable when `!process.stdout.isTTY`. Idempotent `start`/`stop`.

**Where**: `packages/scry/src/tui/{sidebar.ts,format.ts,tests/tui.test.ts}`

**Depends on**: T3

**Reuses**: Spawn's pane concept as inspiration only (no tmux dep).

**Requirement**: SCRY-02, SCRY-05

**Done when**:
- [ ] `tests/tui.test.ts` (using a mock stdout stream) verifies the rendered ANSI contains the agent role, model, and cost fields.
- [ ] When `isTTY=false`, `startTui` returns a no-op handle and logs once.
- [ ] `startTui`/`stop` are idempotent.
- [ ] Update path does not block the main event loop (uses `setImmediate` or microtask).

**Verify**:
```bash
bun test --filter @runecraft/scry tests/tui.test.ts
```

**Commit**: `feat(scry): live TUI sidebar (T6)`

---

### T7: OTel Exporter (dynamic import) [P]

**What**: Create `src/export/otel.ts` with `maybeStartOtel(endpoint)` returning `OtelSink | null`. Lazily `import()` `@opentelemetry/api` + `@opentelemetry/sdk-node` + `@opentelemetry/exporter-otlp-grpc`. Emit one span per `TurnRecord` with attributes `{agent.role, model, provider, repo, session.id}` and one `MetricCounter` per token stream. Catch endpoint errors; warn once; continue.

**Where**: `packages/scry/src/export/{otel.ts,tests/otel.test.ts}`

**Depends on**: T3

**Reuses**: none.

**Requirement**: SCRY-10, SCRY-12

**Done when**:
- [ ] OTel packages are **not** in `dependencies` (only `peerDependencies` + `optionalDependencies`).
- [ ] Without `SCRY_OTEL_ENDPOINT`, `maybeStartOtel` returns `null` without importing.
- [ ] `tests/otel.test.ts` (mocking dynamic imports) verifies a span is emitted and that a connection failure does not throw.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/otel.test.ts
```

**Commit**: `feat(scry): OTel exporter with dynamic imports (T7)`

---

### T8: Plugin entry — wire all hooks

**What**: Create `src/index.ts` exporting a `Plugin` function that returns:
```ts
{
  event: async ({event}) => { /* route via Capture Normalizer; write to DB; update TUI; observe budget; emit OTel */ },
  config: async (input) => { /* mutate input.command — user override wins; inject scry-* slash commands */ },
  "chat.params": async (input, _output) => { /* track model limit and agent name for the live store */ },
  "tool.execute.before": async (input, output) => { /* start tool call timing */ },
  "tool.execute.after": async (input, output) => { /* end tool call timing */ },
  "command.execute.before": async (input, output) => { /* route via command-router for /scry-* */ },
  tool: { scry_summary, scry_ls, scry_budget, scry_budget_set },
}
```
All side-effects non-blocking (fire-and-forget with try/catch). Apply AD-108 priority (user override wins on `config.command`).

**Where**: `packages/scry/src/{index.ts,plugin/command-router.ts}, tests/plugin.test.ts`

**Depends on**: T4, T5, T6, T7, T9

**Reuses**: `packages/guild/src/plugin/plugin-interface.ts:33-48` (template); `packages/guild/src/runtime/opencode/plugin-adapter.ts:78-110` (config-hook pattern with inverse priority).

**Requirement**: SCRY-01, SCRY-02, SCRY-03, SCRY-04, SCRY-06, SCRY-07, SCRY-08, SCRY-09, SCRY-10, SCRY-11, SCRY-12, SCRY-14, SCRY-15

**Done when**:
- [ ] Loading the plugin in a scratch repo via `opencode.json#plugin = ["@runecraft/scry"]` produces no errors and starts the TUI.
- [ ] One chat turn creates exactly one `turns` row and updates the TUI.
- [ ] Closing the session creates exactly one `sessions` row.
- [ ] User-defined `config.command["scry-summary"]` is preserved when present; injected when absent.
- [ ] `tests/plugin.test.ts` mocks the runtime and runs 3 turns end-to-end.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/plugin.test.ts
```

**Commit**: `feat(scry): plugin entry with all hooks wired (T8)`

---

### T9: Slash-command templates + tool definitions [P]

**What**: Create `src/plugin/{tools.ts,slash-commands.ts,command-router.ts}`. `tools.ts` exports four `ToolDefinition` (matching `@opencode-ai/plugin` `ToolDefinition` shape): `scry_summary`, `scry_ls`, `scry_budget`, `scry_budget_set`. `slash-commands.ts` exports `SCRY_SLASH_COMMANDS` and the `renderSlashTemplate(name, args, sessionId, ts)` helper. `command-router.ts` exports `routeScryCommand(input, output)` that injects the template body into the assistant prompt.

**Where**: `packages/scry/src/plugin/{tools.ts,slash-commands.ts,command-router.ts,tests/commands.test.ts}`

**Depends on**: T3

**Reuses**: `packages/guild/src/features/builtin-commands/commands.ts:9-118` (template); `packages/guild/src/runtime/opencode/protocol.ts` `renderBuiltinCommandEnvelope` (re-implement inline).

**Requirement**: SCRY-06, SCRY-07, SCRY-08, SCRY-09

**Done when**:
- [ ] `scry_summary({by:"model", since:"7d"})` returns a markdown table sourced from the DB.
- [ ] `scry_ls({limit:5})` returns a markdown list of the 5 most recent sessions.
- [ ] `scry_budget({})` returns current state (cost / limit, %).
- [ ] `scry_budget_set({weekly_usd: 5})` writes back to the resolved `scry.toml` and returns confirmation.
- [ ] `SCRY_SLASH_COMMANDS` exports 4 commands with valid `template`, `description`, and `agent: "build"` (default).
- [ ] `renderSlashTemplate("scry-summary", "--by repo --since 7d", "sess-1", "2026-06-28T19:00:00Z")` produces a template that instructs the agent to call `scry_summary` with `by=repo`, `since=7d`.
- [ ] `tests/commands.test.ts` verifies the tool outputs and the rendered template structure.

**Verify**:
```bash
bun test --filter @runecraft/scry tests/commands.test.ts
```

**Commit**: `feat(scry): slash commands and tool definitions (T9)`

---

### T10: Skill + README + package.json final

**What**: Create `packages/scry/skills/using-scry/SKILL.md` (always-active skill, mirrors Runes' `using-runes`); write `README.md` following `packages/runes/README.md` structure (install/use/config/OTel/budget); finalize `package.json` (`engines: { node: ">=22", bun: ">=1.3" }`, `files: ["dist", "skills"]`, **no `bin`**); update root `CONTRIBUTING.md` scope list to include `scry`.

**Where**: `packages/scry/{skills/using-scry/SKILL.md,README.md,package.json}`, `CONTRIBUTING.md` (root)

**Depends on**: T8, T9

**Requirement**: SCRY-13, SCRY-16

**Done when**:
- [ ] `bun run build` includes the `skills/` directory marker.
- [ ] README's "Self-registration" section explains that adding `"@runecraft/scry"` to `opencode.json#plugin` is sufficient (no other config required).
- [ ] `package.json` has no `bin` field. `grep -n '"bin"' packages/scry/package.json` returns nothing.
- [ ] `CONTRIBUTING.md` commit scopes include `scry`.

**Verify**:
```bash
grep -n '"bin"' packages/scry/package.json  # expect: no output
grep -n scry CONTRIBUTING.md  # expect: scope line present
ls packages/scry/skills/using-scry/SKILL.md  # expect: file exists
```

**Commit**: `feat(scry): skill, README, package.json final (T10)`

---

### T11: Changeset (auto-generated from commits)

**What**: Once T1–T10 are committed using the conventional scope `scry`, run `bun run changeset:version` (executes `.changeset/generate-from-commits.ts` per the root `package.json` script). Produce a `@runecraft/scry@0.1.0` minor changeset entry.

**Where**: `.changeset/*.md` (generated)

**Depends on**: T10

**Reuses**: existing auto-changeset pipeline (no new tooling).

**Requirement**: release-readiness.

**Done when**:
- [ ] `bun run changeset:version` increments `packages/scry/package.json` to `0.1.0`.
- [ ] CHANGELOG.md generated in `packages/scry/`.
- [ ] CI release.yml dry-run (locally: `bun run build && bun publish --dry-run`) succeeds.

**Verify**:
```bash
bun run changeset:version
cat packages/scry/CHANGELOG.md | head -20
```

**Commit**: `chore: version packages (auto-generated by changeset) (T11)`

---

### T12: Smoke install and end-to-end validation

**What**: In `/tmp/opencode/scry-smoke`, set up a fresh scratch repo with `"@runecraft/scry"` in `opencode.json#plugin` (workspace-linked via `bun install`). Run `bunx opencode` headless; trigger one chat turn via the OpenCode SDK; run a follow-up turn with `/scry-summary --by repo --since 7d`; verify:
1. TUI sidebar was active during the chat.
2. `~/.runecraft/scry/scry.db` contains exactly 1 session and 1 turn after the smoke run.
3. The slash-command returns a non-empty table.
4. With `SCRY_OTEL_ENDPOINT` set to a local `otelcol` collector, the collector logs one span with `agent.role` and `model` attributes.
5. With a `$0.50` weekly budget, a session that crosses it emits exactly one alert (no spam on subsequent turns).

**Where**: not in repo — external smoke dir at `/tmp/opencode/scry-smoke`. Final report committed as `tests/smoke-report.md` for traceability.

**Depends on**: T11

**Reuses**: Guild's `script/smoke-install.ts` pattern as a template.

**Requirement**: all success criteria from `spec.md`.

**Done when**:
- [ ] All five assertions above pass.
- [ ] `tests/smoke-report.md` documents each assertion with the observed output.
- [ ] No regression in `bun test --filter @runecraft/guild` (Scry and Guild coexist cleanly).

**Verify**: `cat tests/smoke-report.md` shows all five assertions passing.

**Commit**: `test(scry): smoke-report validating all success criteria (T12)`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel):
  T3 complete ──┬→ T4 [P]
                ├→ T5 [P]
                ├→ T6 [P]
                ├→ T7 [P]
                └→ T9 [P]

Phase 3 (Sequential integration):
  T4,T5,T6,T7,T9 ──→ T8 ──→ T10

Phase 4 (Release):
  T10 ──→ T11 ──→ T12
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Scaffold + config | 1 package skeleton + 3 files | ✅ Granular |
| T2: Shared types | 2 files | ✅ Granular |
| T3: DB layer | 6 files, one cohesive subsystem | ✅ Granular (cohesive) |
| T4: Capture normalizer | 2 files + tests | ✅ Granular |
| T5: Budget watcher | 1 file + tests | ✅ Granular |
| T6: TUI sidebar | 2 files + tests | ✅ Granular |
| T7: OTel exporter | 1 file + tests | ✅ Granular |
| T8: Plugin entry wiring | 1 file + 1 router + tests | ✅ Granular |
| T9: Slash commands + tools | 3 files + tests | ✅ Granular (cohesive) |
| T10: Packaging/docs | 3 files | ⚠️ split would be noise; acceptable |
| T11: Changeset | 1 generated file | ✅ Granular |
| T12: Smoke report | external + 1 report file | ✅ Granular |

---

## Task Verification Standards

Each task above lists explicit **Done when** checklists with binary pass/fail and explicit `bun test` / `bunx` / `bun run` verification commands. The conventional commit scope **`scry`** is used for all `feat(scry):` and `chore:` commits, matching the existing Arcanum monorepo convention. The pre-push hook (when husky pre-commit is enabled per CONTRIBUTING) will run `bun test --filter @runecraft/scry` and `bun run lint`.

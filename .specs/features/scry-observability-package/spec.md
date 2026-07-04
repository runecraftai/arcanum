# Scry Observability Package Specification

**Status:** Draft — pending user confirmation
**Phase:** Specify
**Started:** 2026-06-28
**Last Updated:** 2026-06-28
**Decisions:** See AD-100 through AD-108 in `.specs/project/STATE.md`

---

## Problem Statement

The Arcanum ecosystem gives AI agents durable skills, memory, and orchestration, but operators have no real-time, cross-repo, cross-agent view of what their agents are costing (tokens, dollars, latency). Guild already records per-session JSONL to `.guild/analytics/`, but only per-repo, only after a session ends, and with no live TUI, no cross-repo rollups, no per-turn latency, no OTel export, and no budget alerts.

Awesome-opencode shows this is a crowded, mature external cluster (Tokenscope, Token Monitor, Opencode Throughput, Opencode Telemetry, opencode-plugin-otel) — each solves a slice. There is no Arcanum-native artifact that unifies capture, storage, query, TUI, and export **as a self-registering OpenCode plugin**.

## Goals

- [ ] Provide a single Arcanum-native observability plugin usable with or without Guild.
- [ ] Real-time and historical views of token/cost/latency per session, per agent, per model, per repo.
- [ ] Cross-repo rollups via a per-user global store (`~/.runecraft/scry/scry.db`).
- [ ] OpenTelemetry (OTLP/gRPC) export for teams that already run Datadog/Honeycomb/Grafana.
- [ ] Budget/quota alerts so users stay near the documented ~$1.95/week target.
- [ ] **Self-registration**: slash-commands `/scry-*` appear automatically when the plugin is added to `opencode.json#plugin` — no Summon, no manual `opencode.json#command` block, no external installer.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Pricing Resolver / `models.dev` fetch | Trust `AssistantMessage.cost` from runtime (see AD-104). Pricing belongs to a memory artifact (Runes v2), not observability. |
| Per-repo replacement for Guild's `.guild/analytics/` | Guild already owns that; Scry is additive. |
| Standalone CLI binary (`bin/scry.js`) | Distribution is plugin-only per user decision. No `bunx scry` UX. |
| Cross-plugin ingestion of Guild JSONL (`scry_guild_sync`) | Deferred to v0.2.0 — see AD-107. |
| Cloud-hosted dashboard / web UI | Out of MVP; local-first is the Arcanum philosophy. |
| Semantic search / RAG over session transcripts | Belongs to a memory artifact (Runes), not observability. |
| Real model pricing microservice | `models.dev` not in scope per AD-104. |
| Mobile/chat bridges (Telegram/Discord/Slack) | Already covered by external awesome-opencode plugins; not Arcanum's job. |

---

## User Stories

### P1: Live per-session token/cost/latency TUI ⭐ MVP

**User Story**: As an Arcanum operator running multiple Guild agents, I want a live TUI sidebar showing per-turn tokens, cost so far, and TTFT for the current session, so that I can tell in real time when I am burning budget or when a model is slow.

**Why P1**: Without real-time visibility, the entire observability story collapses to after-the-fact; this is the vertical slice that demonstrates value end-to-end. TPS is best-effort (`TextPart.time.end` is optional in the OpenCode SDK); TTFT is always available via the `message.part.updated` envelope `time`.

**Acceptance Criteria**:

1. WHEN a chat message streams in THEN Scry SHALL update an in-memory current-session record with input/output/reasoning/cache tokens and a running dollar cost, within one event tick.
2. WHEN Scry is loaded as an OpenCode plugin THEN the TUI SHALL render in the terminal without blocking the main agent loop (off-main-thread or async).
3. WHEN a session ends THEN Scry SHALL flush the in-memory record to the global SQLite store.
4. WHEN no model is detected THEN Scry SHALL mark cost as `NULL` instead of fabricating a value (per AD-104).
5. WHEN `TextPart.time.end` is absent THEN the TUI SHALL display TPS as `—` (best-effort per AD-103).

**Independent Test**: Run `bunx opencode` with Scry loaded; the TUI appears and updates as the model replies; close the session and `/scry-ls` shows the session in the global DB.

---

### P2: Slash-command and agent-invocable operations

**User Story**: As a user, I want both deterministic slash-commands `/scry-summary`, `/scry-ls`, `/scry-budget` and natural-language agent invocations ("show me my week's cost") to surface observability data — without having to write anything in my `opencode.json` beyond the plugin entry — so that adoption is frictionless.

**Why P2**: Whole point of an Arcanum-native plugin is zero-bootstrap cost. The `Hooks.config(input)` mutation of `input.command` (pattern already proven by Guild at `packages/guild/src/runtime/opencode/plugin-adapter.ts:109-110`) lets Scry self-register slash-commands on boot. `Hooks.tool` lets the agent call these on natural-language request.

**Acceptance Criteria**:

1. WHEN the user adds `"@runecraft/scry"` to `opencode.json#plugin` and starts OpenCode THEN the slash-commands `/scry-summary`, `/scry-ls`, `/scry-budget`, `/scry-budget-set` SHALL appear in the command palette without any manual config edit.
2. WHEN `command.execute.before` fires for any `/scry-*` command THEN Scry SHALL inject a template that either (a) instructs the agent to call the matching `Hooks.tool`, or (b) for tool-less agents, prints the rendered results directly.
3. WHEN a user-defined `opencode.json#command["scry-*"]` entry already exists THEN Scry SHALL NOT overwrite it (user override wins) — inverse of Guild's overwrite-in-favor-of-plugin convention. Documented in AD-108.
4. WHEN the user asks in natural language "show my week's cost across repos" THEN the agent SHALL be able to invoke the `scry_summary` `Hooks.tool` directly and present the result.

**Independent Test**: Fresh scratch repo with `"@runecraft/scry"` in plugin list; `/scry-summary --by repo --since 7d` shows up in the slash-command menu and returns a non-empty table after one chat turn.

---

### P3: OTel export and budget alerts

**User Story**: As a team lead, I want Scry to export spans/metrics via OTLP and to alert me when a daily/weekly budget is exceeded, so that runaway agents are caught before they cost real money.

**Why P3**: Teams with existing observability stacks need this; solo devs can ignore it.

**Acceptance Criteria**:

1. WHEN `SCRY_OTEL_ENDPOINT` is set THEN Scry SHALL emit a span per agent turn and a metric per token category, over OTLP/gRPC.
2. WHEN a configured budget (`scry.toml: [budget] weekly_usd = 5`) is exceeded THEN Scry SHALL write a non-blocking warning to the TUI and to `$SCRY_LOG`.
3. WHEN the OTel endpoint is unreachable THEN Scry SHALL log once and continue (no crash).

**Independent Test**: Point Scry at a local OTel collector (`otelcol`), run one chat turn, verify the collector receives a span with `agent` and `model` attributes.

---

## Edge Cases

- WHEN OpenCode emits a `message.updated` with no token info THEN Scry SHALL skip cost computation and counter-increment, never store NaN/undefined.
- WHEN the global DB is locked (another Scry process) THEN Scry SHALL retry with backoff up to 3× and otherwise drop the write with a warning (no crash).
- WHEN a user runs Scry on a repo where Guild is also installed THEN Scry SHALL NOT duplicate `SessionSummary` writes; it consumes OpenCode events directly. Guild's `.guild/analytics/` JSONL remains untouched (ingestion deferred to v0.2 per AD-107).
- WHEN `AssistantMessage.cost === 0` and `info.tokens` > 0 THEN Scry SHALL store `cost_usd = NULL` (unknown) and never fabricate a value (per AD-104).
- WHEN TTY is not interactive (CI / pipe / non-TTY shell) THEN the TUI SHALL auto-disable; capture + store still run; slash-commands and `Hooks.tool` still respond.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SCRY-01 | P1 | Design | Pending |
| SCRY-02 | P1 | Design | Pending |
| SCRY-03 | P1 | Design | Pending |
| SCRY-04 | P1 | Design | Pending |
| SCRY-05 | P1 | Design | Pending |
| SCRY-06 | P2 | Design | Pending |
| SCRY-07 | P2 | Design | Pending |
| SCRY-08 | P2 | Design | Pending |
| SCRY-09 | P2 | Design | Pending |
| SCRY-10 | P3 | - | Pending |
| SCRY-11 | P3 | - | Pending |
| SCRY-12 | P3 | - | Pending |
| SCRY-13 | Edge | - | Pending |
| SCRY-14 | Edge | - | Pending |
| SCRY-15 | Edge | - | Pending |
| SCRY-16 | Edge | - | Pending |

**ID format:** `SCRY-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified
**Coverage:** 16 total, 9 in Design, 7 unmapped ⚠️ (will map after Design).

---

## Success Criteria

- [ ] `bunx opencode` with only `@runecraft/scry` loaded shows a live TUI updating per turn.
- [ ] `/scry-summary --by model --since 7d` reports the correct aggregate vs a hand-computed JSONL snapshot.
- [ ] A natural-language request ("show my week's cost") triggers the `scry_summary` tool and returns the same table.
- [ ] A 1-turn session with an OTel collector running receives exactly one span.
- [ ] With a $0.50 weekly budget, a session that crosses it triggers exactly one alert (no spam).
- [ ] Tests pass: `bun test --filter @runecraft/scry`.
- [ ] No `bin` field in published `package.json`; no Summon dependency for install.

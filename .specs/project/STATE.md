# State

**Last Updated:** 2026-06-28
**Current Work:** scry-observability-package — Spec/Design/Tasks drafted, pending user confirmation to start Execute (T1). Runes-memory-package still in Specify phase.

---

## Recent Decisions (Last 60 days)

### AD-001: New package @runecraft/runes as OpenCode plugin (2026-06-28)

**Decision:** Create `packages/runes/` as a standalone OpenCode plugin, parallel to `guild` and `spawn`. No Summon integration. No MCP server — expose tools natively via OpenCode's `ToolsRecord` plugin return.
**Reason:** User explicitly chose this pattern. Guild and spawn both follow it; no need to invent a new distribution path. Native `ToolsRecord` is simpler than a separate MCP subprocess and targets OpenCode only (the planned audience).
**Trade-off:** Does not work for Claude Code / Cursor / Windsurf / Cline / Copilot / Roo-Code / Aider / Kiro out of the box. Acceptable — v0.3+ can add an MCP server alongside.
**Impact:** Defines the entire build target (node), the tool surface (10 `rune_*` tools), and the install story (`"plugin": ["@runecraft/runes"]` in `opencode.json`).

### AD-002: Build target `node`, not `bun` (2026-06-28)

**Decision:** Bundle with `bun build --target node --format esm` (same pattern as `guild`). Runtime requirement: Node 22+ (for stable `node:sqlite`).
**Reason:** User confirmed priority — users may not have Bun installed. Cross-runtime compatibility. Node 22+ is already a hard floor for modern Arcanum-adjacent tooling.
**Trade-off:** Lose access to `bun:sqlite` (slightly faster API). Gain portability and `node:sqlite` (zero native deps, no `node-gyp`).
**Impact:** SQLite via `node:sqlite` built-in. Document Node 22+ prereq in README and `runes doctor` warning when running on Node < 22.

### AD-003: SQLite via `node:sqlite` built-in, FTS5 virtual table (2026-06-28)

**Decision:** Use `node:sqlite` (no external SQLite lib) with `memories_fts` virtual table for full-text search. Triggers keep FTS5 in sync with `memories`.
**Reason:** Zero native deps (no `better-sqlite3` rebuild). `node:sqlite` is stable on Node 23 and experimental-but-functional on Node 22 (behind no flag in 22.5+). FTS5 is built into the SQLite that ships with Node.
**Trade-off:** `node:sqlite` is synchronous — fast enough for indexed reads (<5ms) but blocks the event loop. Acceptable for a CLI/plugin that processes one operation at a time. Worker-thread offload deferred to v0.3 if profiling shows contention.
**Impact:** No `dependencies` in `package.json` for the DB layer. Cross-platform SQLite via Node's bundled lib. Schema migration must be idempotent.

### AD-004: No MCP server in MVP, native OpenCode tools (2026-06-28)

**Decision:** Expose memory operations via `ToolsRecord` in the plugin return. Skip the MCP server implementation.
**Reason:** OpenCode is the target platform. Native tools are the lowest-friction integration and avoid the subprocess-IPC complexity. MCP can be added later as an adapter without changing the DB or storage layer.
**Trade-off:** Other agents (Claude Code, Cursor, etc.) cannot use runes yet. Acceptable for v0.
**Impact:** No `bin` entry serving stdio. CLI `runes` (subcommand-style) still ships for `doctor`/`search`/`stats` outside the agent.

### AD-005: Storage scoped per repo, slugs from `git remote` or path (2026-06-28)

**Decision:** Each repo maps to one `projects` row, identified by a `slug` derived from `git config --get remote.origin.url` (canonicalized) or — fallback — the absolute path. Memory writes/reads always pass through the current project's slug.
**Reason:** All serious memory-for-agents projects we scanned (engram, magic-context, napkin, iwe, napkin) scope per project. Cross-repo memories cause silent leakage.
**Trade-off:** When the user works on the same repo under different worktrees with different remotes, the slug must be canonical. We normalize `git@github.com:foo/bar.git` and `https://github.com/foo/bar` to the same slug.
**Impact:** `lib/project.ts` owns slug derivation. Tests must cover: same remote, no remote, monorepo subfolder, two repos with same dirname but different remotes.

### AD-006: `rune_context()` injection on demand, not every turn (2026-06-28)

**Decision:** Inject relevant memories only when the skill `using-runes` is loaded AND the user has asked a question that would benefit from prior context. Do NOT auto-inject on every turn.
**Reason:** User explicitly chose "injetar quando necessário". Avoids prompt bloat and stale-context noise.
**Trade-off:** Agent may miss relevant memories when not loaded. Mitigation: the `using-runes` skill is always-active (per napkin pattern) and explicitly tells the agent to call `rune_context()` whenever the user references past work.
**Impact:** No `chat.params` hook injection. The skill carries the prompting responsibility. The plugin exposes `rune_context` as a tool the agent calls.

### AD-007: `~/.runes/runes.db` storage, `RUNES_DATA_DIR` override (2026-06-28)

**Decision:** Default data dir `~/.runes/runes.db` (cross-platform — same pattern as `~/.engram/`). Honor `RUNES_DATA_DIR` env var. Config file at `~/.config/opencode/runes.jsonc` and `.opencode/runes.jsonc` (same as `guild`).
**Reason:** `~/.local/share/...` is Linux-only XDG. `~/.runes/` is simple and works on macOS, Linux, Windows.
**Trade-off:** None meaningful.
**Impact:** `lib/paths.ts` resolves the data dir, used by `db/client.ts` and `bin/runes.ts`.

### AD-008: `bun test` is the test runner (2026-06-28)

**Decision:** Tests use `bun test`, matching `guild` and `spawn`.
**Reason:** User confirmed. Consistent with rest of monorepo.
**Trade-off:** None.
**Impact:** All `*.test.ts` files under `packages/runes/tests/` run via `bun test`. No Jest, no Vitest.

### AD-009: No FTS conflict detection in MVP, no `superseded_by` column (2026-06-28)

**Decision:** MVP stores memories flat. No conflict detection, no LLM-judge, no supersession. Defer to v0.3.
**Reason:** Conflict detection is an LLM-call loop with cost & latency. Out of scope per "core only" decision.
**Trade-off:** Two memories that contradict each other will both surface. Acceptable for v0; user can curate via the `using-runes` skill (cap top-10 per category).
**Impact:** Simpler schema, simpler tools, no LLM dependency in the runtime. Defer `rune_judge` to v0.3.

### AD-100: New package `@runecraft/scry` as OpenCode plugin (2026-06-28)

**Decision:** Create `packages/scry/` as a standalone OpenCode plugin, parallel to `guild`, `runes`, `spawn`. Distribution is **plugin-only** — no `bin/scry.js`, no `bunx scry` UX. Loads via `"@runecraft/scry"` in `opencode.json#plugin`.
**Reason:** User explicitly chose "a ideia é que fosse um plugin opencode" over a CLI. Self-registration via `Hooks.config` mutation makes a CLI redundant — slash-commands and `Hooks.tool` cover all in-session use cases.
**Trade-off:** No CI/automation entry point; users wanting CI hooks must use Guild's existing `/metrics` slash-command. Acceptable — adoption is OpenCode-first by design.
**Impact:** `package.json` ships **no `bin` field**. The plugin's UX surface is the live TUI + `Hooks.tool` (`scry_summary`, `scry_ls`, `scry_budget`, `scry_budget_set`) + self-registered slash-commands (`/scry-summary`, `/scry-ls`, `/scry-budget`, `/scry-budget-set`).

### AD-101: Self-registering slash-commands via `Hooks.config` (2026-06-28)

**Decision:** Scry's `config(input)` hook mutates `input.command` to add `scry-summary`, `scry-ls`, `scry-budget`, `scry-budget-set` with templates that point the agent to the matching `Hooks.tool`. Pattern verified at `packages/guild/src/runtime/opencode/plugin-adapter.ts:109-110`.
**Reason:** User wants the plugin to work immediately upon being added to `opencode.json#plugin` — no Summon extension, no manual `opencode.json#command` block, no external installer. The `config` hook is the only plugin-side mechanism that mutates the live Config object.
**Trade-off:** Adds a small `config` handler (~15 lines mirroring Guild's pattern). Inverse priority convention (see AD-108).
**Impact:** User installs Scry by adding one line to their `opencode.json#plugin`. Slash-commands appear in the command palette on next OpenCode start. No other file edits required.

### AD-102: Trust `AssistantMessage.cost` from runtime, never fabricate (2026-06-28)

**Decision:** v1 reads `info.cost` directly from `message.updated` events. When `info.cost === 0` and `info.tokens > 0`, Scry stores `cost_usd = NULL` (unknown) and displays "unknown" in the TUI. No `models.dev` fetch, no inference.
**Reason:** User confirmed "Manter T5 como fallback (recomendado)". Honesty > apparent completeness. Pricing calculations can be wrong (per-token rate drift, model variants, provider rounding); the runtime is the only place where the canonical `cost` lives for a given turn.
**Trade-off:** If a provider returns 0 even when tokens > 0, the user sees "cost: unknown" indefinitely for that turn. Acceptable — better than fabricating a wrong number.
**Impact:** No `Pricing Resolver` component. No `models.dev` dependency. The `cost_usd` column in SQLite is nullable. The TUI renders "unknown" instead of "0.00".

### AD-103: TTFT always, TPS best-effort via `TextPart.time.end` (2026-06-28)

**Decision:** TTFT is captured from `message.part.updated` envelope `time` minus `AssistantMessage.time.created` (always available). TPS is computed as `output_tokens / (TextPart.time.end - TextPart.time.start)` when `TextPart.time.end !== undefined`; otherwise `null` and the TUI displays `—`. No plugin-side cronometer.
**Reason:** User confirmed "Exibir TTFT, deixar TPS como '—' quando time.end ausente (recomendado)". The OpenCode SDK type marks `TextPart.time.end` as optional (lines 544-547 of `types.gen.d.ts`), and we don't have empirical evidence that every provider populates it.
**Trade-off:** TPS is unavailable for some providers. Acceptable — TTFT is the more useful metric for budget-control purposes anyway.
**Impact:** The `TurnRecord.tps` field is `number | null`. The TUI formatter has a `tps: "—"` branch.

### AD-104: Storage at `~/.runecraft/scry/scry.db` (global, per-user) (2026-06-28)

**Decision:** Cross-repo rollup is a P2 success criterion. The SQLite store is per-user (not per-repo), defaults to `~/.runecraft/scry/scry.db`, overridable via `SCRY_DATA_DIR` env var. Schema: `repos`, `models`, `sessions`, `turns`, `tool_calls`.
**Reason:** Per-repo storage would defeat the cross-repo aggregation goal. Per-user storage is the only way `scry_summary --by repo --since 7d` can answer "what did I spend across all my Arcanum projects last week".
**Trade-off:** Slight ergonomic gap — `--repo <path>` filtering is needed to focus on a single repo.
**Impact:** Path resolution helper at `src/db/paths.ts` mirrors `packages/runes/src/lib/paths.ts`. DB is `node:sqlite` (Node 22+).

### AD-105: `Bun.TOML.parse` for config, zero external parser deps (2026-06-28)

**Decision:** Config file (`scry.toml`) is parsed via `Bun.TOML.parse`. No `@iarna/toml`, no `smol-toml`. When `Bun` is undefined, loader throws `"Scry requires Bun 1.3+ (Bun.TOML)"`.
**Reason:** Probe verified `Bun.TOML.parse` works end-to-end on the existing Bun 1.3.5 runtime. Zero deps = leaner install, no version drift, no transitive risk.
**Trade-off:** Scry does not run under bare `node` for the config-loading path. Acceptable — Arcanum is already Bun-first (Summon, Spells, Guild, Runes, Spawn all assume Bun at dev/test time).
**Impact:** `engines: { node: ">=22", bun: ">=1.3" }` in `package.json`. Config loader has a runtime guard.

### AD-106: No `bin/scry.js`, plugin-only distribution (2026-06-28)

**Decision:** Published `package.json` has **no `bin` field**. Users interact with Scry exclusively through the OpenCode plugin surface (TUI + `Hooks.tool` + slash-commands).
**Reason:** User confirmed "Não publicar bin — só plugin". Eliminates two surfaces to maintain. Cross-repo rollups (P2) are still served by the agent-callable `scry_summary` tool; CI/automation users can adopt Guild's `/metrics` instead.
**Trade-off:** A future user wanting `bunx @runecraft/scry summary` from a CI job will need to be redirected to Guild's `metrics` slash-command. Acceptable — we can revisit if real demand emerges.
**Impact:** `package.json` ships no `bin` entry. The CLI tasks (T10, T11 from the original draft) are removed. The `@runecraft/scry` package is consumed exclusively via OpenCode plugin loading.

### AD-107: `scry_guild_sync` deferred to v0.2.0 (2026-06-28)

**Decision:** v0.1.0 does **not** read `.guild/analytics/*.jsonl`. Cross-plugin ingestion of Guild JSONL into the global DB is deferred to v0.2.0, exposed as a `Hooks.tool` (`scry_guild_sync`) callable by the agent.
**Reason:** User confirmed "Defer para v0.2.0 (recomendado)". The v0.1 surface (capture + TUI + self-registration + tools + OTel + budget) is already substantial; cross-plugin sync is best added once the core is stable.
**Trade-off:** Guild users running v0.1 will see two parallel data stores (Guild's JSONL and Scry's SQLite). The data models don't conflict — they answer different questions (Guild = plan-level adherence, Scry = turn-level cost/latency).
**Impact:** v0.1 explicitly does **not** depend on Guild at runtime. The `scry_guild_sync` tool is added in a follow-up release.

### AD-108: User override wins on `config.command` (inverse of Guild) (2026-06-28)

**Decision:** When Scry's `config(input)` hook runs, it adds `scry-*` slash-commands to `input.command` only for keys not already present. If the user has already declared a `scry-*` command in their `opencode.json`, that user version is preserved.
**Reason:** User-facing declaration in `opencode.json` is the final authority. Inverse of Guild's "plugin wins" convention at `packages/guild/src/runtime/opencode/plugin-adapter.ts:110` (`{ ...existingCommands, ...result.commands }`).
**Trade-off:** A user-declared `scry-summary` with stale template content will not be updated by a Scry upgrade. Acceptable — the user can opt into a refresh by deleting the entry.
**Impact:** The `config` hook in Scry's `src/index.ts` does `{ ...scryCommands, ...existingCommands }` (note the order — user entries overwrite scry entries).

---

## Active Blockers

None.

---

## Lessons Learned

- **OpenCode plugin `config(input)` hook is the self-registration mechanism for slash-commands.** Inverse priority (user override wins) is the Arcanum convention for plugins that respect user authority.
- **Awesome-opencode observability cluster (~10 plugins) converges on the same data model** — per-turn tokens, cost, latency. Scry's job is the Arcanum-idiomatic unified surface, not a new model.
- **Bun runtime guarantees** (`Bun.TOML.parse`) eliminate parser deps for v0.
- **The OpenCode SDK event payloads are fully typed** at `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts`. Reading the `.d.ts` before designing plugins is mandatory.

---

## Quick Tasks Completed

| #   | Description                          | Date       | Commit | Status  |
| --- | ------------------------------------ | ---------- | ------ | ------- |
| 001 | Survey of agent memory repos (scoped) | 2026-06-28 | —      | ✅ Done |
| 002 | Awesome-opencode gap analysis + Scry spec/design/tasks | 2026-06-28 | —      | ✅ Done |

---

## Deferred Ideas

- [ ] MCP server alongside native tools (Claude/Cursor/Copilot support) — Capture during: runes-memory-package
- [ ] `rune_judge` LLM-judged conflict detection via FTS5 candidates — Capture during: runes-memory-package
- [ ] Embedding-based semantic search (provider-pluggable, local-first via ONNX) — Capture during: runes-memory-package
- [ ] Git sync of `.runes/` chunks (engram-style, no merge conflicts) — Capture during: runes-memory-package
- [ ] Doctor-flag concurrent memory plugins (engram, magic-context) — Capture during: runes-memory-package
- [ ] TUI for memory browsing — Capture during: runes-memory-package
- [ ] `scry_guild_sync` `Hooks.tool` for read-only Guild JSONL ingestion — Capture during: scry-observability-package (v0.2)
- [ ] Pricing Resolver via `models.dev` if providers are found that don't populate `AssistantMessage.cost` — Capture during: scry-observability-package (v0.3+, belongs in Runes)
- [ ] `bin/scry.js` standalone CLI for CI/automation (revisit only if real demand) — Capture during: scry-observability-package
- [ ] Tmux-backed TUI sidebar in coordination with `packages/spawn` — Capture during: scry-observability-package
- [ ] TUI visualizer (awesome-opencode `OpenCode Visualizer` style) — Capture during: scry-observability-package

---

## Todos

- [x] Initialize `.specs/project/ROADMAP.md` (filled with awesome-opencode opportunity analysis on 2026-06-28; see `.specs/project/ROADMAP.md`)
- [ ] Initialize `.specs/project/PROJECT.md` (separate task — vision/goals/scope)
- [ ] Initialize `.specs/codebase/*` brownfield docs (separate task)
- [ ] **Scry: 12 tasks pending — request user approval to start Execute (T1)** — see `.specs/features/scry-observability-package/`

---

## Preferences

**Model Guidance Shown:** 2026-06-28
**Caveman mode accepted for spec/design prose:** 2026-06-28
**User response style during planning:** prefers detailed options with "Recommended" markers

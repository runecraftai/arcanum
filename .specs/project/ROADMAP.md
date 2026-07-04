# Arcanum Roadmap — Opportunities from awesome-opencode

**Created:** 2026-06-28
**Source:** `https://github.com/awesome-opencode/awesome-opencode` (full inventory extracted 2026-06-28)
**Status:** Canonical roadmap (moved from `features/awesome-opencode-roadmap.md` working copy on 2026-06-28)
**Owner:** Arcanum maintainers

---

## 1. Strategic Context

The awesome-opencode list (8.4k stars, 598 forks) clusters ~80+ plugins, 11 agent kits, 8 themes, and ~40 projects. The Arcanum ecosystem (Guild, Runes, Spells, Summon, Spawn, Grimoire) already covers multi-agent orchestration (Guild), memory (Runes), skill distribution (Spells + Summon), tmux-based visualization (Spawn), and shared config (Grimoire).

This roadmap captures the **5 highest-value opportunities** the awesome-opencode list reveals — capabilities Arcanum does not yet provide and where its distinctive architecture (Bun monorepo, `@runecraft` scope, RPG-themed identity, changeset-from-commits release pipeline) gives it a competitive advantage.

**Out of scope for this roadmap:**
- Themed clones (Ayu, Charcoal, Poimandres, etc.) — visual differentiation is not Arcanum's value.
- MCP wrapper for skills (Xquik, etc.) — not aligned with `Hooks.tool` preference.
- Image / video / voice / web-generation skills — domain-specific, not core.
- Cross-CLI bridges (Telegram/Discord/Slack bots) — adoption channel, not capability.

---

## 2. The 5 Opportunities

### 2.1 Scry — Observability (`@runecraft/scry`)

**Source cluster:** Tokenscope, Token Monitor, Opencode Throughput, Opencode Telemetry, opencode-plugin-otel, Opencode Quota, Opencode Usage Monitor, opencode-mystatus, Token Tracker, Opencode Log Sanitizer.

**What it is:** A real-time + cross-repo observability plugin that captures per-turn tokens, cost, and latency into a global SQLite store, exposes a live TUI sidebar, and emits OTel for teams that already run Datadog/Honeycomb/Grafana. Self-registers `/scry-summary`, `/scry-ls`, `/scry-budget`, `/scry-budget-set` slash-commands via `Hooks.config` — no Summon, no manual config.

**Why now:** The Arcanum 8-agent × 5-model matrix in `guild-opencode.jsonc` already optimises for the $1.95/week target, but operators have no live visibility into whether the matrix is working. Without observability, the entire cost discipline is invisible.

**Differentiation vs. awesome-opencode competitors:**
- Cross-repo rollup (no competitor does this — they all store per-repo).
- Self-registration via `Hooks.config` (no other plugin ships slash-commands without installer).
- Compatible with **and independent of** Guild (no competitor integrates with a multi-agent orchestrator).
- Local-first via `node:sqlite` (no external service required).
- 100% Arcanum-idiomatic (Bun-first, `Bun.TOML.parse`, follows Runes/Guild template patterns).

**Effort:** 12 tasks, 4 phases, ~M size.
**Status:** ✅ Spec + Design + Tasks drafted in `.specs/features/scry-observability-package/` (12 tasks, 16 requirements). Pending Execute.
**Dependencies:** None (Scry is independent of Guild, Runes, Spawn, etc.).
**Target release:** `@runecraft/scry@0.1.0` — first batch after runes ships.
**Risk:** `command.execute.before` template-injection requires tool-calling agent (mitigated by tool-less template variant). Empirical proof of `AssistantMessage.cost` coverage varies by provider (mitigated by NULL-on-zero + AD-104 honesty rule).

---

### 2.2 Phylactery — Background Agent Runtime

**Source cluster:** Mission Control (DAG + merge train + test gating in tmux worktrees), Pocket Universe (resilient async subagents), OpenCode Ensemble (peer messaging + shared task board), Background Agents (kdcokenny), opencode-arise (Solo Leveling themed parallel tasks), Pilot (GitHub/Linear polling daemon), Subagent Reporter.

**What it is:** A runtime for async/background subagents with worktree isolation, state resumption, and a peer-to-peer coordination model. Spawn already does tmux panes for visualisation; Phylactery adds the **persistent daemon + DAG planning + state survival across restarts** layer underneath.

**Why now:** Guild currently runs subagents synchronously through the orchestrator. Long-running tasks (large refactors, multi-PR migration) need a daemon that can survive session restarts, fan out across isolated worktrees, and merge back with test gating. This is the natural next step after Spawn visualises them — the runtime that drives them.

**Differentiation vs. awesome-opencode competitors:**
- Native integration with Guild's `event-router.ts` and `effect-router.ts` (Mission Control has no awareness of Arcanum at all).
- Worktree isolation + DAG planning in one package (Mission Control has both but is a single ~2k-line plugin; Phylactery can split concerns).
- RPG-themed daemon: Phylactery is "the soul-case" of subagents — when the body (agent session) dies, the soul persists.
- Self-registers commands via `Hooks.config` (same Scry pattern).

**Effort:** 18-22 tasks across 4 phases. **L size** (multi-component daemon, worktree manager, DAG planner, test gate, peer-messaging protocol).
**Status:** 📋 Opportunity (no spec yet). Listed in AD-100 deferred ideas.
**Dependencies:** Spawn (for tmux pane rendering) — strong; Guild (for hook surface) — weak; Scry (for background observability) — orthogonal.
**Target release:** `@runecraft/phylactery@0.1.0` — second batch after Scry.
**Risk:** Test gating on worktrees requires either docker-side or repo-side test isolation. Worktree DAG scheduling has no well-known precedent in OpenCode.

---

### 2.3 Ward — Safety & Guards

**Source cluster:** CC Safety Net (destructive command interception), Envsitter Guard (`.env*` protection), Cupcake (OPA/Rego policy layer for AI agents), OpenCode Workaholic (anti-early-exit), OpenCode Log Sanitizer (JWT/bcrypt redaction), opencode-ascii / UNMOJI (strip unicode), Ralph Wiggum (self-correcting loops).

**What it is:** A safety layer for Arcanum plugins that intercepts destructive commands, protects secrets, sanitises logs, and enforces "done" definitions. Implemented as a `Hooks.tool` provider with declarative policy (TOML) and a `/ward-check` slash-command for user audit.

**Why now:** Arcanum currently relies on OpenCode's permission system for safety. A dedicated safety plugin is the missing trust layer. The RPG metaphor fits naturally: Ward is the protective sigil in front of every spell the agents cast.

**Differentiation vs. awesome-opencode competitors:**
- **Unified policy in `ward.toml`** (Cupcake's Rego is overkill; CC Safety Net has no declarative layer).
- **Log sanitizer** built-in (no competitor combines guard + sanitiser).
- **`/ward-check` slash-command** for dry-run policy review before the user runs an agent session.
- Self-registers via `Hooks.config` (same Scry/Phylactery pattern).
- Integration with Guild's `policy` directory (Ward is the file-system guard, Guild is the agent-level policy).

**Effort:** 8-10 tasks, ~S/M size.
**Status:** 📋 Opportunity (no spec yet).
**Dependencies:** None. Ward is independent of Guild/Scry/Phylactery.
**Target release:** `@runecraft/ward@0.1.0` — first batch (parallel with Scry).
**Risk:** OPA/Rego expertise is rare; the simpler TOML policy will need a thoughtful threat model. Cupcake already does this well in standalone form — we should not duplicate OPA itself but provide a curated TOML schema that compiles to Rego if needed.

---

### 2.4 Leylines — Auth & Provider Layer

**Source cluster:** Antigravity Auth (free Gemini/Anthropic via Google Antigravity IDE), Antigravity Multi-Auth (rotation across Google accounts), Gemini Auth, Kilo Gateway, Omniroute Auth, OpenAI Codex Auth, OpenHax Codex, OpenCode Models Discovery, Opencode LiteLLM (autodiscovery), Provider Alias, Claude Code Switch (CCS) Sync, Optimal Model Temps.

**What it is:** A provider-agnostic auth/config layer for Arcanum that abstracts authentication across Antigravity, Gemini, Codex, Kilo, LiteLLM, and OpenAI-compatible gateways. Exposes them as named providers in `opencode.json` (or auto-discovers LiteLLM on `localhost:4000/8000/8080`) and pipes them through Guild's agent matrix.

**Why now:** Today, `guild-opencode.jsonc` hard-codes 5 model strings. Users who want to swap in Antigravity's free Gemini quota or a local LiteLLM proxy have to edit the matrix by hand. Leylines gives them a "switch" surface.

**Differentiation vs. awesome-opencode competitors:**
- **Single config surface** for all auth providers (each awesome-opencode plugin is single-vendor).
- **Auto-discovery** of local LiteLLM proxies (only `opencode-liteLLM` has this, and only on a few ports).
- **Guild integration** — Leylines exports a `resolveModel(agentRole)` function that the Guild agent matrix can call before each `chat.params` event.
- **Token rotation** across multiple Google accounts (Antigravity Multi-Auth does this but only for Antigravity).
- Self-registers `/leylines-add <provider>` and `/leylines-rotate` slash-commands.

**Effort:** 10-12 tasks, ~M size (auth flows are fiddly but well-bounded).
**Status:** 📋 Opportunity (no spec yet).
**Dependencies:** None for the auth abstraction; depends on Guild for the model matrix integration.
**Target release:** `@runecraft/leylines@0.1.0` — first or second batch.
**Risk:** Each provider's auth flow is unique. Antropic-OAuth-for-Antigravity may break without notice; mitigation = per-provider version pin + clearly marked "experimental" status.

---

### 2.5 Runes Memory v2 — Semantic + AST + Activation

**Source cluster:** Harness Memory (4-layer activation, claims -73% tokens vs CLAUDE.md), Magic Context (background historian + overnight dreamer), Lemma (biological decay/boost + fuzzy dedup), OpenCodeRAG (tree-sitter AST chunking + LanceDB), Hipocampo (BIRE hybrid search), oc-mnemoria (BM25 + semantic), OpenCode Claude Memory (cross-tool memory paths).

**What it is:** Runes v0.1 (FTS5-only lexical) evolves into v0.2 with semantic search, AST-aware chunking, and 4-layer activation. Brings Harness Memory's claim of "73% fewer tokens than CLAUDE.md" to Arcanum.

**Why now:** Runes v0.1 shipped (per `STATE.md`). Users who tested it report that FTS5 alone is too brittle for "find me that conversation about X". v0.2 closes the loop.

**Differentiation vs. awesome-opencode competitors:**
- **Layered activation** as a first-class concept (Harness Memory proves it works; Arcanum-native naming fits).
- **Tree-sitter chunking** in a Bun-native plugin (no Python subprocess).
- **Decay/boost** is optional and configurable per repo (Lemma is opinionated; Arcanum respects user authority per AD-108).
- **Cross-tool memory paths** (OpenCode Claude Memory pattern): a single `.runes/` directory readable by both OpenCode and Claude Code installations.

**Effort:** 14-18 tasks, ~M/L size (semantic search requires either ONNX runtime or a small embedding model — both are sizeable additions).
**Status:** 📋 v0.1 shipped; v0.2 deferred (per `STATE.md` Deferred Ideas: embedding-based semantic search, `rune_judge` conflict detection).
**Dependencies:** Runes v0.1 (already shipped).
**Target release:** `@runecraft/runes@0.3.0` — after v0.2 stabilises.
**Risk:** Adding ONNX (~50MB) or external embedding APIs to a "local-first" plugin violates the philosophy. Mitigation: keep ONNX as `optionalDependency`; fall back to FTS5-only when absent.

---

## 3. Release Sequencing

| Batch | Version | Package | Status |
| --- | --- | --- | --- |
| **Active** | `@runecraft/runes@0.1.0` | Runes (memory) | Shipped |
| | `@runecraft/guild@0.21.0` | Guild (multi-agent) | Shipped |
| | `@runecraft/spawn@0.3.0` | Spawn (tmux) | Shipped |
| | `@runecraft/summon@0.14.1` | Summon (skill installer) | Shipped |
| | `@runecraft/spells@0.14.0` | Spells (skill catalog) | Shipped |
| | `@runecraft/grimoire@0.0.2` | Grimoire (shared configs) | Shipped |
| **Batch 1** | `@runecraft/scry@0.1.0` | Scry (observability) | Spec/Design/Tasks drafted, awaiting Execute |
| | `@runecraft/ward@0.1.0` | Ward (safety) | Not yet specced |
| | `@runecraft/leylines@0.1.0` | Leylines (auth) | Not yet specced |
| **Batch 2** | `@runecraft/phylactery@0.1.0` | Phylactery (background agents) | Not yet specced |
| | `@runecraft/scry@0.2.0` | Scry + `scry_guild_sync` (per AD-107) | Planned |
| **Batch 3** | `@runecraft/runes@0.3.0` | Runes (semantic + AST + activation) | Deferred per STATE.md |

---

## 4. Cross-Cutting Architectural Patterns (reusable across roadmap)

These patterns are introduced by Scry and should be applied to every new Arcanum plugin:

1. **Plugin-only distribution, no `bin`** (AD-100, AD-106). Each plugin is a `@runecraft/*` package loaded via `opencode.json#plugin`.
2. **Self-registration via `Hooks.config`** (AD-101). Each plugin mutates `input.command` to register its own `/plugin-*` slash-commands on boot. User override wins (AD-108).
3. **Bun runtime guarantees** (AD-105). `Bun.TOML.parse` for config; `node:sqlite` for storage; no `@iarna/toml` or `better-sqlite3`.
4. **Never fabricate data** (AD-102). When a value is unknown, store `NULL` and display "unknown" — never make up a number.
5. **RPG-metaphor naming.** `Scry` (observability), `Ward` (protection), `Leylines` (magical pathways), `Phylactery` (soul persistence). Reinforces the Arcanum identity without diluting it.
6. **Independent of Guild.** Every new plugin must work standalone — Guild is a power-user multiplier, not a prerequisite.
7. **Determinism over cleverness.** Pure-function components (Budget Watcher, policy evaluators) live in their own files, are 100% branch-covered, and have no I/O. The integration layer is thin.
8. **Single source of truth per data category.** Per-session JSONL belongs to Guild. Per-turn cost/latency belongs to Scry. Per-memory CRUD belongs to Runes. No overlap.

---

## 5. Capability Matrix — Arcanum vs. awesome-opencode

This matrix tracks which external capabilities Arcanum covers (✅), plans to cover (📋), or has chosen not to cover (❌).

| Capability | Status | Arcanum artifact | awesome-opencode reference |
| --- | --- | --- | --- |
| **Memory (lexical FTS5)** | ✅ | Runes v0.1 | Agent Memory, Harness Memory |
| **Memory (semantic + AST)** | 📋 v0.3 | Runes v0.3 (planned) | OpenCodeRAG, Lemma, Hipocampo |
| **Memory (cross-tool paths)** | 📋 v0.2 | Runes v0.2 (planned) | OpenCode Claude Memory |
| **Memory (background maintenance)** | 📋 v0.3 | Runes v0.3 (planned) | Magic Context ("overnight dreamer") |
| **Multi-agent orchestration** | ✅ | Guild v0.21 | FlowDeck, CrewBee, hiai-opencode |
| **Spec-driven workflow** | ✅ | Spells `spec-driven` skill | GoopSpec, OpenSpec, BMAD |
| **Skill catalog (cross-agent install)** | ✅ | Spells + Summon | Skill-forge, Agent Skills (JDT) |
| **Live TUI** | 📋 v0.1 | Scry (planned) | Opencode Throughput, Tokenscope |
| **Cross-repo rollup** | 📋 v0.1 | Scry (planned) | OpenTab (read-only), tokscale |
| **OTel export** | 📋 v0.1 | Scry (planned) | opencode-plugin-otel |
| **Budget alerts** | 📋 v0.1 | Scry (planned) | Opencode Quota, mystatus |
| **Log sanitization** | 📋 v0.1 | Ward (planned) | Opencode Log Sanitizer |
| **Destructive command interception** | 📋 v0.1 | Ward (planned) | CC Safety Net |
| **`.env*` protection** | 📋 v0.1 | Ward (planned) | Envsitter Guard |
| **Policy-as-code (TOML)** | 📋 v0.1 | Ward (planned) | Cupcake (OPA/Rego) |
| **Anti-early-exit ("done" enforcement)** | 📋 v0.1 | Ward (planned) | Workaholic |
| **Provider auth (Antigravity/Gemini/Codex)** | 📋 v0.1 | Leylines (planned) | Antigravity Auth, Gemini Auth, Codex Auth |
| **LiteLLM autodiscovery** | 📋 v0.1 | Leylines (planned) | Opencode LiteLLM |
| **Background subagent daemon** | 📋 v0.2 | Phylactery (planned) | Mission Control, Background Agents |
| **Worktree-isolated DAG planning** | 📋 v0.2 | Phylactery (planned) | Mission Control, OpenCode Ensemble |
| **Merge train with test gating** | 📋 v0.2 | Phylactery (planned) | Mission Control |
| **Tmux pane visualisation** | ✅ | Spawn v0.3 | Opencode Sidebar |
| **2D agent visualizer (pixel art)** | ❌ | — | Opencode Visualizer (novelty, low value) |
| **Themes** | ❌ | — | Ayu/Charcoal/Poimandres (visual diff, not Arcanum's value) |
| **Mobile/chat bridges (Telegram/Discord)** | ❌ | — | Not aligned with Arcanum's CLI-first identity |
| **Cloud-hosted dashboard** | ❌ | — | Local-first philosophy (see OpenWork) |

---

## 6. Risks and Anti-Goals

### 6.1 What we will NOT do

- **No "kitchen-sink" plugin** (the hiai-opencode or FlowDeck antipattern). Arcanum's identity is **separated by artefact**: each `@runecraft/*` package has one clear job. We do not combine Scry + Ward + Leylines into one bundle.
- **No copycat visual styling** (themes, animated ASCII, etc.). The RPG metaphor in names is enough differentiation.
- **No cloud dependency**. Every plugin is local-first; OTel is opt-in; auth tokens never leave the host unencrypted.
- **No "best of both worlds" CLI + plugin hybrid** for any new package. Scry's "plugin-only" rule (AD-100, AD-106) is the new bar. Ward and Leylines will follow it.
- **No "skills-as-plugins"**. Skills (markdown) and plugins (compiled TS) are different layers; don't conflate.

### 6.2 Risks for the roadmap

1. **Resource contention.** Batch 1 ships three plugins (Scry, Ward, Leylines) in parallel. Arcanum has one maintainer. Mitigation: stagger releases — Scry first (most spec'd), then Ward, then Leylines.
2. **ONNX in Runes v0.3.** Adding ~50MB of ML runtime to a "local-first" plugin changes the install story. Mitigation: keep ONNX as `optionalDependency`; v0.3 ships without it, v0.4 enables it via `npm i @runecraft/runes --include=optional`.
3. **Phylactery's worktree DAG scheduling** has no proven prior art in the OpenCode ecosystem. Mitigation: start with a simple "fan-out, wait-for-all, merge-into-branch" model; iterate.
4. **Provider churn** (Antigravity, Codex) — auth flows break without notice. Mitigation: pin provider versions; mark each as `experimental` until stable for 90 days.

---

## 7. Success Metrics (per release batch)

| Batch | Metric | Target |
| --- | --- | --- |
| Batch 1 — Scry | Live TUI updates within 100ms of `message.updated` event | <100ms p95 |
| Batch 1 — Scry | `/scry-summary --by model --since 7d` returns correct aggregate vs hand-computed JSONL | 100% match in 10/10 tests |
| Batch 1 — Scry | Slash-commands visible in command palette after adding `"@runecraft/scry"` to plugin list (no other config) | 4/4 commands visible |
| Batch 1 — Ward | Destructive-command interception rate (sample of 50 dangerous commands across 5 repos) | 100% intercepted |
| Batch 1 — Leylines | Time to add a new provider's auth flow | < 30 minutes for a typical OAuth provider |
| Batch 2 — Phylactery | Background agent survival across session restart (sample 20 restarts) | 100% state preserved |
| Batch 2 — Phylactery | Merge train with test gating — false positive rate | < 5% |
| Batch 3 — Runes v0.3 | Token reduction vs CLAUDE.md for 10 real sessions | ≥ 50% reduction |

---

## 8. Document Maintenance

This roadmap is a canonical document. Update on:
- Each release of an Arcanum package.
- Each major addition to the awesome-opencode list.
- Each user request that changes priority.

This file lives at `.specs/project/ROADMAP.md` (its canonical home, established 2026-06-28 — moved from the working copy at `features/awesome-opencode-roadmap.md`).

---

## 9. See Also

- `.specs/features/scry-observability-package/` — Scry's full spec/design/tasks.
- `.specs/project/STATE.md` — Decisions AD-100 through AD-108 for Scry; AD-001 through AD-009 for Runes.
- `packages/guild/src/features/analytics/` — existing session-level tracking that Scry complements (not replaces).
- `packages/runes/src/db/sqlite.ts` — direct template for Scry's global store.
- `packages/guild/src/runtime/opencode/plugin-adapter.ts:78-110` — direct template for `Hooks.config` self-registration pattern.
- `packages/guild/src/features/builtin-commands/commands.ts:9-118` — direct template for slash-command definitions.

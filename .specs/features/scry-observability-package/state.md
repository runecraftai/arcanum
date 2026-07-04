# Scry Observability Package — State

**Spec:** `.specs/features/scry-observability-package/spec.md`
**Design:** `.specs/features/scry-observability-package/design.md`
**Tasks:** `.specs/features/scry-observability-package/tasks.md`
**Status:** Specify + Design + Tasks — Draft, pending user confirmation
**Started:** 2026-06-28
**Last Updated:** 2026-06-28

---

## Current Phase

Specify → Design → Tasks drafted. Plan mode. Awaiting user approval to enter Execute (T1).

---

## Phase Progress

- [x] **Specify** — Drafted (16 requirements mapped).
- [x] **Design** — Drafted (11 components, schema, error matrix, tech decisions).
- [x] **Tasks** — Drafted (12 tasks in 4 phases, with Done-when checklists and verify commands).
- [ ] **Execute** — Pending user approval.

---

## Resolved Uncertainties

| # | Uncertainty | Resolution | Evidence |
| --- | --- | --- | --- |
| 1 | OpenCode event payload shape | Use `Hooks.event` for all events; `Hooks.config` for self-registration; shapes verified at `node_modules/.bun/@opencode-ai+sdk@1.14.29/.../v2/gen/types.gen.d.ts` (lines 487-520, 763-770, 1235-1241). |
| 2 | TTFT/TPS availability | TTFT always via envelope `time` on `message.part.updated`; TPS via optional `TextPart.time.end` (display `—` when absent). |
| 3 | TOML parser | `Bun.TOML.parse` end-to-end verified. No `@iarna/toml`. |
| 4 | Slash-command registration | `Hooks.config` mutates `input.command` — proven by Guild at `packages/guild/src/runtime/opencode/plugin-adapter.ts:109-110`. |
| 5 | Pricing source | Trust `AssistantMessage.cost`; never fabricate. No `models.dev` fetch in Scry. |
| 6 | Distribution | Plugin-only. No `bin` field in published `package.json`. |
| 7 | Cross-plugin Guild ingestion | Deferred to v0.2 (`scry_guild_sync` `Hooks.tool`). |
| 8 | User override vs plugin override on `config.command` | User wins (inverse of Guild). Documented in AD-108. |

---

## Open Risks (accepted, not zeroed)

1. **`command.execute.before` template-injection requires the agent to have tool calling enabled.** Mitigation: T9 includes a `tool-less` template variant; T12 smoke validates the agent path.
2. **No empirical proof that every OpenCode provider populates `AssistantMessage.cost`.** Mitigation: NULL when `cost === 0 && tokens > 0` (AD-104).
3. **`TextPart.time.end` is optional.** Mitigation: nullable TPS, display `—` (AD-103).
4. **User-override priority on `config.command` inverts Guild's convention.** Mitigation: documented in AD-108; trade-off is intentional.

---

## Phase Progression Log

- 2026-06-28 — Spec drafted from awesome-opencode gap analysis. 16 requirements across 3 stories (P1 live TUI, P2 self-registering commands, P3 OTel + budget).
- 2026-06-28 — Design drafted after verifying event shapes against `@opencode-ai/sdk` v2 types. 11 components, full schema, tech decisions table.
- 2026-06-28 — Tasks drafted: 12 tasks in 4 phases (Foundation → Core [P] → Integration → Release). T5 Pricing Resolver removed per AD-104; T10 CLI removed per AD-106; T11 Guild sync deferred to v0.2 per AD-107.

---

## Deferred Ideas (Capture during Scry build)

- [ ] `scry_guild_sync` `Hooks.tool` for read-only ingestion of Guild `.guild/analytics/*.jsonl` (v0.2)
- [ ] Pricing Resolver via `models.dev` if providers are found that don't populate `AssistantMessage.cost` (v0.3+, belongs in Runes)
- [ ] `bin/scry.js` standalone CLI for CI/automation (out of scope per AD-106; revisit if real demand)
- [ ] Tmux-backed TUI sidebar in coordination with `packages/spawn` (v0.3)
- [ ] TUI visualizer (awesome-opencode `OpenCode Visualizer` style) — agents rendered as pixel-art in tmux
- [ ] `scry_diff` `Hooks.tool` to compare two sessions
- [ ] Web-based dashboard (out of MVP per local-first philosophy)

---

## Lessons Learned

- OpenCode plugin `config(input)` hook is the **self-registration mechanism** for slash-commands (mutate `input.command`). Inverse priority is recommended for Arcanum-style plugins that respect user authority.
- Awesome-opencode observability cluster (~10 plugins) converges on the same data model: per-turn tokens, cost, latency. Scry's job is to be the Arcanum-idiomatic unified surface, not invent a new model.
- Bun runtime guarantees (`Bun.TOML.parse`) eliminate parser deps for v0. Scry inherits the Arcanum "Bun-first" stance.

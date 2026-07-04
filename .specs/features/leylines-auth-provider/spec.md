# Leylines Auth & Provider Layer Specification

**Status:** Opportunity — not yet specced (see ROADMAP.md §2.4)
**Phase:** Specify
**Started:** 2026-07-04
**Last Updated:** 2026-07-04
**Source:** `.specs/project/ROADMAP.md §2.4`

---

## Problem Statement

`guild-opencode.jsonc` hard-codes 5 model strings. Users who want to swap in Antigravity's free Gemini quota, a local LiteLLM proxy, Kilo gateway, or Codex have to manually edit the matrix. There is no Arcanum-native abstraction for:
- Managing auth credentials across multiple providers.
- Auto-discovering local LiteLLM proxies.
- Rotating tokens across multiple Google accounts (Antigravity Multi-Auth pattern).
- Exposing a `resolveModel(agentRole)` function that Guild's matrix can call.

The awesome-opencode cluster (Antigravity Auth, Gemini Auth, Kilo Gateway, Opencode LiteLLM, Claude Code Switch, Omniroute Auth, Provider Alias) shows mature demand for each of these, but each plugin is single-vendor with no unified surface.

## Goals

- [ ] Provide a single config surface (`leylines.toml`) for all auth providers.
- [ ] Auto-discover local LiteLLM proxies on common ports (4000, 8000, 8080).
- [ ] Support Antigravity (free Gemini/Anthropic via Google IDE), Gemini, Kilo, Codex, and OpenAI-compatible gateways.
- [ ] Token rotation across multiple Google accounts for Antigravity.
- [ ] Export `resolveModel(agentRole)` for Guild's `chat.params` hook to consume.
- [ ] Self-register `/leylines-add <provider>` and `/leylines-rotate` slash-commands via `Hooks.config`.
- [ ] Each provider marked `stable` or `experimental` per 90-day stability criteria.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cloud-hosted credential store | Local-first philosophy; no cloud dependency. |
| Billing / pricing queries | Belongs to Scry, not the auth layer. |
| Non-OpenAI-compatible providers without a REST adapter | Scope too broad for v0.1. |
| Automatic model benchmarking / optimal temp selection | Nice-to-have, deferred to v0.2. |
| MCP server for credential sharing | Deferred; native tools are sufficient for v0.1. |

---

## User Stories

### P1: Add and use a named provider ⭐ MVP

**User Story:** As a developer, I want to run `/leylines-add antigravity` and have Leylines walk me through auth setup, so that I can use free Gemini quota without editing `guild-opencode.jsonc` by hand.

**Acceptance Criteria:**

1. WHEN the user runs `/leylines-add <provider>` THEN Leylines SHALL present a step-by-step auth flow for that provider and write credentials to `~/.config/runecraft/leylines.toml`.
2. WHEN `leylines.toml` defines a `default_provider` THEN `resolveModel(agentRole)` SHALL return that provider's model mapping for all roles.
3. WHEN a provider's auth token is expired THEN Leylines SHALL surface a `[leylines] Token expired for <provider>` warning and fall back to the next configured provider.
4. WHEN no provider is configured THEN Leylines SHALL warn and pass through — no crash, no silent override of `opencode.json`.

**Independent Test:** Run `/leylines-add litellm`; verify `leylines.toml` is written; verify `resolveModel("bard")` returns the LiteLLM model string.

---

### P2: LiteLLM auto-discovery

**User Story:** As a developer running a local LiteLLM proxy, I want Leylines to detect it automatically and offer to register it as a provider.

**Acceptance Criteria:**

1. WHEN Leylines boots AND a process is listening on port 4000, 8000, or 8080 with a `/models` endpoint THEN Leylines SHALL offer to register it as a `litellm` provider.
2. WHEN auto-discovery succeeds THEN Leylines SHALL write the provider entry to `leylines.toml` with `status = "auto-discovered"`.
3. WHEN no local proxy is found THEN auto-discovery SHALL complete silently (no error, no TUI noise).

---

### P3: Antigravity token rotation

**User Story:** As a power user with multiple Google accounts, I want Leylines to rotate through them to maximise free quota.

**Acceptance Criteria:**

1. WHEN `leylines.toml` has `[[providers.antigravity.accounts]]` with multiple entries THEN Leylines SHALL rotate to the next account on 429 or quota-exceeded response.
2. WHEN all accounts are exhausted THEN Leylines SHALL surface a single `[leylines] All Antigravity accounts exhausted` alert and stop rotating.
3. WHEN rotation occurs THEN Leylines SHALL log the rotation event (provider, account index) to `$LEYLINES_LOG` without logging the actual token.

---

### P4: Guild matrix integration

**User Story:** As a Guild user, I want the agent matrix in `guild-opencode.jsonc` to resolve model strings through Leylines so I don't duplicate model config in two places.

**Acceptance Criteria:**

1. WHEN Guild's `chat.params` hook fires AND `@runecraft/leylines` is loaded THEN Guild SHALL call `resolveModel(agentRole)` to get the model string instead of reading it directly from `guild-opencode.jsonc`.
2. WHEN Leylines is NOT loaded THEN Guild SHALL fall back to the existing static matrix (no regression).
3. WHEN `resolveModel` returns `null` THEN Guild SHALL use the static matrix entry for that role.

**Note:** This story requires a minor change in Guild. It is a soft dependency — Leylines works standalone; Guild integration is additive.

---

## Edge Cases

- WHEN a provider's API returns an unexpected schema THEN Leylines SHALL log the raw response and return `null` from `resolveModel` (never crash the plugin host).
- WHEN `leylines.toml` is malformed THEN Leylines SHALL warn on boot and disable itself; other plugins are unaffected.
- WHEN two providers claim the same model alias THEN the first one in `leylines.toml` wins; a warning is emitted.
- WHEN `LEYLINES_PROVIDER` env var is set THEN it overrides the `default_provider` in `leylines.toml` (env > file).

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| LEY-01 | P1 | Pending |
| LEY-02 | P1 | Pending |
| LEY-03 | P1 | Pending |
| LEY-04 | P1 | Pending |
| LEY-05 | P2 | Pending |
| LEY-06 | P2 | Pending |
| LEY-07 | P2 | Pending |
| LEY-08 | P3 | Pending |
| LEY-09 | P3 | Pending |
| LEY-10 | P3 | Pending |
| LEY-11 | P4 | Pending |
| LEY-12 | P4 | Pending |
| LEY-13 | P4 | Pending |

**ID format:** `LEY-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified

---

## Success Criteria

- [ ] `/leylines-add litellm` completes in < 30 seconds for a user with a running local proxy.
- [ ] Auto-discovery finds a local LiteLLM proxy on port 4000 within 2s of plugin boot.
- [ ] Token rotation across 2 Antigravity accounts works end-to-end without manual intervention.
- [ ] Guild matrix resolves models via `resolveModel` when Leylines is loaded; falls back silently when not.
- [ ] Tests pass: `bun test --filter @runecraft/leylines`.
- [ ] No `bin` field in published `package.json`.

---

## Open Questions (to resolve in Design phase)

1. **Auth flow mechanics:** Each provider uses a different OAuth/token flow. How does Leylines handle interactive OAuth redirects in a terminal-only context? (Browser-open pattern vs. device-code flow?)
2. **Token storage:** `~/.config/runecraft/leylines.toml` stores tokens in plaintext. Should we use OS keychain (`keytar`) or keep it simple? Local-first philosophy suggests plaintext with restrictive file permissions (0600).
3. **Guild coupling:** The `resolveModel` integration requires Guild to optionally import Leylines. How do we avoid a hard dependency? (Dynamic `import()` + duck-typing check?)
4. **`experimental` tagging:** What is the 90-day stability criteria operationally? Is it a date in `leylines.toml`, a CI check, or a human review?

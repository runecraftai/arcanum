# Ward Safety & Guards Specification

**Status:** Opportunity — not yet specced (see ROADMAP.md §2.3)
**Phase:** Specify
**Started:** 2026-07-04
**Last Updated:** 2026-07-04
**Source:** `.specs/project/ROADMAP.md §2.3`

---

## Problem Statement

Arcanum currently relies solely on OpenCode's built-in permission system for safety. There is no Arcanum-native layer that:
- Intercepts destructive shell commands before they run.
- Protects `.env*` and other secret files from being read or leaked.
- Sanitises logs (redacts JWTs, bcrypt hashes, API keys from agent output).
- Enforces "done" definitions so agents don't exit early with partial work.

The awesome-opencode cluster (CC Safety Net, Envsitter Guard, Cupcake/OPA, Workaholic, Log Sanitizer) shows there is mature demand for each of these, but no single tool unifies them with a declarative, Arcanum-idiomatic config surface.

## Goals

- [ ] Intercept destructive commands (`rm -rf`, `git reset --hard`, `DROP TABLE`, etc.) before `tool.execute.before` resolves, requiring explicit user confirmation or blocking based on policy.
- [ ] Protect `.env*`, `*.pem`, `*.key`, and other user-defined glob patterns from being passed to the agent or written to disk without confirmation.
- [ ] Sanitise log output (stdout, `$WARD_LOG`) by redacting JWTs, bcrypt hashes, API keys matching configurable regexes.
- [ ] Enforce a "done" definition: block `session.completed` if user-defined exit criteria are unmet (mirrors Workaholic's anti-early-exit).
- [ ] Self-register `/ward-check` slash-command via `Hooks.config` — no Summon, no manual config block.
- [ ] Declarative policy via `ward.toml` (TOML, not Rego — simpler than Cupcake's OPA layer).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Full OPA/Rego policy engine | TOML policy covers 90% of cases; Rego is opt-in in a future version. |
| Network egress filtering | Needs OS-level hook; out of plugin scope. |
| Audit log persistence | v0.2 concern; v0.1 writes warnings to TUI only. |
| Integration with Guild's `policy/` directory | v0.2; Ward is standalone in v0.1. |
| Scry integration (cost-guard) | Orthogonal; Scry handles budget, Ward handles safety. |

---

## User Stories

### P1: Destructive command interception ⭐ MVP

**User Story:** As a developer, I want Ward to intercept commands like `rm -rf` or `git reset --hard` before they execute, so that I can confirm or deny them without losing work.

**Acceptance Criteria:**

1. WHEN `tool.execute.before` fires for a Bash/shell tool call whose command matches a Ward policy rule THEN Ward SHALL block execution and surface a `[ward] Blocked: <reason>` message to the TUI.
2. WHEN `ward.toml` has `[policy] require_confirm = ["rm -rf*", "git reset --hard*"]` THEN Ward SHALL pause and prompt the user for confirmation before proceeding.
3. WHEN `ward.toml` is absent THEN Ward SHALL apply a built-in safe-defaults policy (a curated list of 20+ destructive patterns).
4. WHEN a command is blocked THEN Ward SHALL log the blocked command to `$WARD_LOG` (or stderr if unset).

**Independent Test:** Run Ward-loaded OpenCode; ask the agent to execute `rm -rf /tmp/ward-test-dir`; verify the TUI shows the Ward block and the command does NOT execute until confirmed.

---

### P2: Secret file protection

**User Story:** As a developer, I want Ward to prevent the agent from reading or writing `.env*`, `*.pem`, and `*.key` files without explicit confirmation, so that credentials never leak into the context window.

**Acceptance Criteria:**

1. WHEN `tool.execute.before` fires for a Read/Write tool call whose path matches a Ward-protected glob THEN Ward SHALL block and prompt.
2. WHEN `ward.toml` has `[protect] paths = [".env*", "*.pem", "*.key"]` THEN those patterns override the built-in defaults.
3. WHEN a protected file is accessed THEN Ward SHALL redact its content from any subsequent `message.updated` event (sanitisation pipeline).

**Independent Test:** Ask the agent to read `.env`; verify Ward blocks and the file content never appears in TUI output.

---

### P3: Log sanitisation

**User Story:** As a developer, I want Ward to automatically redact JWTs, bcrypt hashes, and API keys from agent output and logs.

**Acceptance Criteria:**

1. WHEN any `message.updated` event contains a string matching `[sanitise] patterns` THEN Ward SHALL replace the match with `[REDACTED by ward]`.
2. WHEN `ward.toml` has `[sanitise] patterns = [...]` THEN those patterns are appended to Ward's built-in regex set (JWT, bcrypt `$2b$`, `sk-*`, `ghp_*`, `AKIA*`).
3. WHEN `$WARD_LOG` is set THEN redacted output SHALL be written there; the original SHALL NOT be written anywhere.

**Independent Test:** Inject a fake JWT into the agent's context; verify `/ward-check` output shows `[REDACTED by ward]`.

---

### P4: `/ward-check` audit command

**User Story:** As a developer, I want to run `/ward-check` before a session to review what Ward will block, protect, and redact.

**Acceptance Criteria:**

1. WHEN `/ward-check` is run THEN Ward SHALL print a markdown summary of the active policy (blocked patterns, protected paths, sanitise regexes, done-definition if configured).
2. WHEN Ward is loaded THEN `/ward-check` SHALL appear in the command palette automatically (self-registered via `Hooks.config`).

---

## Edge Cases

- WHEN `ward.toml` has a syntax error THEN Ward SHALL warn on boot and fall back to built-in defaults; it SHALL NOT prevent OpenCode from loading.
- WHEN Ward and Guild are both loaded THEN Ward's `tool.execute.before` runs before Guild's hooks (priority: safety > orchestration).
- WHEN a command is blocked but the user overrides THEN Ward SHALL log the override with a timestamp.
- WHEN `process.stdout.isTTY = false` THEN Ward SHALL write all alerts to `$WARD_LOG` or stderr instead of the TUI.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| WARD-01 | P1 | Pending |
| WARD-02 | P1 | Pending |
| WARD-03 | P1 | Pending |
| WARD-04 | P1 | Pending |
| WARD-05 | P2 | Pending |
| WARD-06 | P2 | Pending |
| WARD-07 | P2 | Pending |
| WARD-08 | P3 | Pending |
| WARD-09 | P3 | Pending |
| WARD-10 | P3 | Pending |
| WARD-11 | P4 | Pending |
| WARD-12 | P4 | Pending |

**ID format:** `WARD-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified

---

## Success Criteria

- [ ] 100% of a curated 50-command destructive-command sample is intercepted with default policy.
- [ ] `.env` file content never appears in TUI or logs when Ward is loaded.
- [ ] `/ward-check` visible in command palette after adding `"@runecraft/ward"` to `opencode.json#plugin` (no other config).
- [ ] `ward.toml` absent = safe-defaults applied (no crash, no silent pass-through).
- [ ] Tests pass: `bun test --filter @runecraft/ward`.
- [ ] No `bin` field in published `package.json`.

---

## Open Questions (to resolve in Design phase)

1. **Blocking mechanism:** Does Ward block by rejecting the `tool.execute.before` promise, or by injecting a confirmation prompt into the agent context? The latter is more graceful but requires understanding the OpenCode SDK's blocking model.
2. **Sanitisation timing:** Should sanitisation happen in `message.updated` (post-fact) or as a `chat.params` pre-processor? Post-fact is simpler but leaves a window.
3. **Done-definition enforcement:** How does Ward know a session is "done"? Via a `session.completed` hook? Does OpenCode emit one?
4. **TOML schema:** Should `ward.toml` be repo-local only, or also support `~/.config/runecraft/ward.toml` (global defaults)?

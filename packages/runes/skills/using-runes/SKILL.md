---
name: using-runes
description: >
  Use the runes memory tools (`rune_*`) to persist and recall durable knowledge about this project
  across sessions. Triggers: any time the user references past work, the agent makes a decision,
  the user corrects the agent, the agent learns a convention, or a new project rule is established.
  Use on-demand — do not auto-inject every turn. Use `rune_context` to recall, `rune_save` to record,
  `rune_search` to find by keyword. Do not save secrets, in-progress debug noise, or file content
  (read the file instead).
license: CC-BY-4.0
metadata:
  version: 1.0.0
---

# using-runes

Always-on. The agent should consult and update the project's memory at well-defined moments. Memory is per-repo, scoped by `git remote.origin.url` (or path fallback), and persists across sessions.

## Session start — read context

When a new task begins in a known project, call `rune_context` (no query) to load:

- The 10 most recent memories (so the agent knows what has been decided/learned lately).
- The active session (if any) — link new memories to it via `session_id`.

If the user references past work, the prior session's outcome, or a specific decision, call `rune_context` with a focused `query` (e.g., the keyword) to surface the relevant memories. Prefer `rune_context(query=...)` over `rune_search` for recall — it already orders by importance and excludes soft-deleted rows.

## When to save

Save a memory with `rune_save` whenever one of the following happens and the knowledge would otherwise need to be re-explained next session:

- **decision** — the user and the agent agree on a course of action ("let's use DDD", "we'll deploy via Kamal").
- **correction** — the user corrects the agent's behavior ("no, we don't use `any` here", "this is a monorepo, don't `cd` into subdirs").
- **convention** — a project convention becomes clear ("tests live next to the code", "use bun, not npm").
- **config value** — a non-obvious config the agent should remember ("`PORT` defaults to 4096", "`RUNES_DATA_DIR` overrides the default").
- **naming** — naming rules ("components are PascalCase, hooks are `useFoo`", "db tables are snake_case").
- **architecture** — an architectural note that isn't obvious from the file tree ("the API gateway terminates mTLS, internal calls are plaintext").
- **constraint** — a hard constraint ("Postgres is read-replica-only in this env", "no network calls in tests").
- **learning** — a non-obvious lesson learned the hard way ("the `apply.sh` script must run from the repo root or it silently no-ops").

Each save needs a `title` (one line, ≤200 chars) and a `what` (the durable knowledge, ≤4000 chars). Use `why` for rationale, `where_ref` for the relevant file/dir, `learned` for corrections and lessons.

## When NOT to save

- **Secrets** — never save tokens, API keys, passwords, PII, or anything marked confidential. The skill is a soft guard; the README is the explicit warning.
- **One-off trivia** — anything that won't matter next session.
- **In-progress debug noise** — stack traces, scratch values, half-formed hypotheses. Save a `learning` only after the issue is resolved and the rule is clear.
- **File content** — read the file with the host's tools. The memory is for *meta* about the project, not its source.
- **Easily re-derivable facts** — package names, current versions of deps, public API shapes. Read the file.

## Curation

Per the napkin pattern, keep memory sharp:

- **Top-10 per category.** When saving would push a category past 10 entries, first call `rune_search` in that category, merge duplicates, and drop the lowest-importance / oldest entries. Use `rune_update` to refine, `rune_delete` to remove.
- **Importance 1–10.** Default 5. Use 8–10 for hard rules, 3–4 for soft preferences, 1–2 for trivial facts.
- **Soft delete > hard delete.** Always use `rune_delete` (soft). `runes doctor --purge` is the only path to hard-delete.

## Categories — when to use which

| Category        | One-line meaning                                                       |
| --------------- | ---------------------------------------------------------------------- |
| `decisions`     | "We chose X because Y" — architectural or process decisions.          |
| `corrections`   | "Don't do X; do Y instead" — corrections of the agent's behavior.       |
| `project_rules` | Standing rules of the project that apply broadly.                      |
| `architecture`  | Structural / layering notes that aren't obvious from the file tree.    |
| `constraints`   | Hard constraints the agent must respect (env, policy, perf budgets).   |
| `config_values` | Non-obvious config values and their effects.                           |
| `naming`        | Naming conventions and how to apply them.                              |
| `learnings`     | Lessons learned the hard way — apply to avoid repeating the mistake.   |

If unsure, prefer `learnings` over `decisions` — corrections are higher signal than choices.

## Quick reference

```text
rune_context({ query?: "auth" })            // recent + relevant, ordered by importance
rune_search({ query: "auth", category? })   // raw FTS5 search, ranked
rune_save({ category, title, what, ... })   // persist a new memory
rune_get({ id })                            // fetch one
rune_update({ id, ...fields })              // patch fields
rune_delete({ id })                         // soft delete
rune_session_start({ agent: "opencode" })   // begin a session (idempotent)
rune_session_end({ session_id, summary? })  // finish a session
rune_timeline({ limit? })                   // list recent sessions
rune_stats()                                // per-category counts
```

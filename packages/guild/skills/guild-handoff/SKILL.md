---
name: guild-handoff
description: >
  Capture pause/resume context for Guild work in `.guild/context/handoff.md`
  and `.guild/context/state.md`.
license: CC-BY-4.0
---

# guild-handoff

Capture and restore working context across sessions.

## Primary outputs

- `.guild/context/handoff.md` — session summary (what changed, what remains, blockers)
- `.guild/context/state.md` — global project-level state update
- `.guild/plans/<slug>/state.md` — plan-local state update
- `.guild/plans/<slug>/notes.md` — plan-local findings (updated freely)

---

## Destination routing rules

| What changed | Write to | When |
|-------------|----------|------|
| Global blockers, project-wide status, overall phase | `context/state.md` | At every handoff |
| Session summary: what was done, what remains, decisions | `context/handoff.md` | At every handoff |
| Plan-specific status, blockers, progress | `plans/<slug>/state.md` | At every handoff |
| Discovery findings, temp decisions, debug notes | `plans/<slug>/notes.md` | Freely, as discovered |
| Cross-cutting learning | `plans/<slug>/notes.md` → promote to `knowledge/` | See guild-commit-learning |
| Project identity or roadmap | `context/project.md` / `context/roadmap.md` | Rarely (human or init) |

**Decision tree**:

1. Does this affect **other plans** or the **overall project**?
   → Yes → update `context/state.md`.
   → No → go to step 2.

2. Is this about **where this plan stands** (status, blockers, next steps)?
   → Yes → update `plans/<slug>/state.md`.
   → No → go to step 3.

3. Is this a **finding or temp note** that may become useful later?
   → Yes → write to `plans/<slug>/notes.md`. Consider promoting to `knowledge/` later.
   → No → skip (no need to record).

---

## context/state.md vs knowledge/ — the key distinction

| | `context/state.md` | `knowledge/*` |
|---|---|---|
| **Purpose** | Current project status and blockers | Durable lessons and conventions |
| **Lifespan** | Lives as long as the project; updated on every handoff | Survives indefinitely; written once, read many times |
| **Content** | Where are we? What's blocked? What's next? | What have we learned? What should future agents know? |
| **Examples** | "Auth migration is blocked on secret rotation", "API v2 in review" | "Always use path aliases over relative imports", "AWS SDK v3 required" |
| **Updates** | Updated frequently (every session) | Updated rarely (when a finding is promoted) |

**Rule**: `context/state.md` tells you *what is happening now*. `knowledge/` tells you *what you know*.

---

## Handoff content

Record:
- What changed this session
- What remains to be done
- What is blocked and why
- Key decisions made
- References to `.guild/plans/<slug>/` artifacts

## Handoff update rules

| event | update |
|-------|--------|
| End of session | Write `context/handoff.md`, update `context/state.md` |
| End of plan session | Also update `plans/<slug>/state.md` |
| Discovery during work | Write to `plans/<slug>/notes.md` immediately |
| Learning that applies to future plans | Promote to `knowledge/` (see guild-commit-learning) |

## Guidance

- Keep the handoff short and actionable
- Point future work back to the current `.guild/plans/<slug>/` artifacts
- Update both plan-local and global state at handoff boundaries

## Fallback rules

- Read `.specs/project/HANDOFF.md` only if `.guild/context/handoff.md` is absent
- Read `.specs/project/STATE.md` only if `.guild/context/state.md` is absent
- Write only to `.guild/` — never to `.specs/`

# .guild/ information architecture

**Purpose**: Canonical working memory, planning workspace, and institutional knowledge for Guild agents.

---

## Directory overview

```
.guild/
  context/          # Global project state (single source of truth)
  knowledge/        # Persistent learnings and conventions (survives plans)
  plans/           # Active and archived planning workspaces
  archive/          # Completed or abandoned plans moved here
  runtime/           # Ephemeral session data (auto-managed, do not edit)
```

---

## context/ — global state

**Purpose**: Authoritative project-level information that persists across all plans.

**Files** (all required once initialized):

| file | responsibility | owned by |
|------|----------------|----------|
| `context/project.md` | Project identity: name, purpose, tech stack, key files, owner | init skill |
| `context/roadmap.md` | High-level roadmap and milestones | human or planning skill |
| `context/state.md` | Current project state, blockers, active focus | agents (updated on handoff) |
| `context/handoff.md` | Last human-to-agent or agent-to-agent handoff summary | agents |

**Rules**:
- Exactly one active version per file (no `state.v2.md`)
- Written by init skill on project bootstrap
- Updated by agents only at handoff boundaries
- Never deleted; only replaced

---

## knowledge/ — persistent learnings

**Purpose**: Cross-cutting conventions, decisions, and gotchas that apply to any plan.

**Files**:

| file | responsibility | when to update |
|------|----------------|----------------|
| `knowledge/index.md` | Map of all knowledge files; topics covered | on any knowledge addition |
| `knowledge/decisions.md` | Architectural decisions, rationale, alternatives rejected | on any significant decision |
| `knowledge/conventions.md` | Coding standards, naming rules, patterns used | on convention discovery |
| `knowledge/gotchas.md` | Known pitfalls, common mistakes, fix patterns | on encountering or anticipating issues |
| `knowledge/definition-of-done.md` | Project-wide standing bar (consumed by `guild-verify` and `guild-ship`; complements per-task `tasks.md` criteria) | on quality-bar changes (new lint rule, new security requirement, etc.) |

**Rules**:
- Durable: written once, referenced many times
- Plan-local findings **must not** live here; they go in `plans/<slug>/notes.md` first
- Promotion to knowledge/ requires explicit decision (see learning promotion rules)
- Never overwrites plan-local decisions

---

## plans/ — planning workspaces

**Purpose**: Isolated workspaces for discrete units of work.

**Structure**:

```
plans/
  <slug>/
    spec.md        # What to build and why
    context.md     # User decisions for gray areas (created during discuss phase)
    design.md      # How it fits together (optional)
    tasks.md       # Atomic tasks with verification criteria
    state.md       # Plan-local state (current status, blockers)
    validation.md  # Verifier report (PASS/FAIL, per-AC evidence)
  archive/         # Moved plans go here
```

**Naming**: `<slug>` is lowercase, hyphenated, and unique.
- Good: `auth-redesign`, `api-v2-migration`
- Bad: `Auth Redesign`, `API v2`

**File responsibilities**:

| file | content | lifecycle |
|------|---------|-----------|
| `spec.md` | Feature description, goals, acceptance criteria | Created once, never deleted |
| `context.md` | User decisions for gray areas, assumptions, scope clarifications | Created during discuss phase, updated as decisions change |
| `design.md` | Architecture, data models, API shapes, diagrams | Created when needed, updated on major changes |
| `tasks.md` | Task list with status, linked to spec acceptance criteria | Updated as work progresses |
| `state.md` | Plan-level status: blocked, in-progress, review, done | Updated at every handoff |
| `validation.md` | Verifier report: PASS/FAIL, per-AC evidence | Written once per verification pass, overwritten on re-verify |

**Rules**:
- `plans/<slug>` owns all plan-local state
- `context/state.md` reflects aggregate; `plans/<slug>/state.md` is granular
- Moving a plan to `archive/` = plan is complete or abandoned
- Never reference another plan's files directly; use knowledge/ for cross-plan info

---

## archive/ — completed work

**Purpose**: Preserved plans that are no longer active but kept for audit/history.

**Structure**:

```
archive/
  <slug>/
    (all files from plans/<slug>/ at time of archival)
```

**Rules**:
- Archive when: plan is done, abandoned, or superseded
- Never edit archived files
- Archive structure mirrors `plans/<slug>/` exactly
- Naming preserved from original slug

---

## runtime/ — ephemeral session data

**Purpose**: Auto-managed session state by the agent runtime.

**Do not edit or reference** files in this directory. They are owned by the runtime.

---

## Canonical loading order

Agents must load context in this order:

```
1. .guild/context/project.md
2. .guild/context/roadmap.md
3. active .guild/plans/<slug>/spec.md
4. active .guild/plans/<slug>/state.md
5. .guild/context/state.md
6. .guild/context/handoff.md
7. .guild/knowledge/index.md  (then relevant knowledge files)
8. .guild/knowledge/definition-of-done.md  (project-wide standing bar; read by guild-verify and guild-ship)
9. active .guild/plans/<slug>/context.md
```

---

## Plan-local vs global state boundary

| question | answer |
|----------|--------|
| "What is the current status of this feature?" | `plans/<slug>/state.md` |
| "What is the overall project status?" | `context/state.md` |
| "What conventions should I follow?" | `knowledge/conventions.md` |
| "What did we decide for this feature?" | `plans/<slug>/context.md` or `knowledge/decisions.md` |
| "What blockers exist?" | `plans/<slug>/state.md` (plan-local) or `context/state.md` (global) |
| "What should I do next?" | `plans/<slug>/tasks.md` |
| "How do I set up this project?" | `context/project.md` |
| "What is the project-wide quality bar?" | `knowledge/definition-of-done.md` |
| "What have we learned?" | `knowledge/` files |

---

## State update rules

| event | update |
|-------|--------|
| Start of new session | Read `context/state.md`, read active plan `state.md` |
| After completing a task | Update `plans/<slug>/tasks.md`, update `plans/<slug>/state.md` |
| On blocker discovery | Update `plans/<slug>/state.md` and `context/state.md` |
| On handoff (end of session) | Write summary to `context/handoff.md`, update `context/state.md` |
| On plan completion | Move `plans/<slug>/` to `archive/<slug>/` |
| On learning | Write to `plans/<slug>/context.md` first; promote to `knowledge/` by decision |

---

## Ownership summary

| directory | owned by | modified by |
|-----------|----------|-------------|
| `context/` | init skill (initial), human (roadmap) | agents at handoff |
| `knowledge/` | any agent that discovers knowledge | agents by decision |
| `plans/<slug>/` | planning skill | agents doing the work |
| `archive/<slug>/` | archive action | never (immutable) |
| `runtime/` | runtime system | never (external) |

---

## Anti-patterns to avoid

- Storing plan-specific notes in `knowledge/` (pollutes cross-plan durability)
- Writing to `context/state.md` on every action (noise vs signal)
- Referencing `plans/other-slug/` files directly (use `knowledge/` instead)
- Editing `archive/` files (audit trail corruption)
- Creating `plans/<slug>/state.v2.md` variants (single source of truth)

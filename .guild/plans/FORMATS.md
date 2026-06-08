# Plan Artifact Formats

**Purpose**: Standardize Guild plan artifacts under `.guild/plans/<slug>/` for reliable resume, handoff, and verification.

---

## Files at a glance

| file | purpose | write frequency | cleared on complete |
|------|---------|-----------------|---------------------|
| `spec.md` | What to build and why | once (rarely changes) | no |
| `design.md` | How it fits together | when needed, updated on major changes | no |
| `tasks.md` | Atomic work items with verification | as work progresses | no |
| `state.md` | Current status and blockers | at every handoff | no |
| `notes.md` | Scratchpad: findings, questions, temp decisions | freely | yes |

---

## spec.md

**Contains**:
- One-line TL;DR statement
- Problem or goal in 1-2 sentences
- Key constraints (non-negotiables)
- Acceptance criteria (verifiable, not vague)
- Definition of done (when this plan is complete)

**Does NOT contain**:
- Implementation details (→ `design.md`)
- Task breakdowns (→ `tasks.md`)
- Current status or blockers (→ `state.md`)
- Debug notes or findings (→ `notes.md`)
- Cross-plan context (→ `knowledge/`)

**Format**:

```markdown
# <Plan Title>

**TL;DR**: <one sentence>

## Goal
<problem or objective in plain terms>

## Constraints
- <non-negotiable requirement>
- <non-negotiable requirement>

## Acceptance Criteria
- [ ] <verifiable outcome>
- [ ] <verifiable outcome>

## Definition of Done
<final state when complete>
```

---

## design.md

**Contains**:
- Architecture decisions relevant to this plan
- Data models, API shapes, key file changes
- Component relationships or call flows
- Design decisions and rationale (not repeated elsewhere)

**Does NOT contain**:
- What to build (→ `spec.md`)
- Task breakdowns (→ `tasks.md`)
- Current status (→ `state.md`)
- Scratch notes (→ `notes.md`)
- Cross-cutting decisions (→ `knowledge/decisions.md`)

**Format**:

```markdown
# Design: <Plan Title>

## Architecture
<key structural decisions>

## Data / Models
<code snippets, schema changes, or description>

## Key Files
| file | change |
|------|--------|
| <path> | <what changes> |

## Decisions
- <decision> → <rationale>
```

---

## tasks.md

**Contains**:
- Atomic tasks linked to spec acceptance criteria
- Each task has: description, verification criteria, status
- Status values: `[ ]` (todo), `[wip]` (in progress), `[x]` (done), `[!]` (blocked)

**Does NOT contain**:
- Full spec or goal (→ `spec.md`)
- Architecture (→ `design.md`)
- Status narratives (→ `state.md`)
- Findings or questions (→ `notes.md`)

**Format**:

```markdown
# Tasks: <Plan Title>

## Task list

- [ ] **<Task name>**
  Verifies: <acceptance criteria from spec.md>
  Notes: <optional brief note>

- [x] **<Completed task>**
  Verifies: <acceptance criteria>
  Done: <date or commit ref if useful>

- [!] **<Blocked task>**
  Verifies: <acceptance criteria>
  Blocked by: <blocker reference in state.md>
```

**Rules**:
- One task per line item, no sub-tasks
- Verification criteria must map to spec acceptance criteria
- Update status on every work session
- Never delete completed tasks; mark `[x]`

---

## state.md

**Contains**:
- Current phase: `planning` | `design` | `implementation` | `review` | `done`
- Blocker list (if any) with reference to where it's tracked
- What's done since last update
- What's next (next 1-2 tasks)
- Timestamp of last update

**Does NOT contain**:
- Full spec or design (→ `spec.md` / `design.md`)
- Task list (→ `tasks.md`)
- Debug notes or findings (→ `notes.md`)
- Project-level state (→ `context/state.md`)

**Format**:

```markdown
# State: <Plan Title>

**Phase**: <current phase>
**Updated**: <ISO timestamp>
**Updated by**: <agent or human>

## Status
<one-paragraph summary of where things stand>

## Done since last update
- <completed task or milestone>

## Next
- <next immediate task>
- <following task>

## Blockers
| blocker | tracked in | status |
|---------|------------|--------|
| <description> | <file or link> | open / resolved |

## Notes
<optional brief context for next agent or human>
```

---

## notes.md

**Contains**:
- Discovery findings (file locations, code patterns, conventions)
- Questions to resolve
- Temporary decisions not yet finalized
- Debug observations
- References explored

**Does NOT contain**:
- Spec or goal (→ `spec.md`)
- Design decisions (→ `design.md` or `knowledge/decisions.md`)
- Task status (→ `tasks.md` or `state.md`)
- Cross-plan learnings (→ `knowledge/`)

**Rules**:
- Write freely; no format pressure
- Clear or mark stale entries
- On plan completion: keep durable findings, discard temp notes
- Promote cross-cutting learnings to `knowledge/` before archival

---

## Cross-cutting rules

| question | answer |
|----------|--------|
| Scope creep? | If not in `spec.md`, it doesn't exist for this plan |
| Temp vs durable note? | If it recurs across plans → `knowledge/`; if specific to this plan → `notes.md` |
| Plan-local vs global? | Only this plan needs it → `plans/<slug>/`; whole project needs it → `context/` or `knowledge/` |
| Versioning? | Never `state.v2.md`; always replace in-place |
| Archival? | Move entire `plans/<slug>/` to `archive/<slug>/`; never edit after |

---

## Handoff entry point

When resuming a plan, read in this order:
1. `state.md` — where are we now?
2. `tasks.md` — what needs doing?
3. `spec.md` — why are we doing it?
4. `design.md` (if needed)
5. `notes.md` — any open questions?
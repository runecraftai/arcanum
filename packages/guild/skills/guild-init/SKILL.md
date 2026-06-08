---
name: guild-init
description: >
  Bootstrap Guild project state for first-run setup or new project initialization.
  Creates `.guild/context/*` scaffolding (project.md, roadmap.md, state.md, handoff.md).
  Legacy `.specs/` is fallback only — never write to it.
license: CC-BY-4.0
---

# guild-init

First-run project bootstrap only — creates the canonical `.guild/context/` files.

**Output files** (all under `.guild/context/`):

| file | purpose |
|------|---------|
| `project.md` | Project identity: name, purpose, tech stack, key files, owner |
| `roadmap.md` | High-level milestones and delivery targets |
| `state.md` | Current status, blockers, active focus areas |
| `handoff.md` | Session handoff summary (human→agent or agent→agent) |

**Behavior**:
- Write to `.guild/context/` only — this is the canonical source of truth
- Read legacy `.specs/` only when `.guild/context/` is empty or stale; import content as needed
- Never create new files in `.specs/`
- Leave historical artifacts untouched

**See also**: [.guild/architecture.md](/.guild/architecture.md) for the full context layout, loading order, and state update rules.

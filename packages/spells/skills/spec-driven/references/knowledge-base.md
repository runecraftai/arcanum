# Knowledge Base: docs/ Structure

The `docs/` directory is the persistent knowledge base for this project. It lives at the project root and accumulates knowledge across development sessions.

## Directory Structure

```
docs/
├── project.md        # Living document: project overview, modules, active features
├── conventions.md    # Living document: code patterns, naming rules, structural decisions
├── decisions.md      # Living document: architectural decisions (ADR-style)
└── sessions/
    └── YYYY-MM-DD-<feature>.md    # Immutable session logs, one per feature per day
```

## First-Run Scaffold

When `docs/` does not yet exist, the LEARN phase creates it with this initial content:

### docs/project.md

```markdown
---
title: Project Context
updated: {{YYYY-MM-DD}}
---

# Project Context

## Overview

No context yet. Will be populated as features are built.

## Stack

{{To be filled — detected or manually added}}

## Modules

{{Accumulated as features are built}}
```

### docs/conventions.md

```markdown
---
title: Conventions
updated: {{YYYY-MM-DD}}
---

# Conventions

No conventions recorded yet. Will be populated as patterns are discovered.
```

### docs/decisions.md

```markdown
---
title: Architecture Decision Records
updated: {{YYYY-MM-DD}}
---

# Decisions

No decisions recorded yet. Will be populated as architectural choices are made.

| ID | Date | Decision | Context | Status |
|----|------|----------|---------|--------|
```

## Knowledge Routing

| Discovery Type | Target File | Action |
|---------------|-------------|--------|
| Session summary | `docs/sessions/YYYY-MM-DD-<feature>.md` | Create (immutable, always) |
| New module, feature, or capability added | `docs/project.md` | Append new section |
| New integration (external service, library) | `docs/project.md` | Append to integrations section |
| New code pattern or naming convention | `docs/conventions.md` | Append if new |
| Naming rule discovered (files, functions, types) | `docs/conventions.md` | Append if new |
| Architectural decision with rationale | `docs/decisions.md` | Append as ADR-style row |
| No new knowledge | (none) | Skip silently |

## Session Log Naming Convention

Session logs use this naming pattern: `YYYY-MM-DD-<feature-slug>.md`

Examples:
- `2026-04-23-auth-jwt.md`
- `2026-04-23-fix-null-pointer.md`
- `2026-04-24-email-notifications.md`

If the same feature continues across multiple days, create a new file with the new date:
- `2026-04-23-auth-jwt.md` (day 1)
- `2026-04-24-auth-jwt.md` (day 2 continuation)

## Live Docs Update Rules

1. **Append only** — never remove or overwrite existing content
2. **Deduplicate** — check existing content before adding; skip if already present
3. **Attribute** — end each new entry with: `_(from: feature-name, date: YYYY-MM-DD)_`
4. **Session logs are immutable** — once written, never edited. Create a new log for the same feature on a subsequent day.
5. **Quick scope**: always write session log; update live docs only if significant knowledge was discovered

## Example: Updated docs/conventions.md Entry

```markdown
## File Naming

- Services: `<resource>.service.ts` (e.g., `user.service.ts`)
- Controllers: `<resource>.controller.ts`
- DTOs: `<action>-<resource>.dto.ts` (e.g., `create-user.dto.ts`)

_(from: user-api, date: 2026-04-23)_
```

## Example: Updated docs/decisions.md Entry

```markdown
| ADR-003 | 2026-04-23 | Use Zod for runtime validation | Schema validation needed at API boundary; Zod integrates cleanly with TypeScript types | Active |
```

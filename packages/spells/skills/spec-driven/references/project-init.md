# Project Initialization — `/init` Command

Initialize a new project with `.specs/project/` structure (PROJECT.md, ROADMAP.md, STATE.md, HANDOFF.md).

---

## When to Run

**Triggers** (user input):
- `/init` — initialize project
- `initialize project` — same as `/init`
- `setup project` — same as `/init`
- `inicializar projeto` (Portuguese) — same as `/init`

---

## Skip Logic

**Check**: Does `.specs/project/PROJECT.md` already exist?

- ✅ **YES**: Warn user: `"Project already initialized. Run /map to update codebase docs. Run /init --force to overwrite."`
  - Abort initialization
  - Suggest `/map` for next step

- ❌ **NO**: Proceed with initialization

---

## 5-Step Flow

### Step 1: Create `.specs/project/` Directory

```bash
mkdir -p .specs/project
```

### Step 2: Gather Project Information

Ask user the following questions (in order):

1. **Project Name**: (required)
   - Prompt: "What is the project name?"
   - Example: "My SaaS Platform", "API Gateway", "Mobile App"

2. **Project Vision**: (required, 1-2 sentences)
   - Prompt: "In 1-2 sentences, what is the vision for this project? What problem does it solve?"
   - Example: "Streamline project management for distributed teams with real-time collaboration and AI-powered insights."

3. **Goals**: (required, 3-5 bullets)
   - Prompt: "List 3-5 main goals for the project (one per line, bullet format). Press Enter twice to finish."
   - Example:
     ```
     - Achieve 10k active users by end of 2026
     - Support real-time collaboration with <100ms latency
     - Integrate with Slack and Microsoft Teams
     ```

4. **Active Modules**: (required, comma-separated)
   - Prompt: "List currently active modules/features (comma-separated). Examples: 'auth, api, frontend, database, payments'"
   - Example: "auth, api, frontend, real-time-sync, notifications"

### Step 3: Generate PROJECT.md

Create `.specs/project/PROJECT.md` from user responses using the template below.

### Step 4: Generate ROADMAP.md

Create `.specs/project/ROADMAP.md` with empty milestone structure (template below).

### Step 5: Generate STATE.md

Create `.specs/project/STATE.md` with empty sections (template below).

### Step 6: Generate HANDOFF.md

Create `.specs/project/HANDOFF.md` with an initialized checkpoint (template below). This file is overwritten on pause/resume checkpoints.

---

## Template: PROJECT.md

```markdown
---
title: Project Context
created: {{YYYY-MM-DD}}
updated: {{YYYY-MM-DD}}
---

# {{Project Name}}

## Vision

{{Project Vision — 1-2 sentences}}

## Goals

{{Goals as bullet list}}

## Active Modules

{{Comma-separated list of active modules/subsystems}}

## Context

This project is tracked in `.specs/`. See knowledge-base.md for structure.

---

## Quick Links

- **Roadmap**: ROADMAP.md
- **State**: STATE.md
- **Codebase**: `.specs/codebase/` (run `/map` to generate)
- **Features**: `.specs/features/` (features added during development)
```

### Example PROJECT.md

```markdown
---
title: Project Context
created: 2026-04-28
updated: 2026-04-28
---

# My SaaS Platform

## Vision

Streamline project management for distributed teams with real-time collaboration and AI-powered insights. We're building the go-to platform for teams that move fast.

## Goals

- Achieve 10k active users by end of 2026
- Support real-time collaboration with <100ms latency
- Integrate with Slack and Microsoft Teams
- Maintain 99.9% uptime in production
- Reduce time-to-market for features through automation

## Active Modules

auth, api, frontend, real-time-sync, notifications, database, payments

---

## Context

This project is tracked in `.specs/`. See knowledge-base.md for structure.

---

## Quick Links

- **Roadmap**: ROADMAP.md
- **State**: STATE.md
- **Codebase**: `.specs/codebase/` (run `/map` to generate)
- **Features**: `.specs/features/` (features added during development)
```

---

## Template: ROADMAP.md

```markdown
---
title: Roadmap
created: {{YYYY-MM-DD}}
---

# Roadmap

## {{Milestone 1 Name}}

**Target**: {{Target Date (e.g., Q2 2026)}}

| Feature | Status | Notes |
|---------|--------|-------|
| [Feature 1] | planned | — |
| [Feature 2] | planned | — |

## {{Milestone 2 Name}}

**Target**: {{Target Date}}

| Feature | Status | Notes |
|---------|--------|-------|
| [Feature 1] | planned | — |

---

## Status Legend

- **planned**: Not yet started
- **in-progress**: Currently being built
- **shipped**: Released to production
```

### Example ROADMAP.md

```markdown
---
title: Roadmap
created: 2026-04-28
---

# Roadmap

## MVP (Q2 2026)

**Target**: 2026-06-30

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (email/password) | planned | Basic JWT-based auth |
| Project Dashboard | planned | Create, list, archive projects |
| Team Invite | planned | Email-based team invitations |
| Real-time Sync | planned | WebSocket-based updates |

## Phase 2 (Q3 2026)

**Target**: 2026-09-30

| Feature | Status | Notes |
|---------|--------|-------|
| Slack Integration | planned | Push notifications, project updates |
| Teams Integration | planned | OAuth-based Microsoft Teams sync |
| Comments & Mentions | planned | Collaboration features |
| Search API | planned | Full-text search across projects |

## Future

**Target**: TBD

| Feature | Status | Notes |
|---------|--------|-------|
| Mobile App | planned | iOS and Android clients |
| AI Insights | planned | Auto-generate reports and summaries |
| Export/Reporting | planned | PDF reports, CSV exports |

---

## Status Legend

- **planned**: Not yet started
- **in-progress**: Currently being built
- **shipped**: Released to production
```

---

## Template: STATE.md

```markdown
---
title: Global STATE — Decisions, Blockers, and Context
created: {{YYYY-MM-DD}}
updated: {{YYYY-MM-DD}}
---

# STATE

## Decisions

None yet. Architectural decisions will be recorded here.

---

## Blockers

None yet. Project-wide blockers will be recorded here.

---

## Lessons

None yet. Lessons learned across features will be recorded here.

---

## Todos

None yet. Cross-feature action items will be recorded here.

---

## Deferred

None yet. Deferred ideas will be recorded here.

---

## See Also

For detailed schema and examples, see `state-global.md` in the skill references.
```

---

## Template: HANDOFF.md

```markdown
# Handoff

**Date:** {{YYYY-MM-DDTHH:mm:ssZ}}
**Feature:** none
**Phase:** INIT
**Task:** none
**Branch:** {{current branch if applicable}}

## Completed

- Project planning scaffold initialized.

## In Progress

- No active feature.

## Pending

- Run `/map` for existing codebases.
- Run `/spec <feature>` to start feature planning.

## Blockers

- None.

## Uncommitted Changes

- None recorded by init.

## Context

- Project memory starts in `.specs/project/PROJECT.md`, `ROADMAP.md`, and `STATE.md`.
```

---

## Post-Init Recommendations

After `/init` completes, guide the user:

> ✅ Project initialized!
> 
> **Next steps:**
> 1. **Map your codebase** (if existing code): Run `/map` to document STACK, ARCHITECTURE, CONVENTIONS, etc.
> 2. **Start your first feature**: Run `/spec feature-name` to begin the first feature
> 
> For more info, see `.specs/` structure in knowledge-base.md

---

## Force Override

If user runs `/init --force`:

1. Check if `.specs/project/` exists
2. If yes, warn: "This will overwrite existing PROJECT.md, ROADMAP.md, STATE.md, and HANDOFF.md. Continue? (yes/no)"
3. If yes, delete the 4 files and re-run initialization from Step 2 (gather info)
4. Confirm success and re-display recommendations

---

## Example: Full Initialization Session

```
User: /init

Herald: Initializing project...

Agent: What is the project name?
User: My SaaS Platform

Agent: In 1-2 sentences, what is the vision?
User: Streamline project management for distributed teams with real-time collaboration and AI-powered insights.

Agent: List 3-5 main goals (one per line):
User: Achieve 10k active users by end of 2026
       Support real-time collaboration with <100ms latency
       Integrate with Slack and Microsoft Teams

Agent: List currently active modules (comma-separated):
User: auth, api, frontend, real-time-sync, notifications

Agent: ✅ Project initialized!
Created:
  - .specs/project/PROJECT.md
  - .specs/project/ROADMAP.md
  - .specs/project/STATE.md
  - .specs/project/HANDOFF.md

Next steps:
1. Run `/map` to document existing codebase
2. Run `/spec feature-name` to start your first feature
```

---

## See Also

- `knowledge-base.md` — structure and purpose of `.specs/` directories
- `state-global.md` — detailed STATE.md schema
- `phase-map.md` — next step after `/init`

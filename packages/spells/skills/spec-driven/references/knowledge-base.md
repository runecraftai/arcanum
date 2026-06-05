# Knowledge Base: `.specs/` Structure

The `.specs/` directory is the persistent knowledge base for this project. It lives at the project root and accumulates knowledge across development sessions, organized into 5 subdirectories for different types of artifacts.

## Directory Structure

```
.specs/
├── project/
│   ├── PROJECT.md          # Vision, goals, active modules
│   ├── ROADMAP.md          # Features, milestones, schedule
│   ├── STATE.md            # Decisions, blockers, lessons, todos, deferred items
│   └── HANDOFF.md          # Latest pause/resume checkpoint
├── codebase/
│   ├── STACK.md            # Languages, frameworks, package manager, build tools
│   ├── ARCHITECTURE.md     # High-level design, module boundaries, data flow
│   ├── CONVENTIONS.md      # Naming rules, file organization, patterns
│   ├── STRUCTURE.md        # Annotated directory tree, entry points
│   ├── TESTING.md          # Test framework, coverage, CI commands
│   ├── INTEGRATIONS.md     # External APIs, databases, services
│   └── CONCERNS.md         # Tech debt, security/perf/scale/ops risks
├── features/
│   └── <name>/
│       ├── spec.md         # Feature specification
│       ├── context.md      # Discussion context (Complex scope only)
│       ├── design.md       # Technical design (Large/Complex only)
│       ├── tasks.md        # Implementation tasks with checkboxes
│       └── STATE.md        # Feature checkpoint, blockers, resume context
├── quick/
│   └── NNN-slug/
│       ├── TASK.md         # Single task description
│       └── SUMMARY.md      # Completion summary
└── sessions/
    └── YYYY-MM-DD-<feature>.md    # Immutable session logs, one per feature per day
```

## `.specs/project/` — Project Context (4 files)

**Purpose:** Centralized, persistent project knowledge updated across all features.

### PROJECT.md
- **Content**: project vision statement (1-2 sentences), goals (3-5 bullets), currently active modules (comma-separated list)
- **Lifecycle**: created at `/init`, updated when goals or active modules change
- **Audience**: entry point for understanding what the project is building

### ROADMAP.md
- **Content**: planned features grouped by milestone or release
- **Format**: milestone name, target date, features planned, status (planned/in-progress/shipped)
- **Lifecycle**: created at `/init`, updated as features complete
- **Audience**: product and engineering overview of direction

### STATE.md
- **Content**: 5 sections with append-only rules (see `state-global.md` for full schema)
  - **Decisions**: numbered architectural decisions with date, status, rationale
  - **Blockers**: active blockers with owner, created date, status
  - **Lessons**: learned lessons with date stamp
  - **Todos**: cross-feature action items with owner, priority
  - **Deferred**: items explicitly deferred with reason and target date
- **Rules**: append-only; no deletion; monthly pruning of completed items
- **Lifecycle**: created at `/init`, continuously updated through feature development

### HANDOFF.md
- **Content**: latest resumable checkpoint: active feature, phase, task, completed work, pending work, blockers, and uncommitted changes
- **Rules**: overwritten on each pause; not append-only
- **Lifecycle**: created at `/init`, updated by `/spec pause`, read by `/spec resume`

## `.specs/codebase/` — Brownfield Mapping (7 files, on-demand)

**Purpose:** Document existing codebase structure, patterns, and concerns. Generated via `/map` command by delegating to Scout, using templates in `brownfield-mapping.md`.

**Trigger**: `/map` command automatically generates all 7 docs; `/map stack` generates only STACK.md, etc.

**Files**:
1. **STACK.md** — Programming languages (with versions), frameworks, package manager, build tools, deployment targets
2. **ARCHITECTURE.md** — High-level text diagram, module boundaries, data flow, key patterns, entry points
3. **CONVENTIONS.md** — Naming conventions, file organization, import style, error handling, logging patterns
4. **STRUCTURE.md** — Annotated directory tree (3 levels), key entry points, module responsibilities
5. **TESTING.md** — Test framework, coverage expectations, test file location pattern, fixture strategy, CI commands
6. **INTEGRATIONS.md** — External APIs (with auth method), databases (with ORM), message queues, third-party services
7. **CONCERNS.md** — Tech debt and risk documentation (see `concerns.md` for detailed guidance)

**Schema**: Each doc has a standard template provided in `brownfield-mapping.md` with Scout delegation questions.

**Note**: These are on-demand, generated once and updated selectively as needed. Not created until `/map` is run.

## `.specs/features/<name>/` — Feature Artifacts (5 files)

**Purpose:** Comprehensive documentation for a single feature from conception to completion.

**Files**:
- **spec.md** — Feature specification (What & Why)
  - User story, requirements, acceptance criteria
  - Created during SPEC phase
- **context.md** — Discussion context (Complex scope only, before spec.md)
  - Answers to scope boundaries, user impact, constraints, edge cases, dependencies
  - Created during SPEC → Discuss sub-step
- **design.md** — Technical design (Large/Complex only)
  - Architecture, API design, data model, algorithm outline, risks
  - Created during PLAN phase
- **tasks.md** — Implementation tasks
  - Checkbox-driven task list with file paths, acceptance criteria
  - Created during PLAN phase; marked complete during BUILD
- **STATE.md** — Feature checkpoint & resume context
  - Last completed phase, artifact status, feature-specific blockers, open questions
  - Created at SPEC start, updated each phase, archived at SHIP

## `.specs/quick/NNN-slug/` — Quick Tasks (2 files)

**Purpose:** Single task tracking for minor fixes, config changes, quick ad-hoc work.

**Files**:
- **TASK.md** — Task description, acceptance criteria
- **SUMMARY.md** — Completion report with files changed, diff summary

## `.specs/sessions/` — Session Logs

**Purpose:** Immutable records of work completed in each development session.

**Format**: `YYYY-MM-DD-<feature-slug>.md`

**Examples**:
- `2026-04-23-auth-jwt.md`
- `2026-04-23-fix-null-pointer.md`
- `2026-04-24-email-notifications.md`

**Continuation rule**: If the same feature continues across multiple days, create a new file with the new date.

**Content**: Summary of what was built, decisions made, blockers encountered, context checkpoints.

## Knowledge Routing

| Discovery Type | Target File(s) | Action |
|---------------|----------------|--------|
| Session summary | `.specs/sessions/YYYY-MM-DD-<feature>.md` | Create (immutable, always) |
| New module or feature shipped | `.specs/project/PROJECT.md` (active modules) + `.specs/project/STATE.md` (lessons) | Append |
| New integration discovered | `.specs/codebase/INTEGRATIONS.md` (if `/map` done) | Append or note in `.specs/features/<name>/STATE.md` |
| Architectural decision | `.specs/project/STATE.md` (Decisions section) | Append as new entry |
| Cross-feature blocker or action item | `.specs/project/STATE.md` (Blockers or Todos section) | Append |
| Feature-specific blocker or context | `.specs/features/<name>/STATE.md` | Append to blockers section |
| Code pattern or naming convention | `.specs/codebase/CONVENTIONS.md` (if `/map` done) | Append or document in design.md for future reference |
| Tech debt or risk | `.specs/codebase/CONCERNS.md` (if `/map` done) | Append with severity/likelihood; or log in `.specs/project/STATE.md` |
| Pause/resume checkpoint | `.specs/project/HANDOFF.md` | Overwrite with latest resumable state |
| No new knowledge | (none) | Skip silently |

## Update Rules

1. **Append only** — never remove existing content; status changes (e.g., blocker marked resolved) are allowed
2. **Deduplicate** — check existing content before adding; skip if already present
3. **Attribute** — end each new entry with: `_(from: feature-name, date: YYYY-MM-DD)_` when updating live docs
4. **Session logs are immutable** — once written, never edited. Create a new log for the same feature on a subsequent day.
5. **Quick scope**: always write session log; update live docs (.specs/project/ or .specs/codebase/) only if significant knowledge was discovered
6. **Archives**: do not load `.specs/archive/` by default; archived specs are historical and opt-in only

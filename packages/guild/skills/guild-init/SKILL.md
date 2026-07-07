---
name: guild-init
description: >
  Bootstrap Guild project state for first-run setup or new project initialization.
  Creates `.guild/context/*` scaffolding (project.md, roadmap.md, state.md, handoff.md),
  `.guild/knowledge/definition-of-done.md`, and the OKF knowledge bundle
  (index.md, decisions.md, conventions.md, gotchas.md).
license: CC-BY-4.0
---

# guild-init

First-run project bootstrap only — creates the canonical `.guild/context/` files, the project-wide Definition-of-Done slot, and an [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) knowledge bundle under `.guild/knowledge/`.

## Overview

Scaffold the `.guild/context/` files (project, roadmap, state, handoff), `.guild/knowledge/definition-of-done.md` (the project-wide standing bar consumed by `guild-verify` and `guild-ship`), and the OKF knowledge bundle (index.md, decisions.md, conventions.md, gotchas.md). Never overwrite existing files.

The OKF knowledge bundle is a living, agent-navigable knowledge base. Agents query it before reading raw source files. Humans and agents both contribute to it over time. It is versionable in git and compounds across sessions.

## When to Use

- A new project is being initialized in a directory with no `.guild/` tree.
- The user explicitly asks to bootstrap Guild state for a fresh project.
- The next step is scaffolding, not planning or execution.

**Do NOT use for**: feature spec authoring (use `guild-spec`), planning (use `guild-plan`), or executing an existing plan (use `guild-execute`).

## Primary inputs

- The current working directory (the project root)

## Primary outputs

- `.guild/context/project.md` — project identity
- `.guild/context/roadmap.md` — high-level milestones
- `.guild/context/state.md` — current status, blockers, active focus
- `.guild/context/handoff.md` — session handoff summary
- `.guild/knowledge/definition-of-done.md` — project-wide standing bar (scaffolded empty; do NOT overwrite)
- `.guild/knowledge/index.md` — OKF bundle root index (do NOT overwrite if exists)
- `.guild/knowledge/decisions.md` — architectural decisions log (do NOT overwrite if exists)
- `.guild/knowledge/conventions.md` — coding conventions and patterns (do NOT overwrite if exists)
- `.guild/knowledge/gotchas.md` — known pitfalls and fix patterns (do NOT overwrite if exists)

## Process

1. Confirm the target directory is the project root. If `.guild/` already exists, switch to step 4 (only create missing files).
2. Create `.guild/context/` and `.guild/knowledge/` directories if absent.
3. Scaffold `context/project.md`, `context/roadmap.md`, `context/state.md`, `context/handoff.md` from the templates below. Use stub content with TODO markers; the human fills them in.
4. Scaffold `knowledge/definition-of-done.md` from the template below. **If the file already exists, do NOT touch it.** Re-running `guild-init` must not modify a customized DoD file.
5. Scaffold the OKF knowledge bundle files from the templates below. **If any file already exists, do NOT touch it.**
6. Leave existing directories (`.guild/`, `archive/`) untouched.

## Definition-of-Done template (scaffolded at step 4)

```markdown
# Definition of Done — project-wide standing bar

This file is the **project-wide standing bar** that `guild-verify` and `guild-ship` check against in addition to per-task criteria in `plans/<slug>/tasks.md`. It applies to every change in this project.

Fill in the items below. Each item is a bar the project's maintainers expect every change to clear. Items the agent cannot verify from a given change should be marked `unable to verify` in the verification notes, not auto-passed.

## Project-wide standing bar

<!-- Example items — replace with your project's bar. -->
- All public functions have explicit parameter and return types.
- No new lint or typecheck errors are introduced.
- README and inline documentation are updated where behaviour changes.
- Tests cover the new behaviour at the unit level.
- No secrets, tokens, or credentials are introduced in code, logs, or commits.

## Per-task criteria

Per-task acceptance criteria live in `plans/<slug>/tasks.md` for the active plan. The project-wide bar here is checked in **addition** to (not instead of) the per-task criteria.

## Maintenance

When the project's quality bar changes (e.g., a new lint rule is added, a new security requirement appears), update this file. The next `guild-verify` and `guild-ship` will use the new bar.
```

## OKF Knowledge Bundle templates

### Template: `knowledge/index.md`

```markdown
---
okf_version: "0.1"
title: <Project Name> Knowledge Base
description: Living knowledge base for <Project Name> — navigable by humans and agents.
timestamp: <ISO 8601 date of init>
---

# <Project Name> Knowledge Base

This directory is an [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) knowledge bundle.
It is the canonical source of synthesized understanding about this codebase — architecture decisions, domain vocabulary, coding conventions, and known pitfalls.

**For agents:** Query this directory before reading raw source files. Use specific concept paths instead of scanning multiple files.

---

# Architecture

<!-- Add links to architecture concepts as they are discovered. -->
<!-- Example: * [Overview](architecture/overview.md) - High-level system design -->

# Decisions

* [Decision Log](decisions.md) - Architectural decisions and rationale

# Conventions

* [Coding Conventions](conventions.md) - Style, naming, and patterns

# Gotchas

* [Known Pitfalls](gotchas.md) - Common mistakes and fix patterns
```

### Template: `knowledge/decisions.md`

```markdown
---
type: Decision Log
title: Architectural Decisions
description: Record of significant architectural decisions and their rationale.
timestamp: <ISO 8601 date of init>
---

# Architectural Decisions

A chronological log of significant decisions made in this project. Each entry records what was decided, why, and what alternatives were rejected.

---

<!-- Add entries as decisions are made. Format:

## AD-001: <Short title>

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by AD-NNN | Deprecated

**Decision:** <What was decided in one sentence.>

**Rationale:** <Why this decision was made.>

**Alternatives rejected:** <What else was considered and why it was not chosen.>

-->
```

### Template: `knowledge/conventions.md`

```markdown
---
type: Reference
title: Coding Conventions
description: Coding standards, naming rules, and patterns used in this project.
timestamp: <ISO 8601 date of init>
---

# Coding Conventions

Conventions discovered or established for this project. Agents must follow these when writing or modifying code.

---

<!-- Add conventions as they are established. Format:

## <Convention name>

**Rule:** <The rule in one sentence.>

**Rationale:** <Why this rule exists.>

**Example:**
```<language>
// good
// bad
```

-->
```

### Template: `knowledge/gotchas.md`

```markdown
---
type: Reference
title: Known Pitfalls
description: Common mistakes, tricky areas, and their fix patterns.
timestamp: <ISO 8601 date of init>
---

# Known Pitfalls

Gotchas encountered in this project. Agents must check this file before working in areas marked as tricky.

---

<!-- Add gotchas as they are discovered. Format:

## <Short description of the pitfall>

**Where:** <File, module, or area affected.>

**Symptom:** <What goes wrong.>

**Fix:** <How to avoid or fix it.>

-->
```

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "The project is empty, no DoD needed." | Step 4 scaffolds the file. An empty bar is valid; `guild-verify` logs `DoD: empty/absent; skipped`. The slot must exist for the log to be accurate. |
| "I'll write the DoD later." | Step 4 scaffolds an empty template now. Filling it in later does not block init; overwriting an existing file later is what the rule prevents. |
| "I can overwrite DoD on re-run if it looks stale." | Step 4 says do NOT overwrite. Re-running `guild-init` must not modify a customized DoD file. |
| "I can overwrite OKF files on re-run." | Step 5 says do NOT overwrite. Re-running `guild-init` must not modify existing OKF knowledge files — they accumulate project knowledge over time. |

## Red Flags

- `.guild/knowledge/definition-of-done.md` was overwritten on re-run of `guild-init` when the file already existed.
- `context/project.md` or `context/state.md` written to the wrong location (must be under `.guild/context/`).
- The DoD template was scaffolded with project-specific items pre-filled (the template is empty by design; the human fills it).
- `.guild/` was created at a non-root path (e.g., inside `packages/`).

## Verification

The skill is complete when ALL of the following evidence is present:

- `.guild/context/project.md`, `context/roadmap.md`, `context/state.md`, `context/handoff.md` exist (or were already present and untouched).
- `.guild/knowledge/definition-of-done.md` exists (or was already present and untouched).
- `.guild/knowledge/index.md`, `decisions.md`, `conventions.md`, `gotchas.md` exist (or were already present and untouched).
- Re-running `guild-init` does NOT modify existing `.guild/knowledge/definition-of-done.md` or OKF knowledge files.

**"Seems right" is not evidence.** Every claim of "this project is initialized" cites the file path and the section that was written.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — canonical `.guild/` layout and DoD slot placement.
- [guild-load](guild-load) — loads the context this skill scaffolds.
- [guild-verify](guild-verify) — consumes the DoD file this skill scaffolds.
- [guild-ship](guild-ship) — consumes the DoD file this skill scaffolds.

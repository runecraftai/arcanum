---
name: guild-init
description: >
  Bootstrap Guild project state for first-run setup or new project initialization.
  Creates `.guild/context/*` scaffolding (project.md, roadmap.md, state.md, handoff.md)
  AND `.guild/knowledge/definition-of-done.md`. Legacy `.specs/` is fallback only —
  never write to it.
license: CC-BY-4.0
---

# guild-init

First-run project bootstrap only — creates the canonical `.guild/context/` files and the project-wide Definition-of-Done slot.

## Overview

Scaffold the `.guild/context/` files (project, roadmap, state, handoff) and `.guild/knowledge/definition-of-done.md` (the project-wide standing bar consumed by `guild-verify` and `guild-ship`). Read legacy `.specs/` only when `.guild/context/` is empty or stale; never write to `.specs/`. Never overwrite an existing `.guild/knowledge/definition-of-done.md`.

## When to Use

- A new project is being initialized in a directory with no `.guild/` tree.
- The user explicitly asks to bootstrap Guild state for a fresh project.
- The next step is scaffolding, not planning or execution.

**Do NOT use for**: feature spec authoring (use `guild-spec`), planning (use `guild-plan`), or executing an existing plan (use `guild-execute`).

## Primary inputs

- The current working directory (the project root)
- Legacy `.specs/project/*` files (read-only fallback when `.guild/context/` is empty)

## Primary outputs

- `.guild/context/project.md` — project identity
- `.guild/context/roadmap.md` — high-level milestones
- `.guild/context/state.md` — current status, blockers, active focus
- `.guild/context/handoff.md` — session handoff summary
- `.guild/knowledge/definition-of-done.md` — project-wide standing bar (scaffolded empty; do NOT overwrite)

## Process

1. Confirm the target directory is the project root. If `.guild/` already exists, switch to step 4 (only create missing files).
2. Create `.guild/context/` and `.guild/knowledge/` directories if absent.
3. Scaffold `context/project.md`, `context/roadmap.md`, `context/state.md`, `context/handoff.md` from the templates below. Use stub content with TODO markers; the human fills them in.
4. Scaffold `knowledge/definition-of-done.md` from the template below. **If the file already exists, do NOT touch it.** Re-running `guild-init` must not modify a customized DoD file.
5. Read legacy `.specs/project/*` only when the new `context/` files are empty; import relevant content as needed. Never create new files in `.specs/`.
6. Leave historical artifacts (anything already in `.specs/`, `.notebook/`, `archive/`) untouched.

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

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "The project is empty, no DoD needed." | Step 4 scaffolds the file. An empty bar is valid; `guild-verify` logs `DoD: empty/absent; skipped`. The slot must exist for the log to be accurate. |
| "I'll write the DoD later." | Step 4 scaffolds an empty template now. Filling it in later does not block init; overwriting an existing file later is what the rule prevents. |
| "I can overwrite DoD on re-run if it looks stale." | Step 4 says do NOT overwrite. Re-running `guild-init` must not modify a customized DoD file. |
| "Legacy `.specs/` has the project info, skip context scaffolding." | Step 5 reads `.specs/` as fallback. The canonical state is still `.guild/context/`; legacy is a read source, not a destination. |
| "I'll create both `.specs/` and `.guild/` for safety." | `.specs/` is fallback only. Step 6 says historical artifacts stay untouched, but new work goes to `.guild/` only. Dual-write produces drift. |

## Red Flags

- `.guild/knowledge/definition-of-done.md` was overwritten on re-run of `guild-init` when the file already existed.
- `context/project.md` or `context/state.md` written under `.specs/` instead of `.guild/context/`.
- A new file was created in `.specs/` (legacy is read-only).
- The DoD template was scaffolded with project-specific items pre-filled (the template is empty by design; the human fills it).
- `.guild/` was created at a non-root path (e.g., inside `packages/`).

## Verification

The skill is complete when ALL of the following evidence is present:

- `.guild/context/project.md`, `context/roadmap.md`, `context/state.md`, `context/handoff.md` exist (or were already present and untouched).
- `.guild/knowledge/definition-of-done.md` exists (or was already present and untouched).
- Re-running `guild-init` does NOT modify an existing `.guild/knowledge/definition-of-done.md`.
- No new files were created in `.specs/`.
- Legacy `.specs/` content was only read, not modified.

**"Seems right" is not evidence.** Every claim of "this project is initialized" cites the file path and the section that was written.

## See also

- [.guild/architecture.md](/.guild/architecture.md) — canonical `.guild/` layout and DoD slot placement.
- [guild-load](guild-load) — loads the context this skill scaffolds.
- [guild-verify](guild-verify) — consumes the DoD file this skill scaffolds.
- [guild-ship](guild-ship) — consumes the DoD file this skill scaffolds.

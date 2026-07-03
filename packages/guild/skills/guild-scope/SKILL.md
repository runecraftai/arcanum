---
name: guild-scope
description: >
  Classify the work into init, feature, or plan scope. Use to choose which
  `.guild/` artifacts are appropriate and how deep the planning should go.
license: CC-BY-4.0
---

# guild-scope

Choose the lightest artifact set that still fits the work.

## Overview

Classify the incoming request into a scope (init, feature, quick task, handoff) and pick the artifact set that matches. The classification drives which skills run next and which files get created.

## When to Use

- A new request arrives and the artifact set is not yet chosen.
- The user is unsure whether to write a spec, a plan, or just a quick task.
- The next step is scope classification, not spec authoring, planning, or execution.

**Do NOT use for**: spec authoring (use `guild-spec`), task decomposition (use `guild-plan`), implementation (use `guild-execute`), or verification (use `guild-verify`).

## Primary inputs

- The user request (text or transcript)
- `.guild/context/state.md` — current project state
- `.guild/plans/` — list of active plans (to avoid slug collisions)

## Process

1. Read the user request and identify the verb: bootstrap, ship, fix, refactor, research, configure, verify.
2. Classify the request into a scope using the scope → artifact mapping (see below).
3. Pick the slug: lowercase, hyphenated, unique across `.guild/plans/`. Reject slugs with uppercase, spaces, or non-`[a-z0-9-]` characters.
4. Pick the artifact set by scope (small = `tasks.md` only; medium = full plan; large = `spec.md` + `design.md` + `tasks.md` + extras).
5. Write a one-line scope decision to `.guild/plans/<slug>/state.md` (create the directory) so the next skill has a starting point.
6. Do not create historical migration work as part of scope selection. If the request is a migration, the scope is `feature` and the migration is the feature.

## Scope → artifact mapping (auto-sizing)

The complexity determines the depth:

| Scope | What | Artifact set |
|-------|------|--------------|
| **Small** | ≤3 files, one sentence | `tasks.md` only |
| **Medium** | Clear feature, <10 tasks | `spec.md` + `tasks.md` |
| **Large** | Multi-component feature | `spec.md` + `design.md` + `tasks.md` |
| **Complex** | Ambiguity, new domain | `spec.md` + `context.md` + `design.md` + `tasks.md` + `validation.md` |

**Rules:**
- Spec and tasks are always required — you always need to know WHAT and DO it
- Design is skipped when the change is straightforward (no architectural decisions, no new patterns)
- Context (user decisions for gray areas) is triggered when the feature has any implicit-requirement dimension (persistence/state, external calls, auth, payments, concurrency, state transitions)
- Validation (verifier report) is triggered for Large/Complex scopes after execution

**Scope-specific paths:**

| scope | primary path | artifact set |
|-------|-------------|--------------|
| Init | `.guild/context/project.md`, `.guild/context/roadmap.md` | `context/` files only |
| Feature | `.guild/plans/<slug>/` | sized per table above |
| Quick task | `.guild/plans/<slug>/tasks.md` | `tasks.md` only (small) |
| Handoff | `.guild/context/handoff.md`, `.guild/context/state.md` | `context/` files only |

**Safety valve:** Even when Tasks is skipped for Small scope, execution starts by listing atomic steps. If that listing reveals >5 steps or complex dependencies, stop and create a formal `tasks.md`.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "It's clearly small, no need to declare scope." | Step 2 requires explicit classification. "Clearly small" still needs a slug and an artifact set, even if the set is `tasks.md` only. |
| "I'll add tasks later, just start coding." | Step 4 picks the artifact set up front. `tasks.md` is the contract for `guild-execute`; a missing `tasks.md` blocks execution. |
| "The slug can be `My Feature`, it's just a name." | Step 3 requires lowercase, hyphenated slugs. Spaces and uppercase break shell and config tooling. |
| "Migrations are housekeeping, not a feature." | Step 6 says migrations are features. Housekeeping without a plan produces ad-hoc edits with no audit trail. |
| "I can re-decide scope mid-plan." | Re-deciding is allowed (update `state.md`) but the initial decision is what `guild-plan` and `guild-execute` consume. |

## Red Flags

- A plan directory created with a non-lowercase or non-hyphenated slug.
- `state.md` missing or empty (no scope decision recorded).
- The artifact set chosen does not match the scope (e.g., a "feature" with only `state.md`).
- A migration request was classified as a quick task.
- A new plan reuses a slug already present in `.guild/plans/`.

## Verification

The skill is complete when ALL of the following evidence is present:

- A scope classification is recorded (init, feature, quick task, handoff).
- A slug is chosen that is lowercase, hyphenated, and unique across `.guild/plans/`.
- The artifact set is recorded in `.guild/plans/<slug>/state.md`.

**"Seems right" is not evidence.** Every claim of "this is scoped correctly" cites the scope table row and the file path that records the decision.

## See also

- [guild-spec](guild-spec) — runs after this skill for `feature` scope.
- [guild-plan](guild-plan) — runs after `guild-spec` to produce `tasks.md`.
- [guild-execute](guild-execute) — runs after `guild-plan` once `tasks.md` exists.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

---
feature: spec-driven-v4
status: draft
scope: Large
created: 2026-04-28
owner: rehem
---

# spec-driven v4.0.0 — Full Migration to `.specs/`

## Problem Statement

The current spec-driven skill (v3.0.0) relies on a `docs/` knowledge base that is:

1. **Disconnected from specs** — `docs/project.md`, `docs/conventions.md`, and `docs/decisions.md` live outside the `.specs/` tree, creating split-brain context loading.
2. **Missing brownfield support** — No structured way to capture existing codebase knowledge (stack, architecture, conventions, integrations). Agents re-discover the same information every session.
3. **No verification chain** — The LOAD/LEARN phases lack explicit verification steps, leading to hallucinated context and drifted plans.
4. **No sub-agent alignment** — The skill predates the multi-agent system (Scout/Sage/Forge/Ward/Arbiter) and doesn't define delegation contracts.
5. **Missing scope tier** — Complex features (score ≥12) have no differentiated workflow, causing under-planning.
6. **No Discuss sub-step** — SPEC phase jumps straight to requirements without structured Q&A, producing specs with unstated assumptions.
7. **No UAT sub-step** — TEST phase lacks user-acceptance testing guidance.

v4.0.0 consolidates everything under `.specs/`, adds brownfield mapping, introduces a knowledge verification chain, aligns with the multi-agent protocol, and adds Complex scope tier + Discuss/UAT sub-steps.

## Goals

| ID | Goal | Measure |
|----|------|---------|
| G1 | Unified knowledge location | Zero references to `docs/` in SKILL.md and all references/ files |
| G2 | Brownfield-ready | `/map` command produces 7 codebase docs in `.specs/codebase/` |
| G3 | Verification chain | Every LOAD/LEARN cycle runs 5-step knowledge chain |
| G4 | Multi-agent delegation | `sub-agent-delegation.md` covers all 5 agents with contracts |
| G5 | Complex scope support | `scope-detection.md` includes Complex tier (score ≥12) with `context.md` artifact |

## Out of Scope

- Backward compatibility with v3 `docs/` paths — this is a breaking change
- Automated migration script from `docs/` to `.specs/` — manual migration by user
- Changes to the 7-phase structure (SPEC/PLAN/BUILD/TEST/REVIEW/SIMPLIFY/SHIP)
- Changes to the Herald/coordinator agent protocol
- UI or CLI tooling for `.specs/` management
- Graphify integration changes

## User Stories

### P1 — Must Have

- **US-01**: As a developer, I want all project knowledge in `.specs/project/` so I have a single source of truth.
- **US-02**: As a developer, I want a `/map` command that generates brownfield codebase docs so agents understand my existing codebase without repeated exploration.
- **US-03**: As Sage (planner agent), I want structured feature specs in `.specs/features/<name>/` so I can produce plans with full context.
- **US-04**: As Forge (executor agent), I want tasks with explicit file paths and "Done When" criteria so I can execute without ambiguity.
- **US-05**: As a developer, I want a STATE.md file that tracks decisions, blockers, lessons, and deferred items so context persists across sessions.
- **US-06**: As a developer, I want the LOAD phase to auto-detect and load `.specs/` context so I don't have to manually specify paths.

### P2 — Should Have

- **US-07**: As Sage, I want a Discuss sub-step in SPEC phase that generates `context.md` so unstated assumptions are captured.
- **US-08**: As a developer, I want a Complex scope tier (score ≥12) that requires `context.md` + `design.md` so large features get proper planning.
- **US-09**: As Forge, I want a knowledge verification chain (5 steps) so I don't execute based on hallucinated context.
- **US-10**: As Herald (coordinator), I want a sub-agent delegation reference so I know which tasks to route to which agent.
- **US-11**: As a developer, I want atomic commit policies in BUILD phase so each commit is reviewable in isolation.

### P3 — Nice to Have

- **US-12**: As a developer, I want a UAT sub-step in TEST phase so I can validate features from the user perspective.
- **US-13**: As a developer, I want quick tasks to produce a SUMMARY.md so completed quick fixes have a record.
- **US-14**: As a developer, I want a `project-init` reference that bootstraps PROJECT.md + ROADMAP.md so new projects start structured.

## Acceptance Criteria

| ID | Criterion | Traces To |
|----|-----------|-----------|
| SDV4-01 | `SKILL.md` references only `.specs/` paths; zero occurrences of `docs/project.md`, `docs/conventions.md`, `docs/decisions.md` | G1, US-01 |
| SDV4-02 | `knowledge-base.md` describes `.specs/project/` structure (PROJECT.md, ROADMAP.md, STATE.md) | G1, US-01 |
| SDV4-03 | `phase-map.md` exists and describes `/map` dispatch flow producing 7 codebase docs | G2, US-02 |
| SDV4-04 | `brownfield-mapping.md` exists with templates for all 7 codebase docs (STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS, CONCERNS) | G2, US-02 |
| SDV4-05 | `concerns.md` exists with guidance on populating CONCERNS.md (tech debt, risks, mitigation) | G2, US-02 |
| SDV4-06 | `state-global.md` defines global STATE.md schema with sections: decisions, blockers, lessons, todos, deferred | G1, US-05 |
| SDV4-07 | `state-management.md` updated to distinguish global `.specs/project/STATE.md` from feature `.specs/features/<name>/STATE.md` | G1, US-05 |
| SDV4-08 | `project-init.md` exists with steps to create PROJECT.md + ROADMAP.md from scratch | G1, US-14 |
| SDV4-09 | All 7 `phase-*.md` files use `.specs/` paths exclusively | G1, US-06 |
| SDV4-10 | `context-loading.md` updated with `.specs/` paths, on-demand codebase loading, 160k+ context budget | G1, US-06 |
| SDV4-11 | `knowledge-chain.md` exists with 5-step verification: Source → Freshness → Conflict → Gaps → Confidence | G3, US-09 |
| SDV4-12 | `phase-spec.md`, `phase-plan.md`, `phase-build.md` reference knowledge chain | G3, US-09 |
| SDV4-13 | `sub-agent-delegation.md` exists with delegation table for Scout/Sage/Forge/Ward/Arbiter, including input/output contracts | G4, US-10 |
| SDV4-14 | `phase-review.md` references Ward (security) and Arbiter (quality) via `sub-agent-delegation.md` | G4, US-10 |
| SDV4-15 | `scope-detection.md` includes Complex tier with score ≥12, requiring context.md artifact | G5, US-08 |
| SDV4-16 | `spec-discuss.md` exists defining the Discuss sub-step, integrated into `phase-spec.md` | US-07 |
| SDV4-17 | `phase-spec.md` updated to include Discuss sub-step that produces `context.md` for Large/Complex scope | US-07 |
| SDV4-18 | `test-uat.md` exists defining UAT sub-step, integrated into `phase-test.md` | US-12 |
| SDV4-19 | `phase-test.md` updated to include UAT sub-step | US-12 |
| SDV4-20 | `build-cycle.md` updated with atomic commit policy (one concern per commit, message format) | US-11 |
| SDV4-21 | `phase-plan.md` updated with auto-skip rules: Quick=skip, Medium=inline, Large=formal | US-04 |
| SDV4-22 | `phase-build.md` updated with safety valve + delegation reference | US-04 |
| SDV4-23 | `.skill-meta.json` version is `4.0.0` | G1 |
| SDV4-24 | `README.md` updated with new triggers, `/map`, and `.specs/` paths | G1 |
| SDV4-25 | `SKILL.md` header shows v4.0.0, dispatch includes MAP phase, LOAD/LEARN reference `.specs/` only | G1 |
| SDV4-26 | Verification pass: full read of SKILL.md + all references confirms zero `docs/` references | G1 |

## Success Criteria

1. **Completeness**: All 9 new reference files created, all 14 existing files updated, version bumped to 4.0.0.
2. **Consistency**: Zero references to `docs/project.md`, `docs/conventions.md`, or `docs/decisions.md` in any file under `packages/spells/skills/spec-driven/`.
3. **Self-containment**: A Forge agent can execute any task from `tasks.md` using only the task description + current file content, with no additional research needed.
4. **Traceability**: Every acceptance criterion traces to a goal or user story; every task traces to an acceptance criterion.

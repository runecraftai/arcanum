---
feature: spec-driven-tlc-learning-alignment
status: draft
scope: Large
created: 2026-06-04
owner: rehem
---

# spec-driven tlc learning alignment

## Problem Statement

The canonical `spec-driven` skill has a solid planning pipeline, but it still lags behind `tlc-spec-driven` in operational depth and workflow coverage.

Today the gap shows up in five ways:

1. **Project memory is split or incomplete**: `spec-driven` has LEARN-oriented knowledge capture, but it does not yet provide the same operational memory model as `tlc-spec-driven` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `HANDOFF.md`).
2. **Brownfield support is underspecified**: `spec-driven` can load codebase context, but it does not define the full brownfield mapping workflow and artifacts that `tlc-spec-driven` provides.
3. **Execution workflow is less explicit**: `quick mode`, `discuss`, `validate`, `interactive UAT`, and `session handoff` are richer and more operationally detailed in `tlc-spec-driven`.
4. **Reference implementation is incomplete**: `spec-driven` references a set of `references/*.md` files that do not currently exist, while `tlc-spec-driven` already ships a structured reference library.
5. **Learning support is missing as a first-class capability**: `spec-driven` has a LEARN phase for project knowledge capture, but it does not yet integrate the optional learner-facing exercise model from `learning-opportunities`.

The migration must align with the actual `tlc-spec-driven` path model, which uses `.specs/` as the artifact root. The updated `spec-driven` should standardize on `.specs/`, absorb the TLC workflow surface, and add an explicit optional learning layer without creating a second competing convention.

## Goals

- [ ] G1: Reach feature parity with `tlc-spec-driven` for planning and execution workflows
- [ ] G2: Add deliberate learning support without degrading delivery flow
- [ ] G3: Establish a single, unambiguous `.specs/` path model for artifacts
- [ ] G4: Keep the skill aligned with current agent policies, especially commit approval
- [ ] G5: Make the skill self-contained by materializing every referenced support file

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Rewrite `tlc-spec-driven` itself | The goal is to align `spec-driven`, not fork or replace TLC |
| Any change to existing repository spec artifacts under `.specs/` | This feature only updates the `spec-driven` skill definition and does not modify existing specs |
| Automatic migration tool for old specs | Adds delivery scope without being required for the skill rewrite |
| Changes to native OpenCode `plan` or `build` commands | Native command behavior is outside this skill boundary |
| Changes to Herald or workspace agent protocol files | Those are adjacent systems, not part of this feature |
| Implementing the actual skill changes in this spec phase | This document only specifies the work |

---

## User Stories

### P1: US-01 TLC workflow parity for the canonical skill ⭐ MVP

**User Story**: As a maintainer, I want `spec-driven` to cover the same core workflow surfaces as `tlc-spec-driven` so there is one canonical planning skill instead of two competing models.

**Why P1**: Without parity, teams keep splitting between two workflow models and the canonical skill remains incomplete.

**Acceptance Criteria**:

1. WHEN a maintainer reads `spec-driven/SKILL.md` THEN the skill SHALL document project init, roadmap, brownfield mapping, state management, session handoff, quick mode, discuss, validate, and UAT workflows.
2. WHEN a maintainer follows the documented project structure THEN the skill SHALL use `.specs/` consistently for project, codebase, feature, and quick-task artifacts.
3. WHEN the skill references a workflow detail THEN the referenced support file SHALL exist and match that workflow.

**Independent Test**: Review `SKILL.md` and referenced files and confirm all TLC workflow surfaces are present and internally linked.

---

### P1: US-02 Persistent planning memory and brownfield analysis

**User Story**: As a planner, I want `spec-driven` to define project-level and codebase-level artifacts so existing codebases can be mapped once and reused across sessions.

**Why P1**: Missing memory and mapping forces repeated rediscovery and weakens planning quality across sessions.

**Acceptance Criteria**:

1. WHEN a user initializes project planning THEN the skill SHALL define creation and use of `PROJECT.md`, `ROADMAP.md`, `STATE.md`, and `HANDOFF.md` under `.specs/project/`.
2. WHEN a user maps an existing codebase THEN the skill SHALL define generation of `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `STRUCTURE.md`, `TESTING.md`, `INTEGRATIONS.md`, and `CONCERNS.md` under `.specs/codebase/`.
3. WHEN work is paused or resumed THEN the skill SHALL define deterministic handoff and recovery behavior using `.specs/project/HANDOFF.md` and `.specs/project/STATE.md`.

**Independent Test**: Inspect the project-level and brownfield references and verify that all required artifacts and update rules are defined.

---

### P1: US-03 Execution quality and commit approval safety

**User Story**: As an executor, I want `spec-driven` to define quick mode, structured execution, verification, and approval-gated commits so implementation quality is consistent without violating current agent policy.

**Why P1**: Execution is where ambiguity becomes bad changes; the skill must stay disciplined without auto-committing work.

**Acceptance Criteria**:

1. WHEN a change qualifies as a quick task THEN the skill SHALL define entry criteria, size guardrails, verification expectations, and tracking behavior.
2. WHEN implementation work is executed THEN the skill SHALL define per-task verification and feature-level validation, including interactive UAT only for user-facing features.
3. WHEN the workflow discusses atomic commits THEN the skill SHALL preserve one-task-one-commit guidance but SHALL require explicit user approval before any commit happens.

**Independent Test**: Read the execution references and confirm there is no instruction that performs commits automatically.

---

### P2: US-04 Optional learning opportunities after meaningful work

**User Story**: As a learner, I want optional short exercises after meaningful changes so I can understand patterns instead of only consuming generated code.

**Why P2**: This improves long-term skill building, but it must not slow urgent delivery paths.

**Acceptance Criteria**:

1. WHEN work includes architectural decisions, new modules, refactors, or unfamiliar patterns THEN the skill SHALL allow offering an optional learning exercise.
2. WHEN a learning exercise is offered THEN the skill SHALL ask permission first and SHALL stop immediately after the question.
3. WHEN the work is a quick fix, hotfix, or urgent delivery THEN the skill SHALL not offer a learning exercise.

**Independent Test**: Review the learning reference and confirm it defines both triggers and anti-triggers.

---

### P2: US-05 LEARN separation from pedagogy

**User Story**: As a maintainer, I want `spec-driven` to distinguish project knowledge capture from learner exercises so operational memory and teaching behavior are not conflated.

**Why P2**: Mixing these concepts makes the workflow noisy and harder to reason about.

**Acceptance Criteria**:

1. WHEN the LEARN step is described THEN the skill SHALL define it as project-memory capture and state update.
2. WHEN learner exercises are described THEN the skill SHALL present them as optional, separate from required workflow completion.

**Independent Test**: Review `SKILL.md` and confirm LEARN and learning opportunities are documented as separate concerns.

---

### P3: US-06 Path ambiguity elimination

**User Story**: As a maintainer, I want path strategy rules centered on `.specs/` only so the migration does not create ambiguous storage behavior.

**Why P3**: This is mainly a consistency and maintenance concern once the core workflow is already correct.

**Acceptance Criteria**:

1. WHEN examples, templates, or artifact paths are documented THEN they SHALL point to `.specs/`.
2. WHEN path strategy is described THEN the skill SHALL state that `.specs/` is canonical for this workflow.

**Independent Test**: Search the rewritten skill package and verify the documented artifact root is `.specs/`.

---

## Edge Cases

- WHEN the repository already has historical specs in `.specs/archive/` THEN the skill SHALL avoid loading archived documents by default.
- WHEN the repository already has active or archived files under `.specs/` THEN this feature SHALL not migrate, rename, relocate, or rewrite those existing spec artifacts as part of the skill alignment work.
- WHEN a feature appears small at first but execution planning reveals more than five steps or complex dependencies THEN the skill SHALL escalate from implicit execution to formal `tasks.md`.
- WHEN a workflow references TLC-style commits THEN the skill SHALL preserve the discipline but SHALL not imply auto-commit behavior.
- WHEN the change is pedagogically interesting but the user signaled urgency THEN the skill SHALL skip learner exercises.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| STL-01 | P1: TLC workflow parity for the canonical skill | Design | Pending |
| STL-02 | P1: Persistent planning memory and brownfield analysis | Design | Pending |
| STL-03 | P1: Persistent planning memory and brownfield analysis | Design | Pending |
| STL-04 | P1: Execution quality and commit approval safety | Design | Pending |
| STL-05 | P1: Execution quality and commit approval safety | Design | Pending |
| STL-06 | P1: TLC workflow parity for the canonical skill | Design | Pending |
| STL-07 | P2: Optional learning opportunities after meaningful work | Design | Pending |
| STL-08 | P2: LEARN separation from pedagogy | Design | Pending |
| STL-09 | P3: Path ambiguity elimination | Design | Pending |
| STL-10 | P3: Path ambiguity elimination | Design | Pending |
| STL-11 | P1: Execution quality and commit approval safety | Design | Pending |
| STL-12 | P1: TLC workflow parity for the canonical skill | Design | Pending |

**ID format:** `STL-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 12 total, 12 mapped to stories, 0 unmapped

---

## Detailed Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| STL-01 | Update `spec-driven/SKILL.md` to reflect TLC-level workflow coverage | P1 | `SKILL.md` includes project init, roadmap, brownfield mapping, quick mode, discuss, validate, UAT, pause, and resume triggers |
| STL-02 | Define project-level operational memory artifacts | P1 | `SKILL.md` and references define `PROJECT.md`, `ROADMAP.md`, `STATE.md`, and `HANDOFF.md` with clear creation and update rules |
| STL-03 | Define brownfield mapping artifacts | P1 | Brownfield mapping reference covers `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `STRUCTURE.md`, `TESTING.md`, `INTEGRATIONS.md`, and `CONCERNS.md` |
| STL-04 | Define execution flow with validation depth | P1 | Execution references cover per-task verification, feature-level validation, and interactive UAT for user-facing work |
| STL-05 | Add quick mode workflow and guardrails | P1 | Quick mode reference defines entry criteria, max-size guardrails, verification expectations, and tracking behavior |
| STL-06 | Add discuss/context capture workflow | P1 | `spec-driven` defines when gray areas trigger discussion and when `context.md` is produced |
| STL-07 | Add optional learning exercise layer | P2 | `spec-driven` includes an explicit optional learning-offer step with trigger rules, stop conditions, and question-first behavior |
| STL-08 | Keep LEARN distinct from teaching | P2 | `SKILL.md` clearly distinguishes project knowledge capture from learner-facing exercises |
| STL-09 | Standardize on `.specs/` paths | P1 | The skill documents `.specs/` as the single workflow path for artifacts and examples |
| STL-10 | Eliminate path ambiguity | P2 | The skill explicitly rejects parallel `.spec/` usage in this workflow and defines `.specs/` as canonical |
| STL-11 | Preserve atomic commit discipline with approval gate | P1 | Execution docs preserve one-task-one-commit guidance but state that commits only occur after explicit user approval |
| STL-12 | Materialize missing references | P1 | Every `references/*.md` file named from `SKILL.md` exists after implementation |

---

## Acceptance Criteria

| ID | Criterion | Traces To |
|----|-----------|-----------|
| STLA-01 | `~/.config/opencode/skills/spec-driven/SKILL.md` documents the same top-level workflow surfaces currently documented in `tlc-spec-driven/SKILL.md` | G1, US-01, STL-01 |
| STLA-02 | `spec-driven` documents project initialization that creates `PROJECT.md` and `ROADMAP.md` | G1, US-02, STL-02 |
| STLA-03 | `spec-driven` documents `STATE.md` and `HANDOFF.md` with pause/resume semantics | G1, US-02, STL-02 |
| STLA-04 | A brownfield mapping reference exists and defines all seven codebase artifacts from the TLC model | G1, US-02, STL-03 |
| STLA-05 | `spec-driven` includes quick mode with explicit eligibility rules and verification guardrails | G1, US-03, STL-05 |
| STLA-06 | `spec-driven` includes a discuss/context workflow that states when `context.md` is created | G1, US-01, STL-06 |
| STLA-07 | `spec-driven` includes validation guidance covering per-task verification and feature-level validation | G1, US-03, STL-04 |
| STLA-08 | `spec-driven` includes interactive UAT guidance for user-facing features only | G1, US-03, STL-04 |
| STLA-09 | `spec-driven` includes a learner-facing optional exercise workflow derived from `learning-opportunities` | G2, US-04, STL-07 |
| STLA-10 | The learner-facing workflow explicitly says to ask before starting and stop immediately after asking the question | G2, US-04, STL-07 |
| STLA-11 | `spec-driven` explicitly distinguishes LEARN as project-memory capture from optional learner exercises | G2, US-05, STL-08 |
| STLA-12 | `spec-driven` explicitly uses `.specs/` as the workflow path for artifacts and examples | G3, US-06, STL-09 |
| STLA-13 | `spec-driven` states that `.specs/` is canonical and does not define a parallel `.spec/` workflow | G3, US-06, STL-10 |
| STLA-14 | Execution references preserve atomic commit boundaries while stating that actual commits require explicit user approval | G4, US-03, STL-11 |
| STLA-15 | Every reference file cited by `spec-driven/SKILL.md` exists after the implementation | G5, US-06, STL-12 |
| STLA-16 | The final skill text contains no instruction that auto-commits code without user approval | G4, US-03, STL-11 |
| STLA-17 | The feature scope explicitly excludes any modification to existing `.specs/` artifacts in the repository | G3, US-06 |

---

## Path Strategy

The implementation must define a single artifact root:

1. `spec-driven` must use `.specs/`.
2. The implementation must not introduce `.spec/` as a parallel convention.
3. All workflow examples, references, and generated artifact paths must point to `.specs/`.

Path selection must be deterministic and unambiguous.

---

## Success Criteria

1. `spec-driven` becomes the single canonical skill for this workflow, with no major operational gaps relative to `tlc-spec-driven`.
2. The skill gains an explicit optional teaching layer without making delivery workflows slower or more intrusive.
3. The skill documents and uses `.specs/` consistently, matching the TLC workflow model without introducing an alternate root.
4. All referenced files required by the rewritten skill exist and are internally consistent.
5. The resulting skill remains aligned with current OpenCode execution policy, especially around commits.
6. Existing repository artifacts already stored under `.specs/` remain untouched by this feature unless separately requested.

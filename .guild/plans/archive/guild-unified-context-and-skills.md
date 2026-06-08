# Guild Unified Context and Skills

## TL;DR
> **Summary**: Consolidate Guild's working memory and planning artifacts under `.guild/`, keep `plans/` as the unit of work, enrich existing Guild skills around this new source of truth, and add fallback reads from `.specs/`, `.notebook/`, and repo docs only when `.guild/` lacks the needed context.
> **Estimated Effort**: Large

## Context

### Original Request
Unify the documentation and operational memory that Guild uses so it prefers a single source of truth inside `.guild/`. Preserve direct Guild-style execution, keep `spec.md` / `design.md` / `tasks.md` outputs, avoid dependence on `.specs/` and `.notebook/` as primaries, and enrich Guild's own skills rather than replacing orchestration with a codenavi-like workflow.

### Key Findings
- Current Guild skills are intentionally lightweight and direct, but lack strong context-loading, memory, and discovery conventions.
- Existing flows in `spec-driven` and `tlc-spec-driven` provide useful ideas for init, scope sizing, learning capture, and fallback loading.
- `plans/` is preferred as the main work unit over `features/`.
- Global source-of-truth docs should live under `.guild/context/` and `.guild/knowledge/`.
- Legacy `.specs/` and `.notebook/` should be read only as fallback or migration input.

## Objectives

### Core Objective
Make `.guild/` the canonical planning, context, and learning root for Guild, while preserving the current direct execution style.

### Definition of Done
- [ ] `.guild/` has a clear canonical structure centered on `context/`, `knowledge/`, `plans/`, and `archive/`
- [ ] Guild skill responsibilities are redefined around this structure
- [ ] Fallback loading order from legacy sources is documented and enforced
- [ ] A discovery-oriented Guild skill exists for codebase lookup without taking over orchestration
- [ ] Plan, handoff, and learning flows write to `.guild/` first
- [ ] Docs and examples describe the new conventions clearly

## Proposed Structure

```text
.guild/
  context/
    project.md
    roadmap.md
    state.md
    handoff.md
  knowledge/
    index.md
    decisions.md
    conventions.md
    gotchas.md
  plans/
    <slug>/
      spec.md
      design.md
      tasks.md
      state.md
      notes.md
  archive/
    <slug>/
```

## Loading Order

1. `.guild/context/*`
2. active `.guild/plans/<slug>/*`
3. `.guild/knowledge/*`
4. recent `.guild/` handoff/session-style notes if present
5. fallback: `.specs/*`
6. fallback: `.notebook/*`
7. fallback: repo docs and code

## TODOs

- [x] 1. Define canonical `.guild/` information architecture
  **What**: Finalize the structure, file responsibilities, naming rules, and ownership boundaries for `.guild/context`, `.guild/knowledge`, `.guild/plans/<slug>`, and `.guild/archive`.
  **Files**: `.guild/` docs/design artifact to be created
  **Acceptance**: Every file in the proposed structure has a clear purpose; no ambiguity remains between plan-local vs global state

- [x] 2. Map current Guild behavior to the new structure
  **What**: Audit where Guild currently reads and writes plans, state, handoff, and learnings in code and docs. Identify what must change to prefer `.guild/` as canonical.
  **Files**: `packages/guild/src/**`, `packages/guild/docs/**`, `packages/guild/skills/**`
  **Acceptance**: A migration map exists from current locations to new `.guild/` locations, including fallback behavior

- [x] 3. Redesign Guild skill responsibilities
  **What**: Rewrite the responsibility boundaries for `guild-load`, `guild-scope`, `guild-spec`, `guild-plan`, `guild-execute`, `guild-handoff`, `guild-commit-learning`, `guild-review`, `guild-verify`, `guild-security`, and `guild-ship` around the new `.guild/` structure.
  **Files**: `packages/guild/skills/*/SKILL.md`
  **Acceptance**: Each skill has a crisp role, primary inputs under `.guild/`, and documented fallback rules

- [x] 4. Design a new Guild discovery skill
  **What**: Create a Guild-native discovery/recon skill inspired by codenavi for file lookup, flow tracing, and convention discovery only. It must not own orchestration.
  **Files**: `packages/guild/skills/<new-skill>/SKILL.md`
  **Acceptance**: The skill's scope is limited to discovery; it records useful findings into `.guild/knowledge` or plan-local notes

- [x] 5. Add init and setup conventions under `.guild/`
  **What**: Bring the useful setup ideas from `tlc-spec-driven` into Guild's lighter style so first-run project bootstrap creates `.guild/context/*` and basic planning scaffolds.
  **Files**: `packages/guild/skills/guild-init/SKILL.md`, docs/config or workflow docs as needed
  **Acceptance**: First-run setup guidance exists and targets `.guild/`, not `.specs/`

- [x] 6. Define direct planning output formats
  **What**: Keep Guild's direct style while standardizing `spec.md`, `design.md`, `tasks.md`, `state.md`, and `notes.md` inside `.guild/plans/<slug>/`.
  **Files**: `.guild/plans/FORMATS.md` — canonical format doc with what-goes-where and anti-patterns per file
  **Acceptance**: Formats are concise, execution-oriented, and sufficient for resume/handoff/verification

- [x] 7. Define learning and memory promotion rules
  **What**: Specify how plan-local notes become durable project knowledge in `.guild/knowledge`, and how `context/state.md` differs from `knowledge/*`.
  **Files**: `packages/guild/skills/guild-commit-learning/SKILL.md`, `packages/guild/skills/guild-handoff/SKILL.md`, docs as needed
  **Acceptance**: There are clear rules for when to update `knowledge/`, `context/state.md`, or only plan-local notes

- [x] 8. Specify legacy fallback and migration behavior
  **What**: Define how Guild should read `.specs/` and `.notebook/` during transition, whether to import, mirror, or merely reference legacy artifacts, and when fallback should stop.
  **Files**: docs/design artifact to be created
  **Acceptance**: Fallback order is explicit; no legacy path is treated as canonical

- [x] 9. Update docs to present `.guild/` as canonical
  **What**: Revise Guild docs so users see `.guild/` as the primary workspace for context, plans, learning, and archive flows.
  **Files**: `packages/guild/docs/**`
  **Acceptance**: Docs consistently describe `.guild/` first and mention legacy paths only as fallback or migration notes

- [x] 10. Implement and validate the new workflow end-to-end
  **What**: Apply the code, skill, and docs changes; then validate init, planning, execution, handoff, and learning behavior against the new `.guild/` conventions.
  **Files**: `packages/guild/**`, `.guild/**` examples/tests if added
  **Acceptance**: End-to-end flow works with `.guild/` as source of truth and only uses legacy sources as fallback

## Verification
- [x] T01: `.guild/` structure is documented and internally consistent
- [x] T02: Current Guild reads/writes are mapped to new canonical locations
- [x] T03: Guild skills are redefined around `.guild/`
- [x] T04: Discovery skill exists with non-orchestrator scope
- [x] T05: Init/setup flow targets `.guild/context/*`
- [x] T06: Plan artifact formats are standardized under `.guild/plans/<slug>/`
- [x] T07: Learning promotion rules are documented and usable
- [x] T08: Legacy fallback order is explicit and non-canonical
- [x] T09: Docs present `.guild/` as the primary workspace
- [x] T10: End-to-end validation confirms the new workflow

# Plan Artifact Formats

Canonical format specification for `.guild/plans/<slug>/` artifacts. Consumed by `guild-spec`, `guild-plan`, `guild-verify`, and Wizard planning agents.

## Artifact overview

| File | Required | Phase | Description |
|------|----------|-------|-------------|
| `spec.md` | Always | Specify | Requirements with traceable IDs |
| `context.md` | Complex only | Discuss | User decisions for gray areas |
| `design.md` | Large/Complex | Design | Architecture and components |
| `tasks.md` | Medium+ | Tasks | Atomic tasks with verification |
| `state.md` | Always | All | Plan-local status and blockers |
| `validation.md` | Large/Complex | Verify | Verifier PASS/FAIL report |

---

## `spec.md` — Specification

```markdown
# Spec: [Feature Name]

## Problem Statement
One paragraph describing the user-visible pain this feature solves.

## Goals
- [Goal 1] — independently checkable
- [Goal 2]

## Out of Scope
| Item | Rationale |
|------|-----------|
| [Non-goal 1] | [Why it's excluded] |

## User Stories
| Role | Want | So That | Acceptance Criteria |
|------|------|---------|---------------------|
| [role] | [capability] | [benefit] | REQ-001: [criterion] |
| [role] | [capability] | [benefit] | REQ-002: [criterion] |

## Edge Cases
- **Input**: [scenario] → **Expected**: [behaviour]

## Success Criteria
- [ ] [Observable criterion — a command, file path, or metric]
- [ ] **Estimated Effort**: Quick | Short | Medium | Large | XL
```

**Rules:**
- Every acceptance criterion has a `REQ-NNN` traceable ID
- Success criteria are observable (no "code is clean")
- Out-of-scope is explicit, not implicit

---

## `context.md` — User Decisions

```markdown
# Context: [Feature Name]

## Assumptions
- [Assumption 1]
- [Assumption 2]

## Decisions
- **Decision**: [What was decided] — **Rationale**: [Why]

## Clarifications
| Question | Answer | Date |
|----------|--------|------|
| [Q1] | [A1] | YYYY-MM-DD |
```

**Rules:**
- Created during the discuss phase when the feature has implicit requirements
- Updated as decisions change or new clarifications emerge
- Promotable to `knowledge/decisions.md` for cross-cutting decisions

---

## `design.md` — Architecture

```markdown
# Design: [Feature Name]

## Architecture Overview
[High-level diagram or description]

## Components
### [Component Name]
- **Responsibility**: [What it does]
- **Dependencies**: [What it needs]
- **Interface**: [Public API shape]

## Data Flow
[How data moves through the system]

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| [Risk] | [How we mitigate] |
```

---

## `tasks.md` — Task Breakdown

```markdown
# Tasks: [Feature Name]

## TL;DR
> **Summary**: [One sentence]
> **Estimated Effort**: Quick | Short | Medium | Large | XL

## TODOs
- [ ] 1. **Task Title**
  **What**: [Description of what to build]
  **Files**: [path/to/file.ts (new|modify)]
  **Acceptance**: [Verifiable criterion]
  **REQ**: [REQ-NNN]

- [ ] 2. **Task Title**
  **What**: [Description]
  **Files**: [path/to/file.ts]
  **Acceptance**: [Verifiable criterion]
  **REQ**: [REQ-NNN]

## Verification
- [ ] [Verification step — test command, build, manual check]
```

**Rules:**
- Each task is atomic and independently verifiable
- Tasks ordered by dependency (prerequisites first)
- Every `REQ-NNN` from `spec.md` covered by at least one task
- Sub-fields (`**What**`, `**Files**`, `**Acceptance**`) are recommended but flexible
- Checkbox state drives execution progress (`[ ]` = pending, `[x]` = done)

---

## `state.md` — Plan Status

```markdown
# Status: [Feature Name]

- **Status**: draft | planned | in-progress | review | blocked | done
- **Blocker**: [Description or None]
- **Next Action**: [What the next agent should do]
- **Last Updated**: YYYY-MM-DD
```

---

## `validation.md` — Verifier Report

```markdown
# Validation: [Feature Name]

## Verdict: PASS | FAIL

## Per-AC Evidence
| REQ | Criterion | Status | Evidence |
|-----|-----------|--------|----------|
| REQ-001 | [criterion] | PASS | [file:line or command output] |
| REQ-002 | [criterion] | FAIL | [reason] |

## Gaps
1. [Gap description] — **Severity**: blocker | non-blocker
```

---

## Scope → artifact mapping (auto-sizing)

| Scope | Trigger | Artifacts |
|-------|---------|-----------|
| **Small** | ≤3 files, one sentence | `spec.md` (inline) + `state.md` |
| **Medium** | Clear feature, <10 tasks | `spec.md` + `tasks.md` + `state.md` |
| **Large** | Multi-component feature | `spec.md` + `design.md` + `tasks.md` + `state.md` + `validation.md` |
| **Complex** | Ambiguity, new domain | All artifacts including `context.md` |

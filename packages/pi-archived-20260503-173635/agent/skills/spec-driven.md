# Skill: Spec-Driven Planning

## Purpose

Structured planning methodology for features of any scope: Quick, Medium, or Large. Produces formal specs, design docs, and executable task lists.

## When to Use

- User requests a new feature or substantial refactor
- Scope is unclear — use LOAD phase to determine
- Feature spans multiple files or has complex dependencies
- Need formal documentation for handoff or review

## Methodology

### LOAD
Read available context: codebase structure, existing specs, user requirements, architecture docs. Determine scope (Quick/Medium/Large).

### SPECIFY
Write **spec.md**: what problem does this solve? Success criteria? Out-of-scope constraints? User-facing changes?

### DESIGN
Write **design.md**: architecture, data structures, module interactions, key decisions, risk assessment. Rationale for each choice.

### TASKS
Write **tasks.md**: checkpoint list of concrete, testable work items. Each task includes file paths, acceptance criteria, dependency order.

## Artifact Templates

**Spec** (200-400 lines):
- Problem statement
- Goals and success criteria
- Scope and constraints
- Key decisions (rationale)

**Design** (300-500 lines):
- Architecture overview (diagram)
- Module responsibilities
- Data flow and interactions
- Risk assessment
- File modification summary

**Tasks** (numbered checklist):
- Each task: `- [ ] N. Description (FILE:line)`
- Acceptance: testable condition
- Dependency order explicit
- Phase grouping (1, 2, 3...)

## Examples

- **Quick spec**: Single task, inline in spec.md
- **Medium spec**: spec.md + design.md + 5-10 tasks
- **Large spec**: Full three-file set + 15+ tasks across phases

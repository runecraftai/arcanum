---
feature: individual-skills-improvement
status: draft
scope: large
created: 2026-04-24
---

# Design: Individual Skills Improvement

## Architecture Overview

Each individual skill is a standalone, single-capability skill that maps to exactly one phase of the spec-driven pipeline. Skills are self-contained but act as "good neighbors" to spec-driven by referencing its detailed phase files for deep methodology.

```
spec-driven (orchestrator)
├── references/phase-plan.md ←── skills/planning/SKILL.md references
├── references/phase-build.md ←── skills/incremental-build/SKILL.md references
├── references/phase-test.md ←── skills/test-verification/SKILL.md references
├── references/phase-review.md ←── skills/code-review/SKILL.md references
├── references/phase-simplify.md ←── skills/code-simplification/SKILL.md references
└── references/phase-ship.md ←── skills/shipping/SKILL.md references
```

## Decision 1: SKILL.md Body Structure

**Decision**: Standardize all 6 skills to the following section order.

```markdown
---
name: <kebab-case>
description: "<What it does. When to use. Not for X.>"
license: CC-BY-4.0
metadata:
  author: rehem
  version: 1.0.0
---

# Skill: <Display Name>

<2-3 sentence overview paragraph>

## Triggers

| EN | PT |
|----|-----|
| <english phrase> | <portuguese phrase> |

## LOAD

<Context loading: what files to read, token budget, context summary format>

## <MAIN PHASE>

<Actionable steps numbered 1-N>
<Soft reference to spec-driven phase file>

## LEARN

<Session logging: what to capture, where to write>

## Examples

### Example 1: <title>
**Input**: <what the user says>
**Output**: <what the skill produces>
```

**Rationale**: Consistent structure reduces cognitive load for both agents and human readers. Matches spec-driven's own structure.

## Decision 2: Cross-Reference Strategy

**Decision**: Use soft text references, not file paths.

Each MAIN phase section ends with a note like:
```markdown
> **Deep dive**: For the full methodology, see spec-driven `references/phase-plan.md` and `references/vertical-slicing.md`.
```

**Rationale**: File paths break across installations. Soft references let the agent resolve the path from its loaded skill context. The skill remains functional without spec-driven installed.

## Decision 3: .skill-meta.json Schema

**Decision**: Use the following complete schema for all 6 skills.

```json
{
  "name": "<kebab-case skill name>",
  "version": "1.0.0",
  "description": "<matches frontmatter description>",
  "trigger": [
    "<EN trigger 1>",
    "<PT trigger 1>",
    "<EN trigger 2>",
    "<PT trigger 2>"
  ],
  "scope": ["medium", "large"],
  "audience": ["agent", "developer"],
  "dependencies": ["spec-driven"],
  "phases": ["<primary phase name>"]
}
```

**Rationale**: Matches the fields observed in spec-driven's .skill-meta.json. The `dependencies` field clarifies the relationship. The `trigger` array enables tooling to detect conflicts.

## Decision 4: Trigger Allocation (No Conflicts)

**Decision**: Each skill gets 4-6 trigger phrases (2-3 EN/PT pairs) that are distinct from spec-driven's triggers.

| Skill | EN Triggers | PT Triggers |
|-------|-------------|-------------|
| planning | "create task plan", "slice into tasks", "vertical slice this" | "criar plano de tarefas", "fatiar em tarefas", "fatiar feature" |
| incremental-build | "build next task", "execute build cycle", "run next step" | "executar próxima tarefa", "ciclo de build", "rodar próximo passo" |
| test-verification | "verify this works", "prove it works", "test verification" | "verificar que funciona", "provar que funciona", "verificação de testes" |
| code-review | "review this code", "review my changes", "code review" | "revisar este código", "revisar minhas mudanças", "revisão de código" |
| code-simplification | "simplify this code", "reduce complexity", "simplify module" | "simplificar este código", "reduzir complexidade", "simplificar módulo" |
| shipping | "ship this release", "prepare release", "create changelog" | "preparar release", "criar changelog", "lançar versão" |

**Conflict check against spec-driven**: None of these match spec-driven's triggers ("plan this feature", "specify X", "break this into tasks", "quick fix", "initialize project", "map codebase", etc.). The individual skill triggers are more specific and action-oriented.

## Decision 5: README.md Removal

**Decision**: Delete README.md from each skill folder.

**Rationale**: skill-architect rule: "No README.md inside the skill folder." The SKILL.md itself serves as documentation. README.md is redundant and may confuse tooling that auto-discovers skill files.

## Decision 6: Token Budget per Skill

**Decision**: Target 80-150 lines per SKILL.md.

| Section | Target Lines |
|---------|-------------|
| Frontmatter | 8-10 |
| Title + overview | 3-5 |
| Triggers table | 6-8 |
| LOAD phase | 15-25 |
| MAIN phase | 25-50 |
| LEARN phase | 10-15 |
| Examples | 15-30 |
| **Total** | **82-143** |

**Rationale**: Enough detail to be actionable, small enough to fit in agent context windows without crowding.

## Decision 7: LOAD Phase Content Pattern

**Decision**: All 6 skills share the same LOAD pattern with skill-specific additions.

Common LOAD steps (all skills):
1. Read `docs/project.md` for project overview
2. Read `docs/conventions.md` for coding patterns
3. Read 3 most recent `docs/sessions/*.md` for recent context
4. Check `.specs/project/STATE.md` for blockers and decisions

Skill-specific additions:
- planning: Read `spec.md` from current feature (if exists)
- incremental-build: Read `tasks.md` for current task, load referenced files
- test-verification: Read `tasks.md` for verification criteria, load test files
- code-review: Load changed files (from git diff or explicit list)
- code-simplification: Load target module/file for analysis
- shipping: Read `docs/decisions.md`, check `CHANGELOG.md`, `package.json`

## Decision 8: LEARN Phase Content Pattern

**Decision**: All 6 skills share the same LEARN pattern.

Steps:
1. Write session log to `docs/sessions/YYYY-MM-DD-<skill>-<slug>.md`
2. Record: what was done, decisions made, lessons learned, open items
3. If new conventions discovered → append to `docs/conventions.md`
4. If architectural decision made → suggest `create-adr`

## Components Modified

| Path | Action | Requirement |
|------|--------|-------------|
| `skills/planning/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/planning/.skill-meta.json` | Update | SKIL-08 |
| `skills/planning/README.md` | Delete | SKIL-09 |
| `skills/incremental-build/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/incremental-build/.skill-meta.json` | Update | SKIL-08 |
| `skills/incremental-build/README.md` | Delete | SKIL-09 |
| `skills/test-verification/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/test-verification/.skill-meta.json` | Update | SKIL-08 |
| `skills/test-verification/README.md` | Delete | SKIL-09 |
| `skills/code-review/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/code-review/.skill-meta.json` | Update | SKIL-08 |
| `skills/code-review/README.md` | Delete | SKIL-09 |
| `skills/code-simplification/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/code-simplification/.skill-meta.json` | Update | SKIL-08 |
| `skills/code-simplification/README.md` | Delete | SKIL-09 |
| `skills/shipping/SKILL.md` | Rewrite | SKIL-01 through SKIL-07, SKIL-10 |
| `skills/shipping/.skill-meta.json` | Update | SKIL-08 |
| `skills/shipping/README.md` | Delete | SKIL-09 |

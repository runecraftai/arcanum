---
feature: individual-skills-improvement
status: DONE
scope: large
created: 2026-04-24
completed: 2026-04-24
---

# Spec: Individual Skills Improvement

## Problem Statement

The 6 individual skills (planning, incremental-build, test-verification, code-review, code-simplification, shipping) are stubs of ~7-9 lines each. They lack YAML frontmatter, trigger definitions, detailed phases, examples, and complete metadata. They do not meet the quality bar established by spec-driven v3.0.0 or the skill-architect criteria.

## Goals

1. Upgrade all 6 skills from stubs to production-ready, standalone skill files
2. Ensure each skill meets skill-architect quality criteria
3. Establish cross-references to spec-driven phase reference files
4. Remove prohibited README.md files from skill folders

## Out of Scope

- Creating new skills beyond the existing 6
- Modifying spec-driven itself
- Creating new reference files in spec-driven/references/
- Implementing any code — this is documentation/specification work only

## Requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| SKIL-01 | P1 | Each SKILL.md has YAML frontmatter with name (kebab-case), description (What+When+Not-when, <1024 chars), license: CC-BY-4.0, metadata.author, metadata.version |
| SKIL-02 | P1 | Each SKILL.md defines EN/PT trigger pairs that do NOT conflict with spec-driven's 40+ triggers |
| SKIL-03 | P1 | Each SKILL.md has a detailed LOAD phase specifying what context to load from docs/, .specs/, codebase |
| SKIL-04 | P1 | Each SKILL.md has a detailed MAIN phase with specific, actionable steps (not vague placeholders) |
| SKIL-05 | P1 | Each SKILL.md has a LEARN phase with session logging instructions |
| SKIL-06 | P2 | Each SKILL.md includes 2-3 concrete input/output examples |
| SKIL-07 | P1 | Each SKILL.md is 80-150 lines (hard max: 500 lines) |
| SKIL-08 | P1 | Each .skill-meta.json has complete schema: name, version, description, trigger, scope, audience, dependencies, phases |
| SKIL-09 | P1 | README.md files inside skill folders are removed |
| SKIL-10 | P2 | Each SKILL.md cross-references the corresponding spec-driven reference file(s) for deep methodology |

## Skill-to-Phase Mapping

| Skill | spec-driven Phase | Primary Reference | Secondary References |
|-------|-------------------|-------------------|---------------------|
| planning | PLAN | phase-plan.md | vertical-slicing.md, task-format.md |
| incremental-build | BUILD | phase-build.md | build-cycle.md |
| test-verification | TEST | phase-test.md | prove-it-pattern.md |
| code-review | REVIEW | phase-review.md | review-axes.md |
| code-simplification | SIMPLIFY | phase-simplify.md | simplification-patterns.md |
| shipping | SHIP | phase-ship.md | (none) |

## Acceptance Criteria

- WHEN all 6 SKILL.md files are rewritten THEN each passes the skill-architect 9-point checklist
- WHEN an agent loads any individual skill THEN it gets enough context to execute the phase without needing spec-driven
- WHEN triggers are defined THEN no trigger phrase overlaps with spec-driven's trigger list
- WHEN .skill-meta.json is updated THEN it validates against the complete schema
- WHEN README.md files are removed THEN no skill folder contains a README.md

## Success Criteria

- 6/6 skills have SKILL.md files between 80-150 lines
- 6/6 skills have complete .skill-meta.json
- 0/6 skills have README.md in their folder
- 0 trigger conflicts with spec-driven

## Requirement Coverage

All requirements SKIL-01 through SKIL-10 must be verified per skill (6 × 10 = 60 checkpoints).

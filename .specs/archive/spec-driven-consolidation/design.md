---
feature: spec-driven-consolidation
status: draft
scope: Large
created: 2026-04-24
---

# Design: spec-driven-consolidation

## Architecture Overview

```
agent-skills/
├── skills/
│   ├── spec-driven/                    ← META-SKILL (v3.0.0)
│   │   ├── SKILL.md                    ← Router: LOAD inline + 7 phase dispatchers
│   │   ├── .skill-meta.json
│   │   └── references/                 ← 26 files (7 phase + 19 supporting)
│   │       ├── phase-spec.md
│   │       ├── phase-plan.md
│   │       ├── phase-build.md
│   │       ├── phase-test.md
│   │       ├── phase-review.md
│   │       ├── phase-simplify.md
│   │       ├── phase-ship.md
│   │       ├── scope-detection.md      ← from old spec-driven/references/
│   │       ├── spec-template.md        ← from old spec-driven/references/
│   │       ├── task-template.md        ← from old spec-driven/references/
│   │       ├── tasks-template.md       ← from old spec-driven/references/
│   │       ├── design-template.md      ← from old spec-driven/references/
│   │       ├── knowledge-base.md       ← from old spec-driven/references/
│   │       ├── session-template.md     ← from old spec-driven/references/ (deduplicated)
│   │       ├── skill-anatomy.md        ← from _shared/
│   │       ├── task-format.md          ← from _shared/
│   │       ├── state-management.md     ← from _shared/
│   │       ├── archive-workflow.md     ← from _shared/
│   │       ├── context-loading.md      ← from _shared/
│   │       ├── scope-discipline.md     ← from _shared/
│   │       ├── state-template.md       ← from _shared/
│   │       ├── vertical-slicing.md     ← from planning/references/
│   │       ├── build-cycle.md          ← from incremental-build/references/
│   │       ├── prove-it-pattern.md     ← from test-verification/references/
│   │       ├── review-axes.md          ← from code-review/references/
│   │       └── simplification-patterns.md ← from code-simplification/references/
│   ├── planning/                       ← individual skill (unchanged)
│   ├── incremental-build/              ← individual skill (unchanged)
│   ├── test-verification/              ← individual skill (unchanged)
│   ├── code-review/                    ← individual skill (unchanged)
│   ├── code-simplification/            ← individual skill (unchanged)
│   └── shipping/                       ← individual skill (unchanged)
├── README.md
├── package.json
└── install.js
```

## Technical Decisions

### TD-1: SKILL.md Router Architecture

**Decision**: LOAD phase runs inline in SKILL.md. After LOAD, SKILL.md pattern-matches the user's trigger against a dispatch table and loads the corresponding `references/phase-*.md` file.

**Structure** (~400-500 lines):
```
1. Header + metadata (~20 lines)
2. Quick Reference table: phases × triggers × scope (~40 lines)
3. Trigger dispatch table: PT+EN patterns → phase file (~80 lines)
4. LOAD phase (inline): context loading from docs/, .specs/ (~100 lines)
5. Scope detection logic (inline, references scope-detection.md) (~60 lines)
6. Phase routing instructions (~50 lines)
7. LEARN phase (inline): session logging, knowledge capture (~80 lines)
8. Resume/Pause logic (~40 lines)
9. Skill integrations table (~30 lines)
```

**Rationale**: LOAD and LEARN are cross-cutting concerns shared by all phases — they belong inline. Individual phase logic is phase-specific and better isolated in reference files. This keeps SKILL.md under 500 lines while making each phase deeply documented.

### TD-2: Phase Reference File Structure

Each `phase-*.md` file is self-contained and follows this structure:
```markdown
# Phase: <NAME>
## When
## Goal
## Steps
## Supporting References (links to other refs in this folder)
## Approval Gate (if applicable)
## Completion Criteria
```

**Source merge strategy**:
- Primary content: the individual skill's `SKILL.md` (workflow, steps, rules)
- Trigger context: the corresponding `commands/*.md` (when/how to invoke)
- Skill-specific references: inlined or linked (e.g., phase-build.md → references/build-cycle.md)

### TD-3: install.js Modes

**Decision**: Three install modes via CLI args.

| Mode | Command | Behavior |
|------|---------|----------|
| Default | `node install.js` | Install `skills/spec-driven/` only (meta-skill + all its references/) |
| All | `node install.js --all` | Install all skills under `skills/` |
| Specific | `node install.js --skill <name>` | Install named skill only |

**Target directory**: `~/.config/opencode/skills/<skill-name>/`

**Implementation approach**:
- Parse `process.argv` for flags (no arg parser dependency)
- Scan `skills/` for directories containing `SKILL.md`
- Recursive copy using `fs.cpSync()` (Node.js ≥ 16.7, stable in ≥ 18)
- `_shared/` and `commands/` are NOT installed (they're absorbed into meta-skill)

### TD-4: Migration Strategy — Move First, Then Create

**Order**:
1. Move individual skills to `skills/` (preserves git history via `git mv`)
2. Create meta-skill scaffold (new directory, new files)
3. Create phase reference files (new files)
4. Migrate supporting references (copy, then delete originals)
5. Update install.js (modify existing file)
6. Remove old directories (cleanup)
7. Update README.md (modify existing file)

**Rationale**: Moving first ensures individual skills are intact before any destructive operations. Creating the meta-skill before cleanup ensures we can reference original files while authoring phase files.

### TD-5: Deduplication Strategy

| File | Exists in | Resolution |
|------|-----------|------------|
| `session-template.md` | spec-driven/references/ + _shared/ | Keep spec-driven version (more complete); discard _shared/ copy |
| `design-template.md` | spec-driven/references/ + planning/references/ | Keep spec-driven version; planning/ keeps its own copy unchanged |
| `tasks-template.md` | spec-driven/references/ + planning/references/ | Keep spec-driven version; planning/ keeps its own copy unchanged |

### TD-6: Version Bump

**Decision**: Meta-skill is v3.0.0 (semver major bump).
- v1.x: original spec-driven (legacy)
- v2.x: SPECIFY-only spec-driven (current)
- v3.0.0: full lifecycle meta-skill (this feature)

`.skill-meta.json`:
```json
{
  "name": "spec-driven",
  "version": "3.0.0",
  "description": "Full lifecycle development pipeline — SPEC, PLAN, BUILD, TEST, REVIEW, SIMPLIFY, SHIP",
  "phases": ["spec", "plan", "build", "test", "review", "simplify", "ship"],
  "type": "meta-skill"
}
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SKILL.md exceeds 500 lines | Readability degrades | Phase logic in reference files, SKILL.md is pure routing |
| Phase files miss content from originals | Incomplete phase behavior | Checklist: verify each phase file covers all steps from source SKILL.md + command |
| install.js breaks npx flow | Users can't install | Test node install.js before finishing |
| Git history loss on move | Blame/log breaks | Use git mv for moves |

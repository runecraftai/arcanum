---
feature: spec-driven-consolidation
status: completed
scope: Large
created: 2026-04-24
total_tasks: 16
completed_count: 16
---

# Tasks: spec-driven-consolidation

## Execution Order

Phases must execute sequentially. Tasks within a phase can run in parallel unless dependencies are noted.

---

## Phase 1: Structure Setup

- [x] 1.1 Create `skills/` directory and move individual skills
  - Files: `planning/`, `incremental-build/`, `test-verification/`, `code-review/`, `code-simplification/`, `shipping/`
  - What: `git mv` each of the 6 skill directories from root into `skills/`
  - Acceptance: All 6 directories exist under `skills/` with identical content; no skill directories remain at root; `git status` shows renames
  - Size: S
  - Req: SDCON-01

- [x] 1.2 Scaffold `skills/spec-driven/` with `.skill-meta.json`
  - Files: `skills/spec-driven/.skill-meta.json`
  - What: Create `skills/spec-driven/` directory and `skills/spec-driven/references/` directory. Create `.skill-meta.json` with: name=spec-driven, version=3.0.0, type=meta-skill, phases array listing all 7 phases
  - Depends on: 1.1
  - Acceptance: Directory structure exists; `.skill-meta.json` is valid JSON with version "3.0.0" and 7 phases listed
  - Size: S
  - Req: SDCON-03

---

## Phase 2: Meta-Skill Core

- [x] 2.1 Author `skills/spec-driven/SKILL.md` router
  - Files: `skills/spec-driven/SKILL.md`
  - What: Create the meta-skill SKILL.md with: (1) header and Quick Reference table mapping phases to triggers, (2) PT+EN natural language trigger patterns for all 7 phases (SPEC, PLAN, BUILD, TEST, REVIEW, SIMPLIFY, SHIP), (3) LOAD phase inline — context loading from docs/, .specs/, sessions, (4) scope detection referencing `references/scope-detection.md`, (5) phase routing that loads `references/phase-*.md` based on matched trigger, (6) LEARN phase inline — session logging and knowledge capture, (7) Resume/Pause logic, (8) skill integrations table. Must be ≤ 500 lines total.
  - Depends on: 1.2
  - Acceptance: File exists; line count ≤ 500; contains trigger patterns in both PT and EN; references all 7 phase files; LOAD and LEARN phases are inline; scope detection references scope-detection.md
  - Size: M
  - Req: SDCON-02

---

## Phase 3: Phase Reference Files

All 7 tasks depend on 2.1. They are independent of each other.

- [x] 3.1 Create `references/phase-spec.md`
  - Files: `skills/spec-driven/references/phase-spec.md`
  - Source: `spec-driven/SKILL.md` (v2 SPECIFY logic) + `commands/spec.md`
  - What: Merge the SPECIFY workflow steps, clarification rules, artifact production (spec.md), and approval gate from old SKILL.md with the command trigger context from commands/spec.md. Reference supporting files: `scope-detection.md`, `spec-template.md`, `task-template.md`
  - Acceptance: Contains: When, Goal, Steps (scope detection, clarification, artifact production, approval gate), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.2 Create `references/phase-plan.md`
  - Files: `skills/spec-driven/references/phase-plan.md`
  - Source: `planning/SKILL.md` + `commands/plan.md`
  - What: Merge planning workflow (vertical slicing, task breakdown, dependency ordering) with command trigger context. Reference: `vertical-slicing.md`, `tasks-template.md`, `design-template.md`
  - Acceptance: Contains: When, Goal, Steps (design decisions, task breakdown, approval gate), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.3 Create `references/phase-build.md`
  - Files: `skills/spec-driven/references/phase-build.md`
  - Source: `incremental-build/SKILL.md` + `commands/build.md`
  - What: Merge incremental build workflow (build cycle, task execution, verification) with command trigger context. Reference: `build-cycle.md`
  - Acceptance: Contains: When, Goal, Steps (task execution loop, verification, blocker handling), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.4 Create `references/phase-test.md`
  - Files: `skills/spec-driven/references/phase-test.md`
  - Source: `test-verification/SKILL.md` + `commands/test.md`
  - What: Merge test verification workflow (prove-it pattern, test-first, verification) with command trigger context. Reference: `prove-it-pattern.md`
  - Acceptance: Contains: When, Goal, Steps (test strategy, execution, coverage), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.5 Create `references/phase-review.md`
  - Files: `skills/spec-driven/references/phase-review.md`
  - Source: `code-review/SKILL.md` + `commands/review.md`
  - What: Merge code review workflow (review axes, checklist, feedback) with command trigger context. Reference: `review-axes.md`
  - Acceptance: Contains: When, Goal, Steps (review axes, checklist, verdict), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.6 Create `references/phase-simplify.md`
  - Files: `skills/spec-driven/references/phase-simplify.md`
  - Source: `code-simplification/SKILL.md` + `commands/code-simplify.md`
  - What: Merge code simplification workflow (simplification patterns, refactoring steps) with command trigger context. Reference: `simplification-patterns.md`
  - Acceptance: Contains: When, Goal, Steps (pattern detection, simplification, verification), links to supporting refs
  - Size: S
  - Req: SDCON-04

- [x] 3.7 Create `references/phase-ship.md`
  - Files: `skills/spec-driven/references/phase-ship.md`
  - Source: `shipping/SKILL.md` + `commands/ship.md`
  - What: Merge shipping workflow (release checklist, changelog, versioning) with command trigger context
  - Acceptance: Contains: When, Goal, Steps (pre-ship checklist, release, post-ship), no missing source content
  - Size: S
  - Req: SDCON-04

---

## Phase 4: Migrate Supporting References

All 3 tasks depend on Phase 3 completion. They are independent of each other.

- [x] 4.1 Copy old `spec-driven/references/` files to new location
  - Files: `skills/spec-driven/references/` ← `spec-driven/references/{scope-detection,spec-template,task-template,tasks-template,design-template,knowledge-base,session-template}.md`
  - What: Copy all 7 files from `spec-driven/references/` to `skills/spec-driven/references/`. Preserve content exactly.
  - Acceptance: All 7 files present in new location; content is byte-identical to originals
  - Size: S
  - Req: SDCON-05

- [x] 4.2 Merge `_shared/` files into `skills/spec-driven/references/`
  - Files: `skills/spec-driven/references/` ← `_shared/{skill-anatomy,task-format,state-management,archive-workflow,context-loading,scope-discipline,state-template}.md`
  - What: Copy 7 unique files from `_shared/` to `skills/spec-driven/references/`. Skip `session-template.md` (already present from task 4.1). Verify no other duplicates.
  - Depends on: 4.1
  - Acceptance: 7 new files present; `session-template.md` NOT overwritten; total supporting refs = 14
  - Size: S
  - Req: SDCON-05

- [x] 4.3 Copy individual skill-specific reference files
  - Files: `skills/spec-driven/references/` ← `skills/planning/references/vertical-slicing.md`, `skills/incremental-build/references/build-cycle.md`, `skills/test-verification/references/prove-it-pattern.md`, `skills/code-review/references/review-axes.md`, `skills/code-simplification/references/simplification-patterns.md`
  - What: Copy 5 files from individual skills' `references/` directories into the meta-skill's `references/`. Individual skills retain their copies (no deletion).
  - Depends on: 1.1 (skills must be moved first)
  - Acceptance: 5 files present in `skills/spec-driven/references/`; source files still exist in individual skill directories
  - Size: S
  - Req: SDCON-05

---

## Phase 5: Update Tooling

- [x] 5.1 Update `install.js` for new structure
  - Files: `install.js`
  - What: Rewrite install.js to: (1) scan `skills/` directory for subdirectories containing `SKILL.md`, (2) default mode (no args): install only `skills/spec-driven/` to `~/.config/opencode/skills/spec-driven/`, (3) `--all` flag: install all found skills, (4) `--skill <name>` flag: install specific named skill, (5) remove logic for `_shared/` and `commands/` copying. Use `fs.cpSync()` for recursive copy. Keep zero external dependencies. Parse args via `process.argv` only. Target Node.js ≥ 18.
  - Depends on: Phase 4 complete
  - Acceptance: `node install.js` copies only spec-driven to target; `node install.js --all` copies all 7 skills; `node install.js --skill planning` copies only planning; no references to `_shared/` or `commands/`
  - Size: M
  - Req: SDCON-06

---

## Phase 6: Cleanup & Documentation

- [x] 6.1 Remove old root directories
  - Files: `spec-driven/` (root), `_shared/`, `commands/`
  - What: Delete the three old directories. Verify no other files reference them with broken paths.
  - Depends on: 5.1
  - Acceptance: Directories no longer exist; grep for `_shared/` and old `commands/` paths returns no hits in .js or .md files
  - Size: S
  - Req: SDCON-07

- [x] 6.2 Update `README.md`
  - Files: `README.md`
  - What: Rewrite README to reflect: (1) new `skills/` directory structure, (2) meta-skill concept, (3) install modes (default, --all, --skill), (4) phase overview table (SPEC → PLAN → BUILD → TEST → REVIEW → SIMPLIFY → SHIP), (5) trigger examples in PT and EN, (6) individual skill descriptions for standalone use
  - Depends on: 6.1
  - Acceptance: No references to old structure; install command examples match new install.js behavior; structure diagram matches actual files
  - Size: M
  - Req: SDCON-08

---

## Requirement Coverage

| Requirement | Tasks |
|------------|-------|
| SDCON-01 | 1.1 |
| SDCON-02 | 2.1 |
| SDCON-03 | 1.2 |
| SDCON-04 | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 |
| SDCON-05 | 4.1, 4.2, 4.3 |
| SDCON-06 | 5.1 |
| SDCON-07 | 6.1 |
| SDCON-08 | 6.2 |

## Execution Summary

- **Total tasks**: 16
- **Size breakdown**: 13 × S, 3 × M
- **Critical path**: 1.1 → 1.2 → 2.1 → 3.* → 4.* → 5.1 → 6.1 → 6.2

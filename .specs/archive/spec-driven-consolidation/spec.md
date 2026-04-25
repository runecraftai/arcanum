---
feature: spec-driven-consolidation
status: DONE
scope: Large
created: 2026-04-24
completed: 2026-04-24
---

# spec-driven-consolidation

## Problem Statement

The `agent-skills` repository has 7 skills scattered at root level, shared references in `_shared/`, and thin orchestrators in `commands/`. The current `spec-driven` skill (v2.0.0) covers only the SPECIFY phase, requiring users to manually invoke separate skills for PLAN, BUILD, TEST, REVIEW, SIMPLIFY, and SHIP. This creates friction:

1. **Discoverability** — Users must know 7 separate skill names and their triggers
2. **Fragmented lifecycle** — No single skill orchestrates the full development pipeline
3. **Flat structure** — Skills, shared refs, and commands at root creates noise
4. **Install complexity** — installer copies everything without granularity

## Goals

- [G1] Consolidate repo structure under `skills/` directory
- [G2] Create a `spec-driven` meta-skill (v3.0.0) that routes all 7 lifecycle phases through a single entry point
- [G3] Keep individual skills self-contained (unchanged content) for standalone installation
- [G4] Update `install.js` with granular install options (default, `--all`, `--skill <name>`)
- [G5] Absorb `_shared/`, `commands/`, and old `spec-driven/` into the new structure — then remove originals

## Out of Scope

- Changing content/logic of the 6 individual skills (planning, incremental-build, test-verification, code-review, code-simplification, shipping)
- Adding new phases or skills
- Changing package.json metadata beyond what's needed
- CI/CD pipeline changes
- Publishing to npm registry

## Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| SDCON-01 | Move 6 individual skills into `skills/` folder | P1 | All 6 skills exist under `skills/` with unchanged content; no skills remain at root |
| SDCON-02 | Create meta-skill `SKILL.md` router | P1 | Router file ≤ 500 lines; LOAD phase inline; routes to 7 phase reference files; PT+EN natural language triggers for all phases |
| SDCON-03 | Create meta-skill `.skill-meta.json` | P1 | Valid JSON; version 3.0.0; declares all 7 phases |
| SDCON-04 | Create 7 phase reference files | P1 | Each file merges corresponding skill's SKILL.md + command file content; self-contained |
| SDCON-05 | Migrate supporting references | P1 | All files from old `spec-driven/references/` and `_shared/` present in new location; `session-template.md` deduplicated |
| SDCON-06 | Update `install.js` | P1 | Scans `skills/` folder; default installs `spec-driven` only; `--all` installs all; `--skill <name>` installs specific; zero external deps; Node.js ≥ 18 |
| SDCON-07 | Remove old directories | P1 | `spec-driven/` (root), `_shared/`, `commands/` deleted; no broken references |
| SDCON-08 | Update `README.md` | P2 | Reflects new structure, install modes, meta-skill concept |

## Success Criteria

1. Running `node install.js` installs only `skills/spec-driven/` to `~/.config/opencode/skills/spec-driven/`
2. Running `node install.js --all` installs all 7 skills
3. Running `node install.js --skill planning` installs only `skills/planning/`
4. The installed `spec-driven` meta-skill correctly routes triggers to all 7 phases
5. No files remain at root except `skills/`, `README.md`, `package.json`, `install.js`, `.specs/`
6. All individual skills remain unchanged in content (diff shows only path changes)
7. `SKILL.md` is ≤ 500 lines

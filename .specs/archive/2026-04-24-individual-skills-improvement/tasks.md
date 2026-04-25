---
feature: individual-skills-improvement
status: pending
scope: large
created: 2026-04-24
---

# Tasks: Individual Skills Improvement

## Phase 1: Planning Skill

- [x] 1.1 Rewrite planning SKILL.md (`skills/planning/SKILL.md`)
  - Files: `skills/planning/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: planning, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table with EN/PT pairs: "create task plan"/"criar plano de tarefas", "slice into tasks"/"fatiar em tarefas", "vertical slice this"/"fatiar feature". Add LOAD phase loading docs/project.md, docs/conventions.md, recent sessions, and current spec.md. Add PLAN main phase with steps: analyze requirements, identify vertical slices, define task dependencies, produce tasks.md with traceability. Reference spec-driven `references/phase-plan.md` and `references/vertical-slicing.md`. Add LEARN phase with session logging. Add 2-3 examples showing input request → output task plan.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs with no spec-driven conflicts; LOAD, PLAN, LEARN sections present with actionable steps; 2+ examples included; file is 80-150 lines

- [x] 1.2 Update planning .skill-meta.json (`skills/planning/.skill-meta.json`)
  - Files: `skills/planning/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "planning", version: "1.0.0", description matching frontmatter, trigger array with all EN/PT phrases from SKILL.md, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["plan"]
  - Depends: 1.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers; description matches frontmatter

- [x] 1.3 Remove planning README.md (`skills/planning/README.md`)
  - Files: `skills/planning/README.md`
  - What: Delete the file. SKILL.md serves as the sole documentation.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 2: Incremental Build Skill

- [x] 2.1 Rewrite incremental-build SKILL.md (`skills/incremental-build/SKILL.md`)
  - Files: `skills/incremental-build/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: incremental-build, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table: "build next task"/"executar próxima tarefa", "execute build cycle"/"ciclo de build", "run next step"/"rodar próximo passo". Add LOAD phase loading tasks.md, referenced source files, and build state. Add BUILD main phase with steps: pick next unchecked task, load task context, implement change, verify acceptance criteria, mark complete, report. Reference spec-driven `references/phase-build.md` and `references/build-cycle.md`. Add LEARN phase. Add 2-3 examples showing task pickup → implementation → verification flow.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs with no spec-driven conflicts; LOAD, BUILD, LEARN sections present with actionable steps; 2+ examples included; file is 80-150 lines

- [x] 2.2 Update incremental-build .skill-meta.json (`skills/incremental-build/.skill-meta.json`)
  - Files: `skills/incremental-build/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "incremental-build", version: "1.0.0", description matching frontmatter, trigger array, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["build"]
  - Depends: 2.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers

- [x] 2.3 Remove incremental-build README.md (`skills/incremental-build/README.md`)
  - Files: `skills/incremental-build/README.md`
  - What: Delete the file.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 3: Test Verification Skill

- [x] 3.1 Rewrite test-verification SKILL.md (`skills/test-verification/SKILL.md`)
  - Files: `skills/test-verification/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: test-verification, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table: "verify this works"/"verificar que funciona", "prove it works"/"provar que funciona", "test verification"/"verificação de testes". Add LOAD phase loading tasks.md acceptance criteria, test files, source files under test. Add TEST main phase with steps: identify what to verify, write/run test, check output against acceptance criteria, report pass/fail with evidence. Reference spec-driven `references/phase-test.md` and `references/prove-it-pattern.md`. Add LEARN phase. Add 2-3 examples showing verification request → test execution → evidence output.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs; LOAD, TEST, LEARN sections present; 2+ examples; 80-150 lines

- [x] 3.2 Update test-verification .skill-meta.json (`skills/test-verification/.skill-meta.json`)
  - Files: `skills/test-verification/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "test-verification", version: "1.0.0", description matching frontmatter, trigger array, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["test"]
  - Depends: 3.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers

- [x] 3.3 Remove test-verification README.md (`skills/test-verification/README.md`)
  - Files: `skills/test-verification/README.md`
  - What: Delete the file.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 4: Code Review Skill

- [x] 4.1 Rewrite code-review SKILL.md (`skills/code-review/SKILL.md`)
  - Files: `skills/code-review/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: code-review, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table: "review this code"/"revisar este código", "review my changes"/"revisar minhas mudanças", "code review"/"revisão de código". Add LOAD phase loading changed files (git diff), project conventions, review criteria. Add REVIEW main phase with steps: identify changed files, apply review axes (correctness, clarity, performance, security, conventions), produce findings with severity levels, suggest fixes. Reference spec-driven `references/phase-review.md` and `references/review-axes.md`. Add LEARN phase. Add 2-3 examples showing review request → findings → recommendations.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs; LOAD, REVIEW, LEARN sections present; 2+ examples; 80-150 lines

- [x] 4.2 Update code-review .skill-meta.json (`skills/code-review/.skill-meta.json`)
  - Files: `skills/code-review/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "code-review", version: "1.0.0", description matching frontmatter, trigger array, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["review"]
  - Depends: 4.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers

- [x] 4.3 Remove code-review README.md (`skills/code-review/README.md`)
  - Files: `skills/code-review/README.md`
  - What: Delete the file.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 5: Code Simplification Skill

- [x] 5.1 Rewrite code-simplification SKILL.md (`skills/code-simplification/SKILL.md`)
  - Files: `skills/code-simplification/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: code-simplification, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table: "simplify this code"/"simplificar este código", "reduce complexity"/"reduzir complexidade", "simplify module"/"simplificar módulo". Add LOAD phase loading target files, complexity metrics, project conventions. Add SIMPLIFY main phase with steps: measure current complexity, identify simplification opportunities (extract function, inline, remove dead code, flatten nesting, reduce parameters), apply transformations, verify behavior preserved. Reference spec-driven `references/phase-simplify.md` and `references/simplification-patterns.md`. Add LEARN phase. Add 2-3 examples showing complex code → simplified code.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs; LOAD, SIMPLIFY, LEARN sections present; 2+ examples; 80-150 lines

- [x] 5.2 Update code-simplification .skill-meta.json (`skills/code-simplification/.skill-meta.json`)
  - Files: `skills/code-simplification/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "code-simplification", version: "1.0.0", description matching frontmatter, trigger array, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["simplify"]
  - Depends: 5.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers

- [x] 5.3 Remove code-simplification README.md (`skills/code-simplification/README.md`)
  - Files: `skills/code-simplification/README.md`
  - What: Delete the file.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 6: Shipping Skill

- [x] 6.1 Rewrite shipping SKILL.md (`skills/shipping/SKILL.md`)
  - Files: `skills/shipping/SKILL.md`
  - What: Replace 7-line stub with full skill file (80-150 lines). Include YAML frontmatter (name: shipping, description with What+When+Not-when, license: CC-BY-4.0, metadata.author: rehem, metadata.version: 1.0.0). Add triggers table: "ship this release"/"preparar release", "prepare release"/"lançar versão", "create changelog"/"criar changelog". Add LOAD phase loading package.json/version files, CHANGELOG.md, docs/decisions.md, git log since last tag. Add SHIP main phase with steps: determine version bump (semver), generate changelog entries, update version files, create release checklist, tag release. Reference spec-driven `references/phase-ship.md`. Add LEARN phase. Add 2-3 examples showing release request → changelog + version bump → tag.
  - Depends: none
  - Requirement: SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-10
  - Acceptance: File has YAML frontmatter with all required fields; triggers table has ≥2 EN/PT pairs; LOAD, SHIP, LEARN sections present; 2+ examples; 80-150 lines

- [x] 6.2 Update shipping .skill-meta.json (`skills/shipping/.skill-meta.json`)
  - Files: `skills/shipping/.skill-meta.json`
  - What: Replace minimal metadata with complete schema. Set name: "shipping", version: "1.0.0", description matching frontmatter, trigger array, scope: ["medium", "large"], audience: ["agent", "developer"], dependencies: ["spec-driven"], phases: ["ship"]
  - Depends: 6.1
  - Requirement: SKIL-08
  - Acceptance: JSON is valid; all fields present; trigger array matches SKILL.md triggers

- [x] 6.3 Remove shipping README.md (`skills/shipping/README.md`)
  - Files: `skills/shipping/README.md`
  - What: Delete the file.
  - Depends: none
  - Requirement: SKIL-09
  - Acceptance: File does not exist after deletion

## Phase 7: Verification

- [x] 7.1 Cross-check trigger conflicts
  - Files: all 6 `skills/*/SKILL.md`
  - What: Verify no trigger phrase from any individual skill matches spec-driven's trigger list. Also verify no two individual skills share the same trigger phrase.
  - Depends: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
  - Requirement: SKIL-02
  - Acceptance: Zero trigger conflicts found across all skills and spec-driven

- [x] 7.2 Validate line counts
  - Files: all 6 `skills/*/SKILL.md`
  - What: Count lines in each SKILL.md file. Verify each is between 80-150 lines (hard max 500).
  - Depends: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
  - Requirement: SKIL-07
  - Acceptance: All 6 files are 80-150 lines

- [x] 7.3 Validate .skill-meta.json schema
  - Files: all 6 `skills/*/.skill-meta.json`
  - What: Verify each JSON file is valid and contains all required fields: name, version, description, trigger, scope, audience, dependencies, phases.
  - Depends: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2
  - Requirement: SKIL-08
  - Acceptance: All 6 JSON files are valid and have all required fields

- [x] 7.4 Confirm README.md removal
  - Files: all 6 `skills/*/` directories
  - What: Verify no skill folder contains a README.md file.
  - Depends: 1.3, 2.3, 3.3, 4.3, 5.3, 6.3
  - Requirement: SKIL-09
  - Acceptance: `find skills/*/README.md` returns no results

## Execution Notes

- **Parallelism**: Phases 1-6 are independent and can execute in parallel. Phase 7 depends on all of 1-6.
- **Per phase**: Tasks X.1 must complete before X.2 (meta.json depends on SKILL.md content). Task X.3 (README removal) is independent within each phase.
- **Reference material**: When writing each SKILL.md, read the corresponding spec-driven reference file(s) listed in the spec's Skill-to-Phase Mapping table to incorporate accurate methodology details.

## Requirement Coverage

| Requirement | Tasks |
|-------------|-------|
| SKIL-01 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |
| SKIL-02 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1 |
| SKIL-03 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |
| SKIL-04 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |
| SKIL-05 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |
| SKIL-06 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |
| SKIL-07 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.2 |
| SKIL-08 | 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.3 |
| SKIL-09 | 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.4 |
| SKIL-10 | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1 |

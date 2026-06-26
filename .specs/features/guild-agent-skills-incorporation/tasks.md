# Tasks: guild-agent-skills-incorporation

**Spec**: `.specs/features/guild-agent-skills-incorporation/spec.md`
**Design**: `.specs/features/guild-agent-skills-incorporation/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Anatomy standard + skill retrofit (15 skills)

```text
T01 (anatomy doc + table sync)
T02..T16 (15 skill retrofits, independent, can be parallelised)
```

### Phase 2: Orchestration doc

```text
T17 (orchestration.md) → T18 (cross-links)
```

### Phase 3: DoD mechanism

```text
T19 (architecture.md) → T20 (guild-init scaffold) → T21 (guild-verify read) → T22 (guild-ship read) → T23 (DoD recipe doc + cross-links)
```

### Phase 4: Verification

```text
T24 (build/lint/typecheck) → T25 (anatomy compliance grep) → T26 (test regression) → T27 (decoupling check)
```

---

## Task Breakdown

### T01: Document the skill anatomy and sync the bundled-skills table

**What**: Add a "Skill anatomy" section to `packages/guild/docs/skills.md` covering Overview / When to Use / Process / Rationalizations / Red Flags / Verification. Update the bundled-skills table from 13 rows to 15 rows to match the directories present under `packages/guild/skills/` (add `guild-configurator` and `guild-recon`).

**Where**: `packages/guild/docs/skills.md`

**Depends on**: None

**Requirement**: GUILD-INCORP-01, GUILD-INCORP-02

**Done when**:
- [ ] The doc has a "Skill anatomy" section that names every section, describes its purpose, and states the ≥ 3 Rationalizations rule for workflow-shaped skills.
- [ ] The doc's "Verification" subsection of the anatomy states the rule "'seems right' is not evidence."
- [ ] The bundled-skills table lists 15 entries including `guild-configurator` and `guild-recon`.
- [ ] Cross-references to related docs (e.g., authoring tips) point to the new anatomy.

---

### T02: Retrofit `guild-execute` to the new anatomy

**What**: Expand `packages/guild/skills/guild-execute/SKILL.md` to include Overview, When to Use, Process (numbered steps), Rationalizations (≥ 3 rows), Red Flags, and Verification. Preserve existing "Primary inputs", "Fallback rules", "Output", and "See also" content by slotting them into the appropriate new sections.

**Where**: `packages/guild/skills/guild-execute/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-03

**Done when**:
- [ ] File contains the headings `## Overview`, `## When to Use`, `## Process`, `## Rationalizations`, `## Red Flags`, `## Verification`.
- [ ] Rationalizations table has ≥ 3 rows naming common skip-rationalizations and rebuttals.
- [ ] Verification gate names specific evidence (test output, lint output, `tasks.md` updates).
- [ ] No behaviour change beyond structural expansion.

---

### T03: Retrofit `guild-verify` to the new anatomy

**What**: Expand `packages/guild/skills/guild-verify/SKILL.md` to the new anatomy. **This task also implements the project-wide check step** (DoD mechanism layer 4 in design.md) that reads `.guild/knowledge/definition-of-done.md` as a second criterion alongside per-task `tasks.md`.

**Where**: `packages/guild/skills/guild-verify/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-04, GUILD-INCORP-22

**Done when**:
- [ ] Anatomy headings present (`## Overview`, `## When to Use`, `## Process`, `## Rationalizations`, `## Red Flags`, `## Verification`).
- [ ] Process includes two checks: per-task (existing) and project-wide (new — reads `knowledge/definition-of-done.md`).
- [ ] Process states: when the project-wide file is absent, log a note in `plans/<slug>/notes.md` and continue with per-task only.
- [ ] Verification gate requires evidence for BOTH criteria when both are present.
- [ ] Rationalizations table has ≥ 3 rows including "the build is green, that's enough" and "I'll add tests later" style rebuttals.

---

### T04: Retrofit `guild-review` to the new anatomy

**What**: Expand `packages/guild/skills/guild-review/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-review/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-05

**Done when**:
- [ ] Anatomy headings present.
- [ ] Rationalizations table has ≥ 3 rows.
- [ ] Red Flags list ≥ 2 items (e.g., "reviewer signs off without running tests", "reviewer paraphrases spec acceptance criteria").
- [ ] Verification gate names specific evidence (review status in `state.md`, findings in `notes.md`).

---

### T05: Retrofit `guild-ship` to the new anatomy and add the DoD gate

**What**: Expand `packages/guild/skills/guild-ship/SKILL.md` to the new anatomy. **This task also implements the project-wide DoD gate** (DoD mechanism layer 4 in design.md) that runs after per-task checks and before declaring the change shipped.

**Where**: `packages/guild/skills/guild-ship/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-06, GUILD-INCORP-23

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process includes a "DoD gate" step that reads `knowledge/definition-of-done.md` and confirms every bar item is met.
- [ ] When the project-wide file is absent, the skill logs a note in `plans/<slug>/notes.md` and continues with per-task checks only.
- [ ] Verification gate requires both per-task and project-wide evidence.
- [ ] Rationalizations table has ≥ 3 rows including "it's a small change, no need for a checklist" and "the merge button is right there" style rebuttals.

---

### T06: Retrofit `guild-security` to the new anatomy

**What**: Expand `packages/guild/skills/guild-security/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-security/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-07

**Done when**:
- [ ] Anatomy headings present.
- [ ] Rationalizations table has ≥ 3 rows including "this is internal, no need for input validation" and "the secret is in a private repo" style rebuttals.
- [ ] Red Flags list ≥ 2 items (e.g., "secrets present in diff", "trust boundary crossed without validation").
- [ ] Verification gate names specific evidence (security findings in `notes.md`, updated `gotchas.md` if new pitfalls).

---

### T07: Retrofit `guild-spec` to the new anatomy

**What**: Expand `packages/guild/skills/guild-spec/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-spec/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-08

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps to produce a `spec.md` (problem statement, goals, out of scope, user stories, edge cases, success criteria).
- [ ] Rationalizations table has ≥ 3 rows including "I already know what to build" and "the spec is overhead" style rebuttals.
- [ ] Verification gate names specific evidence (the `spec.md` file with all required sections).

---

### T08: Retrofit `guild-plan` to the new anatomy

**What**: Expand `packages/guild/skills/guild-plan/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-plan/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-09

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps to produce a `tasks.md` (atomic tasks with verification criteria, dependency ordering).
- [ ] Rationalizations table has ≥ 3 rows including "I can hold the whole plan in my head" and "tasks are bureaucracy" style rebuttals.
- [ ] Verification gate names specific evidence (`tasks.md` with verification criteria per task).

---

### T09: Retrofit `guild-scope` to the new anatomy

**What**: Expand `packages/guild/skills/guild-scope/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-scope/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-10

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists the artifact-scope rule (small = single plan doc; medium = full plan; large = spec + design + tasks + extras).
- [ ] Rationalizations table has ≥ 3 rows including "it's clearly small, no need to declare scope" and "I'll add tasks later" style rebuttals.
- [ ] Verification gate names specific evidence (the chosen artifact set with file paths).

---

### T10: Retrofit `guild-init` to the new anatomy and add the DoD scaffold

**What**: Expand `packages/guild/skills/guild-init/SKILL.md` to the new anatomy. **This task also implements the DoD scaffold step** (DoD mechanism layer 4 in design.md): when `guild-init` runs, scaffold `.guild/knowledge/definition-of-done.md` if absent.

**Where**: `packages/guild/skills/guild-init/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-11, GUILD-INCORP-21

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process includes a "Scaffold DoD file" step with the template content (header comment, empty `## Project-wide standing bar` section, `## Per-task criteria` pointer).
- [ ] Behavior rules include: "If the file already exists, do not touch it."
- [ ] Behavior rules preserve the existing context scaffold behaviour (no regression).

---

### T11: Retrofit `guild-handoff` to the new anatomy

**What**: Expand `packages/guild/skills/guild-handoff/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-handoff/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-12

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps for human-to-agent and agent-to-agent handoff.
- [ ] Rationalizations table has ≥ 3 rows including "I'll just tell them in the next turn" and "the handoff is overhead" style rebuttals.
- [ ] Verification gate names specific evidence (`context/handoff.md` and `plans/<slug>/state.md` updated).

---

### T12: Retrofit `guild-load` to the new anatomy

**What**: Expand `packages/guild/skills/guild-load/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-load/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-13

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps to load existing project context into a new session.
- [ ] Red Flags list ≥ 2 items (e.g., "context is stale", "legacy `.specs/` content read but not migrated").

---

### T13: Retrofit `guild-research` to the new anatomy

**What**: Expand `packages/guild/skills/guild-research/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-research/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-14

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps for external documentation lookups with source citations.
- [ ] Verification gate names specific evidence (sources cited inline; answer traceable to a specific URL or doc section).

---

### T14: Retrofit `guild-commit-learning` to the new anatomy

**What**: Expand `packages/guild/skills/guild-commit-learning/SKILL.md` to the new anatomy.

**Where**: `packages/guild/skills/guild-commit-learning/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-15

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process lists numbered steps for capturing reusable lessons into `.guild/knowledge/decisions.md` or `gotchas.md`.
- [ ] Red Flags list ≥ 2 items (e.g., "lesson is too specific to one change", "lesson is captured in `notes.md` but never promoted").

---

### T15: Retrofit `guild-configurator` to the new anatomy

**What**: Expand `packages/guild/skills/guild-configurator/SKILL.md` to the new anatomy. If the file is currently a stub, the retrofit still applies (anatomy structure on a thin body is better than no anatomy).

**Where**: `packages/guild/skills/guild-configurator/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-16

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process describes the configuration workflow.

---

### T16: Retrofit `guild-recon` to the new anatomy

**What**: Expand `packages/guild/skills/guild-recon/SKILL.md` to the new anatomy. If the file is currently a stub, the retrofit still applies.

**Where**: `packages/guild/skills/guild-recon/SKILL.md`

**Depends on**: T01

**Requirement**: GUILD-INCORP-17

**Done when**:
- [ ] Anatomy headings present.
- [ ] Process describes the reconnaissance workflow.

---

### T17: Create `docs/orchestration.md` with patterns, anti-patterns, and Bard-as-lead

**What**: New docs page at `packages/guild/docs/orchestration.md`. Four parts: (1) Endorsed patterns — five patterns with "Use when" triggers, "How it looks in Guild" subsections naming the primitives, and "Cost" notes; (2) Anti-patterns — four anti-patterns with "Why it fails" rationales and "How this would look in Guild" subsections; (3) Bard is a lead, not a meta-router — a short section stating Bard is the user-driven primary and cross-linking to `agents.md`; (4) Decision flow — a table or flowchart to pick a pattern.

**Where**: `packages/guild/docs/orchestration.md` (new file)

**Depends on**: None (orthogonal to the retrofit phase)

**Requirement**: GUILD-INCORP-18

**Done when**:
- [ ] File exists.
- [ ] Contains the sections "Endorsed patterns", "Anti-patterns", "Bard is a lead".
- [ ] Endorsed patterns section covers: direct invocation, single-persona command, parallel fan-out with merge, sequential pipeline (user is orchestrator), research isolation.
- [ ] Anti-patterns section covers: router persona, persona-calls-persona, sequential orchestrator that paraphrases, deep persona trees.
- [ ] Each anti-pattern has a "How this would look in Guild" subsection naming specific primitives.

---

### T18: Add orchestration cross-links to `docs/README.md`, `docs/agents.md`, `docs/custom-agents.md`

**What**: Wire `docs/orchestration.md` into the docs graph. `docs/README.md` gets a new row in the "Customize how agents think and act" table linking to it. `docs/agents.md` and `docs/custom-agents.md` get a "See also" entry linking to it.

**Where**: `packages/guild/docs/README.md`, `packages/guild/docs/agents.md`, `packages/guild/docs/custom-agents.md`

**Depends on**: T17

**Requirement**: GUILD-INCORP-19

**Done when**:
- [ ] `docs/README.md` "Customize how agents think and act" table has a row pointing to `orchestration.md`.
- [ ] `docs/agents.md` "See also" section has a link to `orchestration.md`.
- [ ] `docs/custom-agents.md` "See also" section has a link to `orchestration.md`.
- [ ] All links resolve (no 404s in the rendered docs).

---

### T19: Update `.guild/architecture.md` with the DoD knowledge slot

**What**: Three changes to `.guild/architecture.md`: (a) knowledge table gets a row for `definition-of-done.md` with purpose "Project-wide standing bar (consumed by `guild-verify` and `guild-ship`; complements per-task `tasks.md` criteria)"; (b) canonical loading order inserts `definition-of-done.md` after `knowledge/index.md`; (c) "Plan-local vs global state boundary" table gets a row: "What is the project-wide quality bar?" → `knowledge/definition-of-done.md`.

**Where**: `.guild/architecture.md`

**Depends on**: None

**Requirement**: GUILD-INCORP-20

**Done when**:
- [ ] Knowledge table includes `definition-of-done.md`.
- [ ] Canonical loading order includes `definition-of-done.md` in the correct position.
- [ ] Boundary table includes the new DoD row.
- [ ] `knowledge/index.md` (if it exists) is also updated to mention the new file; otherwise this requirement is noted for the next time the file is created.

---

### T20: Implement the DoD scaffold step in `guild-init`

**What**: Already partially done in T10. This task verifies the retrofit is complete and adds a test or smoke check (or documents a manual smoke procedure) that `guild-init` scaffolds `.guild/knowledge/definition-of-done.md` and does not overwrite it on re-run.

**Where**: `packages/guild/skills/guild-init/SKILL.md` (verification of T10 deliverable)

**Depends on**: T10

**Requirement**: GUILD-INCORP-21

**Done when**:
- [ ] T10 deliverable verified.
- [ ] A note in `guild-init`'s Verification section explicitly states: "Re-running guild-init does not modify an existing `.guild/knowledge/definition-of-done.md`."

---

### T21: Implement the project-wide check in `guild-verify`

**What**: Already partially done in T03. This task verifies the retrofit is complete and that the graceful-degradation behaviour is explicit.

**Where**: `packages/guild/skills/guild-verify/SKILL.md` (verification of T03 deliverable)

**Depends on**: T03

**Requirement**: GUILD-INCORP-22

**Done when**:
- [ ] T03 deliverable verified.
- [ ] Process and Verification gate explicitly state: when `knowledge/definition-of-done.md` is absent, log a note in `plans/<slug>/notes.md` and continue with per-task only.

---

### T22: Implement the DoD gate in `guild-ship`

**What**: Already partially done in T05. This task verifies the retrofit is complete and that the DoD gate appears between per-task checks and the ship declaration.

**Where**: `packages/guild/skills/guild-ship/SKILL.md` (verification of T05 deliverable)

**Depends on**: T05

**Requirement**: GUILD-INCORP-23

**Done when**:
- [ ] T05 deliverable verified.
- [ ] Process explicitly orders: per-task checks → DoD gate → ship declaration.
- [ ] When the project-wide file is absent, the skill logs a note and continues.

---

### T23: Create the DoD user-facing recipe doc and wire cross-links

**What**: New `packages/guild/docs/definition-of-done.md` page with: (1) the distinction between project-wide bar and per-task criteria; (2) the minimal template (copy of the scaffolded file); (3) a populated example for a TypeScript monorepo; (4) a populated example for a frontend SPA; (5) the consuming skills and graceful-degradation behaviour; (6) cross-link to `.guild/architecture.md`. Also update `docs/README.md` to add a "Project state" section linking to this page.

**Where**: `packages/guild/docs/definition-of-done.md` (new), `packages/guild/docs/README.md`

**Depends on**: T19

**Requirement**: GUILD-INCORP-24, GUILD-INCORP-25

**Done when**:
- [ ] `definition-of-done.md` exists with all six parts above.
- [ ] The page contains the phrase "project-wide standing bar".
- [ ] `docs/README.md` has a "Project state" section linking to the DoD page.
- [ ] The page links to `.guild/architecture.md` for the canonical loading order.

---

### T24: Build, lint, typecheck

**What**: Run `bun run build` at the repo root; `bunx turbo lint` and `bunx turbo typecheck` for `packages/guild`. Resolve any failures.

**Where**: Repo root

**Depends on**: T01..T23

**Requirement**: GUILD-INCORP-26

**Done when**:
- [ ] `bun run build` passes.
- [ ] `bunx turbo lint` passes for `packages/guild`.
- [ ] `bunx turbo typecheck` passes for `packages/guild`.

---

### T25: Anatomy compliance grep

**What**: For each of the 15 skills, run a grep that confirms the required headings exist. Skills with Process steps that an agent might want to skip must have ≥ 3 Rationalizations rows.

**Where**: Repo root (shell check)

**Depends on**: T01..T16

**Requirement**: GUILD-INCORP-01..17 (verification)

**Done when**:
- [ ] All 15 skills contain the headings `## Process`, `## Rationalizations`, `## Red Flags`, `## Verification` (Rationalizations may be omitted only on skills where no skip-rationalization applies; this exception is documented per-skill).
- [ ] The workflow-shaped skills (execute, verify, review, ship, security, plan, spec, scope, init, handoff) have ≥ 3 Rationalizations rows each.

---

### T26: Test regression

**What**: Run `bun test` in `packages/guild`. Confirm no regression in the existing test suite. The changes are content-only; no test should break. If a test breaks, fix it (likely a fixture that referenced the old skill body).

**Where**: `packages/guild/`

**Depends on**: T01..T23

**Requirement**: GUILD-INCORP-27

**Done when**:
- [ ] `bun test` in `packages/guild` passes.
- [ ] If any test broke, the fix is recorded in `plans/<slug>/notes.md` (or in a follow-up task) with a rationale.

---

### T27: Decoupling check

**What**: Confirm no changes were made in `packages/spells/` or `packages/summon/`. Run `git diff --stat packages/spells/ packages/summon/` and confirm an empty diff. Also confirm no changes in `.agents/`, `.opencode/`, or other runecraft packages that this feature should not touch.

**Where**: Repo root (git check)

**Depends on**: T01..T23

**Requirement**: Cross-cutting (cherrypick decoupling constraint)

**Done when**:
- [ ] `git diff --stat packages/spells/` returns empty.
- [ ] `git diff --stat packages/summon/` returns empty.
- [ ] `git diff --stat packages/familiar/ packages/grimoire/ packages/spawn/` returns empty (these are unrelated to this feature).

---

## Commit Conventions

This feature generates changesets automatically on push to `main` via `.changeset/generate-from-commits.ts`. Commits **must** use conventional commits with the right scope:

| Commit | Expected scope | Expected bump |
| --- | --- | --- |
| T01 (anatomy doc + table sync) | `docs(guild):` | patch |
| T02..T16 (skill retrofits) | `feat(guild):` | minor |
| T17 (orchestration.md) | `docs(guild):` | patch |
| T18 (orchestration cross-links) | `docs(guild):` | patch |
| T19 (architecture.md DoD slot) | `docs(guild):` | patch |
| T20..T22 (DoD skill verifications) | `feat(guild):` | minor |
| T23 (DoD recipe doc) | `docs(guild):` | patch |
| T24..T27 (verification) | `chore(guild):` or no commit | none |

**Do not** use `chore(guild):` for new content work — that type does not generate changesets (see `determineBumpType` in `generate-from-commits.ts:240`). Use `feat(guild):` for the skill retrofits and the DoD skill changes; `docs(guild):` for the new docs and the architecture.md edit.

---

## Execution Guidance

- Phase 1 retrofits (T02..T16) are independent and can be done in any order or in parallel by multiple contributors. Each is one commit. The 15 commits produce a clean, audit-trail-friendly history.
- The anatomy doc (T01) is the prerequisite for the retrofits; it MUST be merged first.
- Phase 2 (T17..T18) and Phase 3 (T19..T23) are independent of each other and can be parallelised.
- The DoD skill verifications (T20, T21, T22) are not new work; they verify that T10, T03, T05 delivered the DoD mechanism correctly. They produce a single commit per skill.
- Verification (T24..T27) is the gate. All four must pass before the feature is considered done.
- Keep the feature folder self-contained: `.specs/features/guild-agent-skills-incorporation/`. Do not duplicate work into `.specs/project/STATE.md`; the active feature list there is updated as the last task.
- Do NOT modify `packages/spells/` or `packages/summon/`. Decoupling is a hard constraint, mirrored from the cherrypick spec.
- The DoD mechanism is content (skill instructions) only; no new TS code. If you find yourself writing new runtime hooks, stop and check the design.md — you are out of scope.
- The `CHANGELOG.md` in `packages/guild/` will be updated automatically by `changesets/action` when the Release PR is merged — do not edit it manually.

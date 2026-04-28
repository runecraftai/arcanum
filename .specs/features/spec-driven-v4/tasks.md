---
feature: spec-driven-v4
scope: Large
created: 2026-04-28
total_tasks: 20
status: pending
---

# Tasks — spec-driven v4.0.0

## Phase A — Structure (A1–A7)

- [x] **A1** — Rewrite `knowledge-base.md` for `.specs/project/` structure
  - **Files:** `packages/spells/skills/spec-driven/references/knowledge-base.md`
  - **What to change:**
    - Remove all references to `docs/project.md`, `docs/conventions.md`, `docs/decisions.md`
    - Describe `.specs/project/` with 3 files: PROJECT.md (vision, goals, active modules), ROADMAP.md (features, milestones), STATE.md (decisions, blockers, lessons, todos, deferred)
    - Describe `.specs/codebase/` as on-demand brownfield docs (7 files created via `/map`)
    - Describe `.specs/features/<name>/` with artifacts: spec.md, context.md, design.md, tasks.md, STATE.md
    - Describe `.specs/quick/NNN-slug/` with TASK.md + SUMMARY.md
    - Describe `.specs/sessions/` for session logs
    - Include a directory tree diagram showing the full `.specs/` structure
  - **Done when:** File contains zero occurrences of `docs/project`, `docs/conventions`, `docs/decisions`; describes all 5 `.specs/` subdirectories with directory tree
  - **Traces:** SDV4-02

- [x] **A2** — Create `state-global.md`
  - **Files:** `packages/spells/skills/spec-driven/references/state-global.md` *(NEW)*
  - **What to create:**
    - Title: "Global STATE.md — Rules & Schema"
    - Schema for `.specs/project/STATE.md` with 5 sections:
      - `## Decisions` — numbered entries, format: `### D-NNN: Title` with date, status (active/superseded), rationale
      - `## Blockers` — active blockers with owner, created date, status (open/resolved)
      - `## Lessons` — learned lessons, format: `- [YYYY-MM-DD] lesson text`
      - `## Todos` — cross-feature action items with owner and priority
      - `## Deferred` — items explicitly deferred with reason and target date
    - Rules: append-only (no deletion, only status changes); prune completed items monthly
    - Distinction from feature STATE: global = cross-cutting, feature STATE = checkpoint/resume for one feature
    - Full template with placeholder entries for each section
  - **Done when:** File exists with all 5 section schemas, rules section, distinction note, and populated template
  - **Traces:** SDV4-06

- [x] **A3a** — Create `phase-map.md`
  - **Files:** `packages/spells/skills/spec-driven/references/phase-map.md` *(NEW)*
  - **What to create:**
    - Title: "Phase: MAP — Brownfield Mapping"
    - When: Triggered by `/map`, `map codebase`, `analisar projeto existente`, `mapear código`
    - Goal: Produce 7 codebase docs in `.specs/codebase/` from existing codebase
    - Steps:
      1. Check if `.specs/codebase/` exists; create if not
      2. Delegate to Scout: explore codebase structure, stack, conventions (provide list of questions per doc type from `brownfield-mapping.md`)
      3. Process Scout findings through templates in `brownfield-mapping.md`
      4. Write each doc to `.specs/codebase/<DOC>.md`
      5. Update `.specs/project/STATE.md` — add lesson entry noting codebase was mapped
    - Selective mapping: `/map stack`, `/map architecture` etc. generates only that doc
    - Approval gate: present each doc to user before writing; user can approve or adjust
    - Completion criteria: `.specs/codebase/` contains at minimum STACK.md and ARCHITECTURE.md
  - **Done when:** File exists with trigger list, steps, selective mapping, approval gate, and completion criteria
  - **Traces:** SDV4-03

- [x] **A3b** — Create `brownfield-mapping.md`
  - **Files:** `packages/spells/skills/spec-driven/references/brownfield-mapping.md` *(NEW)*
  - **What to create:**
    - Title: "Brownfield Mapping — Codebase Documentation Templates"
    - For each of 7 docs, provide: section headers, example content, what to include/exclude, Scout questions
    - STACK.md template: languages (with versions), frameworks, package manager, build tools, deployment targets
    - ARCHITECTURE.md template: high-level diagram (text), module boundaries, data flow, key patterns, entry points
    - CONVENTIONS.md template: naming conventions, file organization, import style, error handling, logging patterns
    - STRUCTURE.md template: annotated directory tree (3 levels), key entry points, module responsibilities
    - TESTING.md template: test framework, coverage expectations, test file location pattern, fixture strategy, CI commands
    - INTEGRATIONS.md template: external APIs (with auth method), databases (with ORM), message queues, third-party services
    - CONCERNS.md template: refers to `concerns.md` for detailed guidance; just the header template here
    - Scout delegation pattern section: for each doc, list 3-5 specific questions to ask Scout
  - **Done when:** File exists with all 7 doc templates and Scout delegation questions for each
  - **Traces:** SDV4-04

- [x] **A3c** — Create `concerns.md`
  - **Files:** `packages/spells/skills/spec-driven/references/concerns.md` *(NEW)*
  - **What to create:**
    - Title: "CONCERNS.md — Tech Debt & Risk Documentation"
    - 5 categories with descriptions: tech debt, security risks, performance risks, scalability concerns, operational risks
    - Entry format: `### C-NNN: Title` with fields: category, severity (high/medium/low), likelihood (high/medium/low), impact description, current mitigation, proposed mitigation, status (open/in-progress/resolved)
    - Discovery methods section: code review triggers, dependency audit, load testing, security scan
    - Prioritization matrix: severity × likelihood → priority level (critical/high/medium/low/watch)
    - 2 example entries (one tech debt, one security risk)
    - Review cadence recommendation: review open CONCERNS monthly
  - **Done when:** File exists with categories, entry format, discovery methods, matrix, and examples
  - **Traces:** SDV4-05

- [x] **A3d** — Create `project-init.md`
  - **Files:** `packages/spells/skills/spec-driven/references/project-init.md` *(NEW)*
  - **What to create:**
    - Title: "Project Initialization — `/init` Command"
    - Trigger: `/init`, `initialize project`, `setup project`, `inicializar projeto`
    - Skip logic: if `.specs/project/PROJECT.md` exists → warn "Project already initialized. Run `/map` to update codebase docs. Run `/init --force` to overwrite."
    - Steps:
      1. Create `.specs/project/` directory
      2. Ask user: project name, 1-2 sentence vision, 3-5 goals (bullet), active modules (comma-separated)
      3. Generate PROJECT.md from responses
      4. Generate ROADMAP.md with empty milestones structure
      5. Generate STATE.md with empty sections (Decisions, Blockers, Lessons, Todos, Deferred)
    - Full templates for PROJECT.md, ROADMAP.md, STATE.md with placeholders
    - Note: for existing projects, suggest running `/map` after `/init` to generate codebase docs
  - **Done when:** File exists with trigger, skip logic, 5-step flow, and templates for all 3 files
  - **Traces:** SDV4-08

- [x] **A4** — Update SKILL.md for v4.0.0
  - **Files:** `packages/spells/skills/spec-driven/SKILL.md`
  - **Depends on:** A1, A2, A3a must be complete first
  - **What to change:**
    - Line 2: change `name: spec-driven` version comment from v3.0.0 to v4.0.0
    - Quick Reference table: add MAP row with PT/EN triggers and output `.specs/codebase/`
    - Trigger Dispatch Table: add MAP phase triggers section (`/map`, `map codebase`, `mapear código`, `analisar projeto existente`)
    - Dispatch Algorithm: add MAP as step 1 option for explicit `/map` command
    - LOAD Phase section: replace all `docs/` references:
      - "Check whether `docs/` exists" → "Check whether `.specs/project/` exists"
      - `docs/project.md` → `.specs/project/PROJECT.md`
      - `docs/conventions.md` → `.specs/codebase/CONVENTIONS.md` (note: on-demand)
      - `docs/decisions.md` → `.specs/project/STATE.md`
      - "3 most recent files in `docs/sessions/`" → "3 most recent files in `.specs/sessions/`"
      - Add: "If `.specs/project/` missing → note 'Run /init to bootstrap' and proceed"
      - Add: "Step 2b: Load `.specs/codebase/` docs on-demand (budget-aware)"
      - Context Summary: update Prior context from examples to `.specs/` paths
    - LEARN Phase section: replace all `docs/` references:
      - "Create `docs/sessions/YYYY-MM-DD-<feature>.md`" → "Create `.specs/sessions/YYYY-MM-DD-<feature>.md`"
      - "Update only when genuinely new" table: change target files to `.specs/project/` and `.specs/codebase/` paths
      - "First-Run Scaffold": change from `docs/` to `.specs/project/`; refer to `project-init.md`
    - Supporting References section: add 9 new files to the list
  - **Done when:** SKILL.md has v4.0.0 in title; MAP in dispatch; zero occurrences of `docs/project`, `docs/conventions`, `docs/decisions`; LOAD/LEARN use `.specs/` exclusively; 9 new refs listed
  - **Traces:** SDV4-01, SDV4-25

- [x] **A5** — Migrate all `phase-*.md` files to `.specs/` paths
  - **Files:**
    - `packages/spells/skills/spec-driven/references/phase-spec.md`
    - `packages/spells/skills/spec-driven/references/phase-plan.md`
    - `packages/spells/skills/spec-driven/references/phase-build.md`
    - `packages/spells/skills/spec-driven/references/phase-test.md`
    - `packages/spells/skills/spec-driven/references/phase-review.md`
    - `packages/spells/skills/spec-driven/references/phase-simplify.md`
    - `packages/spells/skills/spec-driven/references/phase-ship.md`
  - **Depends on:** A1 (path structure defined)
  - **What to change in EACH file** (search and replace — do not change anything else in this task):
    - `docs/project.md` → `.specs/project/PROJECT.md`
    - `docs/conventions.md` → `.specs/codebase/CONVENTIONS.md`
    - `docs/decisions.md` → `.specs/project/STATE.md`
    - `docs/sessions/` → `.specs/sessions/`
    - `docs/sessions` → `.specs/sessions`
    - Feature artifact paths: ensure `.specs/features/<name>/` is used (not `docs/`)
  - **Done when:** All 7 files have zero occurrences of `docs/project`, `docs/conventions`, `docs/decisions`, `docs/sessions`; paths use `.specs/` prefix
  - **Note:** This task is path migration ONLY. Phase-specific content additions are separate tasks (B3, B4, B5, C1, C2, D1, D2).
  - **Traces:** SDV4-09

- [x] **A6** — Update `context-loading.md` with new paths and budget
  - **Files:** `packages/spells/skills/spec-driven/references/context-loading.md`
  - **Depends on:** A1
  - **What to change:**
    - Rewrite loading order to 3-tier:
      1. **Project context** (always): `.specs/project/PROJECT.md`, `.specs/project/ROADMAP.md`, `.specs/project/STATE.md`
      2. **Codebase context** (on-demand, budget-aware): `.specs/codebase/` in priority order: STACK → ARCHITECTURE → CONVENTIONS → STRUCTURE → TESTING → INTEGRATIONS → CONCERNS
      3. **Feature context** (when resuming): `.specs/features/<name>/STATE.md` → `spec.md` → `context.md` → `design.md` → `tasks.md`
    - Add budget section: "Total context budget: 160k tokens. Reserve 40k for active phase work. Load context in priority order; stop when budget exhausted."
    - Add on-demand strategy: "Load `.specs/codebase/` docs only when the active phase needs them. Build and architecture phases always load STACK + ARCHITECTURE. Test phase always loads TESTING."
    - Remove all `docs/` path references
    - Add at end: "After loading, run knowledge chain verification (→ see `knowledge-chain.md`)."
  - **Done when:** 3-tier loading order documented; budget section (160k) exists; zero `docs/` references; knowledge-chain reference present
  - **Traces:** SDV4-10

- [x] **A7** — Bump version to 4.0.0
  - **Files:**
    - `packages/spells/skills/spec-driven/.skill-meta.json`
    - `packages/spells/skills/spec-driven/README.md`
  - **Depends on:** None (run in parallel with A1-A6)
  - **What to change in `.skill-meta.json`:**
    - Change `"version"` field value to `"4.0.0"`
  - **What to change in `README.md`:**
    - Update title/version header to v4
    - English triggers: add `/map`, `/init` to triggers list
    - Portuguese triggers: add `mapear codebase`, `inicializar projeto`
    - Add scope tiers table: Quick / Medium / Large / **Complex** (≥12)
    - Update all `docs/` path references to `.specs/`
    - Add note: "⚠️ v4 is a breaking change. `docs/` is no longer used. Run `/init` to bootstrap `.specs/project/` and `/map` to generate codebase docs."
    - Update artifacts list to include 9 new reference files
  - **Done when:** `.skill-meta.json` has `"version": "4.0.0"`; README has `/map`, `/init`, Complex tier, breaking change note, `.specs/` paths
  - **Traces:** SDV4-23, SDV4-24

## Phase B — Discipline (B1–B5)

- [x] **B1** — Create `knowledge-chain.md`
  - **Files:** `packages/spells/skills/spec-driven/references/knowledge-chain.md` *(NEW)*
  - **What to create:**
    - Title: "Knowledge Chain — 5-Step Context Verification"
    - Intro: explains why verification is needed (prevent hallucinated context, fabricated APIs)
    - 5 steps with detailed criteria:
      1. **Source Verify**: Origin of each context item. `.specs/` files = trusted. Agent memory / inference = untrusted. Score: >80% trusted = pass; 50-80% = warn; <50% = LOW confidence.
      2. **Freshness Check**: File age. Updated this session = fresh. Updated <7 days = acceptable. >7 days = stale; flag for re-verification on critical files. Stale non-critical files = warn only.
      3. **Conflict Detect**: Cross-reference loaded items for contradictions (version mismatches, contradictory conventions, duplicate definitions with different values). Each conflict = flag. Unresolved conflicts → LOW confidence.
      4. **Gaps Scan**: Check for referenced files that don't exist. Check for expected sections that are empty. Critical gaps (missing spec.md when resuming, missing STATE.md) → LOW. Non-critical gaps → MEDIUM.
      5. **Confidence Score**: Aggregate. HIGH = all trusted + fresh + no conflicts + no gaps. MEDIUM = minor staleness or non-critical gaps only. LOW = any of: untrusted majority, unresolved conflicts, critical gaps.
    - Decision table:
      | Confidence | Action |
      |------------|--------|
      | HIGH | Proceed with phase |
      | MEDIUM | Proceed with caution; note gaps in output |
      | LOW | PAUSE. Inform user. Delegate Scout for targeted exploration. Do not proceed. |
    - Integration note: "Invoked as the final step of LOAD phase, before phase dispatch."
  - **Done when:** File has intro, all 5 steps with criteria, decision table, integration note
  - **Traces:** SDV4-11

- [x] **B2** — Create `sub-agent-delegation.md`
  - **Files:** `packages/spells/skills/spec-driven/references/sub-agent-delegation.md` *(NEW)*
  - **What to create:**
    - Title: "Sub-Agent Delegation — Contracts & Rules"
    - Intro: explains the multi-agent system and why delegation contracts matter
    - Full delegation table (5 rows, one per agent):

      | Agent | Delegate When | Never Delegate | Input Contract | Output Contract |
      |-------|--------------|----------------|----------------|-----------------|
      | **Scout** | Codebase exploration; "where is X?"; context gathering; brownfield mapping; reading 3+ files; dependency tracing | Single known file reads; trivial lookups; planning | Topic statement + up to 5 specific questions | `SCOUT_FINDINGS`: structured answers with `file:line` references |
      | **Sage** | Feature planning (Medium/Large/Complex); architecture decisions; spec review; breaking down requirements | Quick tasks; single-file changes; implementation; execution | Feature description + scope + SCOUT_FINDINGS (if available) | `SAGE_STATUS: READY` (spec/design/tasks artifacts) or `SAGE_STATUS: NEEDS_SCOUT` (topic) |
      | **Forge** | File creation/editing; code implementation; running commands; writing artifacts; commits; post-execution | Planning; exploration; architectural decisions; decision-making | Instruction with explicit file paths + acceptance criteria OR path to `tasks.md` | `FORGE_STATUS: DONE` (summary + files changed) or `FORGE_STATUS: BLOCKED` (reason) |
      | **Ward** | Security review after Forge completes | Non-security quality concerns; planning; implementation | Diff + list of modified files + security context | `APPROVE` or `REJECT` with specific findings (OWASP refs, file:line) |
      | **Arbiter** | Code quality review after Ward approves | Security concerns; implementation; planning | Diff + list of modified files + quality checklist | `APPROVE` or `REJECT` with specific findings (rule, file:line, suggested fix) |

    - Context budget per agent: Scout ≤20k, Sage ≤40k, Forge ≤60k per task, Ward ≤30k, Arbiter ≤30k
    - Anti-patterns section:
      - ❌ Asking Forge to explore before implementing
      - ❌ Asking Scout to implement or write files
      - ❌ Asking Sage to execute tasks
      - ❌ Skipping Ward/Arbiter when code changes are significant
    - Flow diagram (text):
      ```
      Herald → Scout (explore) → Sage (plan) → Forge (execute) → Ward (security) → Arbiter (quality) → Herald (commit)
      ```
  - **Done when:** File has intro, full 5-agent table with all columns, budget section, anti-patterns, flow
  - **Traces:** SDV4-13

- [x] **B3** — Update `phase-plan.md` with auto-skip rules
  - **Files:** `packages/spells/skills/spec-driven/references/phase-plan.md`
  - **Depends on:** A5 (paths migrated)
  - **What to change:**
    - Add at the very top, before existing content, a new section "## Auto-Skip Rules":
      ```
      ## Auto-Skip Rules

      The PLAN phase depth depends on scope:

      | Scope | Score | PLAN Action | Artifacts |
      |-------|-------|-------------|-----------|
      | Quick | 1-3 | **Skip entirely** — tasks implicit in BUILD | None |
      | Medium | 4-6 | **Inline plan** — write plan as section in spec.md | spec.md section only |
      | Large | 7-11 | **Formal plan** — produce design.md | design.md |
      | Complex | ≥12 | **Formal plan + Discuss** — context.md required before planning | context.md + design.md |

      **Safety valve**: If during planning the knowledge chain returns MEDIUM or LOW confidence,
      pause and request Scout exploration before continuing. Do not plan from uncertain context.
      ```
    - Add knowledge chain pre-condition after the auto-skip section:
      ```
      **Pre-condition**: Run knowledge chain verification (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.
      ```
  - **Done when:** Auto-skip table (4 tiers) exists at top; safety valve documented; knowledge chain pre-condition present
  - **Traces:** SDV4-21

- [x] **B4** — Update `phase-build.md` with safety valve and delegation refs
  - **Files:** `packages/spells/skills/spec-driven/references/phase-build.md`
  - **Depends on:** A5 (paths migrated), B1 (knowledge-chain.md exists), B2 (sub-agent-delegation.md exists)
  - **What to change:**
    - Add at the very top, before existing content:
      ```
      **Pre-condition**: Run knowledge chain verification (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.
      ```
    - Add a "## Safety Valve" section:
      ```
      ## Safety Valve

      If during BUILD the executor encounters codebase state that contradicts loaded context (e.g., a file that should exist doesn't, an API that differs from STACK.md):

      1. **STOP immediately.** Do not guess or infer.
      2. Return `FORGE_STATUS: BLOCKED` with a clear description of the contradiction.
      3. Herald will delegate Scout for targeted re-exploration.
      4. Resume after context is corrected.

      Never fabricate. An explicit BLOCKED is always better than incorrect implementation.
      ```
    - Add a "## Delegation Rules" section:
      ```
      ## Delegation Rules

      Follow the contracts in `sub-agent-delegation.md`.

      Key rule: Forge should never explore the codebase. If you need to understand existing code before implementing, return BLOCKED and let Scout explore first.
      ```
    - Add a "## Commit Policy" note:
      ```
      Each completed task should result in one atomic commit. See `build-cycle.md` for the commit message format and size rules.
      ```
  - **Done when:** Pre-condition, Safety Valve section, Delegation Rules section, and Commit Policy note all present
  - **Traces:** SDV4-22

- [x] **B5** — Add knowledge chain pre-conditions to phase-spec.md and phase-plan.md
  - **Files:**
    - `packages/spells/skills/spec-driven/references/phase-spec.md`
    - `packages/spells/skills/spec-driven/references/phase-plan.md`
  - **Depends on:** B1 (knowledge-chain.md exists), A5 (paths migrated)
  - **Note:** phase-build.md pre-condition was already added in B4. This task covers spec and plan only.
  - **What to change in `phase-spec.md`:**
    - Add after the "## When" section, before "## Goal":
      ```
      **Pre-condition**: Run knowledge chain verification (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.
      ```
  - **What to change in `phase-plan.md`:**
    - The pre-condition was already added in B3 as part of the auto-skip rules. Verify it's present. If already present from B3, this step is a no-op for phase-plan.md.
  - **Done when:** `phase-spec.md` has knowledge chain pre-condition; `phase-plan.md` has it (from B3 or added here)
  - **Traces:** SDV4-12

## Phase C — Refinements (C1–C4)

- [x] **C1** — Create `spec-discuss.md` and integrate into `phase-spec.md`
  - **Files:**
    - `packages/spells/skills/spec-driven/references/spec-discuss.md` *(NEW)*
    - `packages/spells/skills/spec-driven/references/phase-spec.md` *(UPDATE)*
  - **Depends on:** A5 (phase-spec has `.specs/` paths), B5 (pre-condition added)
  - **What to create in `spec-discuss.md`:**
    - Title: "Discuss Sub-Step — Structured Q&A Before Spec"
    - When: Automatically for Complex scope. Optional for Large (agent uses judgment). Skip for Quick/Medium.
    - Question framework (5 categories, 2-3 questions each):
      1. **Scope Boundaries**: What's explicitly in scope? What's explicitly out? Where's the boundary with adjacent features?
      2. **User Impact**: Who is affected? What changes in their day-to-day? Are there edge users (admin, anonymous, power user)?
      3. **Technical Constraints**: Known performance requirements? Required integrations that must be preserved? Version constraints?
      4. **Edge Cases**: What happens when the primary path fails? What about empty/null states? Concurrent access scenarios?
      5. **Dependencies**: What must exist before this works? What other features depend on this? Are there migrations required?
    - Process: ask questions grouped by category; wait for answers before proceeding; if user says "skip" on a category, mark as "Not discussed"
    - Output format: create `.specs/features/<name>/context.md` with:
      ```markdown
      ---
      feature: <name>
      created: YYYY-MM-DD
      participants: [user, agent]
      ---
      # Context — <Feature Name>
      ## Scope Boundaries
      [answers or "Not discussed"]
      ## User Impact
      [answers or "Not discussed"]
      ## Technical Constraints
      [answers or "Not discussed"]
      ## Edge Cases
      [answers or "Not discussed"]
      ## Dependencies
      [answers or "Not discussed"]
      ## Open Questions
      [items deferred for later]
      ```
    - Rule: for Complex scope, `context.md` MUST be written before `spec.md` is started
  - **What to change in `phase-spec.md`:**
    - Add after Step 2 (Clarification), before Step 3 (Produce Artifact):
      ```
      ### Step 2b: Discuss Sub-Step (Large/Complex)

      For Large or Complex scope: run the Discuss sub-step before writing spec.md.
      → See `spec-discuss.md` for the question framework and `context.md` output format.

      - **Complex scope**: Discuss is REQUIRED. Do not start spec.md until context.md is written.
      - **Large scope**: Discuss is recommended. Ask user: "Run Discuss to capture context first? (yes/skip)"
      - **Quick/Medium**: Skip Discuss entirely.
      ```
  - **Done when:** `spec-discuss.md` exists with framework, process, and `context.md` template; `phase-spec.md` has Step 2b with scope rules
  - **Traces:** SDV4-16, SDV4-17

- [x] **C2** — Create `test-uat.md` and integrate into `phase-test.md`
  - **Files:**
    - `packages/spells/skills/spec-driven/references/test-uat.md` *(NEW)*
    - `packages/spells/skills/spec-driven/references/phase-test.md` *(UPDATE)*
  - **Depends on:** A5 (phase-test has `.specs/` paths)
  - **What to create in `test-uat.md`:**
    - Title: "UAT Sub-Step — User Acceptance Testing"
    - Purpose: validate feature from user perspective after automated tests pass; catch UX gaps that unit tests miss
    - When to run: after all automated tests pass; before REVIEW phase; only for user-facing features
    - Scope rules:
      | Scope | UAT Scenarios |
      |-------|--------------|
      | Quick | Skip UAT |
      | Medium | 1-2 happy path scenarios |
      | Large | 3-5 scenarios (happy path + 1-2 edge cases) |
      | Complex | 5+ scenarios (happy path + edge cases + error states) |
    - UAT scenario template:
      ```markdown
      ### UAT-NNN: <Scenario Title>
      - **As**: <user role>
      - **When**: <specific action or sequence>
      - **Then**: <expected observable outcome>
      - **Status**: PASS / FAIL / SKIP
      - **Notes**: <observations, deviations, screenshots if applicable>
      ```
    - Sign-off criteria: all scenarios PASS or SKIP with written justification; zero FAIL
    - If FAIL: log in feature STATE.md as blocker; return to BUILD
  - **What to change in `phase-test.md`:**
    - Add after automated test steps, before approval gate:
      ```
      ### UAT Sub-Step

      After automated tests pass, run UAT scenarios for user-facing features.
      → See `test-uat.md` for scenario template, scope rules, and sign-off criteria.

      Skip UAT if: feature has no user-facing changes (backend only, internal tooling, refactoring).
      ```
  - **Done when:** `test-uat.md` exists with scope rules, template, and sign-off criteria; `phase-test.md` has UAT sub-step
  - **Traces:** SDV4-18, SDV4-19

- [x] **C3** — Add atomic commit policy to `build-cycle.md`
  - **Files:** `packages/spells/skills/spec-driven/references/build-cycle.md`
  - **What to change:**
    - Add a new section "## Atomic Commit Policy" (add before the final section of the file, or at the end if no clear insertion point):
      ```markdown
      ## Atomic Commit Policy

      Each task in `tasks.md` should result in exactly one atomic commit.

      **Rules:**
      - **One concern per commit.** Never mix feature code + refactoring + formatting in the same commit.
      - **Independently revertable.** Each commit must leave the build in a passing state.
      - **Size limit.** If a task produces >300 lines changed, consider splitting into sub-commits by logical boundary.

      **Commit message format:** `type(scope): description`

      | Type | Use for |
      |------|---------|
      | `feat` | New feature or capability |
      | `fix` | Bug fix |
      | `refactor` | Code restructure without behavior change |
      | `docs` | Documentation only |
      | `test` | Test additions or corrections |
      | `chore` | Build, tooling, dependency updates |

      **Examples:**
      - ✅ `feat(spec-driven): add phase-map.md reference`
      - ✅ `refactor(spec-driven): migrate docs/ paths to .specs/`
      - ✅ `docs(spec-driven): add knowledge-chain verification guide`
      - ❌ `update spec-driven` — no type, no scope, vague
      - ❌ `feat(spec-driven): add phase-map + fix typos + update README` — mixed concerns
      ```
  - **Done when:** Atomic Commit Policy section exists with rules, size limit, format table, and examples (good and bad)
  - **Traces:** SDV4-20

- [x] **C4** — Add Complex tier to `scope-detection.md`
  - **Files:** `packages/spells/skills/spec-driven/references/scope-detection.md`
  - **What to change:**
    - Update the Thresholds table to add Complex row:
      ```
      | Score | Scope | Artifacts |
      |-------|-------|-----------|
      | ≤ 4 | **Quick** | TASK.md only |
      | 5–9 | **Medium** | spec.md + tasks.md |
      | 10–11 | **Large** | spec.md + design.md + tasks.md |
      | ≥ 12 | **Complex** | spec.md + context.md + design.md + tasks.md |
      ```
      *(Note: Large threshold changes from ≥10 to 10-11 to make room for Complex at ≥12)*
    - Add Complex characteristics section:
      ```
      ### Complex Scope (Score ≥12)

      Characteristics of Complex features:
      - Touches 4+ distinct modules or subsystems
      - Requires new architectural patterns not currently in the codebase
      - Has 4+ external integration points
      - Involves data migrations or breaking API changes
      - Requires domain expertise not currently documented

      Complex workflow: SPEC (with mandatory Discuss → context.md) → PLAN (formal design.md) → BUILD → TEST (with UAT) → REVIEW → SIMPLIFY → SHIP
      ```
    - Update Manual Override section to add: `/spec complex <description>` → force Complex
    - Add a Complex scoring example:
      ```
      ### Complex (score 13)
      "Implement multi-tenant billing with Stripe, usage metering, and invoice generation"
      - Files: 10+ files (score 3 ×2 = 6)
      - Concepts: 3+ new (Stripe webhooks, metering, invoice PDF) (score 3 ×2 = 6)
      - Ambiguity: significant (2)
      - Integrations: 4+ (2)
      - Risk: high (2)
      - **Total: 18 → Complex**
      ```
  - **Done when:** Complex tier (≥12) in thresholds table; characteristics section; manual override option; scoring example
  - **Traces:** SDV4-15

## Phase D — Review & Ship Updates (D1–D3)

- [x] **D1** — Update `phase-review.md` for multi-agent delegation
  - **Files:** `packages/spells/skills/spec-driven/references/phase-review.md`
  - **Depends on:** A5 (paths migrated), B2 (sub-agent-delegation.md exists)
  - **What to change:**
    - Add at the top, after the "## When" section:
      ```
      ## Multi-Agent Review Flow

      In the multi-agent system, REVIEW maps to two sequential sub-agents:

      1. **Ward** (security review) — reviews for vulnerabilities, auth issues, input validation, secrets. See `sub-agent-delegation.md` for input/output contracts.
      2. **Arbiter** (quality review) — reviews for code quality, spec compliance, consistency. See `sub-agent-delegation.md` for input/output contracts.

      Flow: `Forge completes BUILD` → `Ward reviews` → if APPROVE → `Arbiter reviews` → if APPROVE → proceed to SIMPLIFY.

      If Ward or Arbiter returns REJECT: return all findings to BUILD phase with explicit list of items to fix. Re-run full review after fix.
      ```
  - **Done when:** Multi-Agent Review Flow section exists with Ward/Arbiter refs, flow, and reject handling
  - **Traces:** SDV4-14

- [x] **D2** — Update `phase-ship.md` with STATE.md update step
  - **Files:** `packages/spells/skills/spec-driven/references/phase-ship.md`
  - **Depends on:** A5 (paths migrated), A2 (state-global.md exists)
  - **What to change:**
    - Add as the final step in the SHIP phase (after tagging/changelog, before Completion Criteria):
      ```
      ### Final Step: Update STATE

      After shipping:
      1. Update `.specs/features/<name>/STATE.md`: set `status: shipped`, set `shipped: YYYY-MM-DD`
      2. Update `.specs/project/STATE.md`:
         - Add lesson entry if anything noteworthy was learned during this feature
         - Close any blockers in `## Blockers` that were resolved by this feature
         - Add shipped feature to `## Decisions` if it introduced an architectural decision
      3. Archive session log: ensure `.specs/sessions/YYYY-MM-DD-<name>.md` is written
      ```
  - **Done when:** Final STATE update step exists with 3 sub-steps
  - **Traces:** SDV4-09 (ship-specific), SDV4-06 (STATE usage)

- [x] **D3** — Update `state-management.md` for dual-level STATE
  - **Files:** `packages/spells/skills/spec-driven/references/state-management.md`
  - **Depends on:** A2 (state-global.md exists)
  - **What to change:**
    - Add at the top, before existing content, a new section "## Dual-Level STATE":
      ```
      ## Dual-Level STATE

      The spec-driven skill maintains two levels of STATE:

      ### Global STATE — `.specs/project/STATE.md`
      - **Scope**: cross-cutting, project-wide
      - **Content**: architectural decisions, project-wide blockers, lessons learned across features, cross-feature todos, deferred ideas
      - **Lifecycle**: persists indefinitely; pruned monthly for completed items
      - **Schema**: → see `state-global.md`

      ### Feature STATE — `.specs/features/<name>/STATE.md`
      - **Scope**: single feature only
      - **Content**: checkpoint (last completed phase), artifact status, feature-specific blockers, resume context
      - **Lifecycle**: created at SPEC start → updated each phase → archived (status: shipped) at SHIP
      - **Schema**: → see below (existing frontmatter format)

      **Rule**: Never duplicate information between global and feature STATE. If an item affects only one feature → feature STATE. If it affects multiple features or the project as a whole → global STATE.
      ```
    - Replace all `docs/` path references in the rest of the file with `.specs/` equivalents
  - **Done when:** Dual-level section exists at top with global/feature distinction, lifecycle, rule; zero `docs/` references in file
  - **Traces:** SDV4-07

## Phase E — Verification (E1)

- [x] **E1** — Full verification pass
  - **Files:** All files in `packages/spells/skills/spec-driven/`
  - **Depends on:** ALL previous tasks (A1-A7, B1-B5, C1-C4, D1-D3) must be complete
  - **What to do:**
    1. Read `SKILL.md` end-to-end. Check:
       - [ ] Version is 4.0.0 in header
       - [ ] MAP phase present in dispatch table
       - [ ] Zero occurrences of: `docs/project`, `docs/conventions`, `docs/decisions`, `docs/sessions`
       - [ ] LOAD section references `.specs/project/`, `.specs/codebase/`, `.specs/features/`
       - [ ] LEARN section references `.specs/sessions/`, `.specs/project/STATE.md`
    2. For each file in `references/`, check:
       - [ ] Zero occurrences of `docs/project`, `docs/conventions`, `docs/decisions`
       - [ ] All paths use `.specs/` prefix where applicable
       - [ ] Cross-references to new files (knowledge-chain.md, sub-agent-delegation.md, etc.) are valid
    3. Check `.skill-meta.json`: version is `4.0.0`
    4. Check `README.md`: has `/map`, `/init`, Complex tier, breaking change note
    5. Count files in `references/`: must be exactly 35 (26 original + 9 new)
    6. Produce a verification report:
       ```
       ## Verification Report — spec-driven v4.0.0

       Files checked: N
       docs/ references found: 0 (PASS) | [list] (FAIL)
       Missing cross-references: 0 (PASS) | [list] (FAIL)
       Version consistency: PASS | FAIL
       Reference file count: 35/35 (PASS) | N/35 (FAIL)
       ```
  - **Done when:** Verification report shows all PASS; zero `docs/` references across entire skill directory
  - **Traces:** SDV4-26

## Dependency Graph

```
A1, A2, A3a, A3b, A3c, A3d, A7   ← all independent, can run in parallel

A1 ──────────────────► A4
A1 ──────────────────► A5
A1 ──────────────────► A6

B1, B2   ← independent of A (can start after A1 completes)

A5 ──────────────────► B3
A5 + B1 ─────────────► B4
A5 + B1 ─────────────► B5

A5 ──────────────────► C1 (also needs B5)
A5 ──────────────────► C2
                        C3, C4 ← independent of other B/C tasks

A5 ──────────────────► D1 (also needs B2)
A2 + A5 ─────────────► D2
A2 + A5 ─────────────► D3

ALL ─────────────────► E1
```

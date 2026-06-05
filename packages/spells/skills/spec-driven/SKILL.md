---
name: spec-driven
description: >
  Adaptive project and feature workflow from quick fixes through full spec-to-ship delivery.
  Use when saying "initialize project", "map codebase", "quick fix", "specify this feature",
  "plan the work", "build and test it", "validate", "review code", "simplify this", or "release it".
  Triggered by /init, /map, /spec, /plan, /build, /test, /validate, /review, /simplify, /ship,
  pause/resume commands, and Portuguese equivalents.
  Do NOT use for native OpenCode plan/build command routing or unrelated standalone tasks outside this workflow.
license: CC-BY-4.0
---

# spec-driven (v4.1.0)

A lifecycle meta-skill that orchestrates project memory, codebase mapping, feature planning, execution, validation, review, simplification, and shipping. Routes user triggers to individual phase handlers. v4 uses `.specs/` as the canonical artifact root; this workflow does not define or use a parallel `.spec/` convention.

```
LOAD → DISPATCH → [INIT|MAP|QUICK|SPEC|PLAN|BUILD|TEST|VALIDATE|REVIEW|SIMPLIFY|SHIP|PAUSE|RESUME] → LEARN
```

**LEARN is project-memory capture.** It updates `.specs/` project/session knowledge after work. Optional learner-facing exercises are a separate post-completion offer and only run after explicit user permission.

---

## Quick Reference: Phases & Triggers

| Phase            | PT Triggers                                     | EN Triggers                                            | Scope   | Output                                                              |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------ | ------- | ------------------------------------------------------------------- |
| **INIT**         | `inicializar projeto`                           | `/init`, `initialize project`, `setup project`         | Project | `.specs/project/PROJECT.md`, `ROADMAP.md`, `STATE.md`, `HANDOFF.md` |
| **MAP**          | `mapear codebase`, `analisar projeto existente` | `/map`, `map codebase`                                 | Auto    | `.specs/codebase/` (7 docs)                                         |
| **QUICK**        | `correção rápida`, `pequena mudança`            | `quick fix`, `quick task`, `small change`, `bug fix`   | Quick   | `.specs/quick/NNN-slug/`                                            |
| **SPEC**         | `vamos especificar`, `preciso de um spec`       | `specify`, `write spec`, `what should we build`        | Auto    | `.specs/features/<name>/spec.md`                                    |
| **PLAN**         | `vamos planejar`, `quebra em tarefas`           | `plan this`, `break into tasks`, `design the approach` | Auto    | `.specs/features/<name>/tasks.md`                                   |
| **BUILD**        | `vamos construir`, `implementar`                | `build this`, `implement`, `execute tasks`             | Auto    | Code files + task checkmarks                                        |
| **TEST**         | `vamos testar`, `teste isso`                    | `test this`, `verify`, `prove it works`                | Auto    | Test results + coverage                                             |
| **VALIDATE**     | `validar`, `UAT`, `testar comigo`               | `validate`, `verify work`, `walk me through it`, `UAT` | Auto    | Validation report + optional UAT results                            |
| **REVIEW**       | `revisa isso`, `code review`                    | `review this`, `code review`, `check quality`          | Auto    | Review notes + verdict                                              |
| **SIMPLIFY**     | `simplifica`, `refatora`                        | `simplify this`, `refactor`, `reduce complexity`       | Auto    | Refactored code                                                     |
| **SHIP**         | `vamos fazer release`, `versiona`               | `ship it`, `release`, `publish`                        | Auto    | Release tag + changelog                                             |
| **PAUSE/RESUME** | `pausar trabalho`, `retomar trabalho`           | `pause work`, `resume work`, `continue`, `handoff`     | Auto    | `.specs/project/HANDOFF.md` + `.specs/project/STATE.md`             |

---

## Trigger Dispatch Table

The meta-skill pattern-matches user input against these patterns (case-insensitive, PT/EN):

**MAP phase triggers:**

- `/map`, `map codebase`, `mapear código`, `analisar projeto existente`

**INIT triggers:**

- `/init`, `initialize project`, `setup project`, `inicializar projeto`

**QUICK mode triggers:**

- `quick fix`, `quick task`, `small change`, `bug fix`, `just do X`, `correção rápida`, `pequena mudança`

**SPEC phase triggers:**

- `/spec`, `specify`, `write spec`, `what should we build`, `vamos especificar`, `preciso de um spec`

**PLAN phase triggers:**

- `/plan`, `plan this`, `break into tasks`, `design the approach`, `vamos planejar`, `quebra em tarefas`

**BUILD phase triggers:**

- `/build`, `build this`, `implement`, `execute tasks`, `vamos construir`, `implementar`

**TEST phase triggers:**

- `/test`, `test this`, `verify`, `prove it works`, `vamos testar`, `teste isso`

**VALIDATE triggers:**

- `validate`, `verify work`, `UAT`, `test with me`, `walk me through it`, `validar`, `testar comigo`

**REVIEW phase triggers:**

- `/review`, `code review`, `review this`, `check quality`, `revisa isso`

**SIMPLIFY phase triggers:**

- `/simplify`, `refactor`, `simplify this`, `reduce complexity`, `simplifica`, `refatora`

**SHIP phase triggers:**

- `/ship`, `release`, `publish`, `ship it`, `vamos fazer release`, `versiona`

**Special triggers:**

- `/spec resume`, `resume work`, `continue`, `retomar trabalho` → Load handoff and last state, continue from checkpoint
- `/spec pause`, `pause work`, `end session`, `pausar trabalho` → Save checkpoint, handoff, and session memory
- `/init`, `initialize project`, `setup project`, `inicializar projeto` → Initialize `.specs/project/`
- `/map <doc>` → Selective codebase mapping (e.g., `/map stack`, `/map architecture`)

---

## Dispatch Algorithm

Match the user's input against this decision tree (in order):

1. **PAUSE/RESUME command** — If input matches pause/resume/handoff triggers → route to `session-handoff.md`
2. **INIT command** — If input matches INIT triggers (e.g., `/init`, `initialize project`) → route to `project-init.md`
3. **MAP command** — If input matches MAP triggers (e.g., `/map`, `map codebase`) → route to MAP phase directly
4. **QUICK command** — If input is one sentence, expected to touch ≤3 files, and has no design decision → route to `quick-mode.md`
5. **Explicit phase command** — If input starts with `/spec`, `/plan`, `/build`, `/test`, `/validate`, `/review`, `/simplify`, `/ship` → route to that phase directly
6. **Resume fallback** — If input contains `resume`, `continue`, `retomar` → check `.specs/project/HANDOFF.md` and `.specs/project/STATE.md`, then route to the most recent incomplete phase
7. **Keyword match** — Scan for phase keywords (see Trigger Dispatch Table above); use highest-confidence match
8. **Ambiguous** — If no clear match, ask: "Which phase? INIT / MAP / QUICK / SPEC / PLAN / BUILD / TEST / VALIDATE / REVIEW / SIMPLIFY / SHIP / PAUSE / RESUME"
9. **Default** — If user describes a new feature with no phase context → start SPEC

Never guess silently. When ambiguous, surface the ambiguity.

---

## LOAD Phase (Inline)

**When**: Always — every invocation starts here.

**Goal**: Build a context summary from prior knowledge before routing to phase handler.

### Steps

1. Check whether `.specs/project/` exists at the project root.
   - If missing → note "first run" and suggest: `Run /init to bootstrap .specs/project/`
   - If exists, proceed to step 2

2. If `.specs/project/` exists, read (always):
   - `.specs/project/PROJECT.md` — project vision, goals, active modules
   - `.specs/project/ROADMAP.md` — planned features and milestones
   - `.specs/project/STATE.md` — architectural decisions, blockers, lessons
   - `.specs/project/HANDOFF.md` — current checkpoint for pause/resume, if present
   - The 3 most recent files in `.specs/sessions/` (by date, descending)

3. **Load `.specs/codebase/` docs on-demand (budget-aware)**: Only load when active phase needs them. See `context-loading.md` for tier strategy.

4. **Context budget**: Total loaded ≤ 160k tokens. Reserve 40k for active phase work. Load in priority order; stop when budget exhausted. See `context-loading.md`.

5. Run **knowledge chain verification** (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.

6. Produce a **Context Summary**:

```
## Context Summary

Project: [inferred from .specs/project/PROJECT.md or "unknown"]
Active feature: [if resuming]
Known conventions: [bullet list, max 5]
Recent decisions: [bullet list, max 3]
Last session: [date/feature, or "none"]
Knowledge chain confidence: [HIGH | MEDIUM | LOW]
Prior context from: [file list]
```

1. If confidence = MEDIUM or LOW → flag caution in output and alert user.

---

## Scope Detection (Referenced)

After LOAD, detect scope using the scoring matrix in `references/scope-detection.md`:

1. Analyze user's description against 5 signals: files, concepts, ambiguity, integrations, risk
2. Calculate score
3. Recommend scope (Quick/Medium/Large)
4. If user disputes → allow override

If user specified scope explicitly (`quick`, `medium`, `large`) → skip detection.

---

## Phase Dispatch

After LOAD and scope detection, pattern-match the user's trigger against the Trigger Dispatch Table above and load the corresponding phase reference file:

- User said "specify" or "what should we build" → Load and execute `references/phase-spec.md`
- User said "plan this" or "break into tasks" → Load and execute `references/phase-plan.md`
- User said "implement" or "build this" → Load and execute `references/phase-build.md`
- User said "test this" or "verify" → Load and execute `references/phase-test.md`
- User said "validate", "UAT", or "walk me through it" → Load and execute `references/validate.md`
- User said "review this" or "code review" → Load and execute `references/phase-review.md`
- User said "simplify" or "refactor" → Load and execute `references/phase-simplify.md`
- User said "ship" or "release" → Load and execute `references/phase-ship.md`
- User said "quick fix" or "small change" → Load and execute `references/quick-mode.md`
- User said "pause", "resume", or "handoff" → Load and execute `references/session-handoff.md`

Each phase file is self-contained with: When, Goal, Steps, Supporting References, Approval Gate, Completion Criteria.

---

## Error Handling

| Situation                                   | Action                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/spec resume` but no checkpoint found      | Inform user, ask to start from SPEC                                                                       |
| `.specs/project/` missing or empty          | Note "Project not initialized. Run `/init` to bootstrap.", proceed                                        |
| `.specs/project/PROJECT.md` malformed       | Skip that file, log warning, load remaining `.specs/` files                                               |
| Tests fail during SHIP                      | Block ship, route to BUILD or TEST phase                                                                  |
| Scope estimate changes mid-phase            | Note the change, update `.specs/features/*/tasks.md`, continue                                            |
| User interrupts mid-phase                   | Save checkpoint to `.specs/project/HANDOFF.md` and progress note to `.specs/sessions/`, confirm next step |
| Historical specs exist in `.specs/archive/` | Do not load archived documents by default; load only when the user names one explicitly                   |

---

## LEARN Phase (Inline)

**When**: After phase completes or on explicit `/spec pause`.

**Goal**: Capture session knowledge and update persistent `.specs/` knowledge base.

### 6a. Session Log

Create `.specs/sessions/YYYY-MM-DD-<feature>.md` using template `references/session-template.md`.

Fill:

- **What Was Done**: bullet list of changes
- **Files Changed**: list of modified/created files
- **Decisions Made**: architectural or design choices
- **Conventions Discovered**: new patterns found
- **Open Items**: blocked or deferred work

Session logs are **immutable** — never edit after writing.

LEARN captures operational memory only. Do not mix learner exercises, teaching prompts, or quizzes into session logs unless the user explicitly asked to record a learning outcome as project knowledge.

### 6b. Live Docs Updates

Update only when genuinely new:

| Discovery                    | Target                                                                                 | Action          |
| ---------------------------- | -------------------------------------------------------------------------------------- | --------------- |
| New module/feature shipped   | `.specs/project/PROJECT.md` (active modules) + `.specs/project/STATE.md` (lessons)     | Append sections |
| New code pattern             | `.specs/codebase/CONVENTIONS.md` (if `/map` done)                                      | Append entry    |
| Architectural decision       | `.specs/project/STATE.md` (Decisions section)                                          | Append entry    |
| Tech debt or risk discovered | `.specs/codebase/CONCERNS.md` (if `/map` done) or `.specs/project/STATE.md` (Blockers) | Append entry    |
| Cross-feature action item    | `.specs/project/STATE.md` (Todos section)                                              | Append entry    |
| Nothing new                  | (none)                                                                                 | Skip            |

Rules:

- Append only (no overwrites)
- Deduplicate (check before adding)
- Attribute: "(from: feature-name, date: YYYY-MM-DD)"

### 6c. First-Run Scaffold

If `.specs/project/` missing:

Run `/init` command. See `project-init.md` for full scaffold.

### 6d. Graphify (Optional)

If `graphify` skill available, suggest:

> "Run `/graphify --update .` to update the knowledge graph."
> Do not auto-invoke.

### 6e. Completion

Present LEARN summary:

```
## LEARN Complete

Session log: .specs/sessions/{{date}}-{{feature}}.md
Updated: [files, or "none"]
Graphify: [available / not available]
```

### 6f. Optional Learning Offer (Separate from LEARN)

After meaningful work, optionally offer a short learning exercise using `learning-opportunities.md`.

Offer only after:

- Architectural decisions
- New files, modules, or schemas
- Refactors
- Unfamiliar patterns
- User asks why/how during development

Do not offer after:

- Quick fixes
- Hotfixes or urgent delivery
- Pure debugging
- User declined earlier in the session
- User says `just ship it`, `fix this quick`, or equivalent urgency signals

When offering, ask one sentence and stop immediately after the question:

> "Would you like a quick learning exercise on [topic]? About 10-15 minutes."

Do not provide hints, examples, or suggested answers until the user opts in.

---

## Resume / Pause

### Resume

When user says `resume work` or `/spec resume`:

1. Run LOAD phase
2. Load `.specs/project/HANDOFF.md` if present
3. Load `.specs/project/STATE.md` for project-level decisions, blockers, and todos
4. Check `.specs/features/*/tasks.md` for `status: pending` or `status: in-progress`
5. If found → present feature name and first unchecked task. Ask: "Resume from here? (yes/no)"
6. If approved → jump to the recorded phase/checkpoint

### Pause

When user says `pause work` or `/spec pause`:

1. Write `.specs/project/HANDOFF.md` using `session-handoff.md`
2. Update `.specs/project/STATE.md` with project-level blockers/todos only when needed
3. Set tasks.md `status` to `in-progress` when pausing during a feature
4. Run LEARN phase (session log, update docs)
5. Report: "Work paused. Resume with `/spec resume`."

---

## Skill Integrations

Optional integrations. Check availability before suggesting:

| Skill                    | When to suggest                                          |
| ------------------------ | -------------------------------------------------------- |
| `mermaid-studio`         | During PLAN phase, for architecture diagrams             |
| `codenavi`               | During SPEC/PLAN, for deep codebase navigation           |
| `graphify`               | After LEARN, to update knowledge graph                   |
| `learning-opportunities` | After meaningful non-urgent work, for optional exercises |

---

## Context Loading Strategy

See `context-loading.md` for detailed 3-tier strategy:

1. **Project context** (always): `.specs/project/PROJECT.md`, `.specs/project/ROADMAP.md`, `.specs/project/STATE.md`, `.specs/project/HANDOFF.md` (~6k tokens)
2. **Codebase context** (on-demand, budget-aware): `.specs/codebase/` docs in priority order: STACK → ARCHITECTURE → CONVENTIONS → STRUCTURE → TESTING → INTEGRATIONS → CONCERNS (~5k per file)
3. **Feature context** (when resuming): `.specs/features/<name>/STATE.md` → `spec.md` → `context.md` → `design.md` → `tasks.md` (~8k tokens)

**Total budget**: 160k tokens. Reserve 40k for active phase work. Load in priority order; stop when budget exhausted.

**On-demand strategy**: Load `.specs/codebase/` docs only when the active phase needs them. Build and architecture phases always load STACK + ARCHITECTURE. Test phase always loads TESTING.

If file exceeds budget, load recent sections only.

---

## Supporting References

All phase files and supporting documentation are in `references/`:

**Phase files:**

- `phase-map.md` — MAP phase (codebase mapping) details
- `phase-spec.md` — SPEC phase details
- `phase-plan.md` — PLAN phase details
- `phase-build.md` — BUILD phase details
- `phase-test.md` — TEST phase details
- `validate.md` — Validation and interactive UAT guidance
- `phase-review.md` — REVIEW phase details
- `phase-simplify.md` — SIMPLIFY phase details
- `phase-ship.md` — SHIP phase details

**Templates & Reference Structures:**

- `knowledge-base.md` — `.specs/` structure and knowledge routing
- `project-init.md` — `/init` command and `.specs/project/` scaffold
- `quick-mode.md` — Quick task workflow, guardrails, verification, tracking
- `session-handoff.md` — Pause/resume handoff via `.specs/project/HANDOFF.md`
- `state-global.md` — Global STATE.md schema and rules
- `state-template.md` — Feature STATE.md template
- `brownfield-mapping.md` — Codebase mapping templates and Scout questions
- `concerns.md` — Tech debt & risk documentation
- `spec-template.md` — Spec artifact template
- `task-template.md` — Task artifact template
- `tasks-template.md` — Tasks file template
- `design-template.md` — Design artifact template
- `session-template.md` — Session log template

**Discipline & Patterns:**

- `knowledge-chain.md` — Context verification (5-step)
- `sub-agent-delegation.md` — Delegation contracts (Scout, Sage, Forge, Ward, Arbiter)
- `spec-discuss.md` — Discuss sub-step for Complex scope
- `test-uat.md` — UAT sub-step for user-facing features
- `learning-opportunities.md` — Optional learner-facing exercises after meaningful work
- `vertical-slicing.md` — Vertical slicing guide
- `build-cycle.md` — Build cycle patterns & atomic commit policy
- `prove-it-pattern.md` — Test-first patterns
- `review-axes.md` — Code review framework
- `simplification-patterns.md` — Refactoring patterns

**Utilities:**

- `scope-detection.md` — Scope scoring matrix (with Complex tier)
- `skill-anatomy.md` — Skill structure guide
- `task-format.md` — Task formatting rules
- `state-management.md` — Dual-level STATE tracking patterns
- `archive-workflow.md` — Archival and cleanup
- `context-loading.md` — Context management rules (3-tier, 160k budget)
- `scope-discipline.md` — Scope control principles

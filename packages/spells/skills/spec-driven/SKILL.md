---
name: spec-driven
description: >
  Full lifecycle feature development from spec to ship. Use when saying "specify this feature",
  "plan the work", "build and test it", "review code", "simplify this", or "release it".
  Triggered by /spec, /plan, /build, /test, /review, /simplify, /ship — and their
  Portuguese equivalents (especificar, planejar, implementar, testar, revisar, simplificar, publicar).
  Do NOT use for quick one-off edits, standalone bugfixes, or tasks that don't fit a feature workflow.
license: CC-BY-4.0
---

# spec-driven (v4.0.0)

A 7-phase meta-skill that orchestrates the complete development lifecycle. Routes user triggers to individual phase handlers. v4 uses `.specs/` instead of `docs/`.

```
LOAD → DISPATCH → [MAP|SPEC|PLAN|BUILD|TEST|REVIEW|SIMPLIFY|SHIP] → LEARN
```

---

## Quick Reference: Phases & Triggers

| Phase | PT Triggers | EN Triggers | Scope | Output |
|-------|------------|-------------|-------|--------|
| **MAP** | `mapear codebase`, `analisar projeto existente` | `/map`, `map codebase` | Auto | `.specs/codebase/` (7 docs) |
| **SPEC** | `vamos especificar`, `preciso de um spec` | `specify`, `write spec`, `what should we build` | Auto | `.specs/features/<name>/spec.md` |
| **PLAN** | `vamos planejar`, `quebra em tarefas` | `plan this`, `break into tasks`, `design the approach` | Auto | `.specs/features/<name>/tasks.md` |
| **BUILD** | `vamos construir`, `implementar` | `build this`, `implement`, `execute tasks` | Auto | Code files + task checkmarks |
| **TEST** | `vamos testar`, `teste isso` | `test this`, `verify`, `prove it works` | Auto | Test results + coverage |
| **REVIEW** | `revisa isso`, `code review` | `review this`, `code review`, `check quality` | Auto | Review notes + verdict |
| **SIMPLIFY** | `simplifica`, `refatora` | `simplify this`, `refactor`, `reduce complexity` | Auto | Refactored code |
| **SHIP** | `vamos fazer release`, `versiona` | `ship it`, `release`, `publish` | Auto | Release tag + changelog |

---

## Trigger Dispatch Table

The meta-skill pattern-matches user input against these patterns (case-insensitive, PT/EN):

**MAP phase triggers:**
- `/map`, `map codebase`, `mapear código`, `analisar projeto existente`

**SPEC phase triggers:**
- `/spec`, `specify`, `write spec`, `what should we build`, `vamos especificar`, `preciso de um spec`

**PLAN phase triggers:**
- `/plan`, `plan this`, `break into tasks`, `design the approach`, `vamos planejar`, `quebra em tarefas`

**BUILD phase triggers:**
- `/build`, `build this`, `implement`, `execute tasks`, `vamos construir`, `implementar`

**TEST phase triggers:**
- `/test`, `test this`, `verify`, `prove it works`, `vamos testar`, `teste isso`

**REVIEW phase triggers:**
- `/review`, `code review`, `review this`, `check quality`, `revisa isso`

**SIMPLIFY phase triggers:**
- `/simplify`, `refactor`, `simplify this`, `reduce complexity`, `simplifica`, `refatora`

**SHIP phase triggers:**
- `/ship`, `release`, `publish`, `ship it`, `vamos fazer release`, `versiona`

**Special triggers:**
- `/spec resume` → Load last session, continue from checkpoint
- `/spec pause` → Save checkpoint and session
- `/init`, `initialize project`, `setup project`, `inicializar projeto` → Initialize `.specs/project/`
- `/map <doc>` → Selective codebase mapping (e.g., `/map stack`, `/map architecture`)

---

## Dispatch Algorithm

Match the user's input against this decision tree (in order):

1. **MAP command** — If input matches MAP triggers (e.g., `/map`, `map codebase`) → route to MAP phase directly
2. **INIT command** — If input matches INIT triggers (e.g., `/init`, `initialize project`) → route to INIT phase directly
3. **Explicit phase command** — If input starts with `/spec`, `/plan`, `/build`, `/test`, `/review`, `/simplify`, `/ship` → route to that phase directly
4. **Resume command** — If input contains `resume`, `continue`, `retomar` → check `.specs/features/*/tasks.md` for incomplete tasks, route to most recent incomplete phase
5. **Keyword match** — Scan for phase keywords (see Trigger Dispatch Table above); use highest-confidence match
6. **Ambiguous** — If no clear match, ask: "Which phase? MAP / INIT / SPEC / PLAN / BUILD / TEST / REVIEW / SIMPLIFY / SHIP"
7. **Default** — If user describes a new feature with no phase context → start SPEC

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

7. If confidence = MEDIUM or LOW → flag caution in output and alert user.

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
- User said "review this" or "code review" → Load and execute `references/phase-review.md`
- User said "simplify" or "refactor" → Load and execute `references/phase-simplify.md`
- User said "ship" or "release" → Load and execute `references/phase-ship.md`

Each phase file is self-contained with: When, Goal, Steps, Supporting References, Approval Gate, Completion Criteria.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| `/spec resume` but no checkpoint found | Inform user, ask to start from SPEC |
| `.specs/project/` missing or empty | Note "Project not initialized. Run `/init` to bootstrap.", proceed |
| `.specs/project/PROJECT.md` malformed | Skip that file, log warning, load remaining `.specs/` files |
| Tests fail during SHIP | Block ship, route to BUILD or TEST phase |
| Scope estimate changes mid-phase | Note the change, update `.specs/features/*/tasks.md`, continue |
| User interrupts mid-phase | Save progress note to `.specs/sessions/`, confirm next step |

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

### 6b. Live Docs Updates

Update only when genuinely new:

| Discovery | Target | Action |
|-----------|--------|--------|
| New module/feature shipped | `.specs/project/PROJECT.md` (active modules) + `.specs/project/STATE.md` (lessons) | Append sections |
| New code pattern | `.specs/codebase/CONVENTIONS.md` (if `/map` done) | Append entry |
| Architectural decision | `.specs/project/STATE.md` (Decisions section) | Append entry |
| Tech debt or risk discovered | `.specs/codebase/CONCERNS.md` (if `/map` done) or `.specs/project/STATE.md` (Blockers) | Append entry |
| Cross-feature action item | `.specs/project/STATE.md` (Todos section) | Append entry |
| Nothing new | (none) | Skip |

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
Do not auto-invoke.

### 6e. Completion

Present LEARN summary:
```
## LEARN Complete

Session log: .specs/sessions/{{date}}-{{feature}}.md
Updated: [files, or "none"]
Graphify: [available / not available]
```

---

## Resume / Pause

### Resume

When user says `resume work` or `/spec resume`:

1. Run LOAD phase
2. Check `.specs/features/*/tasks.md` for `status: pending` or `status: in-progress`
3. If found → present feature name and first unchecked task. Ask: "Resume from here? (yes/no)"
4. If approved → jump to BUILD phase at first unchecked task

### Pause

When user says `pause work` or `/spec pause`:

1. Run LEARN phase (session log, update docs)
2. Set tasks.md `status` to `in-progress`
3. Report: "Work paused. Resume with `/spec resume`."

---

## Skill Integrations

Optional integrations. Check availability before suggesting:

| Skill | When to suggest |
|-------|----------------|
| `mermaid-studio` | During PLAN phase, for architecture diagrams |
| `codenavi` | During SPEC/PLAN, for deep codebase navigation |
| `graphify` | After LEARN, to update knowledge graph |

---

## Context Loading Strategy

See `context-loading.md` for detailed 3-tier strategy:

1. **Project context** (always): `.specs/project/PROJECT.md`, `.specs/project/ROADMAP.md`, `.specs/project/STATE.md` (~6k tokens)
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
- `phase-review.md` — REVIEW phase details
- `phase-simplify.md` — SIMPLIFY phase details
- `phase-ship.md` — SHIP phase details

**Templates & Reference Structures:**
- `knowledge-base.md` — `.specs/` structure and knowledge routing
- `project-init.md` — `/init` command and `.specs/project/` scaffold
- `state-global.md` — Global STATE.md schema and rules
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


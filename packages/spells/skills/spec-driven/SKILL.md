---
name: spec-driven
version: 3.0.0
type: meta-skill
description: "Full lifecycle development pipeline — SPEC, PLAN, BUILD, TEST, REVIEW, SIMPLIFY, SHIP"
trigger: /spec
scope: public
audience: development-teams
license: CC-BY-4.0
---

# spec-driven (v3.0.0)

A 7-phase meta-skill that orchestrates the complete development lifecycle. Routes user triggers to individual phase handlers.

```
LOAD → DISPATCH → [SPEC|PLAN|BUILD|TEST|REVIEW|SIMPLIFY|SHIP] → LEARN
```

---

## Quick Reference: Phases & Triggers

| Phase | PT Triggers | EN Triggers | Scope | Output |
|-------|------------|-------------|-------|--------|
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
- `map codebase` → LOAD only, produce context summary

---

## LOAD Phase (Inline)

**When**: Always — every invocation starts here.

**Goal**: Build a context summary from prior knowledge before routing to phase handler.

### Steps

1. Check whether `docs/` exists at the project root.
   - If missing → note "first run" and proceed. `docs/` will be scaffolded in LEARN phase.

2. If `docs/` exists, read:
   - `docs/project.md` — project overview, modules, active features
   - `docs/conventions.md` — coding patterns, naming rules
   - `docs/decisions.md` — architectural choices
   - The 3 most recent files in `docs/sessions/` (by date, descending)

3. If `.specs/codebase/` exists, load domain-specific reference files on-demand.

4. **Context budget**: Total loaded ≤ 40k tokens. If files are large, load recent sections only.

5. Produce a **Context Summary**:

```
## Context Summary

Project: [inferred from docs/project.md or "unknown"]
Active feature: [if resuming]
Known conventions: [bullet list, max 5]
Recent decisions: [bullet list, max 3]
Last session: [date/feature, or "none"]
Prior context from: [file list]
```

6. If user said `map codebase` → **stop here**, present Context Summary. Do not proceed to phase dispatch.

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

## LEARN Phase (Inline)

**When**: After phase completes or on explicit `/spec pause`.

**Goal**: Capture session knowledge and update persistent docs/ knowledge base.

### 6a. Session Log

Create `docs/sessions/YYYY-MM-DD-<feature>.md` using template `references/session-template.md`.

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
| New module/feature | `docs/project.md` | Append section |
| New code pattern | `docs/conventions.md` | Append entry |
| Architectural decision | `docs/decisions.md` | Append ADR |
| Nothing new | (none) | Skip |

Rules:
- Append only (no overwrites)
- Deduplicate (check before adding)
- Attribute: "(from: feature-name, date: YYYY-MM-DD)"

### 6c. First-Run Scaffold

If `docs/` missing:

```
docs/
├── project.md
├── conventions.md
├── decisions.md
└── sessions/
```

See `references/knowledge-base.md` for full scaffold content.

### 6d. Graphify (Optional)

If `graphify` skill available, suggest:
> "Run `/graphify --update docs/` to update the knowledge graph."
Do not auto-invoke.

### 6e. Completion

Present LEARN summary:
```
## LEARN Complete

Session log: docs/sessions/{{date}}-{{feature}}.md
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

| Content | Load when | Token budget |
|---------|----------|--------------|
| `docs/project.md` | Every invocation | ~2k max |
| `docs/conventions.md` | Every invocation | ~2k max |
| `docs/decisions.md` | Every invocation | ~2k max |
| 3 recent `docs/sessions/*.md` | Every invocation | ~6k max |
| `.specs/codebase/*.md` | On-demand | ~5k per file |
| Feature spec/design/tasks | When resuming | ~4k max |
| **Total** | | **< 40k tokens** |

If file exceeds budget, load recent sections only.

---

## Supporting References

All phase files and supporting documentation are in `references/`:

- `phase-spec.md` — SPEC phase details
- `phase-plan.md` — PLAN phase details
- `phase-build.md` — BUILD phase details
- `phase-test.md` — TEST phase details
- `phase-review.md` — REVIEW phase details
- `phase-simplify.md` — SIMPLIFY phase details
- `phase-ship.md` — SHIP phase details
- `scope-detection.md` — Scope scoring matrix
- `spec-template.md` — Spec artifact template
- `task-template.md` — Task artifact template
- `tasks-template.md` — Tasks file template
- `design-template.md` — Design artifact template
- `session-template.md` — Session log template
- `knowledge-base.md` — docs/ scaffold template
- `vertical-slicing.md` — Vertical slicing guide
- `build-cycle.md` — Build cycle patterns
- `prove-it-pattern.md` — Test-first patterns
- `review-axes.md` — Code review framework
- `simplification-patterns.md` — Refactoring patterns
- `skill-anatomy.md` — Skill structure guide
- `task-format.md` — Task formatting rules
- `state-management.md` — State tracking patterns
- `archive-workflow.md` — Archival and cleanup
- `context-loading.md` — Context management rules
- `scope-discipline.md` — Scope control principles
- `state-template.md` — State checkpoint format


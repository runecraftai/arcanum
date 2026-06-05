<p align="center">
  <img src="https://img.shields.io/badge/Skill-spec--driven-blue?style=for-the-badge" alt="skill badge" />
  <img src="https://img.shields.io/badge/Stack-Agnostic-green?style=for-the-badge" alt="stack agnostic" />
  <img src="https://img.shields.io/badge/Version-4.1.0-purple?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🎯 spec-driven</h1>

<p align="center">
  <strong>Full lifecycle development orchestration. From spec to ship.<br/>PT/EN triggers. Auto-sized phases. Zero ceremony when scope is small.</strong>
</p>

---

## ✨ What Is This Skill?

**spec-driven** is a meta-skill that orchestrates the complete software development lifecycle through adaptive workflow surfaces. It auto-sizes based on complexity — applying full rigor for complex features, using quick mode for simple changes, and preserving pause/resume memory across sessions.

```
LOAD → DISPATCH → phase handler → LEARN → optional learning offer

Phases (skipped when not needed):
INIT | MAP | QUICK | SPEC | PLAN | BUILD | TEST | VALIDATE | REVIEW | SIMPLIFY | SHIP | PAUSE/RESUME
```

| Scope | Effort | Artifacts |
|-------|--------|-----------|
| **Quick** | 1-3 files | TASK.md only |
| **Medium** | 4-6 files | spec.md + tasks.md |
| **Large** | 7-11 files | spec.md + design.md + tasks.md |
| **Complex** | ≥12 files | spec.md + context.md + design.md + tasks.md |

> **The complexity is in the system, not in your workflow.** You trigger naturally — the skill decides how deep to go.

---

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @runecraft/spells

# bun
bun add @runecraft/spells

# pnpm
pnpm add @runecraft/spells

# yarn
yarn add @runecraft/spells
```

Copy to your agent:
```bash
cp node_modules/@runecraft/spells/skills/spec-driven/SKILL.md <your-agent-skills-dir>/spec-driven.md
```

### First Commands

| What You Want | Say This |
|---------------|----------|
| Bootstrap a new project | `/init` or `initialize project` or `inicializar projeto` |
| Map an existing codebase | `/map` or `map codebase` or `mapear código` |
| Specify a feature | `/spec` or `specify` or `vamos especificar` |
| Plan and break into tasks | `/plan` or `plan this` or `vamos planejar` |
| Implement a task | `/build` or `implement` or `vamos construir` |
| Run tests | `/test` or `test this` or `vamos testar` |
| Validate or run UAT | `/validate`, `UAT`, or `walk me through it` |
| Code review | `/review` or `code review` or `revisa isso` |
| Refactor | `/simplify` or `refactor` or `simplifica` |
| Release | `/ship` or `release` or `vamos fazer release` |
| Resume previous work | `/spec resume` or `resume work` |
| Pause current session | `/spec pause` or `pause work` |

**🇵🇹 🇬🇧 PT/EN — both languages are fully supported as first-class triggers.**

---

## 📁 Project Structure

The skill creates and maintains a `.specs/` directory:

```
.specs/
├── project/                 — Project metadata & strategy
│   ├── PROJECT.md           — Vision, goals, tech stack, constraints
│   ├── ROADMAP.md           — Milestones, features, status tracking
│   └── STATE.md             — Persistent memory: decisions, blockers, learnings
├── codebase/                — Created by /map (brownfield only)
│   ├── STACK.md             — Technology stack analysis
│   ├── ARCHITECTURE.md      — Current architecture patterns
│   ├── CONVENTIONS.md       — Code style, naming, patterns
│   ├── STRUCTURE.md         — Directory layout, module organization
│   ├── TESTING.md           — Test patterns, coverage, quality gates
│   ├── INTEGRATIONS.md      — External dependencies, APIs
│   └── CONCERNS.md          — Technical debt, risks, gaps
├── features/
│   └── <name>/              — One per feature
│       ├── spec.md          — Requirements with traceable IDs (FEAT-01, etc.)
│       ├── context.md       — Complex scope only
│       ├── design.md        — Architecture + task breakdown
│       └── tasks.md         — Atomic implementation tasks
└── sessions/
    └── YYYY-MM-DD-<feature>.md  — Session checkpoints
```

---

## 🔄 The Eight Phases

#### MAP — Brownfield Codebase Analysis
**Goal:** Document an existing codebase before any feature work begins.  
**Triggers:** `/map`, `map codebase`, `mapear código`, `analyze project`  
**Skipped when:** Greenfield project (no existing code to analyze)  
**Output:** 7 docs in `.specs/codebase/` — STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS, CONCERNS

#### INIT — Project Bootstrap
**Goal:** Create the `.specs/project/` foundation for project management and tracking.  
**Triggers:** `/init`, `initialize project`, `setup project`, `inicializar projeto`  
**Skipped when:** `.specs/project/` already exists  
**Output:** `.specs/project/PROJECT.md`, `ROADMAP.md`, `STATE.md`

#### SPEC — Requirements & Design
**Goal:** Write complete, traceable specifications with uniquely identified requirements.  
**Triggers:** `/spec`, `specify`, `write spec`, `vamos especificar`, `preciso de um spec`  
**Skipped when:** Quick scope (use TASK.md instead)  
**Output:** `.specs/features/<name>/spec.md` with traceable IDs (FEAT-01, AUTH-02, etc.)

#### PLAN — Architecture & Task Breakdown
**Goal:** Design the approach and decompose into atomic, independently executable tasks.  
**Triggers:** `/plan`, `plan this`, `break into tasks`, `design the approach`, `vamos planejar`  
**Skipped when:** Quick scope (Forge executes directly)  
**Output:** `.specs/features/<name>/design.md` + `tasks.md` (checklist format)

#### BUILD — Implementation
**Goal:** Execute tasks sequentially, one atomic commit per task.  
**Triggers:** `/build`, `build this`, `implement`, `execute tasks`, `vamos construir`  
**Skipped when:** Never — always happens  
**Output:** Code changes, checkmarks in `tasks.md`, atomic commits (Conventional Commits 1.0.0)

#### TEST — Verification & Proof
**Goal:** Prove the feature works correctly through comprehensive testing.  
**Triggers:** `/test`, `test this`, `verify`, `prove it works`, `vamos testar`  
**Skipped when:** Quick scope (Forge verifies before commit)  
**Output:** Test results, coverage reports, validation notes

#### REVIEW — Code Quality Gates
**Goal:** Evaluate code quality, architecture alignment, and knowledge transfer.  
**Triggers:** `/review`, `code review`, `review this`, `check quality`, `revisa isso`  
**Skipped when:** Quick scope, or explicitly skipped for trusted code  
**Output:** Review notes, quality verdict, improvement suggestions

#### SIMPLIFY — Refactoring & Reduction
**Goal:** Reduce complexity, remove duplication, improve maintainability.  
**Triggers:** `/simplify`, `refactor`, `simplify this`, `reduce complexity`, `simplifica`  
**Skipped when:** Not explicitly requested  
**Output:** Refactored code, before/after metrics, complexity reduction

#### SHIP — Release & Changelog
**Goal:** Create tagged release, publish artifacts, document changes.  
**Triggers:** `/ship`, `release`, `publish`, `ship it`, `vamos fazer release`  
**Skipped when:** Not explicitly requested  
**Output:** Release tag, changelog, published artifacts

---

## ⚡ Quick Mode

For tasks ≤3 files with no design decisions:

```
You: quick fix: dark mode toggle doesn't persist after refresh

Agent: Quick Task: Persist dark mode preference
       File: src/hooks/useTheme.ts
       Verify: Toggle dark, refresh page — preference persists

       [Implements fix...]

       ✅ Committed: fix(theme): persist dark mode preference to localStorage
```

**Guardrails:** max 3 files, no new dependencies, no architectural decisions.

---

## 🎯 Complete Trigger Reference

### English Triggers

| Phase | Triggers |
|-------|----------|
| **MAP** | `/map`, `map codebase`, `analyze project` |
| **INIT** | `/init`, `initialize project`, `setup project` |
| **SPEC** | `/spec`, `specify`, `write spec`, `what should we build` |
| **PLAN** | `/plan`, `plan this`, `break into tasks`, `design the approach` |
| **BUILD** | `/build`, `build this`, `implement`, `execute tasks` |
| **TEST** | `/test`, `test this`, `verify`, `prove it works` |
| **REVIEW** | `/review`, `code review`, `review this`, `check quality` |
| **SIMPLIFY** | `/simplify`, `refactor`, `simplify this`, `reduce complexity` |
| **SHIP** | `/ship`, `release`, `publish`, `ship it` |

### Portuguese Triggers

| Fase | Triggers |
|------|----------|
| **MAP** | `/map`, `mapear codebase`, `mapear código` |
| **INIT** | `/init`, `inicializar projeto`, `setup do projeto` |
| **SPEC** | `/spec`, `vamos especificar`, `preciso de um spec` |
| **PLAN** | `/plan`, `vamos planejar`, `quebra em tarefas` |
| **BUILD** | `/build`, `vamos construir`, `implementar` |
| **TEST** | `/test`, `vamos testar`, `teste isso` |
| **REVIEW** | `/review`, `revisa isso`, `avalia a qualidade` |
| **SIMPLIFY** | `/simplify`, `simplifica`, `refatora` |
| **SHIP** | `/ship`, `vamos fazer release`, `versiona` |

### Special Triggers

| Trigger | Action |
|---------|--------|
| `/spec resume` or `resume work` | Load last session, continue from checkpoint |
| `/spec pause` or `pause work` | Save session checkpoint, update STATE.md |
| `/map <doc>` | Selective mapping (e.g., `/map stack`, `/map architecture`) |

---

## 🔁 Workflow Examples

### Greenfield Project

```
/init → /spec user-auth → /plan → /build → /test → /ship
```

Start fresh: bootstrap project, write spec for first feature, plan the approach, implement, verify, release.

### Brownfield Feature

```
/map → /init → /spec payment-flow → /plan → /build → /test → /review → /ship
```

Existing codebase: analyze first, then bootstrap `.specs/`, spec the new feature, plan, implement with quality gate, release.

### Session Continuity

```
Session 1: /spec → /plan → /build (partial) → /spec pause
Session 2: /spec resume → continue /build → /test → /ship
```

Pause at any point, resume exactly where you left off. State is always persisted to STATE.md.

---

## 🧠 Context Management

The skill manages a **160k token budget**, loading context in tiers:

| Tier | Documents | Approx. Tokens | Strategy |
|------|-----------|----------------|----------|
| **Always** | PROJECT.md, ROADMAP.md, STATE.md | ~6k | Always loaded first |
| **On-demand (codebase)** | STACK → ARCHITECTURE → CONVENTIONS → STRUCTURE → TESTING → INTEGRATIONS → CONCERNS | ~5k each | Loaded in order as needed |
| **On-demand (feature)** | spec.md → context.md → design.md → tasks.md | ~8k | Loaded when resuming phase |

**Reserve:** 40k tokens for active phase work (BUILD, TEST, REVIEW, SIMPLIFY).

---

## 🔗 Skill Integrations

| Skill | When activated | Behavior |
|-------|---------------|----------|
| **mermaid-studio** | During PLAN phase | Delegates architecture diagram generation |
| **codenavi** | During SPEC/PLAN | Deep codebase navigation for context gathering |
| **graphify** | After each phase | Updates knowledge graph with learnings |
| **learning-opportunities** | After meaningful non-urgent work | Offers optional short learning exercises |

Detected automatically. Gracefully falls back if not installed.

---

## 📚 Reference Files

39 supporting files organized in 4 categories:

### Phase Files (9)
| File | Purpose |
|------|---------|
| `phase-map.md` | Brownfield codebase analysis framework |
| `phase-spec.md` | Requirement writing discipline |
| `phase-plan.md` | Architecture & task decomposition |
| `phase-build.md` | Atomic commit & implementation cycle |
| `phase-test.md` | Verification, UAT, quality gates |
| `validate.md` | Validation and interactive UAT guidance |
| `phase-review.md` | Code review axes & quality framework |
| `phase-simplify.md` | Refactoring and simplification framework |
| `phase-ship.md` | Release, changelog, artifact management |

### Templates & Structures (13)
| File | Purpose |
|------|---------|
| `project-init.md` | PROJECT.md, ROADMAP.md, STATE.md, HANDOFF.md templates |
| `quick-mode.md` | Quick task workflow and guardrails |
| `session-handoff.md` | Pause/resume checkpoint via `.specs/project/HANDOFF.md` |
| `state-global.md` | Global STATE.md schema and rules |
| `state-template.md` | Feature STATE.md template |
| `spec-template.md` | Spec.md structure with examples |
| `design-template.md` | Design.md with architecture sections |
| `task-template.md` | Single task format & checklist item |
| `tasks-template.md` | Tasks.md checklist structure |
| `session-template.md` | Session log checkpoint format |
| `knowledge-base.md` | Reference knowledge for all phases |
| `brownfield-mapping.md` | Codebase analysis patterns |
| `concerns.md` | Risk & technical debt framework |

### Discipline & Patterns (10)
| File | Purpose |
|------|---------|
| `knowledge-chain.md` | Context verification chain (codebase → docs → Context7 → web) |
| `sub-agent-delegation.md` | When to delegate to Scout, Sage, Arbiter |
| `spec-discuss.md` | Requirement discussion & validation |
| `test-uat.md` | User acceptance test patterns |
| `vertical-slicing.md` | Task decomposition into thin vertical slices |
| `build-cycle.md` | Single-task build flow: edit → test → commit → mark |
| `learning-opportunities.md` | Optional learner-facing exercises after meaningful work |
| `prove-it-pattern.md` | "Prove it works" validation checklist |
| `review-axes.md` | Code review evaluation criteria |
| `simplification-patterns.md` | Refactoring & complexity reduction patterns |

### Utilities (7)
| File | Purpose |
|------|---------|
| `scope-detection.md` | Weighted scoring matrix for Quick/Medium/Large/Complex |
| `skill-anatomy.md` | spec-driven architecture & phase routing |
| `task-format.md` | Checkbox format, atomic task rules |
| `state-management.md` | STATE.md structure & update protocol |
| `archive-workflow.md` | How to archive `.specs/features/` after release |
| `context-loading.md` | Token budget & progressive disclosure strategy |
| `scope-discipline.md` | When to skip phases based on scope |

---

## ⚡ Tips for Best Results

### Do's ✅
- Start every new project with `/init`
- For existing codebases, run `/map` before any feature work
- Use natural language — PT or EN, the skill understands both
- Let the agent auto-size scope — trust it
- Say `/spec pause` before ending a session
- Verify code before committing — ask the agent to run tests
- One feature at a time — avoid parallel tracks

### Don'ts ❌
- Don't force phases when scope is small
- Don't work multiple features simultaneously
- Don't skip verification before commits
- Don't accept vague outputs — challenge the agent
- Don't bypass `.specs/` — always use it for tracking
- Don't write code without a spec first
- Don't merge without a code review (unless Quick scope)

---

## 🤖 Compatibility

Tested and verified on:

| Agent | Status | Notes |
|-------|--------|-------|
| **Claude Code** | ✅ Fully supported | Primary reference agent |
| **Cursor** | ✅ Fully supported | Excellent for inline editing |
| **Opencode** | ✅ Fully supported | Multi-agent routing works natively |
| **GitHub Copilot** | ✅ Fully supported | Via custom instructions |
| **Antigravity (Gemini)** | ✅ Fully supported | Experimental, API-based |

Works with any agent supporting custom instructions and tool use.

---

## ❓ FAQ

**Q: Can I skip phases?**  
A: Yes. The skill auto-skips PLAN and TEST for Quick/Medium scope. Quick mode skips the entire pipeline. You only get ceremony when scope demands it.

**Q: What if my project already has code?**  
A: Run `/map` first. It creates 7 documents analyzing your existing codebase — architecture, stack, conventions, and risks — before any feature work begins.

**Q: How does requirement traceability work?**  
A: Each requirement gets a traceable ID (e.g., `AUTH-01`) in `spec.md`. Tasks reference these IDs. Validation checks which requirements are covered. You get a clear trail: spec → plan → task → commit.

**Q: What are atomic commits?**  
A: Each task should produce exactly one commit when commits are approved, following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Agents must ask for explicit approval before committing.

**Q: Can I use this for small tasks or quick fixes?**  
A: Yes. Use `quick fix: <description>` for bug fixes, config changes, or tweaks in ≤3 files. You get verification and optional approved commit guidance without planning overhead.

**Q: What if I close my session mid-task?**  
A: Say `/spec pause` before ending. Next session, say `/spec resume` to continue exactly where you left off.

**Q: PT or EN?**  
A: Both. All triggers work in Portuguese and English as first-class citizens. Use whichever feels natural.

**Q: Does this work with any tech stack?**  
A: Yes. Completely stack-agnostic. Works with any language, framework, or architecture.

**Q: Will the agent fabricate APIs or patterns?**  
A: No. The skill enforces a Knowledge Verification Chain: codebase → project docs → Context7 MCP → web search → flag as uncertain. It never guesses. If documentation can't be found, it says so.

**Q: What are the 39 reference files?**  
A: They're phase-specific documentation loaded on-demand. You never interact with them directly — the agent loads what it needs when it needs it, within the 160k token budget.

---

## 📄 License

MIT

---

<p align="center">
  <sub>Part of the <a href="https://github.com/runecraft-dev/arcanum">Arcanum</a> ecosystem</sub>
</p>

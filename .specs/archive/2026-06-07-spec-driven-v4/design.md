---
feature: spec-driven-v4
scope: Large
created: 2026-04-28
---

# Design — spec-driven v4.0.0

## 1. File Structure: Before vs After

### Before (v3)

```
docs/
├── project.md            # project overview
├── conventions.md        # coding conventions
├── decisions.md          # architectural decisions
└── sessions/             # session logs

packages/spells/skills/spec-driven/
├── SKILL.md              # v3.0.0
├── .skill-meta.json
├── README.md
└── references/           # 26 files
    ├── knowledge-base.md
    ├── scope-detection.md
    ├── phase-spec.md
    ├── phase-plan.md
    ├── phase-build.md
    ├── phase-test.md
    ├── phase-review.md
    ├── phase-simplify.md
    ├── phase-ship.md
    ├── state-management.md
    ├── context-loading.md
    ├── build-cycle.md
    └── ... (14 others)
```

### After (v4)

```
.specs/                               # NEW — unified knowledge root
├── project/
│   ├── PROJECT.md                    # vision, goals, active modules
│   ├── ROADMAP.md                    # features and milestones
│   └── STATE.md                      # global memory (decisions, blockers, lessons, todos, deferred)
├── codebase/                         # NEW — brownfield (on-demand via /map)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
├── features/
│   └── <name>/
│       ├── spec.md
│       ├── context.md                # NEW — from Discuss sub-step
│       ├── design.md
│       ├── tasks.md
│       └── STATE.md                  # checkpoint per feature
├── quick/
│   └── NNN-slug/
│       ├── TASK.md
│       └── SUMMARY.md                # NEW
└── sessions/                         # MOVED from docs/sessions/

packages/spells/skills/spec-driven/
├── SKILL.md                          # v4.0.0 — updated
├── .skill-meta.json                  # version 4.0.0
├── README.md                         # updated
└── references/                       # 35 files (26 updated + 9 new)
    ├── knowledge-base.md             # REWRITTEN
    ├── phase-map.md                  # NEW
    ├── brownfield-mapping.md         # NEW
    ├── concerns.md                   # NEW
    ├── project-init.md               # NEW
    ├── state-global.md               # NEW
    ├── knowledge-chain.md            # NEW
    ├── sub-agent-delegation.md       # NEW
    ├── spec-discuss.md               # NEW
    ├── test-uat.md                   # NEW
    ├── scope-detection.md            # UPDATED
    ├── phase-spec.md                 # UPDATED
    ├── phase-plan.md                 # UPDATED
    ├── phase-build.md                # UPDATED
    ├── phase-test.md                 # UPDATED
    ├── phase-review.md               # UPDATED
    ├── phase-simplify.md             # UPDATED
    ├── phase-ship.md                 # UPDATED
    ├── state-management.md           # UPDATED
    ├── context-loading.md            # UPDATED
    ├── build-cycle.md                # UPDATED
    └── ... (others unchanged)
```

## 2. Migration Strategy: `docs/` → `.specs/`

**Approach: Hard deprecation (breaking change)**

- v4 SKILL.md and all references will contain **zero** references to `docs/project.md`, `docs/conventions.md`, or `docs/decisions.md`.
- No fallback loading of `docs/` paths. If `.specs/project/` doesn't exist, LOAD phase outputs a prompt to run `/init`.
- Session logs move from `docs/sessions/` to `.specs/sessions/`.
- The actual migration of user content (copying `docs/project.md` → `.specs/project/PROJECT.md`, etc.) is **manual** and out of scope for this feature. The `project-init.md` reference will document the bootstrapping flow for new projects.
- Existing `docs/` directory is not deleted — it simply becomes invisible to the skill.

**Migration mapping (for documentation only):**

| Old path | New path | Notes |
|----------|----------|-------|
| `docs/project.md` | `.specs/project/PROJECT.md` | Rewrite to new schema |
| `docs/conventions.md` | `.specs/codebase/CONVENTIONS.md` | Brownfield doc |
| `docs/decisions.md` | `.specs/project/STATE.md` (decisions section) | Merged into STATE |
| `docs/sessions/` | `.specs/sessions/` | Direct move |

## 3. LOAD Phase v4 Contract

```pseudocode
function LOAD_v4():
  # Step 1: Project context
  if exists(".specs/project/PROJECT.md"):
    load(".specs/project/PROJECT.md")        # vision, goals
    load(".specs/project/ROADMAP.md")         # if exists
    load(".specs/project/STATE.md")           # if exists — decisions, blockers, lessons
  else:
    emit("⚠️ No .specs/project/ found. Run /init to bootstrap.")

  # Step 2: Codebase context (on-demand, budget-aware)
  if exists(".specs/codebase/"):
    budget_remaining = 160_000 - tokens_used
    priority_order = [STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS, CONCERNS]
    for doc in priority_order:
      if budget_remaining > tokens(doc):
        load(".specs/codebase/" + doc)
        budget_remaining -= tokens(doc)
      else:
        emit("⚠️ Budget limit: skipping " + doc)
        break

  # Step 3: Feature context (if resuming)
  if feature_name:
    if exists(".specs/features/{feature_name}/STATE.md"):
      load(".specs/features/{feature_name}/STATE.md")
    if exists(".specs/features/{feature_name}/spec.md"):
      load(".specs/features/{feature_name}/spec.md")
    if exists(".specs/features/{feature_name}/context.md"):
      load(".specs/features/{feature_name}/context.md")
    if exists(".specs/features/{feature_name}/design.md"):
      load(".specs/features/{feature_name}/design.md")
    if exists(".specs/features/{feature_name}/tasks.md"):
      load(".specs/features/{feature_name}/tasks.md")

  # Step 4: Knowledge chain verification
  run_knowledge_chain()  # 5-step verification
```

## 4. LEARN Phase v4 Contract

```pseudocode
function LEARN_v4(phase_completed, artifacts_produced):
  # Step 1: Update feature STATE
  if feature_name:
    update(".specs/features/{feature_name}/STATE.md", {
      last_phase: phase_completed,
      last_updated: now(),
      artifacts: artifacts_produced,
      checkpoint: generate_checkpoint()
    })

  # Step 2: Update global STATE (if significant)
  if has_decisions or has_blockers or has_lessons:
    append(".specs/project/STATE.md", {
      decisions: new_decisions,        # append to ## Decisions
      blockers: new_blockers,          # append to ## Blockers
      lessons: new_lessons,            # append to ## Lessons
      deferred: deferred_items         # append to ## Deferred
    })

  # Step 3: Session log
  write(".specs/sessions/YYYY-MM-DD-{slug}.md", session_summary)
```

## 5. Knowledge Chain (5-Step Verification)

```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌──────┐    ┌────────────┐
│ Source   │───▶│ Freshness │───▶│ Conflict │───▶│ Gaps │───▶│ Confidence │
│ Verify   │    │ Check     │    │ Detect   │    │ Scan │    │ Score      │
└─────────┘    └───────────┘    └──────────┘    └──────┘    └────────────┘

1. Source Verify   — Is this from .specs/ or from agent memory? Prefer .specs/.
2. Freshness Check — Was this written/updated this session? Flag stale (>7 days).
3. Conflict Detect — Does this contradict other loaded context? Flag for resolution.
4. Gaps Scan       — Are there referenced files that don't exist? Flag missing.
5. Confidence Score — Rate overall context confidence: HIGH / MEDIUM / LOW.
                      If LOW → pause and request Scout exploration.
```

## 6. Architectural Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| AD-01 | Hard deprecation of `docs/` | Clean break avoids split-brain. Users must migrate. |
| AD-02 | No backward compatibility layer | Complexity of dual-path loading exceeds benefit. v3 remains available in git history. |
| AD-03 | Brownfield docs are on-demand | Not every project needs all 7 codebase docs. `/map` creates only what's relevant. |
| AD-04 | STATE.md dual-level (global + feature) | Global captures cross-cutting concerns; feature STATE enables checkpoint/resume. |
| AD-05 | Knowledge chain runs at LOAD, not per-phase | Reduces overhead. Once context is verified at LOAD, phases trust it. |
| AD-06 | Context budget 160k+ tokens | Large models support 200k. Reserve 40k for phase work, leaving 160k for context. |
| AD-07 | Complex tier at score ≥12 | Differentiates from Large (score 7-11). Complex requires `context.md` from Discuss. |
| AD-08 | 9 new reference files, not inline | Each concern gets its own file for single-responsibility and targeted loading. |
| AD-09 | Discuss sub-step produces `context.md` | Captures Q&A, assumptions, edge cases before spec writing. Reduces spec rewrites. |
| AD-10 | Atomic commit policy in BUILD | Each commit = one concern. Enables isolated review and clean revert. |

## 7. Change Map — File by File

### New Files (9)

| File | Purpose | Key Content |
|------|---------|-------------|
| `references/phase-map.md` | MAP phase orchestration | Dispatch rules for `/map` command; triggers brownfield-mapping; creates `.specs/codebase/` |
| `references/brownfield-mapping.md` | How to generate codebase docs | Templates for each of the 7 docs; Scout delegation pattern |
| `references/concerns.md` | CONCERNS.md population guide | Tech debt identification, risk categorization, mitigation templates |
| `references/project-init.md` | `/init` command flow | Creates `.specs/project/PROJECT.md` + `ROADMAP.md`; interactive prompts |
| `references/state-global.md` | Global STATE.md rules | Schema: Decisions, Blockers, Lessons, Todos, Deferred; append-only; pruning rules |
| `references/knowledge-chain.md` | 5-step verification | Detailed steps, decision criteria, confidence scoring rubric |
| `references/sub-agent-delegation.md` | Agent delegation table | For each of 5 agents: when to delegate, input/output contracts, never-delegate rules |
| `references/spec-discuss.md` | Discuss sub-step in SPEC | Question framework, when to trigger, output format for `context.md` |
| `references/test-uat.md` | UAT sub-step in TEST | UAT scenario template, user-perspective validation, sign-off criteria |

### Updated Files (14)

| File | What Changes |
|------|-------------|
| `references/knowledge-base.md` | **Rewrite**: Remove all `docs/` references. Describe `.specs/project/`, `.specs/codebase/`, `.specs/features/`, `.specs/sessions/`. |
| `references/scope-detection.md` | **Add Complex tier**: Score ≥12 → scope=Complex. Requires spec.md + context.md + design.md + tasks.md. |
| `references/phase-spec.md` | **Add**: Discuss sub-step ref. **Add**: Knowledge chain invocation. **Replace**: `docs/` → `.specs/` paths. |
| `references/phase-plan.md` | **Add**: Auto-skip rules (Quick=skip, Medium=inline, Large=formal, Complex=formal+Discuss). **Add**: Knowledge chain ref. **Replace**: `docs/` → `.specs/`. |
| `references/phase-build.md` | **Add**: Safety valve. **Add**: Atomic commit ref. **Add**: Delegation ref. **Replace**: `docs/` → `.specs/`. |
| `references/phase-test.md` | **Add**: UAT sub-step ref. **Replace**: `docs/` → `.specs/`. |
| `references/phase-review.md` | **Add**: Ward/Arbiter refs via sub-agent-delegation. **Replace**: `docs/` → `.specs/`. |
| `references/phase-simplify.md` | **Replace**: `docs/` → `.specs/` paths only. |
| `references/phase-ship.md` | **Add**: STATE.md update step on ship. **Replace**: `docs/` → `.specs/`. |
| `references/state-management.md` | **Add**: Dual-level STATE distinction. **Replace**: `docs/` → `.specs/`. |
| `references/context-loading.md` | **Rewrite** loading order. **Add**: 160k+ budget. **Replace**: `docs/` → `.specs/`. |
| `references/build-cycle.md` | **Add**: Atomic commit policy section. |
| `SKILL.md` | **Bump**: v4.0.0. **Add**: MAP phase. **Rewrite**: LOAD/LEARN for `.specs/`. **Remove**: All `docs/` refs. |
| `.skill-meta.json` | **Bump**: version to `4.0.0`. |
| `README.md` | **Update**: Triggers (`/map`, `/init`). Paths to `.specs/`. Version v4. Complex tier. |

## 8. Scope Tiers (Updated)

| Tier | Score | Artifacts | PLAN Phase |
|------|-------|-----------|------------|
| Quick | 1-3 | TASK.md only | Skip |
| Medium | 4-6 | spec.md + tasks.md | Inline in spec |
| Large | 7-11 | spec.md + design.md + tasks.md | Formal design.md |
| Complex | ≥12 | spec.md + context.md + design.md + tasks.md | Formal design.md + mandatory Discuss |

# Context Loading Strategy

Context loading establishes shared understanding before planning or execution using a 3-tier strategy.

## 3-Tier Loading Strategy

Load context in tier order, respecting token budget and phase needs.

### Tier 1: Project Context (Always)

**Files** (~6k token budget):
- `.specs/project/PROJECT.md` — project vision, goals, active modules
- `.specs/project/ROADMAP.md` — planned features and milestones
- `.specs/project/STATE.md` — architectural decisions, blockers, lessons
- `.specs/project/HANDOFF.md` — latest pause/resume checkpoint, if present
- 3 most recent `.specs/sessions/*.md` (sorted by date, descending)

**Load if**:
- `.specs/project/` exists at project root
- Files are under budget

**Purpose**: Understand current project direction, recent work, and architectural constraints.

### Tier 2: Codebase Context (On-demand, budget-aware)

**Files** (~50k token budget, selective loading):

Load in priority order, only when active phase needs them:

1. **STACK.md** — languages, frameworks, build tools, deployment
2. **ARCHITECTURE.md** — module boundaries, data flow, entry points
3. **CONVENTIONS.md** — naming rules, code patterns, organization
4. **STRUCTURE.md** — directory tree, module responsibilities
5. **TESTING.md** — test framework, coverage, CI commands
6. **INTEGRATIONS.md** — external APIs, databases, message queues
7. **CONCERNS.md** — tech debt, security/perf/scale/ops risks

**Load if**:
- Codebase mapping has been run (`/map` command)
- Active phase needs specific knowledge
  - **BUILD/TEST phases**: Always load STACK + ARCHITECTURE
  - **TEST phase**: Always load TESTING
  - **PLAN/SPEC phases**: Load as needed for design decisions
  - **Other phases**: Load on-demand

**How to select**:
- Don't load all 7 docs automatically
- Load only docs relevant to current phase
- Stop loading when budget exhausted or phase needs satisfied

**Purpose**: Understand existing codebase structure, patterns, and constraints to avoid conflicts with current feature work.

### Tier 3: Feature Context (When resuming)

**Files** (~8k token budget):
- `.specs/features/<name>/STATE.md` — feature checkpoint, resume context
- `.specs/features/<name>/spec.md` — feature specification
- `.specs/features/<name>/context.md` — discussion context (if exists)
- `.specs/features/<name>/design.md` — technical design (if exists)
- `.specs/features/<name>/tasks.md` — task breakdown

**Load if**:
- Resuming work on a specific feature
- User specifies a feature by name

**Purpose**: Resume work from where it was left off; understand design and implementation progress.

## Total Budget

**Hard limit**: 160k tokens total across all loaded context per invocation.

**Allocation**:
- Tier 1 (project): ~6k tokens (always)
- Tier 2 (codebase): ~50k tokens (on-demand, selective)
- Tier 3 (feature): ~8k tokens (when resuming)
- **Reserve**: 40k tokens for active phase work
- **Total**: 160k tokens

**Strategy**:
- Load project context always (6k)
- Load codebase docs selectively (0-50k depending on phase)
- Load feature context on-demand (0-8k when resuming)
- Ensure 40k minimum available for active phase (SPEC/PLAN/BUILD/TEST work)

## On-Demand Loading Rules

1. **Load by phase needs, not comprehensively**:
   - SPEC/PLAN: Load STACK + ARCHITECTURE (10k); add others only if needed
   - BUILD/TEST: Load STACK + ARCHITECTURE + TESTING (15k); add others if needed
   - REVIEW/SIMPLIFY: Load CONVENTIONS + CONCERNS as needed

2. **Load within budget**: Stop loading when budget nears exhaustion (40k reserve for active work)

3. **Prefer summaries**: If file is large, load recent sections only

4. **Cache context**: Reuse context within same session

5. **Signal importance**: Flag uncertain or conflicting information

6. **Skip archives by default**: Do not load `.specs/archive/` unless the user explicitly names an archived feature or asks for historical comparison.

## Knowledge Chain Verification

After loading, run knowledge chain verification (→ see `knowledge-chain.md`):

1. **Source Verify**: Where did each loaded item come from? `.specs/` = trusted; inference = untrusted
2. **Freshness Check**: Are loaded files recent? Stale files (>7 days) flag for re-verification
3. **Conflict Detect**: Cross-reference loaded items for contradictions
4. **Gaps Scan**: Check for referenced files that don't exist
5. **Confidence Score**: Aggregate to HIGH / MEDIUM / LOW

**Decision**:
- HIGH confidence → proceed with phase
- MEDIUM confidence → proceed with caution; note gaps
- LOW confidence → PAUSE; request Scout exploration before proceeding

## Context Summary Output

After loading and verification, produce a summary:

```markdown
## Context Summary

Project: [name from .specs/project/PROJECT.md, or "unknown"]
Active feature: [if resuming]

Knowledge chain confidence: [HIGH | MEDIUM | LOW]
- [if MEDIUM/LOW, list gaps/conflicts]

Context loaded from:
- .specs/project/PROJECT.md (1.5k tokens)
- .specs/project/ROADMAP.md (0.8k tokens)
- .specs/project/STATE.md (2.1k tokens)
- .specs/sessions/2026-04-23-feature.md (1.6k tokens)
- .specs/codebase/STACK.md (2.3k tokens)
- .specs/codebase/ARCHITECTURE.md (3.2k tokens)
- Total: 11.5k tokens / 160k budget
```

## First-Run Behavior

If `.specs/project/` does not exist:
- Note: "Project not initialized. Run `/init` to bootstrap."
- Skip Tier 1 and 2 loading
- Recommend user run `/init` before starting features

If `.specs/codebase/` does not exist:
- Note: "Codebase not mapped. Run `/map` to generate docs."
- Skip Tier 2 loading
- Recommend user run `/map` after `/init`

## Cache Invalidation

Reload context if:
- User explicitly says "refresh context"
- Session is new (24+ hours since last load)
- User mentions significant repo changes
- Knowledge chain confidence drops to LOW

Otherwise, reuse context from earlier in same session.

## See Also

- `knowledge-chain.md` — 5-step context verification
- `knowledge-base.md` — `.specs/` structure and routing
- `context-loading.md` — this file (detailed strategy)

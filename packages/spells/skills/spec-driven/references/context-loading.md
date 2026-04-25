# Context Loading

Context loading establishes shared understanding before planning or execution.

## Loading Strategy

Load context in this order, stopping at token budget:

### Load Tier 1: Project Context (Every invocation)

**Files** (2k token budget):
- `docs/project.md` — project overview, modules, tech stack
- `docs/conventions.md` — coding patterns, naming rules
- `docs/decisions.md` — past architectural decisions

**Load if**:
- docs/ exists at project root
- Files are under 2k tokens each

### Load Tier 2: Session Context (Every invocation)

**Files** (6k token budget):
- 3 most recent `docs/sessions/*.md` (sorted by date, descending)

**Load if**:
- docs/sessions/ exists
- To understand recent work and decisions

### Load Tier 3: Feature Context (When resuming or planning)

**Files** (4k token budget):
- `.specs/features/<name>/spec.md` — current feature spec
- `.specs/features/<name>/design.md` — design decisions
- `.specs/features/<name>/tasks.md` — task breakdown

**Load if**:
- Resuming work on feature
- Planning next phase

### Load Tier 4: Codebase Context (On-demand during planning)

**Files** (5k token budget per file):
- `.specs/codebase/*.md` — domain-specific architecture docs
- Existing code files relevant to feature domain

**Load if**:
- DESIGN or PLAN phase
- Need to understand existing code structure

**How to select**:
- Use glob to find relevant files (e.g., `src/auth/*` for auth feature)
- Read only files with clear relevance
- Avoid loading entire codebase

### Load Tier 5: External Context (On-demand)

**Sources** (unlimited, within token budget):
- Library/framework documentation (via context7)
- API documentation
- Best practices guides

**Load if**:
- Need external library knowledge
- Planning integration with external service

## Total Budget

**Hard limit**: 40k tokens total across all loaded context.

**Allocation**:
- Tiers 1–2: 8k tokens (always)
- Tier 3: 4k tokens (feature specific)
- Tier 4: 5k tokens (codebase)
- Tier 5: Remaining tokens for external context

## Loading Rules

1. **Load on-demand**: Don't preload everything
2. **Prefer summaries**: If file is large, load recent sections only
3. **Cache context**: Reuse context within same session
4. **Signal importance**: Flag uncertain or conflicting information
5. **Dedup**: Don't load same file twice

## Context Summary Output

After loading, produce a summary:

```markdown
## Context Summary

Project: [name from docs/project.md, or "unknown"]
Tech stack: [from docs/project.md]
Active feature: [from STATE.md, or "none"]
Last session: [date and name, or "none"]

Known conventions:
- [pattern 1 from docs/conventions.md]
- [pattern 2]

Recent decisions:
- [decision 1 from docs/decisions.md]
- [decision 2]

Context loaded from:
- docs/project.md (2.1k tokens)
- docs/conventions.md (1.8k tokens)
- docs/sessions/2026-04-23-feature.md (2.3k tokens)
- Total: 6.2k tokens / 40k budget
```

## First-Run Behavior

If `docs/` does not exist:
- Note "first run"
- Skip Tier 1 and 2 loading
- Proceed with LOAD phase
- Create docs/ scaffold during LEARN phase

## Cache Invalidation

Reload context if:
- User explicitly says "refresh context"
- Session is new (24+ hours since last load)
- User mentions significant repo changes

Otherwise, reuse context from earlier in same session.

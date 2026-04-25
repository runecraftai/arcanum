# State Template

Copy this template to create STATE.md when tracking feature progress across sessions.

```yaml
---
feature: feature-name
description: Brief description of feature
status: draft | approved | in-progress | completed | partial | archived
scope: Quick | Medium | Large
created: 2026-04-24T10:00:00Z
last-updated: 2026-04-24T15:45:00Z
current-phase: load | spec | plan | design | build | test | review | simplify | ship
checkpoint: task-N or phase-name
---

# Feature Progress: feature-name

## Status

Current status: **in-progress**

## Progress

- SPEC phase: ✓ Complete (2026-04-24)
- PLAN phase: ✓ Complete (2026-04-24)
- BUILD phase: ⏳ In Progress
  - Current task: Task 5: Implement password reset endpoint
  - Completed: 4/12 tasks
  - Blocked: 0 tasks

## Last Session

- Date: 2026-04-24
- Duration: 2 hours
- What was done:
  - Completed spec approval
  - Completed task breakdown
  - Implemented login endpoint (Task 1-4)
- Next steps:
  - Continue with Task 5 (password reset)
  - Complete remaining BUILD tasks

## Blockers

None currently.

## Open Items

- [ ] Session template deduplicated
- [ ] design.md approved (pending review)
- [ ] Performance testing needed (post-MVP)

## Resume Instructions

To resume work on this feature:

1. Say: `/spec resume`
2. Agent will load this state
3. Continue from checkpoint: **Task 5**

Or manually:
1. Load `.specs/features/feature-name/tasks.md`
2. Jump to first unchecked task
3. Execute from there

## Archive Info

(Leave empty until shipped)

- Shipped: —
- Version: —
- Archive path: —
```

## When to Update STATE.md

Update STATE.md after each session:

1. Set `last-updated` timestamp
2. Update current `phase` and `checkpoint`
3. Update task counts (completed/blocked)
4. List what was done in "Last Session"
5. List next steps
6. Record any new blockers

## Checkpoint Format

Checkpoint should be specific:

- ✓ `Task 5: Implement password reset endpoint`
- ✓ `BUILD phase, Task 5`
- ✗ `Task 5` (too vague without context)
- ✗ `BUILD phase` (not specific enough)

Good checkpoints allow resumption without re-reading entire state.

## Status vs Checkpoint

- **Status**: Overall feature state (draft/approved/in-progress/completed/partial/archived)
- **Checkpoint**: Current execution point (which task, which phase)

Example:
```yaml
status: in-progress           # Feature is being built
checkpoint: task-7            # Stop at task 7, resume from 8
```

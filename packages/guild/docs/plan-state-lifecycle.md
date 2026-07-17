# Plan State Lifecycle

This document describes how Guild manages the plan-local state file (`.guild/plans/<slug>/state.md`) across the plan lifecycle: creation, resumption, and handoff boundaries.

## Overview

The plan-state write path ensures that `.guild/plans/<slug>/state.md` is created and refreshed at key lifecycle moments, providing a durable record of plan status that persists across sessions and handoffs.

**File location**: `.guild/plans/<slug>/state.md`

**Format**: Markdown with structured fields (see [Plan Artifact Formats](../skills/guild-plan/references/FORMATS.md#state-md--plan-status))

```markdown
# Status: [Feature Name]

- **Status**: draft | planned | in-progress | review | blocked | done
- **Blocker**: [Description or None]
- **Next Action**: [What the next agent should do]
- **Last Updated**: YYYY-MM-DD
- **Progress**: [completed]/[total] tasks completed
```

## Lifecycle Moments

### 1. Plan Creation (`createFreshPlanExecution`)

**When**: A user runs `/start-work <plan-name>` and a new plan is selected for execution.

**What happens**:
1. `start-work-hook.ts` calls `PlanService.createExecution()`
2. `createExecution()` calls `createFreshPlanExecution()` in `plan-execution.ts`
3. `createFreshPlanExecution()` creates a fresh `WorkState` and writes it to `.guild/state.json`
4. **NEW**: `refreshPlanState()` is called to create/refresh `.guild/plans/<slug>/state.md`
5. Execution lease is updated (if enabled)

**State file content**:
- Status: `in-progress`
- Blocker: `None`
- Next Action: `Continue to next unchecked task`
- Progress: Current task count from the plan file

**Code path**:
```
start-work-hook.ts
  → PlanService.createExecution()
    → createFreshPlanExecution()
      → refreshPlanState() ← NEW
```

### 2. Plan Resume (`resumePlanExecution`)

**When**: A user runs `/start-work` and an existing plan is resumed (no explicit plan name, or same plan name).

**What happens**:
1. `start-work-hook.ts` detects existing work state
2. Calls `PlanService.resumeExecution()`
3. `resumeExecution()` calls `resumePlanExecution()` in `plan-execution.ts`
4. `resumePlanExecution()` appends the session ID and resumes work
5. **NEW**: `refreshPlanState()` is called to refresh `.guild/plans/<slug>/state.md`
6. Execution lease is updated (if enabled)

**State file content**:
- Status: `in-progress` (unchanged)
- Blocker: `None` (cleared)
- Next Action: `Continue to next unchecked task`
- Progress: Updated task count from the plan file
- Last Updated: Today's date

**Code path**:
```
start-work-hook.ts
  → PlanService.resumeExecution()
    → resumePlanExecution()
      → refreshPlanState() ← NEW
```

### 3. Handoff Boundaries (Future)

**When**: A plan is paused, handed off between agents, or status changes mid-execution.

**What happens**:
- The handoff skill (`guild-handoff`) or a hook can call `writePlanState()` with custom status and blocker information
- This allows capturing plan-local context for the next agent

**State file content** (example):
- Status: `blocked`
- Blocker: `Waiting for API response from external service`
- Next Action: `Resume after API is available; check endpoint /api/status`
- Progress: Updated task count

**Code path** (future):
```
work-continuation.ts (on pause)
  → writePlanState() with status="blocked"
```

## Implementation Details

### Module: `plan-state-writer.ts`

Located at `packages/guild/src/domain/plans/plan-state-writer.ts`

**Exports**:

```typescript
export interface PlanStateWriterInput {
  planRepository: PlanRepository
  directory: string
  workState: WorkState
  status: "draft" | "planned" | "in-progress" | "review" | "blocked" | "done"
  blocker?: string | null
  nextAction?: string | null
}

export function writePlanState(input: PlanStateWriterInput): boolean
export function refreshPlanState(
  planRepository: PlanRepository,
  directory: string,
  workState: WorkState,
): boolean
```

**Behavior**:

- `writePlanState()`: Full control over status, blocker, and next action. Used for custom state updates.
- `refreshPlanState()`: Convenience function that writes `in-progress` status with default blocker/next-action. Used after plan creation/resume.

**File creation**:
- Creates parent directories if they don't exist (`.guild/plans/<slug>/`)
- Writes to `state.md` in the same directory as the plan file
- Overwrites existing `state.md` (idempotent)

**Progress tracking**:
- Reads current progress from the plan file (checkbox count)
- Includes progress in the state file for visibility

### Integration Points

#### 1. `plan-execution.ts`

**Changes**:
- Import `refreshPlanState` from `plan-state-writer.ts`
- Call `refreshPlanState()` after `writeWorkState()` in both functions:
  - `createFreshPlanExecution()` — after creating fresh state
  - `resumePlanExecution()` — after resuming work

**Rationale**: These are the two entry points where plan execution begins or resumes. Refreshing state here ensures the file is always current with the work state.

#### 2. `start-work-hook.ts`

**No changes required**: The hook already calls `PlanService.createExecution()` and `PlanService.resumeExecution()`, which now trigger state writes internally.

#### 3. `work-continuation.ts`

**Future enhancement**: When work is paused (e.g., due to stale continuations), the hook could call `writePlanState()` with `status: "blocked"` and a reason.

## Testing

Unit tests for `plan-state-writer.ts` cover:

- Writing state markdown with correct format
- Including blocker when provided
- Default `in-progress` status via `refreshPlanState()`
- Creating parent directories
- Including today's date in the Last Updated field

Run tests:
```bash
bun test packages/guild/src/domain/plans/plan-state-writer.test.ts
```

Integration tests for plan execution (start-work-hook, work-continuation) verify that state files are created as a side effect of plan lifecycle operations.

## Consistency Rules

1. **State file always exists** after plan creation or resume.
2. **Status field reflects execution state**: `in-progress` during active work, `blocked` if paused, `done` if complete.
3. **Progress field is always current**: Reflects the latest checkbox count from the plan file.
4. **Last Updated is today's date**: Refreshed on every state write.
5. **Blocker is explicit**: Either a description or "None" — never absent.
6. **Next Action is actionable**: Tells the next agent what to do (e.g., "Continue to next unchecked task" or "Resume after API is available").

## Future Enhancements

1. **Pause hook integration**: When work is paused, update state.md with `status: "blocked"` and reason.
2. **Handoff skill integration**: `guild-handoff` can call `writePlanState()` to capture plan-local context.
3. **Completion tracking**: When all tasks are done, update state.md with `status: "done"`.
4. **Blocker resolution**: When a blocker is resolved, clear it and update status.

## See Also

- [Plan Artifact Formats](../skills/guild-plan/references/FORMATS.md) — canonical format spec for state.md
- [guild-handoff skill](../skills/guild-handoff/SKILL.md) — uses state.md for pause/resume context
- [guild-plan skill](../skills/guild-plan/SKILL.md) — creates and updates state.md during planning
- [Architecture](architecture.md) — high-level Guild structure

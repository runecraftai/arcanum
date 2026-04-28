# Phase: BUILD

## When

After PLAN is approved, when user triggers: `/build`, `build this`, `implement`, `execute tasks`, `vamos construir`, `implementar`

## Goal

Execute each task directly, one at a time, implementing features while verifying each step. Mark tasks complete as they are verified.

**Pre-condition**: Run knowledge chain verification (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.

## Safety Valve

If during BUILD the executor encounters codebase state that contradicts loaded context (e.g., a file that should exist doesn't, an API that differs from STACK.md):

1. **STOP immediately.** Do not guess or infer.
2. Return `FORGE_STATUS: BLOCKED` with a clear description of the contradiction.
3. Herald will delegate Scout for targeted re-exploration.
4. Resume after context is corrected.

Never fabricate. An explicit BLOCKED is always better than incorrect implementation.

## Delegation Rules

Follow the contracts in `sub-agent-delegation.md`.

Key rule: Forge should never explore the codebase. If you need to understand existing code before implementing, return BLOCKED and let Scout explore first.

## Commit Policy

Each completed task should result in one atomic commit. See `build-cycle.md` for the commit message format and size rules.

## Steps

### Step 1: Load Task Checklist

1. Load tasks.md (or TASK.md for Quick scope)
2. Find the first unchecked task `- [ ]`
3. If all tasks checked → BUILD is complete, proceed to LEARN

### Step 2: Execute One Task

For each task in document order:

**2a. Read the task definition**:
- What: implementation goal
- Where: file(s) to modify
- Done when: acceptance criteria

**2b. Load referenced files**:
- Read each file in `Where` list
- Understand current implementation
- Note any related code patterns

**2c. Implement the change**:
- Make the modification directly
- Keep changes minimal and focused on this task
- Follow project conventions from `.specs/codebase/CONVENTIONS.md`

**2d. Verify acceptance criteria**:

For each "Done when" criterion:
1. Check manually or run verification command
2. If criterion fails → fix before moving forward
3. Document any findings

**2e. Mark task complete**:
- Edit tasks.md: change `- [ ]` to `- [x]`
- Report: "✓ Task N/M: [title] — [brief summary]"

**2f. Proceed to next task**:
- Move to next unchecked task
- Repeat steps 2a–2e

### Step 3: Handle Blockers

If a task cannot be completed due to external dependency:

1. Mark task as `- [BLOCKED: reason]` in tasks.md
2. Report blocker clearly to user with remediation steps
3. Skip tasks that depend on the blocked task
4. Continue with non-dependent tasks
5. Mark BUILD `partial` if any blockers remain

**Example blocker reasons**:
- Missing API key or credentials
- Unresolved design question from user
- Dependency on external service not available
- Performance requirement unachievable with current stack

### Step 4: Handle Test Failures

If verification fails:

1. Analyze the failure
2. Fix the code
3. Re-verify all criteria
4. Only then mark task complete

Do not skip failed tasks — resolve before moving on.

### Step 5: Completion

When all tasks checked (or blocked with reason):

1. Update tasks.md frontmatter: `status: completed` (or `partial` if blockers exist)
2. Update `completed_count: N` (number of completed tasks)
3. Report summary:
   ```
   ## BUILD Complete

   Total tasks: M
   Completed: N
   Blocked: B (reasons listed in tasks.md)
   ```
4. Proceed to LEARN

## Build Cycle Pattern (from `build-cycle.md`)

Each task execution follows the **build cycle**:

```
LOAD → EXECUTE → VERIFY → [BLOCKER?] → MARK COMPLETE → NEXT
```

### Verification Strategy

Verification depends on task type:

| Task Type | Verification | Command Examples |
|-----------|-------------|-----------------|
| File creation | File exists, content correct | `ls -la <file>` |
| Code function | Tests pass | `npm test -- --testNamePattern="function"` |
| Integration | Component works end-to-end | Manual test + logging |
| Config change | System works with new config | `node app.js` (check output) |
| Refactoring | Tests still pass, no regressions | `npm test && npm run lint` |

### Code Quality Standards

Before marking complete, verify:
- [ ] Code compiles/runs without errors
- [ ] Tests pass (if applicable)
- [ ] Linting passes (if applicable)
- [ ] No performance regressions
- [ ] Comments added where needed
- [ ] Follows project conventions

## Supporting References

- `build-cycle.md` — Build cycle patterns in detail
- `prove-it-pattern.md` — How to write tests alongside implementation
- `vertical-slicing.md` — Understanding task interdependencies

## Completion Criteria

✓ BUILD phase is complete when:
1. All tasks are either checked (completed) or blocked
2. No unresolved failures
3. tasks.md `status: completed` or `partial`
4. All non-blocked tasks verified
5. Ready to proceed to TEST phase

# Build Cycle

The incremental build cycle executes one task at a time, verifies it, and moves to the next.

## Build Cycle Steps

1. **Load**: Fetch current task from plan
2. **Execute**: Implement the task
3. **Verify**: Run tests and lint
4. **Handle Blockers**: Address failures
5. **Mark Complete**: Update task status
6. **Next**: Move to next task or complete phase

## Verification Criteria

- Code compiles/runs
- Tests pass
- Linting passes
- No regressions

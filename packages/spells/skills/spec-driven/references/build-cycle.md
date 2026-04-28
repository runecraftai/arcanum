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

## Atomic Commit Policy

Each task in `tasks.md` should result in exactly one atomic commit.

**Rules:**
- **One concern per commit.** Never mix feature code + refactoring + formatting in the same commit.
- **Independently revertable.** Each commit must leave the build in a passing state.
- **Size limit.** If a task produces >300 lines changed, consider splitting into sub-commits by logical boundary.

**Commit message format:** `type(scope): description`

| Type | Use for |
|------|---------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructure without behavior change |
| `docs` | Documentation only |
| `test` | Test additions or corrections |
| `chore` | Build, tooling, dependency updates |

**Examples:**
- ✅ `feat(spec-driven): add phase-map.md reference`
- ✅ `refactor(spec-driven): migrate docs/ paths to .specs/`
- ✅ `docs(spec-driven): add knowledge-chain verification guide`
- ❌ `update spec-driven` — no type, no scope, vague
- ❌ `feat(spec-driven): add phase-map + fix typos + update README` — mixed concerns

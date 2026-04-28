# Phase: TEST

## When

After BUILD is completed, when user triggers: `/test`, `test this`, `verify`, `prove it works`, `vamos testar`, `teste isso`

## Goal

Verify that the implemented feature works correctly through strategic test coverage. Prove that acceptance criteria are met and no regressions exist.

## Steps

### Step 1: Load Implementation Context

1. Read completed tasks.md to understand what was built
2. Load relevant spec.md or TASK.md to review acceptance criteria
3. Identify what needs to be tested:
   - Happy path: primary workflow
   - Edge cases: boundary conditions
   - Error handling: failure modes
   - Integration: component interactions

### Step 2: Test Strategy (Prove-It Pattern)

Apply the **prove-it pattern** (see `prove-it-pattern.md`):

**2a. Understand**: What behavior must be proven?
- List each acceptance criterion from spec
- For each, identify test cases needed

**2b. Plan Tests**: What test cases cover the behavior?
- Happy path tests (normal operation)
- Edge case tests (boundaries, limits)
- Error case tests (invalid input, failures)
- Integration tests (component interactions)

**2c. Write Tests**: Create test cases first (test-driven approach)
- Use project's test framework (Jest, Vitest, pytest, etc.)
- Structure: Arrange → Act → Assert
- Name tests clearly: `describe("Feature X", () => { it("should Y", ...) })`

**2d. Implement**: Make tests pass
- Run failing tests: `npm test` or `pytest`
- Fix implementation to pass tests
- Do not skip failing tests

**2e. Verify**: Run full test suite
- Execute all tests: `npm test`
- Check for regressions: no existing tests should break
- Measure coverage: `npm test -- --coverage`

**2f. Refactor**: Simplify if needed
- Keep test and code both clear
- Remove duplication
- Maintain clarity

### Step 3: Coverage Goals

Aim for these coverage levels:

| Coverage Type | Target |
|---------------|--------|
| Line coverage | ≥ 80% |
| Branch coverage | ≥ 75% |
| Function coverage | ≥ 80% |

Coverage is measured per module:
```bash
npm test -- --coverage src/auth/
```

### Step 4: Test Execution

**For each test suite** in the feature:

1. Create test file (if not already created during BUILD):
   - Pattern: `src/auth/auth.test.js` (for `src/auth/auth.js`)
   - Use project's naming convention

2. Write test cases covering:
   - Each acceptance criterion from spec
   - Happy path scenarios
   - Error scenarios
   - Edge cases

3. Run tests:
   ```bash
   npm test -- auth.test.js
   ```

4. If tests fail:
   - Analyze failure
   - Fix implementation
   - Re-run tests

5. Continue until all tests pass

### Step 5: Regression Testing

After new tests pass, run full suite to catch regressions:

```bash
npm test
npm run lint
npm run type-check  # if TypeScript project
```

If regressions found:
- Analyze what broke
- Fix implementation
- Re-verify

### Step 6: Performance Testing (if applicable)

For performance-critical code:

1. Establish baseline performance
2. Run performance tests
3. Verify no degradation

Example:
```bash
npm run perf-test
```

### Step 7: Integration Testing

Test feature end-to-end with real system:

1. Start application
2. Exercise workflow manually
3. Verify no errors in logs
4. Check UI/API responses

For APIs:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### UAT Sub-Step

After automated tests pass, run UAT scenarios for user-facing features.
→ See `test-uat.md` for scenario template, scope rules, and sign-off criteria.

Skip UAT if: feature has no user-facing changes (backend only, internal tooling, refactoring).

### Step 8: Completion

When all tests pass and coverage is adequate:

1. Update tasks.md: add note on test coverage
2. Generate coverage report: `npm test -- --coverage > test-coverage.txt`
3. Report summary:
   ```
   ## TEST Complete

   Test framework: [Jest/pytest/etc]
   Total tests: N
   Passed: N
   Failed: 0
   Coverage:
   - Lines: XX%
   - Branches: XX%
   - Functions: XX%
   ```
4. Proceed to REVIEW phase

## Supporting References

- `prove-it-pattern.md` — Test-driven development patterns
- `build-cycle.md` — Integration with build verification

## Verification Checklist

- [ ] All new tests pass
- [ ] No regression failures
- [ ] Coverage ≥ 80% for new code
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] Edge cases covered

## Completion Criteria

✓ TEST phase is complete when:
1. All unit tests pass
2. All integration tests pass
3. No regressions in existing tests
4. Coverage ≥ 80% for new code
5. Performance acceptable
6. Ready for REVIEW phase

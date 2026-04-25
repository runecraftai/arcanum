# Phase: SIMPLIFY

## When

After REVIEW is complete, when user triggers: `/simplify`, `refactor`, `simplify this`, `reduce complexity`, `simplifica`, `refatora`

## Goal

Improve code clarity and reduce complexity while maintaining behavior. Apply simplification patterns to make the codebase more maintainable.

## Steps

### Step 1: Identify Simplification Opportunities

Review code for common patterns that can be simplified:

Using `simplification-patterns.md` as guide, look for:

1. **Extract Function**: Large functions that do multiple things
   - Example: 50-line function with 3 distinct sections → split into 3 functions
   - Benefit: Each function has single responsibility, easier to test

2. **Remove Duplication**: Repeated logic in multiple places
   - Example: Same validation in 3 endpoints → extract to shared function
   - Benefit: Single source of truth, easier to maintain

3. **Inline Trivial**: Unnecessary abstractions
   - Example: One-line wrapper function → inline the call
   - Benefit: Less indirection, clearer code

4. **Flatten Nesting**: Deep if/else or nested loops
   - Example: 4 levels of nesting → early returns reduce to 1 level
   - Benefit: Easier to follow logic flow

5. **Rename for Clarity**: Poor variable/function names
   - Example: `x`, `data`, `process()` → `tokenPayload`, `fetchUserPreferences()`
   - Benefit: Self-documenting code

6. **Remove Dead Code**: Unused functions, variables, imports
   - Example: Old function not called anywhere → delete it
   - Benefit: Less cognitive load, clearer intent

7. **Simplify Logic**: Complex conditions → clearer equivalents
   - Example: `if (!(!x && y))` → `if (x || !y)`
   - Benefit: Easier to understand intent

### Step 2: Create Refactoring Plan

For each simplification opportunity, create a plan:

```markdown
## Simplification: Extract validateEmail()

**File**: src/auth/auth.js (lines 42-58)

**Current**: Email validation duplicated in 3 places:
- signup() at line 42
- login() at line 102
- updateProfile() at line 180

**Plan**:
1. Create shared function: src/auth/validation.js
2. Implement validateEmail(email) with existing logic
3. Update 3 callsites to use new function
4. Add tests for validation.test.js
5. Verify all existing tests still pass

**Effort**: 20 minutes
**Risk**: Low (pure refactoring, no behavior change)
```

### Step 3: Execute Refactorings

For each planned refactoring:

**3a. Backup current state** (via git):
```bash
git status  # verify no uncommitted changes
```

**3b. Write/update tests** (if needed):
- Extract tests for the function being refactored
- Ensure tests pass before refactoring
- Tests will guide the refactoring

**3c. Refactor**:
- Apply the simplification pattern
- Keep changes focused on one refactoring per commit

**3d. Verify**:
- Run tests: `npm test`
- Run linter: `npm run lint`
- No regressions should occur

**3e. Commit**:
```bash
git add .
git commit -m "refactor: extract validateEmail() function"
```

### Step 4: Complexity Metrics (Optional)

If applicable, measure complexity before and after:

```
Cyclomatic Complexity:
  auth.js before: 12
  auth.js after: 8
  → Reduced by 33%

Lines of Code:
  auth.js before: 350
  auth.js after: 320
  → Reduced by 9%

Test Coverage:
  Before: 82%
  After: 85%
  → Improved by 3%
```

### Step 5: Document Changes

Create a summary of simplifications:

```markdown
## Simplifications Applied

### 1. Extract validateEmail()
- **Where**: src/auth/validation.js (new file)
- **What**: Consolidated 3 duplicate email validations
- **Benefit**: Single source of truth, easier to maintain
- **Tests**: validation.test.js (5 new tests)
- **Status**: ✓ Complete

### 2. Flatten login() logic
- **Where**: src/auth/auth.js, login() function
- **What**: Reduced 4 levels of nesting to 2 using early returns
- **Benefit**: Logic flow easier to follow
- **Tests**: All existing tests pass
- **Status**: ✓ Complete

### 3. Remove unused helper functions
- **Where**: src/auth/helpers.js
- **What**: Deleted 2 unused functions (fetchSessionData, validateToken)
- **Benefit**: Cleaner codebase, no dead code
- **Status**: ✓ Complete
```

### Step 6: Re-verify Quality

After all simplifications:

1. **Run full test suite**:
   ```bash
   npm test
   ```

2. **Run linter**:
   ```bash
   npm run lint
   ```

3. **Check type safety** (if TypeScript):
   ```bash
   npm run type-check
   ```

4. **Verify coverage didn't drop**:
   ```bash
   npm test -- --coverage
   ```

If any tests fail or coverage drops significantly:
- Analyze failure
- Revert problematic refactoring
- Re-approach differently

### Step 7: Completion

When all simplifications complete:

1. Create final summary of changes
2. Verify no regressions
3. Report:
   ```
   ## SIMPLIFY Complete

   Simplifications applied: N
   Complexity reduced: XX%
   Coverage maintained at: XX%
   All tests passing: ✓
   ```
4. Proceed to SHIP phase

## Supporting References

- `simplification-patterns.md` — Detailed patterns with examples
- `prove-it-pattern.md` — Ensure tests guide refactoring

## Simplification Checklist

- [ ] Duplication identified and consolidated
- [ ] Large functions extracted
- [ ] Dead code removed
- [ ] Variable names clarified
- [ ] Logic flattened where possible
- [ ] All tests pass after refactoring
- [ ] Linter passes
- [ ] Coverage maintained or improved

## Completion Criteria

✓ SIMPLIFY phase is complete when:
1. All identified simplification opportunities addressed
2. All tests pass
3. Linter passes
4. Code is measurably simpler
5. No regressions introduced
6. Ready for SHIP phase

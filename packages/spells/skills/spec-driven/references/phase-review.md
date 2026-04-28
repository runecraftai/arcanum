# Phase: REVIEW

## When

After TEST passes, when user triggers: `/review`, `code review`, `review this`, `check quality`, `revisa isso`

## Goal

Assess code quality comprehensively across multiple dimensions. Provide constructive feedback and a verdict on readiness for simplification and shipping.

## Multi-Agent Review Flow

In the multi-agent system, REVIEW maps to two sequential sub-agents:

1. **Ward** (security review) — reviews for vulnerabilities, auth issues, input validation, secrets. See `sub-agent-delegation.md` for input/output contracts.
2. **Arbiter** (quality review) — reviews for code quality, spec compliance, consistency. See `sub-agent-delegation.md` for input/output contracts.

Flow: `Forge completes BUILD` → `Ward reviews` → if APPROVE → `Arbiter reviews` → if APPROVE → proceed to SIMPLIFY.

If Ward or Arbiter returns REJECT: return all findings to BUILD phase with explicit list of items to fix. Re-run full review after fix.

## Steps

### Step 1: Load Implementation

1. Load tasks.md to understand what was built
2. Load spec.md to review requirements
3. Load design.md (if exists) to review architectural decisions
4. Identify all modified/created files

### Step 2: Review Axes

Apply the **Review Axes framework** (see `review-axes.md`):

Assess code on 7 independent axes:

#### Axis 1: Correctness
- [ ] Does it work as intended?
- [ ] Are all acceptance criteria met?
- [ ] Are error cases handled?
- [ ] Is error handling appropriate?

#### Axis 2: Clarity
- [ ] Is code easy to understand?
- [ ] Are function/variable names clear?
- [ ] Is logic simple or overly complex?
- [ ] Are comments helpful (not redundant)?

#### Axis 3: Consistency
- [ ] Does it follow project conventions?
- [ ] Are naming rules consistent?
- [ ] Does code style match project?
- [ ] Are design patterns aligned with project?

#### Axis 4: Performance
- [ ] Is it efficient? Any O(n²) loops?
- [ ] Are there obvious bottlenecks?
- [ ] Is memory usage reasonable?
- [ ] Are database queries optimized?

#### Axis 5: Security
- [ ] Are inputs validated?
- [ ] Are secrets protected (no hardcoded keys)?
- [ ] Are dependencies up-to-date?
- [ ] Are there vulnerability risks?

#### Axis 6: Testing
- [ ] Is behavior adequately tested?
- [ ] Are edge cases covered?
- [ ] Is coverage adequate (≥ 80%)?
- [ ] Do tests verify acceptance criteria?

#### Axis 7: Documentation
- [ ] Is purpose documented?
- [ ] Are assumptions documented?
- [ ] Is public API documented?
- [ ] Are complex sections explained?

### Step 3: Review Checklist

For each axis, create a review entry:

```markdown
## Review Summary

### ✓ Axis 1: Correctness
- Verdict: **PASS**
- All acceptance criteria met
- Error handling adequate
- No gaps found

### ✓ Axis 2: Clarity
- Verdict: **PASS**
- Function names clear
- Logic straightforward
- Comments helpful

### ? Axis 3: Consistency
- Verdict: **MINOR**
- Naming mostly consistent
- One function uses old pattern (in auth.js, line 42)
- Suggestion: Align with newer pattern for consistency

### ✓ Axis 4: Performance
- Verdict: **PASS**
- No obvious bottlenecks
- Database queries efficient
- Memory usage reasonable

### ✓ Axis 5: Security
- Verdict: **PASS**
- Inputs validated
- Secrets use environment variables
- No hardcoded keys
- Dependencies up-to-date

### ✓ Axis 6: Testing
- Verdict: **PASS**
- 85% code coverage
- Edge cases covered
- All acceptance criteria verified

### ✓ Axis 7: Documentation
- Verdict: **PASS**
- Public API documented
- Complex logic explained
- Assumptions clear
```

### Step 4: Severity Classification

For each issue found, classify by severity:

| Severity | Definition | Example |
|----------|-----------|---------|
| **Blocker** | Must fix before shipping | Security vulnerability, broken feature |
| **Major** | Should fix before shipping | Significant performance issue, missing test coverage |
| **Minor** | Nice to fix, but can ship | Naming inconsistency, redundant comment |
| **Suggestion** | Nice to have | Consider refactoring for clarity |

### Step 5: Feedback Report

Create a structured feedback report:

```markdown
## Code Review Feedback

**Overall Verdict: APPROVE** (or APPROVE WITH MINOR FIXES / REQUEST CHANGES)

### Issues Found

#### Blocker Issues: 0
(none)

#### Major Issues: 1
1. **Performance**: N+1 query in getUserPosts (line 127)
   - Problem: Fetches user, then in loop fetches each post separately
   - Suggestion: Use JOIN query or batch fetch
   - Effort: 30 minutes to fix

#### Minor Issues: 2
1. **Naming**: Variable `x` in auth.js is unclear
   - Suggestion: Rename to `tokenPayload`
2. **Documentation**: Missing docstring on validateEmail()
   - Suggestion: Add JSDoc comment

### Strengths

- Clean separation of concerns
- Good test coverage
- Clear error messages
- Follows project patterns well

### Suggestions for Future

- Consider adding rate limiting to login endpoint
- Document the token expiry strategy
- Monitor performance metrics after deployment

### Verdict

**APPROVE** — Ship as is, or apply minor fixes if time permits.
```

### Step 6: Verdict

Assign overall verdict:

- **APPROVE**: No blockers, ready to ship
- **APPROVE WITH MINOR FIXES**: Minor issues (suggestions/minor severity) exist but don't block shipping
- **REQUEST CHANGES**: Major or blocker issues must be fixed before shipping

### Step 7: Next Steps

Based on verdict:

- **APPROVE**: Proceed to SIMPLIFY phase
- **APPROVE WITH MINOR FIXES**: User chooses: fix minor items now, or proceed as-is
- **REQUEST CHANGES**: Return to BUILD to fix blocking issues, then re-TEST and re-REVIEW

## Supporting References

- `review-axes.md` — Detailed review framework
- `code-simplification/references/simplification-patterns.md` — Preview of simplification opportunities

## Review Checklist

- [ ] All 7 axes assessed
- [ ] Verdict assigned
- [ ] Issues prioritized by severity
- [ ] Feedback report complete
- [ ] User informed of verdict

## Completion Criteria

✓ REVIEW phase is complete when:
1. All axes reviewed
2. Verdict is clear (APPROVE/MINOR/CHANGE)
3. Feedback report delivered
4. User approves proceeding to SIMPLIFY (or requests changes)

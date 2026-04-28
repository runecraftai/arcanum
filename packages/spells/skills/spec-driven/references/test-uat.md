# UAT Sub-Step — User Acceptance Testing

User acceptance testing (UAT) validates a feature from the user's perspective after automated tests pass. Catches UX gaps, workflow issues, and edge cases that unit tests miss.

---

## Purpose

**What UAT catches**:
- User flows that don't match reality
- Missing error messages or confusing UX
- Incomplete workflows (missing steps)
- Edge case handling in user context
- Accessibility issues
- Performance perceived by end users

**What UAT doesn't catch**:
- Code quality or security (that's Ward & Arbiter)
- Performance metrics <100ms (load testing catches that)

---

## When to Run

**After** automated tests pass (unit, integration, e2e).

**Before** REVIEW phase.

**Only for** user-facing features (UI, API users, workflows).

**Skip if**:
- Backend-only changes (no user-facing components)
- Internal tooling (only developer-facing)
- Pure refactoring (no new functionality)

---

## Scope Rules by Size

| Scope | Effort | UAT Scenarios | Examples |
|-------|--------|---------------|----------|
| **Quick** | 1–5h | Skip UAT | Fix button alignment, typo correction |
| **Medium** | 5–20h | 1–2 scenarios | Add email field to form, simple feature |
| **Large** | 20–40h | 3–5 scenarios | Multi-step workflow, complex forms |
| **Complex** | 40+h | 5+ scenarios | Multi-user interactions, integrations |

---

## UAT Scenario Template

```markdown
### UAT-NNN: <Scenario Title>

**Setup**:
[Preconditions — what state must exist before running this scenario]

Example: "Create a user account with email test@example.com; fund account with $50"

**Scenario**:
- **As**: <user role> (e.g., authenticated user, admin, anonymous user)
- **When**: <specific action or sequence>
- **Then**: <expected observable outcome>

Example:
- **As**: authenticated user
- **When**: I click "Checkout", enter valid credit card, click "Pay"
- **Then**: Payment processes; I see "Order confirmed" page; confirmation email arrives in 2 seconds

**Steps** (if multi-step):
1. [Action 1]
2. [Action 2]
3. [Expected result]
4. [Action 3]
5. [Expected result]

**Status**: PASS | FAIL | SKIP

**Notes**: 
[Observations, deviations, screenshots if applicable]
- If FAIL: describe failure, what went wrong
- If SKIP: explain why skipped
- If PASS: note any observations (e.g., "button clicked slightly slow but acceptable")
```

---

## Example UAT Scenarios

### Example 1: Medium scope (Happy path + edge case)

```markdown
### UAT-001: User Registration (Happy Path)

**Setup**: Empty system; user has valid email

**Scenario**:
- **As**: anonymous user
- **When**: I navigate to signup, enter email "alice@example.com", password "SecureP@ss123", confirm password, click "Sign Up"
- **Then**: Account created; I'm logged in; I see my dashboard

**Status**: PASS
**Notes**: UX smooth; buttons responsive; no lag

---

### UAT-002: User Registration (Duplicate Email)

**Setup**: User "alice@example.com" already exists

**Scenario**:
- **As**: anonymous user
- **When**: I try to sign up with email "alice@example.com" (already taken)
- **Then**: Form shows error "Email already in use"; I can correct it and retry

**Status**: FAIL
**Notes**: Error message showed "Invalid input" instead of "Email already taken" (too generic)
**Fix**: Changed error message to be more specific
```

---

## Sign-Off Criteria

UAT is complete when:

1. ✓ All scenarios are either **PASS** or **SKIP** with written justification
2. ✓ **ZERO FAIL scenarios** (no unexpected behavior)
3. ✓ Critical paths covered (happy path + 1-2 edge cases)
4. ✓ Scenarios tested by someone other than the developer (or developer + user feedback)
5. ✓ No regressions in related features

**If FAIL**: Log in feature STATE.md as blocker; return to BUILD; fix; re-run full UAT.

---

## Execution

1. **Run each scenario manually or with automated UAT tools**
   - Test in real environment (staging or production-like)
   - Use real browser/device if possible
   - Test on mobile if feature is user-facing

2. **Document results in feature STATE.md**:
   ```markdown
   ## UAT

   Completed: 2026-04-28
   Scenarios: 5 total
   - PASS: 4
   - SKIP: 1 (admin scenario deferred to UAT phase 2)
   - FAIL: 0

   Ready for: REVIEW phase
   ```

3. **If FAIL detected**:
   - Note details in STATE.md
   - Return to BUILD
   - Fix issues
   - Re-run UAT (affected scenarios minimum)
   - Sign off again before proceeding

---

## Scope Rules

### Quick Scope
- **Skip UAT entirely**
- Automated tests sufficient
- Example: "Fix button color from red to blue"

### Medium Scope
- **1–2 scenarios minimum**
- Happy path + one edge case
- Example: "Add email field to signup form"
  - UAT-001: User signs up with valid email (happy path)
  - UAT-002: User tries signup with invalid email (edge case)

### Large Scope
- **3–5 scenarios minimum**
- Happy path + 2–3 edge cases
- Example: "Payment checkout workflow"
  - UAT-001: Complete payment with valid card (happy)
  - UAT-002: Declined card (edge)
  - UAT-003: Timeout during payment (edge)
  - UAT-004: User cancels mid-checkout (edge)
  - UAT-005: Mobile checkout experience (platform edge)

### Complex Scope
- **5+ scenarios**
- Happy path + all edge cases + error states
- Multi-user interactions
- Example: "Real-time collaboration on documents"
  - UAT-001: Single user creates & edits document (happy)
  - UAT-002: Two users edit same doc simultaneously (concurrency)
  - UAT-003: User loses connection mid-edit (error state)
  - UAT-004: Admin revokes access while user editing (permission change)
  - UAT-005: Comment threads on shared doc (interaction)
  - UAT-006: Mobile + desktop collaboration (platform mix)

---

## Integration with REVIEW Phase

After UAT passes:

1. Feature has been validated by users (or developer role-playing user)
2. No FAIL scenarios exist
3. Ready for REVIEW phase (Ward + Arbiter)
4. Feature can proceed to SIMPLIFY and SHIP

**Checklis for REVIEW gate**:
- [ ] All automated tests pass
- [ ] UAT complete: N scenarios, N PASS, 0 FAIL
- [ ] No regressions detected
- [ ] Performance acceptable in production-like environment

---

## Regression Testing

Before shipping, check that prior features still work:
- [ ] Related features still pass their UAT scenarios
- [ ] No broken integrations
- [ ] User flows for adjacent features unaffected

---

## See Also

- `phase-test.md` — TEST phase; includes UAT as sub-step
- `test-driven.md` — How to write testable code alongside implementation
- `scope-detection.md` — Scope scoring (determines UAT effort)

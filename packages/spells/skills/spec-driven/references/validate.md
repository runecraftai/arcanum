# Validate

Verify implementation against the spec, tasks, coding principles, and user-facing behavior. Validation can be invoked explicitly or performed as the final quality pass after BUILD/TEST.

## Two Verification Levels

### Per-Task Verification

Per-task verification is mandatory during BUILD. A task is not complete until its `Done when` criteria are proven.

For each task:

1. Read the task acceptance criteria.
2. Run the listed verification command or manual check.
3. Fix failures before marking the task complete.
4. Record any skipped check with the reason.

### Feature-Level Validation

Feature-level validation runs after all tasks, or when the user asks for `validate`, `verify work`, `UAT`, or `walk me through it`.

Validate:

- All tasks are done or explicitly blocked
- Every spec acceptance criterion has PASS/FAIL evidence
- Edge cases from `spec.md` are handled or tracked
- Tests/build/lint/typecheck relevant to the change have run
- Changed files remain surgical and aligned with existing patterns
- User-facing work gets UAT only when human judgment matters

## Interactive UAT

Run interactive UAT only for user-facing features with complex behavior: UI flows, interaction patterns, visual design, API workflows used directly by users, or behavior where automated checks cannot capture acceptance.

Skip UAT for:

- Quick fixes
- Backend-only internals
- Infrastructure/config-only changes
- Pure refactors
- Urgent hotfixes unless the user explicitly requests UAT

When UAT applies, present one scenario at a time:

```markdown
Test N: <scenario name>

Expected: <specific observable result>

Does this work? Describe what you see.
```

Stop and wait for the user after each scenario.

Interpret responses:

| User response | Result |
|---------------|--------|
| `yes`, `pass`, `works`, `next` | PASS |
| `skip`, `can't test`, `n/a` | SKIP with reason |
| Anything else | ISSUE; record verbatim |

If UAT finds issues, create fix tasks and ask for approval before implementing them.

## Validation Report

Use this structure in the final response or in `.specs/features/<name>/validation.md` when a durable artifact is useful:

```markdown
# Validation: <Feature>

## Task Completion

| Task | Status | Evidence |
|------|--------|----------|
| T1 | PASS | <command/check> |

## Acceptance Criteria

| Requirement | Result | Evidence |
|-------------|--------|----------|
| FEAT-01 | PASS | <test/manual check> |

## Tests

- `<command>` — PASS | FAIL | NOT RUN (<reason>)

## UAT

- Applied: yes/no
- Reason: <why>
- Result: PASS | SKIP | ISSUES

## Code Quality

- Surgical changes: PASS | FAIL
- Existing patterns preserved: PASS | FAIL
- No scope creep: PASS | FAIL

## Overall

Ready | Blocked | Needs Fix
```

## Completion Criteria

Validation is complete when:

1. Per-task checks have evidence
2. Feature acceptance criteria have PASS/FAIL status
3. UAT is run or explicitly skipped with a reason
4. Fix tasks exist for any issue found
5. No commit was made without explicit user approval

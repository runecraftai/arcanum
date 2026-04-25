# Task Format

Tasks are the atomic unit of work. Each task should be completable in under 30 minutes.

## Task Structure (in tasks.md)

```markdown
- [ ] Task N: [Title]
  - What: [1 sentence of what to implement]
  - Where: [file path(s) to modify/create]
  - Depends on: [Task numbers, or "none"]
  - Done when: [3-5 acceptance criteria]
  - Verification: [how to verify]
  - Size: S | M | L
  - Req: [REQUIREMENT-ID(s)]
```

## Fields Explained

### What
One-sentence goal for the task. Should be clear enough for implementation.

Example:
- ✗ "Do the thing"
- ✓ "Create password reset endpoint that validates email and sends reset link"

### Where
File path(s) affected by this task. Can be multiple files.

Examples:
- `src/auth/resetPassword.js` (new file)
- `src/auth/email.js`, `src/auth/routes.js` (existing files modified)
- `tests/auth.test.js` (test file)

### Depends on
Task numbers that must complete first. Use "none" if this task has no dependencies.

Example:
- `Depends on: 1, 3` (this task requires tasks 1 and 3 to be complete)
- `Depends on: none` (this task is independent)

### Done when
Acceptance criteria using WHEN/THEN format. 3-5 criteria per task.

```
- [ ] WHEN user clicks "Forgot Password", THEN modal appears
- [ ] WHEN user enters valid email, THEN reset link is sent
- [ ] WHEN user clicks reset link, THEN password form appears
```

### Verification
How to verify the task is complete. Can be:
- Automated test: `npm test -- auth.test.js`
- Manual test steps
- Code review checklist

Example:
```
- Run tests: npm test -- auth.test.js
- Manually test on mobile device
- Check no console errors
```

### Size
Estimated effort:
- **S (Small)**: < 15 minutes
- **M (Medium)**: 15–30 minutes
- **L (Large)**: 30–60 minutes (should be split)

### Req
Requirement ID(s) from spec.md that this task implements.

Example:
- `Req: UAUTH-04`
- `Req: UAUTH-04, UAUTH-05`

## Task Ordering

Tasks should be ordered by:
1. **Dependencies first**: Tasks with no deps before those that depend on them
2. **Setup before core**: Infrastructure before feature implementation
3. **Within phase**: Logical grouping (setup, core, integration, verification)

## Granularity Rule

Each task should take < 30 minutes to complete. If a task would take longer:
- Break it into 2–3 smaller tasks with clear dependencies
- Order the subtasks correctly

Example of granularity:
- ✗ "Implement entire authentication module" (too big)
- ✓ 
  - Task 1: Create User model and database migration
  - Task 2: Implement password hashing and verification
  - Task 3: Create login endpoint
  - Task 4: Create registration endpoint
  - Task 5: Add session/JWT token handling

## Task Checkboxes

During execution, mark tasks as:
- `- [ ]` Unchecked (not started)
- `- [x]` Checked (completed and verified)
- `- [BLOCKED: reason]` Blocked by external factor

Never partially check a task — it's either done or not.

## Requirement Traceability

At the end of tasks.md, include a traceability table:

```markdown
## Requirement Coverage

| Requirement ID | Task(s) |
|---|---|
| UAUTH-01 | 1 |
| UAUTH-02 | 2, 3 |
| UAUTH-03 | 4, 5 |
| UAUTH-04 | 6 |
```

**Rule**: Every requirement ID from spec.md must appear in this table.

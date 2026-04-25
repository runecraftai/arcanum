# Phase: SPEC

## When

After LOAD, when user triggers: `/spec`, `specify`, `write spec`, `what should we build`, `vamos especificar`, `preciso de um spec`

## Goal

Capture what to build with testable, traceable requirements. Produce a specification artifact that serves as the source of truth for subsequent phases.

## Steps

### Step 1: Scope Detection

Use the scoring matrix in `scope-detection.md` to determine scope (Quick/Medium/Large):

1. Analyze user's description against 5 signals:
   - **Files**: How many distinct files would change? (≤3 = 0 pts, 4-10 = 1 pt, >10 = 2 pts)
   - **Concepts**: How many new concepts/integrations? (≤1 = 0 pts, 2-3 = 1 pt, >3 = 2 pts)
   - **Ambiguity**: Is the requirement clear? (clear = 0 pts, somewhat = 1 pt, unclear = 2 pts)
   - **Integrations**: External system dependencies? (none = 0 pts, 1 = 1 pt, >1 = 2 pts)
   - **Risk**: High-impact or experimental? (low = 0 pts, medium = 1 pt, high = 2 pts)

2. Calculate total score:
   - **0-2**: Quick scope (single task, simple changes)
   - **3-5**: Medium scope (small feature, few integrations)
   - **6-10**: Large scope (complex feature, many concepts)

3. Present reasoning and recommended scope to user
4. If user specified scope explicitly → use it, skip detection

### Step 2: Clarification

If scope ≥ Medium and description is ambiguous (Ambiguity signal = 1 or 2), ask 1–3 focused clarifying questions.

Examples:
- "Does this integrate with the existing user service, or create a new one?"
- "What's the expected scale — hundreds of users or millions?"
- "Is backwards compatibility required?"

Wait for user response before proceeding.

### Step 3: Produce Artifact

#### For Quick scope → `.specs/quick/NNN-slug/TASK.md`

1. Determine next NNN number from existing `.specs/quick/` directories
2. Use template from `task-template.md`
3. Fill:
   - **Problem**: What's the user's need?
   - **Solution**: How will you solve it?
   - **Files**: Which files will change?
   - **Done When**: WHEN/THEN format acceptance criteria
   - **Verification**: How to verify completion

Example:
```markdown
# Task: Fix login button alignment

## Problem
Login button on mobile is misaligned.

## Solution
Adjust CSS media query for screens < 480px.

## Files
- src/auth/login.css

## Done When
- [ ] Button is centered on mobile (480px viewport)
- [ ] No horizontal scroll
- [ ] Button remains centered on desktop

## Verification
- Open page on mobile device (or dev tools mobile view)
- Button should be centered
```

#### For Medium or Large scope → `.specs/features/<name>/spec.md`

1. Use template from `spec-template.md`
2. Choose `<name>`: kebab-case, 2-4 words (e.g., `user-auth-service`)
3. Fill all sections:

**Header**:
```markdown
---
feature: user-auth-service
status: draft
scope: Medium
created: 2026-04-24
---

# user-auth-service
```

**Problem Statement**: 1–2 paragraphs describing the current state and friction.

**Goals**: 3-5 measurable goals (G1, G2, G3...).

**Out of Scope**: List what's explicitly NOT in this feature (e.g., "OAuth integration", "two-factor auth").

**User Stories** (grouped by priority P1/P2/P3):
```markdown
### P1 — Core
- As a user, I want to log in with email/password
- As a user, I want to see validation errors on invalid input

### P2 — Enhancement
- As a user, I want to remember my login across sessions
- As an admin, I want to manage user permissions
```

**Acceptance Criteria** (requirement-based):

```markdown
| ID | Requirement | Acceptance Criteria | Priority |
|----|------------|-------------------|----------|
| UAUTH-01 | User registration | Form accepts email, password; validates format; stores encrypted | P1 |
| UAUTH-02 | User login | Email + password authenticates user; redirects to dashboard | P1 |
| UAUTH-03 | Session persistence | Valid token stored in secure cookie; survives page reload | P1 |
| UAUTH-04 | Logout | Button clears session; redirects to login page | P1 |
| UAUTH-05 | Password reset | User can request reset link via email | P2 |
```

**Success Criteria**:
1. All P1 user stories are implemented and verified
2. All UAUTH-01 through UAUTH-04 acceptance criteria are met
3. No regressions in existing auth flow
4. Test coverage ≥ 80% for auth module

### Step 4: Approval Gate

Present the artifact to user:

**For Quick scope**:
> "Does this task look correct? (approve / adjust)"

**For Medium/Large scope**:
> "Does this spec capture the requirement? (approve / adjust)"

Do NOT proceed to next phase until user approves.

**Idempotency**: If spec already exists with `status: approved` → skip SPEC phase, proceed to PLAN or BUILD.

## Supporting References

- `scope-detection.md` — Scoring matrix and examples
- `spec-template.md` — Full spec artifact template
- `task-template.md` — Quick task template
- `knowledge-base.md` — Conventions for requirement IDs

## Approval Gate

- [ ] User approves spec artifact
- [ ] No regressions from prior feature work
- [ ] All P1 stories captured

## Completion Criteria

✓ SPEC phase is complete when:
1. Artifact exists (TASK.md or spec.md)
2. User explicitly approved it
3. Scope is documented
4. All requirement IDs are assigned (for Medium/Large)

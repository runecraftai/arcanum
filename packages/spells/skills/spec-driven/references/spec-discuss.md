# Discuss Sub-Step — Structured Q&A Before Spec

A focused discussion phase that captures context and edge cases before writing the specification. Used for Large and Complex scopes to ensure requirements are complete and unambiguous.

---

## When to Run

**Automatic** (mandatory):
- Large scope (score 7-11): Recommended. Ask user: "Run Discuss to capture context first? (yes/skip)"
- Complex scope (score ≥12): **Required**. Must complete before writing spec.md.

**Manual** (optional):
- Quick/Medium: Skip entirely.
- Any scope: User can request explicitly with `/discuss` or "let's discuss first"

---

## Goal

Answer 5 key categories of questions before committing to a specification. This prevents:
- Incomplete specs that miss edge cases
- Rework due to missed requirements
- Scope creep mid-feature
- Ambiguity about user impact and constraints

---

## Question Framework (5 Categories)

### 1. Scope Boundaries

**Purpose**: Establish clear in-scope and out-of-scope boundaries to prevent scope creep.

**Questions**:
- What's explicitly in scope for this feature?
- What's explicitly out of scope?
- Where's the boundary with adjacent features?

**Examples**:
- Q: "Does 'user authentication' include OAuth, or just email/password?"
  A: "Email/password only. OAuth is out of scope, deferred to Q3."
  
- Q: "Is 'payment processing' including refunds and disputes?"
  A: "Refunds in scope. Disputes out of scope for MVP, add in phase 2."

### 2. User Impact

**Purpose**: Understand who is affected and how their workflow changes.

**Questions**:
- Who is affected by this feature? (e.g., users, admins, developers)
- What changes in their day-to-day workflow?
- Are there edge users? (anonymous, power user, admin roles)

**Examples**:
- Q: "Who uses the notification feature?"
  A: "All authenticated users. Admins get additional digest emails. Anonymous users see nothing."
  
- Q: "What changes in their workflow?"
  A: "Before: users check dashboard for updates. After: real-time notifications pop up; users can mark as read."

### 3. Technical Constraints

**Purpose**: Identify performance, compatibility, and integration requirements.

**Questions**:
- Are there known performance requirements? (latency, throughput)
- Required integrations that must be preserved?
- Version constraints? (e.g., "must work on Node 16+")

**Examples**:
- Q: "Performance requirement for the search API?"
  A: "Must return results in <500ms for databases up to 100k records. Pagination required."
  
- Q: "Version constraint?"
  A: "Must support Python 3.8+; existing code uses dataclasses so we're okay."

### 4. Edge Cases

**Purpose**: Surface failure modes and uncommon scenarios.

**Questions**:
- What happens when the primary path fails? (network error, timeout, etc.)
- Empty/null states? (no data, no results)
- Concurrent access scenarios? (two users editing same record)

**Examples**:
- Q: "What if the payment gateway is down?"
  A: "Queue the payment for retry; show user 'pending' state; send confirmation email anyway."
  
- Q: "What if search returns zero results?"
  A: "Show empty state with search tips; suggest popular items."
  
- Q: "What if two users edit the same document simultaneously?"
  A: "Last-write-wins for now; add conflict detection in phase 2."

### 5. Dependencies

**Purpose**: Understand blockers and integration points with other features.

**Questions**:
- What must exist before this works?
- What other features depend on this?
- Are migrations required? (data model changes)

**Examples**:
- Q: "What must exist first?"
  A: "User authentication (already exists). API rate limiting (needs to be added first)."
  
- Q: "What features depend on this?"
  A: "Email notifications depend on this message queue. Billing depends on this usage tracking."
  
- Q: "Data migrations needed?"
  A: "Yes, add 'notification_preference' column to users table; migration script required."

---

## Process

1. **Ask questions grouped by category**
   - Present all 5 categories to user
   - Go category by category
   - Allow user to answer multiple questions per category
   - If user says "skip" on a category → mark as "Not discussed"

2. **Wait for answers**
   - User provides answers in natural language
   - Clarify any vague responses
   - Ask follow-ups if needed

3. **Document responses**
   - Record all answers in context.md (see format below)
   - Preserve exact wording where possible (avoid summarizing into misrepresentation)

4. **Identify gaps**
   - Note items deferred for later phases
   - Flag assumptions that need validation
   - List open questions

---

## Output Format

Create `.specs/features/<name>/context.md` with this structure:

```markdown
---
feature: <name>
created: YYYY-MM-DD
participants: [user, agent]
---

# Context — <Feature Name>

## Scope Boundaries

[User's answers about in-scope, out-of-scope, and boundaries]

Example response:
- In scope: Email/password auth, session persistence, logout
- Out of scope: OAuth, two-factor auth, password reset
- Boundary: Overlaps with user management feature; coordination needed on role definition

## User Impact

[User's answers about who is affected and workflow changes]

Example response:
- Affected users: All authenticated users, plus admins (separate flow)
- Workflow change: Users now see real-time notifications instead of polling dashboard
- Edge cases: Anonymous users see no notifications; power users can configure channels

## Technical Constraints

[Performance, integration, version requirements]

Example response:
- Performance: Search API must return in <500ms
- Integration: Must use existing user service; cannot duplicate user DB
- Versions: Node 18+, React 18+

## Edge Cases

[Failure modes and uncommon scenarios]

Example response:
- Primary path fails: Payment gateway down → retry queue + user "pending" notification
- Empty state: No search results → show suggestions and popular items
- Concurrency: Two users edit same record → last-write-wins (for MVP)

## Dependencies

[What must exist first, what depends on this, migrations]

Example response:
- Prerequisites: User auth (exists), rate limiting (needs implementation)
- Dependents: Billing module depends on this usage tracking
- Migrations: Add notification_preference column; script attached

## Open Questions

[Items deferred for later discussion or spec phase]

- How to handle timezone in notifications? (deferred to PLAN phase)
- Should users be able to mute specific notification types? (defer to phase 2)
- What's the retention period for notification history? (defer to phase 2)

---

**Discussed by**: [agent name]
**Discussed on**: YYYY-MM-DD
**Status**: Complete (or "Partial" if some categories skipped)
```

---

## Scope Rules

| Scope | Discuss Required | Time Estimate |
|-------|-----------------|----------------|
| Quick | Skip | — |
| Medium | Optional ("Run Discuss?") | 15-30 min |
| Large | Recommended | 20-40 min |
| Complex | **Mandatory** | 30-60 min |

---

## Integration with SPEC Phase

After Discuss completes:
1. context.md is written and user-approved
2. User can proceed to SPEC phase
3. Spec writer uses context.md as reference for spec.md
4. Spec should address all questions raised in context.md

**Rule for Complex scope**: `context.md` MUST be written before `spec.md` is started. Do not skip Discuss for Complex features.

---

## Example: Full Discuss Session

```
Agent: Let's discuss this feature before writing the spec.

## Scope Boundaries
Q: What's explicitly in scope?
User: Email-based auth, user registration, login, logout. Session persistence in cookies.
Q: What's out of scope?
User: OAuth, two-factor auth, LDAP integration. All deferred.
Q: Boundary with other features?
User: Overlaps with user management on roles; we'll need to align.

## User Impact
Q: Who is affected?
User: All users. Plus admins who manage user accounts.
Q: Workflow change?
User: Before: manual login form. After: same form, but sessions persist longer (7 days).
Q: Edge cases?
User: Anonymous users skip auth. Power users might manage API tokens (future feature).

[etc...]

Agent: I've documented this in context.md. Ready to proceed to SPEC phase?
User: Yes, looks good.

Agent: Proceeding to SPEC phase. I'll write spec.md addressing all points from context.md.
```

---

## See Also

- `phase-spec.md` — SPEC phase; includes Discuss as Step 2b
- `scope-detection.md` — Scope scoring (determines whether Discuss is required)
- `spec-template.md` — Spec artifact template (spec.md)

# Scope Discipline

Scope discipline keeps features focused and deliverable.

## Scope Definition

**Scope** = What's IN and what's OUT of this feature.

## In Scope vs Out of Scope

### In Scope (MUST DO)
- Requirements explicitly listed in spec.md
- P1 and P2 priorities
- Changes required for acceptance criteria

### Out of Scope (DEFER)
- Related features that emerged during design
- "Nice to have" enhancements
- Refactoring of unrelated code
- "While we're here" tasks

## Scope Enforcement Rules

### Rule 1: Document Out of Scope

Every feature spec MUST have an "Out of Scope" section:

```markdown
## Out of Scope

- OAuth/SAML integration (future phase)
- Two-factor authentication (v1.2)
- Admin user management (separate feature)
- Performance optimization (post-MVP)
```

**Why**: Makes it explicit what we're NOT doing.

### Rule 2: Question Creep

When new requirements emerge during PLAN or BUILD:

1. **Pause and assess**: Is this in-scope?
2. **Check spec.md**: Does spec mention it?
3. **If not in spec**: It's out of scope
4. **Action**:
   - Record as "Open Item" in tasks.md
   - Suggest as future feature
   - Do NOT implement unless user approves scope expansion

Example dialogue:
```
User: "While implementing login, should we also add logout?"
Agent: "Logout is in spec.md (UAUTH-04), so it's in scope. 
        However, if you're thinking about session management 
        beyond logout, that might be future work. Should I add it?"
```

### Rule 3: Scope Expansion Requires Reset

If user wants to expand scope mid-way:

1. Stop execution
2. Return to SPEC or PLAN phase
3. Update spec.md or tasks.md with new requirements
4. Re-approve with user
5. Resume from beginning of affected phase

This ensures requirements are properly documented and traced.

### Rule 4: No Silent Scope Creep

Never implement features that:
- Were not in original spec
- Were explicitly marked "Out of Scope"
- Were not approved by user

If tempted:
- Flag to user: "This seems useful, but it's out of scope. Should we add it?"
- Wait for approval
- If approved → expand scope via SPEC/PLAN phases

## Scope Discipline Checklist

- [ ] spec.md has "Out of Scope" section
- [ ] All new requirements discussed before implementation
- [ ] User approves scope changes
- [ ] tasks.md matches spec.md requirements
- [ ] No "nice to have" features in tasks
- [ ] Open items clearly marked and deferred

## Priority Within Scope

Once scope is set, prioritize by:

1. **P1 (Must have)**: Blocks release
2. **P2 (Should have)**: Nice but not blocking
3. **P3 (Could have)**: Backlog for future

In PLAN phase, order tasks by:
- P1 items first
- P2 items second
- P3 items last (often deferred)

## When Scope is Unclear

If spec is vague:

1. **During SPEC phase**: Ask clarifying questions
2. **During PLAN**: Flag ambiguities as "TBD" in tasks.md
3. **During BUILD**: Contact user before implementing ambiguous requirements

Never guess scope — confirm with user.

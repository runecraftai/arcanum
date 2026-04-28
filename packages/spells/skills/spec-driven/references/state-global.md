# Global STATE.md — Rules & Schema

The `.specs/project/STATE.md` file maintains persistent, cross-cutting project knowledge. It differs from feature-level STATE (see `state-management.md` for distinction).

## Purpose

**Global STATE.md** documents project-wide context that persists across features:
- **Decisions**: architectural choices that affect multiple features or the entire system
- **Blockers**: external or structural impediments affecting project progress
- **Lessons**: learned wisdom across all features (patterns, anti-patterns, surprises)
- **Todos**: cross-feature action items or cleanup tasks
- **Deferred**: features or ideas intentionally deferred with scheduled review

---

## Schema: 5 Sections

### 1. Decisions

Numbered architectural decisions with rationale and status.

**Format**:
```markdown
### D-NNN: Title

- **Date**: YYYY-MM-DD
- **Status**: active | superseded
- **Rationale**: [1-2 sentences explaining the decision and why]
- **Impact**: [affected modules or features, if relevant]
```

**Examples**:
```markdown
### D-001: Use TypeScript with strict mode

- **Date**: 2026-04-01
- **Status**: active
- **Rationale**: Strict mode catches type-related bugs early; improves IDE assistance and refactoring confidence.
- **Impact**: All new code must be TypeScript. Existing JS must be migrated incrementally.

### D-002: Adopt Zod for API validation

- **Date**: 2026-04-15
- **Status**: active
- **Rationale**: Runtime validation at API boundaries ensures data safety; Zod integrates cleanly with TypeScript.
- **Impact**: All new API routes must define Zod schemas. Old routes can use ad-hoc validation.
```

**Rules**:
- Append new decisions to the end (assign next available number)
- Mark superseded decisions with status `superseded` — never delete, only deprecate
- Decisions are immutable once written (add new decision if direction changes)

---

### 2. Blockers

Active impediments to project progress, with ownership and status.

**Format**:
```markdown
### B-NNN: Title

- **Owner**: @username or team name
- **Created**: YYYY-MM-DD
- **Status**: open | in-progress | resolved
- **Description**: [what is blocking, why it matters]
- **Current Workaround**: [if applicable]
- **Depends On**: [external event, decision, or resolution]
```

**Examples**:
```markdown
### B-001: Stripe API rate limit on webhook retry

- **Owner**: @billing-team
- **Created**: 2026-04-10
- **Status**: open
- **Description**: Stripe webhooks are rate-limited; if we retry all failed webhooks, we hit the limit and lose visibility.
- **Current Workaround**: Manual retry queue; checks Stripe dashboard weekly.
- **Depends On**: Stripe support ticket for increased limits or async webhook processing architecture.

### B-002: Database migration tool missing

- **Owner**: @infra
- **Created**: 2026-04-05
- **Status**: in-progress
- **Description**: No migration tool for development database; manual SQL required for local setup.
- **Current Workaround**: Documented SQL scripts in `db/migrations/` — developers run manually.
- **Depends On**: Evaluation and adoption of a migration library (Flyway, Liquibase, etc.)
```

**Rules**:
- Mark resolved blockers as `resolved` (with a note on resolution date if desired); keep them in the file for historical reference
- Add workarounds to help team move forward while blocker is open
- Regularly review open blockers (at least monthly)

---

### 3. Lessons

Learned wisdom — patterns, anti-patterns, surprises, and recommendations.

**Format**:
```markdown
- [YYYY-MM-DD] **Title**: Short summary or principle; details if needed. _(from: feature-name)_
```

**Examples**:
```markdown
- [2026-04-20] **Validation at boundaries first**: Check input data at API boundaries, not in business logic. Saves debugging time and improves error messages for clients. _(from: user-api)_
- [2026-04-18] **Avoid optional config fields**: Optional config fields lead to code paths no one tests. Better to make them required or remove them. _(from: email-service)_
- [2026-04-15] **Session timeout edge case**: Sessions can timeout mid-request if service restarts. Add graceful degradation instead of hard fail. _(from: auth-jwt)_
- [2026-04-10] **Database connection pooling is critical**: Without pooling, 3+ concurrent features cause connection exhaustion. Learned hard. Always configure pool size. _(from: scalability-incident)_
```

**Rules**:
- Append new lessons to the end
- Lessons are immutable; never edit or delete
- Include feature origin for traceability

---

### 4. Todos

Cross-feature action items, cleanup tasks, or deferred micro-features.

**Format**:
```markdown
- [ ] [Priority: HIGH | MEDIUM | LOW] **Title** — short description. Owner: @username. (Added: YYYY-MM-DD)
```

**Examples**:
```markdown
- [ ] [Priority: HIGH] **Refactor email templates to Handlebars** — current string interpolation is unmaintainable. Owner: @content-team. (Added: 2026-04-15)
- [ ] [Priority: MEDIUM] **Add TypeScript to legacy routes** — gradual migration of 10 routes. Owner: @backend-team. (Added: 2026-04-10)
- [ ] [Priority: LOW] **Update CHANGELOG** — document recent API changes. Owner: @docs. (Added: 2026-04-18)
```

**Rules**:
- Mark completed todos with `[x]` (or move to a Completed subsection for archive)
- Assign owner and priority for accountability
- Review at least monthly; consider archiving completed items

---

### 5. Deferred

Features or ideas explicitly deferred with scheduled review date.

**Format**:
```markdown
- **Title** — short description. **Reason**: why deferred. **Review**: YYYY-MM-DD. _(Deferred: YYYY-MM-DD)_
```

**Examples**:
```markdown
- **Dark mode UI** — user request but not in current roadmap. **Reason**: design system needs finalization first. **Review**: 2026-07-01. _(Deferred: 2026-04-15)_
- **GraphQL API** — long-term alternative to REST. **Reason**: REST is sufficient; GraphQL adds complexity for current scale. **Review**: 2026-10-01 (post-launch). _(Deferred: 2026-04-10)_
- **Automated email compliance checks** — low priority; manual review works for now. **Reason**: small volume; GDPR compliance in place. **Review**: 2026-12-01. _(Deferred: 2026-04-08)_
```

**Rules**:
- Include a review date; update periodically
- Move to `## Todos` or `## Decisions` if reconsidered
- Archive old deferred items (>6 months past review date) to a separate Archived section if desired

---

## Global Rules

1. **Append-only structure** — new entries always appended to the end; never delete, only status-change
2. **Monthly review** — first Friday of each month, review all blockers and todos; prune completed/stale items
3. **Immutable decisions** — once written, never edit; create new decision if direction changes
4. **Cross-feature accountability** — each blocker and todo has an owner; periodically (weekly) check status
5. **Lessons are permanent** — never edit or delete; they form the project's institutional memory

---

## Distinction: Global vs. Feature STATE

| Aspect | Global STATE (`.specs/project/`) | Feature STATE (`.specs/features/<name>/`) |
|--------|----------------------------------|--------------------------------------------|
| **Scope** | Project-wide, cross-cutting | Single feature only |
| **Content** | Decisions, blockers, lessons, todos, deferred | Phase checkpoint, blockers specific to feature, open questions |
| **Lifetime** | Persists indefinitely | Created at SPEC start, archived (status: shipped) at SHIP |
| **Access** | Frequently consulted; updated continuously | Accessed during resume (when returning to feature) |
| **Duplication Rule** | Never duplicate info — if item affects only one feature, use feature STATE instead | Never duplicate global info — if item is cross-cutting, use global STATE |

---

## Template: First-Run Scaffold

When initializing a project via `/init`, create `.specs/project/STATE.md` with this template:

```markdown
---
title: Global STATE — Decisions, Blockers, and Context
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# PROJECT STATE

## Decisions

None yet. Architectural decisions will be recorded here.

## Blockers

None yet. Project-wide blockers will be recorded here.

## Lessons

None yet. Lessons learned across features will be recorded here.

## Todos

None yet. Cross-feature action items will be recorded here.

## Deferred

None yet. Deferred ideas will be recorded here.
```

---

## Integration with Knowledge Base

See `knowledge-base.md` for routing decisions to global STATE vs. session logs vs. feature STATE. The key principle: **global STATE is for information that affects or informs multiple features; feature STATE is for single-feature context**.

For project initialization flow, see `project-init.md`.

For feature-level STATE schema, see `state-management.md`.

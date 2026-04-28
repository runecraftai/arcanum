# CONCERNS.md — Tech Debt & Risk Documentation

A structured registry for tracking technical concerns: debt, security risks, performance bottlenecks, scalability issues, and operational risks. This document provides the detailed schema and guidance for `.specs/codebase/CONCERNS.md`.

---

## 5 Categories

### 1. Tech Debt

Code, architecture, or infrastructure that works but incurs "interest" over time. Examples:
- Deprecated library versions due for upgrade
- Legacy code paths that could be refactored
- Duplicate code or poor modularity
- Missing error handling in non-critical paths
- Inefficient database queries (but still acceptable performance)

**Severity**: low, medium, high (high if blocking new features or creating bugs)

---

### 2. Security Risks

Potential security vulnerabilities or weaknesses. Examples:
- Missing input validation on an endpoint
- Hardcoded secrets or weak secret management
- Outdated dependencies with known CVEs
- Missing authentication/authorization checks
- Insecure API exposure
- Insufficient encryption for sensitive data

**Severity**: high (always); likelihood determines priority

**Likelihood**: high, medium, low (how exploitable in current deployment context)

---

### 3. Performance Risks

Code or infrastructure that could degrade performance under load. Examples:
- Unbounded database queries (no pagination)
- Synchronous operations in critical path
- Missing caching or inefficient cache strategy
- Large dependency bundles
- Slow third-party API calls without timeout
- N+1 query problems

**Severity & Likelihood**: both assessed separately

---

### 4. Scalability Concerns

Architectural or operational limits that prevent scaling. Examples:
- Single-threaded processing bottleneck
- No connection pooling (will exhaust connections under load)
- No load balancing or horizontal scaling plan
- Data volume growth not addressed (e.g., no archival strategy)
- Memory-intensive operations
- No caching layer for high-traffic endpoints

**Severity & Likelihood**: both assessed

---

### 5. Operational Risks

Deployment, monitoring, or production readiness gaps. Examples:
- Missing health checks or monitoring
- No graceful degradation for failed integrations
- Insufficient logging for debugging production issues
- No rollback plan for deployments
- Missing alerting for critical services
- Database backup/restore untested
- No rate limiting on public APIs

**Severity & Likelihood**: both assessed

---

## Entry Format

```markdown
### C-NNN: Title

- **Category**: tech-debt | security-risk | performance-risk | scalability-concern | operational-risk
- **Severity**: high | medium | low
- **Likelihood**: high | medium | low (security & risk categories only; not for debt)
- **Impact**: [1-2 sentences describing what happens if this issue manifests]
- **Current Mitigation**: [what we're doing now to reduce the risk or cost]
- **Proposed Mitigation**: [how to fix or reduce the risk; may be deferred]
- **Status**: open | in-progress | resolved
- **Related Decision**: [link to `.specs/project/STATE.md` decision if applicable]
```

---

## Example Entries

### Example 1: Tech Debt

```markdown
### C-001: Legacy Express middleware pattern

- **Category**: tech-debt
- **Severity**: medium
- **Impact**: New developers take longer to understand request flow; middleware order is fragile and easy to break
- **Current Mitigation**: Documented middleware order in ARCHITECTURE.md; code comments explain each middleware
- **Proposed Mitigation**: Migrate to Express 5 or nest-js with dependency injection; estimated 3 days
- **Status**: open
- **Related Decision**: [if any]
```

### Example 2: Security Risk

```markdown
### C-002: API endpoints missing rate limiting

- **Category**: security-risk
- **Severity**: high
- **Likelihood**: high
- **Impact**: Brute-force attacks on auth endpoints possible; DoS vulnerability; API abuse
- **Current Mitigation**: Behind API gateway with basic rate limiting (100 req/min per IP); human monitoring of logs
- **Proposed Mitigation**: Add express-rate-limit middleware; set stricter limits on `/login` (10 req/min), `/forgot-password` (3 req/min)
- **Status**: in-progress
- **Related Decision**: D-004 (API security posture)
```

### Example 3: Performance Risk

```markdown
### C-003: User list endpoint loads all users without pagination

- **Category**: performance-risk
- **Severity**: high
- **Likelihood**: medium
- **Impact**: If user table grows to 10k+ rows, `/api/users` response time > 5s; frontend timeout; UX degradation
- **Current Mitigation**: Database index on created_at; query limits to 1k rows in code; admin UI shows warning at 5k users
- **Proposed Mitigation**: Implement cursor-based pagination; default limit 50 users per page; add tests for pagination correctness
- **Status**: open
- **Related Decision**: [if any]
```

### Example 4: Scalability Concern

```markdown
### C-004: Single Redis instance (no cluster)

- **Category**: scalability-concern
- **Severity**: high
- **Likelihood**: high (if user base grows 5x)
- **Impact**: Redis becomes bottleneck; session store can't scale; cache hits plateau at ~80%
- **Current Mitigation**: Currently <1000 concurrent users; monitoring Redis memory and hit rate weekly
- **Proposed Mitigation**: Plan Redis cluster upgrade (Redis Sentinel) for Q3 2026; estimate 2 days to implement
- **Status**: open
- **Related Decision**: D-005 (caching strategy)
```

### Example 5: Operational Risk

```markdown
### C-005: No database backup tested in production

- **Category**: operational-risk
- **Severity**: high
- **Likelihood**: medium
- **Impact**: If database corruption or accidental delete occurs, no verified recovery path; potential data loss
- **Current Mitigation**: AWS RDS automated daily backups; backup retention 7 days; documented restore procedure (untested)
- **Proposed Mitigation**: Test restore procedure quarterly; set calendar reminder; document time-to-restore; plan for zero-downtime restore with read replica
- **Status**: open
- **Related Decision**: [if any]
```

---

## Discovery Methods

How to identify concerns when mapping a codebase:

### 1. Code Review

- Look for `TODO`, `FIXME`, `HACK`, `XXX` comments
- Identify outdated patterns or deprecated libraries
- Check error handling completeness
- Flag manual processes or error-prone workflows

### 2. Dependency Audit

- Run `npm audit` or equivalent
- Identify deprecated packages or major version gaps
- Check for unmaintained dependencies
- Look for security CVEs

### 3. Load Testing

- Run spike tests or stress tests
- Identify query N+1 problems
- Measure endpoint response times
- Flag operations that don't scale

### 4. Security Scan

- OWASP dependency check
- Manual auth/authz review
- Input validation review
- Secrets scanning (no hardcoded keys)
- Review API exposure and rate limiting

### 5. Monitoring & Alerts Review

- Check logging coverage (are errors being logged?)
- Identify gaps in health checks
- Review alert thresholds
- Check for silent failures (operations that fail without notification)

### 6. Conversation with Stakeholders

- Ask team: "What keeps you up at night?"
- Ask ops: "What's fragile in production?"
- Ask sec: "What's the biggest risk vector?"
- Ask users/product: "What features need performance?"

---

## Prioritization Matrix

Combine **Severity** and **Likelihood** to determine priority:

| Severity | High Likelihood | Medium Likelihood | Low Likelihood |
|----------|-----------------|-------------------|----------------|
| **High** | 🔴 CRITICAL | 🔴 CRITICAL | 🟠 HIGH |
| **Medium** | 🟠 HIGH | 🟡 MEDIUM | 🟡 MEDIUM |
| **Low** | 🟡 MEDIUM | 🟢 LOW | 🟢 LOW |

**Action**:
- 🔴 **CRITICAL**: Fix immediately; block releases if unfixed. Target: 1-2 weeks.
- 🟠 **HIGH**: High priority; address in next 2-4 weeks. If security, fix sooner.
- 🟡 **MEDIUM**: Backlog; include in next feature cycle or quarterly planning.
- 🟢 **LOW**: Monitor; fix if convenient or during refactoring.

---

## Templates

### Template: CONCERNS.md Header

```markdown
# Concerns

This document tracks technical concerns identified during codebase mapping and development. See `concerns.md` in the skill references for detailed schema and examples.

## Summary

| Category | Count | CRITICAL | HIGH | MEDIUM | LOW |
|----------|-------|----------|------|--------|-----|
| Tech Debt | 3 | — | 1 | 1 | 1 |
| Security Risks | 2 | 1 | 1 | — | — |
| Performance Risks | 2 | — | 1 | 1 | — |
| Scalability Concerns | 1 | — | 1 | — | — |
| Operational Risks | 1 | — | — | 1 | — |
| **TOTAL** | **9** | **1** | **4** | **3** | **1** |

---

## CRITICAL Issues (Fix Immediately)

[List entries with CRITICAL priority here]

---

## HIGH Priority Issues

[List entries with HIGH priority here]

---

## MEDIUM & LOW (Backlog)

[List entries with MEDIUM/LOW priority]
```

### Template: Individual Entry

```markdown
### C-NNN: [Title]

- **Category**: [category]
- **Severity**: [high | medium | low]
- **Likelihood**: [high | medium | low] (for risks; omit for debt)
- **Impact**: [what happens if this manifests]
- **Current Mitigation**: [what we're doing now]
- **Proposed Mitigation**: [how to fix]
- **Status**: [open | in-progress | resolved]
- **Owner**: [@username] (optional; for active items)
- **Related Decision**: [link to `.specs/project/STATE.md` D-XXX if applicable]
```

---

## Review Cadence

- **Monthly**: Review all OPEN CRITICAL and HIGH items; update status
- **Quarterly**: Review all items; reprioritize based on business direction
- **Before each release**: Ensure no CRITICAL items are known and unfixed
- **When resolved**: Update status; document resolution approach for future reference

---

## Integration with `.specs/project/STATE.md`

- **Architectural decision for risk mitigation**: Add to `.specs/project/STATE.md` → `## Decisions`
- **Blocker preventing mitigation**: Add to `.specs/project/STATE.md` → `## Blockers`
- **Lesson learned from addressing a concern**: Add to `.specs/project/STATE.md` → `## Lessons`

---

## Example: Concern to Decision Flow

```
Concern discovered: C-045 "Missing async error handling"
  ↓
Assigned to @backend-team
  ↓
Proposed mitigation: Use express-async-errors or wrap all async handlers
  ↓
Decision made (D-099): "Adopt express-async-errors library"
  ↓
C-045 status updated to "in-progress"
  ↓
PR merged, tests added
  ↓
C-045 status updated to "resolved"
```

---

## See Also

- `brownfield-mapping.md` — template headers for CONCERNS.md
- `phase-map.md` — how to populate CONCERNS.md via Scout delegation
- `knowledge-base.md` — knowledge routing for concerns discovered during development

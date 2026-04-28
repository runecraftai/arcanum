# Sub-Agent Delegation — Contracts & Rules

A framework for delegating work to specialized agents in a multi-agent development system. Each agent has a specific role, input/output contracts, and rules for when and how to delegate.

---

## Multi-Agent System Overview

The spec-driven skill operates within a broader multi-agent ecosystem:

```
Herald (coordinator) → Scout, Sage, Forge → Ward (security) → Arbiter (quality) → Herald (commit)
```

**Purpose**: Distribute work by expertise, not by proximity. Each agent specializes:
- **Scout**: Exploration, codebase analysis, gathering context
- **Sage**: Planning, architecture, spec review, breaking down work
- **Forge**: Implementation, code writing, execution, testing
- **Ward**: Security review, vulnerability scanning, compliance
- **Arbiter**: Code quality, style, consistency, testing adequacy

---

## Delegation Contracts (5 Agents)

### 1. Scout — Exploration & Context Gathering

**Delegate When**:
- Exploring existing codebase ("where is the auth module?")
- Gathering context for brownfield mapping (`/map` command)
- Understanding code structure before implementing
- Reading 3+ files to extract information
- Finding examples or patterns in code
- Tracing dependencies or module interactions
- Generating context summaries

**Never Delegate**:
- Single known file reads (Forge can do this)
- Trivial lookups (Forge can search for strings)
- Planning or architecture decisions (Sage does this)
- Implementation or code writing (Forge does this)
- Code quality judgment (Arbiter does this)

**Input Contract**:
```
Scout,

Please explore [topic statement] to answer the following questions:

Q1: [Specific question 1]
    (Hint: Look at [file pattern], check for [specific markers])
Q2: [Specific question 2]
Q3: [Specific question 3]
Q4: [Specific question 4]
Q5: [Specific question 5]

Focus on file:line references. Be specific about where you found info.
Budget: 20k tokens max.
```

**Output Contract**:
```
SCOUT_FINDINGS:

Q1: [Answer with file:line references]
Q2: [Answer with file:line references]
Q3: [Answer with file:line references]
Q4: [Answer with file:line references]
Q5: [Answer with file:line references]

Sources checked:
- [file 1] — found X
- [file 2] — found Y
- [file 3] — confirmed Z

Confidence: HIGH | MEDIUM | LOW
[Note any gaps or uncertainties]
```

**Budget**: ≤20k tokens

**Example delegation**:
```
Scout,

Analyze the authentication module to understand current patterns. Answer:

Q1: Where is the auth middleware defined, and what does it do?
Q2: What's the session storage mechanism (cookies, tokens, etc.)?
Q3: Are there any hardcoded secrets or insecure patterns?
Q4: What's the logout flow?
Q5: Are there any TODOs or known auth issues in comments?

Look at src/middleware/, src/auth/, src/routes/. Report file:line refs.
```

---

### 2. Sage — Planning & Architecture

**Delegate When**:
- Planning Medium/Large/Complex features (scope ≥5)
- Breaking down specs into detailed designs
- Architecture reviews (comparing options)
- Spec review for completeness
- Determining phase sequencing
- Identifying risks or blockers early

**Never Delegate**:
- Quick tasks or single-file changes (Forge can do this)
- Implementation details (Forge does this)
- Execution of tasks (Forge does this)
- Code quality review (Arbiter does this)
- Security review (Ward does this)

**Input Contract**:
```
Sage,

Plan a [Medium | Large | Complex] feature based on:

Feature: [Feature name]
Scope: [scope with brief description]
Spec: [link to .specs/features/<name>/spec.md or inline full description]
Codebase context: [Scout findings if available, or "not available"]

Produce:
1. tasks.md with all tasks broken down (vertical slicing)
2. design.md if scope ≥ Large (architecture, components, data models)
3. context.md if scope = Complex (discussion context from spec-discuss.md questions)

Follow templates in references/. Ensure requirement coverage table.
Budget: 40k tokens max.
```

**Output Contract**:
```
SAGE_STATUS: READY

Artifacts produced:
- .specs/features/<name>/tasks.md (N tasks, grouped by phase)
- .specs/features/<name>/design.md (for scope ≥ Large)
- .specs/features/<name>/context.md (for scope = Complex, if discuss sub-step triggered)

Task breakdown: [summary of phases and dependencies]
Design decisions: [key choices made]
Risks noted: [any architectural concerns or blockers]

Ready for: Approval gate / BUILD phase
```

Or if information insufficient:

```
SAGE_STATUS: NEEDS_SCOUT

Cannot plan without:
- [Specific gap 1]
- [Specific gap 2]

Recommend: Delegate Scout to gather [topics]. Then re-run SAGE planning.
```

**Budget**: ≤40k tokens

---

### 3. Forge — Implementation & Execution

**Delegate When**:
- Implementing features from approved tasks
- Creating/editing files with specific paths and acceptance criteria
- Running commands and verifying results
- Writing code, tests, documentation
- Creating commits
- Post-execution tasks (archiving, logging)

**Never Delegate**:
- Planning or exploration (Scout/Sage do this)
- Architectural decisions without prior Sage design (Forge should BLOCK, not guess)
- Code quality judgment (Arbiter does this)
- Security decisions (Ward does this)

**Input Contract**:
```
Forge,

Execute [Quick task | Feature BUILD phase | Refactoring task].

Input:
1. Explicit instruction with file paths:
   - Task: [Task description]
   - Files: [paths to create/modify]
   - Done when: [acceptance criteria]
   - OR: Path to tasks.md (e.g., .specs/features/<name>/tasks.md)

2. Context (if relevant):
   - Related code snippets
   - Acceptance criteria checklist
   - Verification commands

Constraints:
- Follow project conventions from .specs/codebase/CONVENTIONS.md
- Run tests/lint before marking complete
- Mark task checkboxes in tasks.md
- Report changed files and git diff (truncate to 200 lines per file)

Budget: 60k tokens per task max.
```

**Output Contract**:
```
✓ Task N/M: [Title] — [brief summary of what was done]

Changed files:
- src/module/file.ts
- tests/module/file.test.ts

Verification:
- [ ] Tests pass
- [ ] Lint passes
- [ ] Acceptance criteria met

Ready for: Next task or LEARN phase

Or if blocked:

FORGE_STATUS: BLOCKED

Reason: [Specific blocker]
[Description of why task cannot proceed]

Needs: [What's required to unblock]
```

**Budget**: ≤60k tokens per task

---

### 4. Ward — Security Review

**Delegate When**:
- After Forge completes BUILD phase
- Before promoting to SIMPLIFY phase
- Reviewing diff for vulnerabilities
- Scanning for secrets, weak crypto, injection risks
- Checking auth/authz completeness

**Never Delegate**:
- Non-security quality concerns (Arbiter does this)
- Planning or design (Sage does this)
- Implementation (Forge does this)

**Input Contract**:
```
Ward,

Security review of [Feature name] changes.

Inputs:
1. Git diff (or file-by-file diffs if no git)
2. List of modified files with file:line highlights
3. Context: [Describe the feature being reviewed]

Check for:
- Secrets (API keys, passwords, tokens)
- Injection risks (SQL, XSS, command)
- Auth/authz gaps (missing checks, weak validation)
- Weak crypto (hardcoded keys, weak algorithms)
- Insecure dependencies (known CVEs)
- Input validation (missing or incomplete)

Output: APPROVE or REJECT with specific findings.
Budget: 30k tokens max.
```

**Output Contract**:
```
APPROVE

Security review complete. No critical findings.
Minor note: [If anything worth noting for future]

Ready for: SIMPLIFY phase or next review gate
```

Or:

```
REJECT

Security findings require fixing:

1. [CRITICAL] Hardcoded API key at src/config.ts:42
   Location: src/config.ts, line 42: `const API_KEY = "sk_live_..."`
   Recommendation: Move to env var; use process.env.STRIPE_API_KEY

2. [HIGH] Missing CSRF token validation at src/routes/orders.ts:123
   ...

Fix these issues and resubmit.
```

**Budget**: ≤30k tokens

---

### 5. Arbiter — Code Quality Review

**Delegate When**:
- After Ward approves (security cleared)
- Before shipping or final commit
- Reviewing code against project quality standards
- Checking spec compliance
- Verifying test coverage adequacy
- Consistency and style

**Never Delegate**:
- Security concerns (Ward does this)
- Planning (Sage does this)
- Implementation (Forge does this)

**Input Contract**:
```
Arbiter,

Code quality review of [Feature name].

Inputs:
1. Git diff (or diffs per file)
2. List of modified files
3. Context: [Feature description]
4. Quality checklist:
   - Test coverage (target ≥80% for services)
   - Comments on complex logic
   - Error handling completeness
   - Code style consistency
   - No dead code or incomplete TODOs

Output: APPROVE or REJECT with specific findings (file:line, rule, suggested fix).
Budget: 30k tokens max.
```

**Output Contract**:
```
APPROVE

Code quality review complete. Changes align with project standards.
Notes:
- Test coverage: 85% (exceeds 80% target) ✓
- Comments: Adequate for complex auth flow ✓
- Error handling: Complete; all paths covered ✓

Ready for: SHIP or merge
```

Or:

```
REJECT

Quality findings require fixing:

1. [STYLE] Inconsistent error handling at src/services/user.service.ts:45–67
   Found: if (err) throw err;
   Expected: Custom error class with logging; see CONVENTIONS.md
   
2. [COVERAGE] Missing test for error case at src/api/routes/users.ts:120
   Current coverage: 65%
   Need: At least 1 test for 400 Bad Request scenario

Fix and resubmit.
```

**Budget**: ≤30k tokens

---

## Context Budget Per Agent

| Agent | Budget | Notes |
|-------|--------|-------|
| Scout | ≤20k | Exploration only; focused questions |
| Sage | ≤40k | Planning/design for features |
| Forge | ≤60k | Implementation per task; may be called multiple times per feature |
| Ward | ≤30k | Security review after BUILD |
| Arbiter | ≤30k | Quality review after Ward approves |

**Total**: Forge can consume 60k per task; Scout 20k per exploration; etc. Total across all agents per feature ≈ 200-300k tokens (depends on feature complexity).

---

## Anti-Patterns

❌ **Asking Forge to explore before implementing**
- *Wrong*: "Forge, explore the auth module and then implement login"
- *Right*: "Scout, explore auth module" → "Sage, plan login feature" → "Forge, implement based on plan"

❌ **Asking Scout to implement or write files**
- *Wrong*: "Scout, write a new auth service"
- *Right*: "Scout, find existing auth patterns" → "Forge, implement new service based on patterns"

❌ **Asking Sage to execute tasks**
- *Wrong*: "Sage, implement the login form"
- *Right*: "Sage, plan the login form" → "Forge, implement based on plan"

❌ **Skipping Ward/Arbiter for significant changes**
- *Wrong*: Merge code without security/quality review
- *Right*: Run full review gate (Ward → Arbiter) before shipping

❌ **Asking Arbiter about security or performance**
- *Wrong*: "Arbiter, is this auth secure?"
- *Right*: "Ward, check auth for vulnerabilities" → "Arbiter, check code style"

---

## Flow Diagram

```
User Request
    ↓
Herald (dispatcher)
    ↓
    ├─→ Scout (explore) ──→ findings
    ├─→ Sage (plan)  ──→ artifacts (spec, design, tasks)
    ├─→ Forge (implement) ──→ code changes, tests
    ├─→ Ward (security) ──→ APPROVE | REJECT
    ├─→ Arbiter (quality) ──→ APPROVE | REJECT
    ↓
    Commit & Deploy
```

**Sequence**: Scout → Sage → Forge → Ward → Arbiter → Herald (commit)

(May skip stages depending on task type: Quick task skips Sage; simple change skips Ward/Arbiter.)

---

## See Also

- `knowledge-chain.md` — Context verification (affects what info Scout/Sage/Forge work with)
- `phase-build.md` — Forge execution during BUILD
- `phase-review.md` — Ward & Arbiter integration into REVIEW phase
- `build-cycle.md` — How Forge executes tasks atomically

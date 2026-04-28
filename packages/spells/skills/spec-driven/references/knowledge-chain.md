# Knowledge Chain — 5-Step Context Verification

A verification process to ensure loaded context is accurate, fresh, complete, and trustworthy before proceeding with planning or execution.

---

## Why Verification Matters

**Problem**: Agent systems can hallucinate facts, fabricate APIs, misread configuration files, or act on stale information.

**Risk**: Building features based on false assumptions leads to:
- Implementation that doesn't match actual codebase
- Broken integrations with APIs that don't exist or have changed
- Specifications that contradict prior decisions
- Time wasted on incorrect approaches

**Solution**: Verification before proceeding catches gaps and conflicts early.

---

## 5-Step Verification Process

### 1. Source Verify

**Purpose**: Determine whether loaded context is from trusted sources (primary sources like `.specs/` files) or inferred/assumed (agent memory, hallucinations).

**Method**:
- Trace origin of each context item
- **Trusted sources** (~100% confidence): `.specs/` files, committed code, git history
- **Semi-trusted** (~80% confidence): Code comments, commit messages, documentation strings
- **Untrusted** (~0% confidence): Agent inference, guesses, fabricated details

**Scoring**:
- Count trusted items vs. untrusted items
- Calculate: `(trusted_count / total_count) * 100 = trust_percentage`

**Result**:
- \>80% trusted → PASS (Source Verify)
- 50-80% trusted → WARN (Mixed sources; some inference)
- <50% trusted → FAIL (Mostly inference/untrusted)

**Example**:
```
Loaded context:
1. "Project uses TypeScript 5.2" — from .specs/codebase/STACK.md ✅ Trusted
2. "Uses Zod for validation" — from code imports in src/api/ ✅ Trusted
3. "Database connection pool size is 20" — from code comment ⚠️  Semi-trusted
4. "API rate limit is 1000 req/min" — agent inference (not found in docs) ❌ Untrusted

Trust score: 2 trusted + 1 semi + 1 untrusted = 4 items
Confidence: 2/4 = 50% → WARN (borderline)
```

---

### 2. Freshness Check

**Purpose**: Ensure loaded context reflects current project state.

**Method**:
- Check file modification date for each loaded document
- Compare to current date
- Categorize by recency:
  - **Fresh**: Updated this session or <1 day ago
  - **Acceptable**: Updated <7 days ago
  - **Stale**: Updated >7 days ago
  - **Very stale**: Updated >30 days ago

**Scoring**:
- Fresh files: 0 points (no flag)
- Acceptable files: 0 points (note for reference)
- Stale files: 1 point each (flag for re-verification on critical files like ARCHITECTURE.md, STATE.md)
- Very stale files: 2 points each (likely incorrect; recommend refresh)

**Critical files** (re-verify if stale):
- `.specs/project/STATE.md` — decisions and blockers change frequently
- `.specs/codebase/STACK.md` — dependencies may have been upgraded
- `.specs/codebase/ARCHITECTURE.md` — design changes affect planning
- `.specs/features/<name>/spec.md` — when resuming mid-feature

**Non-critical files** (warn only if stale):
- `.specs/codebase/CONVENTIONS.md` — naming patterns are stable
- `.specs/codebase/STRUCTURE.md` — directory layout is stable
- `.specs/sessions/*.md` — historical reference

**Result**:
- No stale files → PASS (Freshness Check)
- Non-critical files stale → WARN (note as reference only)
- Critical files stale → FLAG (recommend re-running `/map` or checking latest STATE)

**Example**:
```
Freshness check:
- .specs/project/PROJECT.md (modified: 2026-04-28, today) → Fresh ✅
- .specs/codebase/STACK.md (modified: 2026-04-20, 8 days ago) → Stale (non-critical)
- .specs/project/STATE.md (modified: 2026-04-10, 18 days ago) → Very Stale (CRITICAL) ⚠️

Action: Warn user that STATE.md is outdated; ask if they want to review it before proceeding.
```

---

### 3. Conflict Detect

**Purpose**: Identify contradictions within loaded context that could derail execution.

**Method**:
- Cross-reference loaded items against each other
- Check for contradictory statements:
  - **Version mismatches**: "Uses Node 18" vs. "Requires Node 16+"
  - **Contradictory conventions**: "Use camelCase" vs. "Use snake_case"
  - **Duplicate definitions with different values**: Two specs for the same feature with conflicting requirements
  - **Decision reversal**: STATE.md says "Use REST API" but recent code uses GraphQL
  - **Capability conflicts**: STACK says "No database" but STRUCTURE shows `db/` directory

**Scoring**:
- 0 conflicts → PASS (Conflict Detect)
- 1-2 conflicts → WARN (Note and flag as ambiguous)
- 3+ conflicts → FAIL (Unresolved conflicts → LOW confidence)

**Example**:
```
Conflict detection:
1. spec.md says "Integrate with Stripe" but INTEGRATIONS.md doesn't list Stripe ⚠️ Conflict
2. CONVENTIONS.md says "Files named <resource>.ts" but code uses <resource>.model.ts ⚠️ Conflict
3. .specs/features/billing/design.md references "Webhook integration" but CONCERNS.md lists "No webhook rate limiting" as a risk

Conflicts: 2 (non-critical) → WARN
```

---

### 4. Gaps Scan

**Purpose**: Identify missing information that could impede execution.

**Method**:
- Check for referenced files that don't exist:
  - Task references `.specs/codebase/ARCHITECTURE.md` but it's not written yet
  - INTEGRATIONS.md references an API but no auth details provided
  - Feature STATE.md references a design doc that doesn't exist

- Check for expected sections that are empty:
  - `.specs/project/STATE.md` has empty `## Decisions` (no architectural choices documented)
  - Feature spec.md has empty `## Acceptance Criteria`
  - TESTING.md missing test framework information

**Scoring**:
- **Critical gaps** (2 points each): Missing spec.md when resuming; missing STATE.md; missing ARCHITECTURE during BUILD
- **Non-critical gaps** (1 point each): Empty ROADMAP; missing CONVENTIONS; empty open questions
- 0 gaps → PASS (Gaps Scan)
- Non-critical gaps only (1-2 points) → WARN
- Critical gaps (2+ points) → FLAG (may require exploration before proceeding)

**Example**:
```
Gap scan:
1. Feature resume requested, but .specs/features/<name>/spec.md missing ❌ CRITICAL GAP
2. ARCHITECTURE.md references "Payment module" but no details on auth method ⚠️ Non-critical gap
3. Task mentions "check .specs/codebase/CONCERNS.md" but file doesn't exist ❌ CRITICAL GAP (referenced but missing)

Critical gaps: 2 → FLAG
```

---

### 5. Confidence Score (Aggregate)

**Purpose**: Synthesize all 4 checks into a final confidence rating.

**Calculation**:
| Check | Status | Points |
|-------|--------|--------|
| Source Verify | >80% trusted | 0 |
| | 50-80% mixed | 1 |
| | <50% untrusted | 2 |
| Freshness Check | All fresh | 0 |
| | Some stale (non-critical) | 0 |
| | Critical files stale | 1 |
| Conflict Detect | No conflicts | 0 |
| | 1-2 conflicts | 1 |
| | 3+ conflicts | 2 |
| Gaps Scan | No gaps | 0 |
| | 1-2 non-critical | 0 |
| | Critical gaps | 2 |

**Confidence Level**:
- **Total = 0 points**: HIGH confidence. All checks passed.
- **Total = 1 point**: MEDIUM confidence. Minor issues (one stale non-critical file or one minor conflict).
- **Total ≥ 2 points**: LOW confidence. Multiple issues or critical gaps exist.

---

## Decision Table

| Confidence | Action | Next Step |
|------------|--------|-----------|
| **HIGH** | Proceed with phase | Load phase handler (SPEC/PLAN/BUILD/TEST/REVIEW) |
| **MEDIUM** | Proceed with caution | Load phase handler; emit warning about gaps; flag uncertain items in output |
| **LOW** | PAUSE | Inform user of specific gaps/conflicts. Ask: "Should I delegate Scout for targeted exploration?" Do not proceed to phase. |

---

## Integration with Broader Workflow

**Invoked by**: LOAD phase (after loading all context files)

**Timing**: Run knowledge chain verification as final step before phase dispatch.

**Output**: Include confidence score + summary in Context Summary output to user.

**Example output**:
```
## Context Summary

Project: My SaaS Platform
Knowledge chain confidence: MEDIUM ⚠️
  - Warning: .specs/project/STATE.md is 18 days old (critical file); recommend review
  - Gap: .specs/codebase/CONCERNS.md referenced but not generated yet (run /map to create)

Proceeding to SPEC phase with caution. Flag gaps in output.
```

---

## When to Request Scout Exploration

If knowledge chain returns **LOW confidence**, ask Herald to delegate Scout for targeted exploration:

```
Knowledge chain returned LOW confidence. Gaps detected:
1. [CRITICAL] spec.md references "user authentication" but no auth module found in codebase
2. [CRITICAL] STACK.md missing; run /map to generate codebase docs

Recommend: Run /map to generate codebase documentation before starting this feature.
```

User can then:
- Run `/map` to generate missing codebase docs
- Ask Scout specific questions: "Where is the auth module in the codebase?"
- Refresh context and re-verify

Then resume phase after gaps are filled.

---

## See Also

- `context-loading.md` — What to load and how (before verification)
- `knowledge-base.md` — Where knowledge lives (.specs/ structure)
- `sub-agent-delegation.md` — When to delegate Scout for exploration

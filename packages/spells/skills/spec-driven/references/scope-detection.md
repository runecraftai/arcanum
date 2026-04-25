# Scope Detection

When the user invokes `/spec`, the agent scores the complexity of the request using this matrix.

## Scoring Matrix

| Signal | Weight | Score 1 | Score 2 | Score 3 |
|--------|--------|---------|---------|---------|
| Files touched | ×2 | 1–3 files | 4–10 files | 10+ files |
| New concepts introduced | ×2 | 0 | 1–2 new | 3+ new |
| Ambiguity / unknowns | ×1 | None | Some gray areas | Significant unknowns |
| Integration points | ×1 | 0–1 | 2–3 | 4+ |
| Risk / novelty | ×1 | None | Low | Medium–High |

**Total score** = Σ (signal_score × weight)

## Thresholds

| Score | Scope | Artifacts |
|-------|-------|-----------|
| ≤ 4 | **Quick** | TASK.md only |
| 5–9 | **Medium** | spec.md + tasks.md |
| ≥ 10 | **Large** | spec.md + design.md + tasks.md |

## Presenting to the User

After scoring, the agent should:

1. State the score and how it was calculated
2. Recommend the scope
3. Ask the user to confirm or override

Example:
> "Based on your description, I'm scoring this as: files=2 (×2=4), concepts=1 (×2=2), ambiguity=0, integrations=1, risk=0 → Total: 7 → **Medium scope**. Does this look right, or would you like to adjust?"

## Manual Override

The user can specify scope explicitly:
- `/spec quick <description>` → force Quick
- `/spec medium <description>` → force Medium
- `/spec large <description>` → force Large

## Examples

### Quick (score 3)
"Fix the null pointer in UserService.getById"
- Files: 1 file (score 1 ×2 = 2)
- Concepts: 0 (score 0 ×2 = 0)
- Ambiguity: none (0)
- Integrations: 0 (0)
- Risk: none (0)
- **Total: 2 → Quick**

### Medium (score 7)
"Add email notifications when orders ship"
- Files: ~5 files (score 2 ×2 = 4)
- Concepts: 1 new (email service) (score 1 ×2 = 2)
- Ambiguity: some (1)
- Integrations: 1 (0)
- Risk: low (1)
- **Total: 8 → Medium**

### Large (score 11)
"Implement JWT authentication with role-based access"
- Files: 10+ files (score 3 ×2 = 6)
- Concepts: 3+ new (JWT, RBAC, middleware) (score 3 ×2 = 6) — wait, max is already 6 here
- Ambiguity: some (1)
- Integrations: 2 (1)
- Risk: medium (1)
- **Total: 15 → Large**

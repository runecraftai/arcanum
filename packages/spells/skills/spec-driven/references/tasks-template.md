<!-- Template: .specs/features/<name>/tasks.md — Medium/Large scope artifact. Replace all {{placeholders}}. -->
---
feature: {{feature-name}}
date: {{YYYY-MM-DD}}
status: pending
---

# Tasks: {{feature-name}}

**Spec**: `.specs/features/{{feature-name}}/spec.md`

## Execution Plan

Tasks execute sequentially in document order. Each task must pass its acceptance criteria before the next begins.

```
T1 → T2 → T3 → T4 → T5
```

## Task Breakdown

### T1: {{Task Title}}

**What**: {{Description of the change}}
**Where**: `{{path/to/primary/file}}`
**Depends on**: None
**Requirement**: {{FEAT}}-01

**Done when**:
- [ ] {{Verifiable criterion}}
- [ ] {{Verifiable criterion}}

---

### T2: {{Task Title}}

**What**: {{Description of the change}}
**Where**: `{{path/to/primary/file}}`
**Depends on**: T1
**Requirement**: {{FEAT}}-02

**Done when**:
- [ ] {{Verifiable criterion}}
- [ ] {{Verifiable criterion}}

---

## Granularity Check

Each task should be completable in under 30 minutes. If a task would take longer, split it.

| Task | Estimated Time | Split? |
|------|---------------|--------|
| T1 | {{estimate}} | No |

## Requirement Coverage

| Requirement | Task(s) | Status |
|-------------|---------|--------|
| {{FEAT}}-01 | T1 | Pending |

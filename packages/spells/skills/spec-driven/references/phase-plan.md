# Phase: PLAN

## When

After SPEC is approved, when user triggers: `/plan`, `plan this`, `break into tasks`, `design the approach`, `vamos planejar`, `quebra em tarefas`

## Goal

Break the specification into atomic, verifiable, sequentially ordered tasks that can be executed independently while respecting dependencies. Produce a comprehensive task breakdown that guides implementation.

## Auto-Skip Rules

The PLAN phase depth depends on scope:

| Scope | Score | PLAN Action | Artifacts |
|-------|-------|-------------|-----------|
| Quick | 1-3 | **Skip entirely** — tasks implicit in BUILD | None |
| Medium | 4-6 | **Inline plan** — write plan as section in spec.md | spec.md section only |
| Large | 7-11 | **Formal plan** — produce design.md | design.md |
| Complex | ≥12 | **Formal plan + Discuss** — context.md required before planning | context.md + design.md |

**Safety valve**: If during planning the knowledge chain returns MEDIUM or LOW confidence, pause and request Scout exploration before continuing. Do not plan from uncertain context.

**Pre-condition**: Run knowledge chain verification (→ see `knowledge-chain.md`). If confidence = LOW, pause and request Scout exploration before proceeding.

## Steps

### Step 1: Read Specification

1. Load the approved spec artifact (TASK.md or spec.md)
2. Identify all requirement IDs (e.g., UAUTH-01, UAUTH-02)
3. Extract acceptance criteria for each requirement
4. Note any explicit ordering constraints mentioned by user

### Step 2: Design Task Structure

Apply **Vertical Slicing** (see `vertical-slicing.md`):

1. Break feature into thin end-to-end slices
2. Each slice delivers measurable value
3. Order by dependency and priority
4. Make dependencies explicit

Group tasks into **logical phases**:
- **Setup**: Infrastructure, scaffolding, dependencies
- **Core**: Primary feature implementation
- **Integration**: Cross-component wiring
- **Verification**: Testing, validation
- **Polish**: Docs, examples, cleanup

### Step 3: Create Task Breakdown

Produce `.specs/features/<name>/tasks.md` using template `tasks-template.md`:

**Header**:
```markdown
---
feature: user-auth-service
status: draft
scope: Medium
created: 2026-04-24
total_tasks: 12
completed_count: 0
---

# Tasks: user-auth-service
```

**For each task**:

```markdown
- [ ] Task N: [Title]
  - What: [1 sentence of what to implement]
  - Where: [file path(s) to modify/create]
  - Depends on: [Task numbers, or "none"]
  - Done when: [3-5 acceptance criteria with WHEN/THEN]
  - Verification: [how to verify each criterion]
  - Size: S | M | L
  - Req: [REQUIREMENT-ID(s)]
```

**Granularity rule**: Each task should be completable in under 30 minutes.

If a task would take longer, split into subtasks.

### Step 4: Verify Traceability

Create a **Requirement Coverage** table at the end:

```markdown
## Requirement Coverage

| ID | Tasks |
|----|-------|
| UAUTH-01 | 2, 3, 4 |
| UAUTH-02 | 5, 6, 7 |
| UAUTH-03 | 8, 9 |
| UAUTH-04 | 10 |
| UAUTH-05 | 11, 12 |
```

**Rule**: Every requirement ID in spec must appear in at least one task.

### Step 5: Design Decision Documentation (for Large scope)

If scope is Large, create `.specs/features/<name>/design.md` using template `design-template.md`:

1. Check existing codebase for reusable components (search by domain)
2. If `codenavi` skill available, use it for deeper navigation
3. Apply **Knowledge Verification Chain**:
    - First: existing codebase (`src/`, `lib/`, `packages/`)
    - Second: project docs (`.specs/project/`, `.specs/codebase/`)
    - Third: `context7` if available (external library docs)
    - Fourth: general knowledge
    - Flag anything uncertain

4. Fill design.md sections:
   - **Architecture Overview**: How components fit together
   - **Code Reuse Analysis**: What exists, what's new
   - **Components**: New classes, modules, functions
   - **Data Models**: Schemas, interfaces
   - **Error Handling**: Failure modes and recovery
   - **Tech Decisions**: Why these choices?

5. If `mermaid-studio` available, suggest diagram creation

### Step 6: Approval Gate

Present tasks.md (and design.md if Large) to user:

> "Does this task breakdown look correct? (approve / adjust)"

Wait for user approval before proceeding.

**Idempotency**: If tasks.md exists with `status: approved` → skip to BUILD.

## Supporting References

- `vertical-slicing.md` — Slicing patterns and examples
- `tasks-template.md` — Full tasks artifact template
- `design-template.md` — Design artifact template
- `build-cycle.md` — How tasks will be executed (preview)

## Approval Gate

- [ ] User approves task breakdown
- [ ] Every requirement ID covered
- [ ] Dependencies are explicit
- [ ] Design approved (if Large scope)

## Completion Criteria

✓ PLAN phase is complete when:
1. tasks.md exists with all tasks listed
2. Requirement Coverage table is complete
3. User explicitly approved task breakdown
4. design.md exists and approved (if Large)
5. Status updated to `approved`

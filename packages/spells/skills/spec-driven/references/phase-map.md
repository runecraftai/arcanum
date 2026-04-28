# Phase: MAP — Brownfield Mapping

Map an existing codebase to create comprehensive `.specs/codebase/` documentation. This phase is triggered explicitly and generates all or part of the 7 standard codebase docs.

---

## When to Run

**Triggers** (user input):
- `/map` — generate all 7 docs
- `map codebase` — same as `/map`
- `mapear código` (Portuguese) — same as `/map`
- `analisar projeto existente` (Portuguese) — same as `/map`
- `/map stack` — generate only STACK.md
- `/map architecture` — generate only ARCHITECTURE.md
- `/map conventions` — generate only CONVENTIONS.md
- etc. for other individual docs

---

## Goal

Transform existing codebase into documented structure by generating 7 files in `.specs/codebase/`:

1. STACK.md
2. ARCHITECTURE.md
3. CONVENTIONS.md
4. STRUCTURE.md
5. TESTING.md
6. INTEGRATIONS.md
7. CONCERNS.md

Each doc follows the template and Scout delegation pattern in `brownfield-mapping.md`.

---

## Steps

### Step 1: Pre-Flight Check

1. Check if `.specs/codebase/` directory exists
2. If not, create it: `mkdir -p .specs/codebase/`
3. Note which docs already exist (skip regenerating them unless user specifies `--force`)

### Step 2: Determine Scope

- Full map: `/map` or `map codebase` → generate all 7 docs
- Selective map: `/map stack` or `/map architecture` → generate only specified doc(s)
- Default: if no scope specified, generate all 7

### Step 3: Delegate to Scout

For each doc to be generated, delegate to Scout with:
- **Input**: the doc type (STACK, ARCHITECTURE, etc.), the template section headers from `brownfield-mapping.md`, and the specific Scout delegation questions for that doc type
- **Task**: explore codebase and answer the questions with specific file:line references where applicable
- **Output**: structured findings for each question

**Delegation contract**: See `sub-agent-delegation.md` for Scout input/output schema.

### Step 4: Process Findings Through Templates

For each doc type:
1. Receive Scout findings
2. Populate the corresponding template from `brownfield-mapping.md` with Scout answers
3. Preserve file:line references and examples
4. Ensure all section headers from the template are present

### Step 5: Approval Gate

Before writing each doc to `.specs/codebase/<DOC>.md`:
1. Present the populated doc to the user for review
2. User can:
   - **Approve**: doc is written as-is
   - **Adjust**: user provides corrections or additions; rewrite and re-present
   - **Skip**: skip this doc for now; come back later
3. Emit approval request with clear boundaries of what was discovered

### Step 6: Write Docs

For each approved doc, write to `.specs/codebase/<DOC>.md`.

### Step 7: Update `.specs/project/STATE.md`

After all docs are written, update `.specs/project/STATE.md`:
1. Add a **Lessons** entry noting the codebase was mapped on this date
2. Example: `[2026-04-28] Codebase mapped; see `.specs/codebase/` docs for STACK, ARCHITECTURE, CONVENTIONS, etc. _(from: /map)_`
3. If any cross-cutting concerns or architectural decisions emerge from mapping, add entries to `## Decisions` or `## Blockers` as appropriate

---

## Selective Mapping

If user specifies `/map stack`, only execute the STACK.md generation path:

1. Delegate to Scout for STACK doc type only (question set from `brownfield-mapping.md`)
2. Populate STACK template from Scout findings
3. Present for approval
4. Write `.specs/codebase/STACK.md`
5. Update `.specs/project/STATE.md` with lesson entry

Same pattern applies for each individual doc.

---

## Safety Valve

If Scout findings are incomplete or contradictory:
1. Flag the specific gaps to the user
2. Ask user: "Proceed with partial STACK.md?" or "Need me to ask Scout follow-up questions?"
3. Do not write doc with critical gaps (e.g., missing primary language/framework info)

---

## Completion Criteria

`.specs/codebase/` must contain, at minimum:
- ✅ STACK.md (languages, frameworks, build tools)
- ✅ ARCHITECTURE.md (module boundaries, data flow, entry points)

All other docs (CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS, CONCERNS) are optional for first pass. User can run `/map conventions` later to fill gaps.

---

## Integration with Broader Workflow

- **Project Init**: `/init` creates `.specs/project/` (PROJECT.md, ROADMAP.md, STATE.md). User typically runs `/map` next.
- **Feature Start**: `SPEC` phase may load `.specs/codebase/` docs for context (on-demand, budget-aware). See `context-loading.md`.
- **Knowledge Maintenance**: Mapped docs are living documents; update selectively as codebase evolves.

---

## Example: Full Map Session

```
User: /map

Herald: Preparing to map codebase...
Scout: [explores project, answers 50+ questions]
Sage: [reviews Scout findings for completeness]
Forge: [processes through templates, presents approval gates]

User sees:
  1. STACK.md preview → User: Approve
  2. ARCHITECTURE.md preview → User: Adjust (missing module X) → [rewrite] → User: Approve
  3. CONVENTIONS.md preview → User: Skip (too much to review now)
  4. STRUCTURE.md preview → User: Approve
  5. TESTING.md preview → User: Approve
  6. INTEGRATIONS.md preview → User: Adjust (add Stripe details) → [rewrite] → User: Approve
  7. CONCERNS.md preview → User: Approve

Forge writes 6 docs to `.specs/codebase/`, updates `.specs/project/STATE.md`
```

---

## Example: Selective Map

```
User: /map conventions

Herald: Mapping CONVENTIONS.md only...
Scout: [explores naming patterns, file organization, etc.]
Forge: [populates template from Scout findings]

User sees CONVENTIONS.md preview → Approve
Forge writes `.specs/codebase/CONVENTIONS.md`, updates STATE.md lesson
```

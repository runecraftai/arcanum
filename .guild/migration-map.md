# Guild Migration Map: `.specs/*` → `.guild/*`

Generated from audit of `packages/guild/src/`, `packages/guild/docs/`, `packages/guild/skills/`.

---

## Status Summary

| Area | Current canonical | Target canonical | Status |
|------|-------------------|------------------|--------|
| Runtime state (state.json, plans, sessions) | `.guild/` | `.guild/` | ✅ Already correct |
| Config files | `.opencode/guild-opencode.jsonc` | `.opencode/guild-opencode.jsonc` | ✅ Unchanged |
| Workflow definitions | `.opencode/workflows/` | `.opencode/workflows/` | ✅ Unchanged |
| Skills (all 13) | `.specs/*` | `.guild/` | ❌ Must migrate |
| Code (prompt-composer, completion) | Mixed `.specs/*` + `.guild/` | `.guild/` | ❌ Must migrate |
| Docs (architecture.md) | `.guild/` | `.guild/` | ✅ Correct |
| Bard prompts (hardcoded strings) | `.specs/*` | `.guild/` | ❌ Must migrate |

---

## 1. Runtime State (Already Correct)

**Source**: `src/features/work-state/constants.ts`

```
Current:  .guild/state.json        → Target: .guild/context/state.md (JSON → Markdown)
Current:  .guild/plans/            → Target: .guild/plans/
Current:  .guild/runtime/sessions/ → Target: .guild/runtime/sessions/
```

The constants define `.guild/` as root. The JSON `state.json` is the only structural mismatch — the new architecture calls for `.guild/context/state.md` (markdown) while the current code uses `.guild/state.json` (JSON). See **Risk #1**.

**Files using this correctly**:
- `src/infrastructure/fs/work-state-fs-store.ts` — all reads/writes go through `.guild/`
- `src/infrastructure/fs/plan-fs-repository.ts` — delegates to work-state-fs-store
- `src/domain/plans/plan-service.ts` — uses plan-repository
- `src/features/work-state/validation.ts` — validates against `PLANS_DIR`

---

## 2. Skills (All 13 Must Update)

**Scope**: `packages/guild/skills/*/SKILL.md`

Every skill's description field and content references `.specs/*` paths. These must be updated to `.guild/` paths. The skill logic itself (what they do) does not need to change — only the file path references.

### Migration per skill:

| Skill | Current canonical | Target canonical | Changes |
|-------|-------------------|------------------|---------|
| `guild-init` | `.specs/project/PROJECT.md`, `.specs/project/ROADMAP.md`, `.specs/project/STATE.md`, `.specs/project/HANDOFF.md` | `.guild/context/project.md`, `.guild/context/roadmap.md`, `.guild/context/state.md`, `.guild/context/handoff.md` | All 4 path references in description + content |
| `guild-load` | `.specs/project/*`, `.specs/project/HANDOFF.md`, `.specs/project/STATE.md` | `.guild/context/*`, `.guild/context/handoff.md`, `.guild/context/state.md` | All 3 path references |
| `guild-handoff` | `.specs/project/HANDOFF.md`, `.specs/project/STATE.md` | `.guild/context/handoff.md`, `.guild/context/state.md` | Both path references |
| `guild-plan` | `.specs/features/<feature>/tasks.md` | `.guild/plans/<slug>/tasks.md` | Path reference + slug naming convention |
| `guild-spec` | `.specs/features/<feature>/spec.md` | `.guild/plans/<slug>/spec.md` | Path reference + slug naming convention |
| `guild-execute` | `.specs/features/<feature>/tasks.md` | `.guild/plans/<slug>/tasks.md` | Path reference |
| `guild-commit-learning` | (no specific path, references "project memory") | `.guild/knowledge/` | Clarify knowledge/ usage |
| `guild-verify`, `guild-review`, `guild-ship`, `guild-scope`, `guild-research` | (description-only skills, no path refs) | N/A | No changes needed |

### Fallback behavior for skills:
- Skills should **read** `.specs/*` as fallback if `.guild/` is empty/stale
- Skills should **write** to `.guild/` only (never back to `.specs/*`)
- This applies only during migration transition; once projects are bootstrapped with `.guild/`, `.specs/*` reads should be deprecated

---

## 3. Code References (Must Update)

### 3a. `src/features/workflow/completion.ts` — `resolveSpecArtifactPath()`

**Lines**: 154–170

```typescript
// CURRENT (hardcoded .specs/* fallback):
const candidates = [
  join(directory, ".specs", "features", planName, "tasks.md"),
  join(directory, ".specs", "features", planName, "spec.md"),
  join(directory, ".specs", "features", planName, "design.md"),
  join(directory, ".specs", "quick", planName, "TASK.md"),
  join(directory, ".specs", "project", `${planName}.md`),
]
```

**Target**: Replace with `.guild/plans/<slug>/` candidates first, then `.specs/*` as fallback.

```typescript
// MIGRATED:
const candidates = [
  // .guild/ (canonical) — checked first
  join(directory, ".guild", "plans", planName, "tasks.md"),
  join(directory, ".guild", "plans", planName, "spec.md"),
  join(directory, ".guild", "plans", planName, "design.md"),
  join(directory, ".guild", "plans", planName, "state.md"),
  // .specs/* (legacy fallback) — checked second
  join(directory, ".specs", "features", planName, "tasks.md"),
  join(directory, ".specs", "features", planName, "spec.md"),
  join(directory, ".specs", "features", planName, "design.md"),
  join(directory, ".specs", "quick", planName, "TASK.md"),
  join(directory, ".specs", "project", `${planName}.md`),
]
```

**Risk**: Low. This is a read path with additive candidates. Adding `.guild/` first maintains backward compatibility.

### 3b. `src/agents/bard/prompt-composer.ts`

**Lines**: 57, 140

```typescript
// CURRENT:
"Plans live under `.specs/*` according to scope. Execution goes through /start-work → Fighter."
steps.push(`1. PLAN: Delegate to Wizard → produces a plan under \`.specs/*\` according to scope`)
```

**Target**: Replace with `.guild/plans/<slug>/` references.

```typescript
// MIGRATED:
"Plans live under `.guild/plans/<slug>/`. Execution goes through /start-work → Fighter."
steps.push(`1. PLAN: Delegate to Wizard → produces a plan under \`.guild/plans/<slug>/\``)
```

**Risk**: Medium. These are hardcoded prompt strings. Changing them alters Bard's behavior guidance. Update in place — no fallback needed since this is a prompt rewrite, not a file path.

---

## 4. Configuration (No Changes)

**Source**: `src/infrastructure/fs/config-fs-loader.ts`

Config files at `~/.config/opencode/guild-opencode.jsonc` (user) and `<project>/.opencode/guild-opencode.jsonc` (project) are **separate** from the `.guild/` working memory. No migration needed.

---

## 5. Documentation

### `packages/guild/docs/architecture.md`

Already references `.guild/` correctly (lines 105–127). No changes needed.

### `packages/guild/docs/AGENTS.md`

References `.guild/plans/` for Wizard (correct). No changes needed.

---

## Risk Summary

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | `state.json` (JSON) vs `context/state.md` (Markdown) — data format mismatch | **High** | The new architecture uses Markdown for context files. Current code writes JSON to `.guild/state.json`. Migration needs a converter: read old JSON, write new Markdown, then delete JSON. The plan-level `plans/<slug>/state.md` is already planned as markdown. |
| R2 | Skills hardcode `.specs/*` paths in descriptions — agents following skill descriptions will write to wrong locations | **High** | Update all skill descriptions. During transition, agents may write to `.specs/*` if they follow old skill descriptions. Must ship skill updates alongside any code that reads from new paths. |
| R3 | `completion.ts` `resolveSpecArtifactPath()` adds `.guild/` candidates first — if a stale `.specs/*` file exists alongside a fresh `.guild/` file, the `.guild/` version wins | **Medium** | This is the intended behavior (`.guild/` is canonical). Stale `.specs/*` files should be cleaned up during project migration. |
| R4 | Bard prompt strings reference `.specs/*` — changing them mid-session affects Bard's behavior | **Medium** | Update as part of a coordinated release. Old sessions with compacted context may still reference `.specs/*` in their context. The fallback read in completion.ts covers this. |
| R5 | No migration tooling exists yet for existing projects with `.specs/*` content | **Medium** | The architecture doc already notes `.specs/` and `.notebook/` are fallback only. A migration script should be built to import existing `.specs/*` content into `.guild/`. |

---

## Migration Phases

### Phase 1: Code fixes (low risk, no data change)
1. Update `completion.ts` `resolveSpecArtifactPath()` to check `.guild/` before `.specs/`
2. Update Bard prompt strings in `prompt-composer.ts`
3. Add `.guild/` as primary candidates in workflow completion

### Phase 2: Skills update
4. Update all 13 skill descriptions and content to reference `.guild/` paths
5. Add fallback read from `.specs/*` for backward compatibility during transition

### Phase 3: State format migration
6. Add JSON→Markdown converter for `.guild/state.json` → `.guild/context/state.md`
7. Update `work-state-fs-store.ts` to write markdown instead of JSON (or dual-write during transition)

### Phase 4: Cleanup
8. Remove `.specs/*` fallback candidates from code once all projects are migrated
9. Document migration path for existing projects
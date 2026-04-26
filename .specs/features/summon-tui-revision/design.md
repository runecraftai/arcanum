# Design: summon-tui-revision

**Spec:** summon-tui-revision
**Scope:** Large
**Created:** 2026-04-25

---

## Architecture Overview

The change introduces a **TUI orchestrator** function that sequences the 6-step flow. This orchestrator lives in a new module `src/tui/flow.ts` and is called from the default command in `src/cli.ts`. Existing TUI modules are reused where possible; two new modules are added for the new steps.

```
src/cli.ts (entry point)
  └─ default command → src/tui/flow.ts::runInteractiveFlow()
       ├─ Step 1: src/tui/banner.ts + src/agents/detector.ts + src/tui/agent-select.ts
       ├─ Step 2: src/tui/action-menu.ts
       ├─ Step 3: src/tui/skill-browse.ts (modified for update/remove filtering)
       ├─ Step 4: src/tui/method-select.ts (existing)
       ├─ Step 5: src/tui/scope-select.ts (NEW)
       └─ Step 6: src/tui/confirmation.ts (NEW)
```

## Key Decisions

### D1 — Orchestrator pattern (not state machine)
A sequential async function with early returns on cancel. Each step is a function call returning the user's choice or a cancel symbol. No need for a formal state machine — the flow is linear with conditional skips.

**Rationale:** The flow has no branching loops or backward navigation. A simple `async function` with `if (isCancel(result)) return` after each step is clearest.

### D2 — Default command via citty's default meta
citty supports a default subcommand by exporting `default: true` in a command definition, or by running the TUI flow when `process.argv` has no subcommand. We'll detect "no subcommand" in `src/cli.ts` and call `runInteractiveFlow()` directly.

**Approach:** In `src/cli.ts`, check if citty received no subcommand. If not, import and run `runInteractiveFlow()`. This avoids restructuring the existing command definitions.

### D3 — Filtering installed skills (clack workaround)
@clack/prompts v0.7.0 has no `disabled` option on multiselect items. To handle "already installed" skills in the install flow:
1. Before showing `groupMultiselect`, call `clack.log.info()` listing already-installed skill names with "[installed]" labels.
2. Filter those skills OUT of the `groupMultiselect` options entirely.
3. If ALL skills in a category are installed, omit that category group.

For update/remove: only show skills that ARE installed (simple filter).

### D4 — Scope select is a new TUI module
New file `src/tui/scope-select.ts` — a `clack.select()` with two options: Local / Global. Follows the same pattern as `method-select.ts`.

### D5 — Confirmation is a new TUI module
New file `src/tui/confirmation.ts` — uses `clack.note()` for the summary box and `clack.confirm()` for the yes/no gate.

### D6 — install.ts refactor strategy
The existing `src/commands/install.ts` (255L) contains the full interactive flow inline. We will:
1. Extract the interactive flow logic into `src/tui/flow.ts`.
2. Keep `src/commands/install.ts` as the CLI command handler for `./summon install`. When flags are present (--skill, --agent), it runs non-interactive. When no flags, it delegates to `runInteractiveFlow()`.
3. Extract shared execution logic (the actual install/update/remove operations) into helper functions within `src/commands/install.ts` or a shared module, so both the TUI flow and inline commands can call them.

### D7 — Skill filtering logic
New utility function `filterSkillsByInstallStatus(skills, agents, action)` in `src/skills/discovery.ts`:
- `action === 'install'` → return skills NOT installed on ALL selected agents
- `action === 'update'` or `action === 'remove'` → return skills installed on at least one selected agent

This uses existing `discoverInstalledSkills()` from `src/skills/discovery.ts`.

## Module Changes Summary

| File | Change type | Description |
|------|------------|-------------|
| `src/cli.ts` | Modify | Add default-command detection → call `runInteractiveFlow()` |
| `src/tui/flow.ts` | **New** | Orchestrator: 6-step interactive flow |
| `src/tui/scope-select.ts` | **New** | Step 5: Local vs Global select |
| `src/tui/confirmation.ts` | **New** | Step 6: Summary note + confirm |
| `src/tui/skill-browse.ts` | Modify | Accept action param, filter skills by install status |
| `src/tui/agent-select.ts` | Modify | Show all registered agents (not just detected), detected pre-selected |
| `src/skills/discovery.ts` | Modify | Add `filterSkillsByInstallStatus()` utility |
| `src/commands/install.ts` | Modify | Extract interactive flow; keep non-interactive path; delegate to `runInteractiveFlow()` when no flags |

## Data Flow

```
runInteractiveFlow():
  agents: DetectedAgent[] ← Step 1 (agent-select)
  action: 'install' | 'update' | 'remove' ← Step 2 (action-menu)
  skills: Skill[] ← Step 3 (skill-browse, filtered by action + agents)
  method?: 'copy' | 'symlink' ← Step 4 (method-select, install only)
  scope?: 'local' | 'global' ← Step 5 (scope-select, install+copy only)
  confirmed: boolean ← Step 6 (confirmation)
  → execute(action, agents, skills, method, scope)
```

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing CLI commands | install.ts keeps its flag-based non-interactive path untouched; only the no-flag path changes |
| citty default command conflicts | Test that `./summon install`, `./summon update` etc. still route correctly |
| Skill filtering edge cases | Handle empty results gracefully (show message, don't crash) |

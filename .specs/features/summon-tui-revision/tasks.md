# Tasks: summon-tui-revision

**Spec:** summon-tui-revision
**Scope:** Large
**Created:** 2026-04-25

---

## Phase 1 — New TUI modules (no dependencies on refactored code)

- [x] 1.1 Create scope select module (`src/tui/scope-select.ts`)
  - Files: `src/tui/scope-select.ts` (new)
  - Implementation: Export `selectScope()` returning `'local' | 'global' | symbol` (cancel). Use `clack.select()` with two options: `{ value: 'local', label: 'Local (this project only)' }` and `{ value: 'global', label: 'Global (available everywhere)' }`.
  - Acceptance: Function returns selected scope or cancel symbol. Follows same pattern as `src/tui/method-select.ts`.

- [x] 1.2 Create confirmation module (`src/tui/confirmation.ts`)
  - Files: `src/tui/confirmation.ts` (new)
  - Implementation: Export `showConfirmation(summary: { agents: string[], skills: string[], action: string, method?: string, scope?: string })` returning `boolean | symbol`. Use `clack.note()` to display formatted summary, then `clack.confirm({ message: 'Proceed?' })`.
  - Acceptance: Shows summary box with all provided fields (omits method/scope if undefined). Returns true/false/cancel.

## Phase 2 — Skill filtering logic

- [x] 2.1 Add `filterSkillsByInstallStatus()` to discovery module (`src/skills/discovery.ts`)
  - Files: `src/skills/discovery.ts`
  - Implementation: Export `filterSkillsByInstallStatus(allSkills: Skill[], installedSkills: InstalledSkill[], action: 'install' | 'update' | 'remove')`. For `install`: return skills where skill is NOT installed on all selected agents. For `update`/`remove`: return skills where skill IS installed on at least one selected agent. Also export `getInstalledSkillNames(agents: DetectedAgent[])` that aggregates installed skills across agents.
  - Acceptance: Given a catalog of 5 skills, 2 installed on all agents → install filter returns 3, update/remove filter returns 2. Edge case: empty result returns empty array (never throws).

## Phase 3 — Modify existing TUI modules

- [x] 3.1 Update agent-select to show all registered agents (`src/tui/agent-select.ts`)
  - Files: `src/tui/agent-select.ts`, `src/agents/registry.ts` (read only)
  - Implementation: Import full agent registry. Show ALL registered agents in multiselect. Detected agents have `initialValue: true` (pre-selected). Undetected agents are unselected but selectable. Label detected agents with hint "(detected)".
  - Acceptance: All 9 registered agents appear in the multiselect. Detected ones are pre-selected. User can select/deselect any.

- [x] 3.2 Update skill-browse to support action-based filtering (`src/tui/skill-browse.ts`)
  - Files: `src/tui/skill-browse.ts`
  - Implementation: Change signature to accept `action: 'install' | 'update' | 'remove'` and `installedSkillNames: string[]`. For `install`: use `groupMultiselect` by category, exclude installed skills from options. Before the prompt, call `clack.log.info()` listing installed skills with "[installed]" label if any exist. For `update`/`remove`: use `multiselect` (flat, no categories needed) showing only installed skills. If no skills available after filtering → call `clack.log.warn()` with appropriate message and return empty array.
  - Acceptance: Install mode shows only uninstalled skills in groupMultiselect with installed hint. Update/remove mode shows only installed skills in flat multiselect. Empty catalog handled gracefully.

## Phase 4 — TUI orchestrator

- [x] 4.1 Create the interactive flow orchestrator (`src/tui/flow.ts`)
  - Files: `src/tui/flow.ts` (new)
  - Implementation: Export `runInteractiveFlow()` as async function. Sequence:
    1. `showBanner()` from `src/tui/banner.ts`
    2. Detect agents via `detectAgents()` from `src/agents/detector.ts` (with spinner)
    3. `selectAgents(detectedAgents)` from `src/tui/agent-select.ts` → if cancel, `outro()` + return
    4. `selectAction()` from `src/tui/action-menu.ts` → if cancel, `outro()` + return
    5. Load skill catalog via `loadSkillCatalog()`, get installed skills via `getInstalledSkillNames(agents)`, filter with `filterSkillsByInstallStatus()`, then `browseSkills(filtered, action, installedNames)` → if cancel or empty, `outro()` + return
    6. If action === 'install': `selectMethod()` → if cancel, `outro()` + return
    7. If action === 'install' && method === 'copy': `selectScope()` → if cancel, `outro()` + return
    8. `showConfirmation({ agents, skills, action, method, scope })` → if cancel or false, `outro('Aborted')` + return
    9. Execute action using existing install/update/remove logic
    10. `showProgress()` / `outro('Done!')`
  - Each step checks `isCancel()` and exits gracefully.
  - Acceptance: Full 6-step flow runs. Conditional steps (4,5) correctly skipped. Cancel at any step shows `outro` and exits without error.

## Phase 5 — Entry point wiring

- [x] 5.1 Refactor install command to delegate interactive mode (`src/commands/install.ts`)
  - Files: `src/commands/install.ts`
  - Implementation: Keep the existing command definition and flag handling. Add check at top of `run()`: if no `--skill` and no `--agent` flags provided → call `runInteractiveFlow()` from `src/tui/flow.ts` and return. Otherwise proceed with existing non-interactive logic. Extract the actual install/update/remove execution into exported helper functions (e.g., `executeInstall(agents, skills, method, scope)`) that both the TUI flow and inline commands can call.
  - Acceptance: `./summon install` with no flags → launches TUI flow. `./summon install --skill X --agent Y` → runs non-interactively as before. Extracted execution helpers are importable.

- [x] 5.2 Wire default command in CLI entry point (`src/cli.ts`)
  - Files: `src/cli.ts`
  - Implementation: Detect when no subcommand is provided (citty provides this via the command handler or by checking `process.argv`). When no subcommand → import and call `runInteractiveFlow()` from `src/tui/flow.ts`. Existing subcommands (`install`, `update`, `remove`, `list`) remain unchanged.
  - Acceptance: `./summon` (no args) → launches interactive TUI. `./summon install` → routes to install command (which itself delegates to TUI if no flags). `./summon list` → existing behavior.

## Phase 6 — Integration verification

- [ ] 6.1 Manual integration test: full TUI flow
  - Files: none (runtime test)
  - Steps: Run `./summon`, verify banner → agent select (all 9 shown, detected pre-selected) → action select → skill browse (filtered correctly) → method (install only) → scope (install+copy only) → confirmation → execution
  - Acceptance: All 6 steps appear in correct order. Conditional steps skipped when not applicable. Cancel at each step exits cleanly.

- [ ] 6.2 Manual integration test: inline commands preserved
  - Files: none (runtime test)
  - Steps: Run `./summon install --skill <name> --agent <agent>`, verify non-interactive install. Run `./summon list`, verify listing. Run `./summon update`, verify behavior. Run `./summon remove`, verify behavior.
  - Acceptance: All inline commands work identically to before the change.

- [ ] 6.3 Edge case: no agents detected
  - Files: none (runtime test)
  - Steps: Run `./summon` in an environment with no agents installed.
  - Acceptance: Agent multiselect shows all 9 agents, none pre-selected. Flow continues normally.

- [ ] 6.4 Edge case: all skills already installed
  - Files: none (runtime test)
  - Steps: Install all skills on all agents, then run `./summon` and choose "Install new skills".
  - Acceptance: Shows "All skills are already installed" message. Does not crash. Returns to menu or exits gracefully.

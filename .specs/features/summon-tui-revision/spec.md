# Spec: summon-tui-revision

**Status:** draft
**Scope:** Large
**Created:** 2026-04-25

---

## Problem

Running `./summon` with no arguments currently shows citty's default help text instead of launching the interactive TUI. The TUI flow (currently embedded in `src/commands/install.ts`) lacks two steps that users need: **installation scope** (local vs global) and **confirmation summary**. The update/remove actions share the same entry but their skill-selection step doesn't filter appropriately (install shows all skills; update/remove should show only installed skills).

## Goal

Make `./summon` (no subcommand) launch a 6-step interactive TUI flow:

1. **Agent selection** — banner + detect + multiselect (detected pre-selected)
2. **Action menu** — Install / Update / Remove
3. **Skill browse** — context-sensitive list depending on action
4. **Installation method** — Copy vs Symlink (install action only)
5. **Installation scope** — Local vs Global (install + copy only)
6. **Confirmation** — summary box + confirm prompt

Preserve existing inline CLI commands (`./summon install --skill X --agent Y`, `./summon update`, `./summon remove`, `./summon list`) unchanged.

## Users

- Developers using arcanum to manage AI-agent skills across editors/tools.

## Requirements

### R1 — Default command launches TUI
- `./summon` with no args → full interactive 6-step TUI flow
- `./summon install` with no flags → same full interactive TUI flow (backwards-compat)
- `./summon install --skill <name> --agent <agent>` → non-interactive (existing behavior)

### R2 — Step 1: Agent selection
- Display ASCII banner via `showBanner()`
- Run agent detection via `detectAgents()`
- Show multiselect: detected agents pre-selected (green ✓), all registered agents shown
- Cancel (Ctrl+C / Esc) → exit gracefully

### R3 — Step 2: Action menu
- select prompt: "Install new skills" / "Update existing skills" / "Remove installed skills"
- Cancel → exit gracefully

### R4 — Step 3: Skill browse (conditional)
- **Install action:** groupMultiselect by category. Skills already installed on ALL selected agents are filtered out of selectable options. Show "[installed]" hint via `clack.note()` or `clack.log.info()` before the prompt listing already-installed skills.
- **Update action:** multiselect showing only skills currently installed on at least one selected agent.
- **Remove action:** multiselect showing only skills currently installed on at least one selected agent.
- If no skills match the filter → show message and return to action menu or exit.

### R5 — Step 4: Installation method (install only)
- select prompt: "Copy (independent copies, recommended)" / "Symlink (global ~/.agents/skills + symlinks)"
- Skipped entirely for update/remove actions.

### R6 — Step 5: Installation scope (install + copy only)
- select prompt: "Local (this project only)" / "Global (available everywhere)"
- Skipped for symlink method (symlink is inherently global).
- Skipped for update/remove actions.

### R7 — Step 6: Confirmation
- `clack.note()` showing summary: selected agents, selected skills, action, method (if applicable), scope (if applicable).
- `clack.confirm()`: Y/enter → proceed with execution, N/esc → abort.

### R8 — Execution
- After confirmation, execute the action (install/update/remove) using existing logic in `installSkill()` / equivalent functions.
- Show progress via existing `showProgress()` mechanism.

### R9 — Preserve inline commands
- `./summon install --skill X --agent Y` → non-interactive install (unchanged)
- `./summon update` → existing behavior (unchanged)
- `./summon remove` → existing behavior (unchanged)
- `./summon list` → existing behavior (unchanged)

## Non-goals

- No new UI library (stay on @clack/prompts v0.7.0)
- No redesign of the skill catalog format or SKILL.md parsing
- No changes to agent registry entries
- No new CLI flags beyond what exists

## Success criteria

- `./summon` launches interactive TUI with all 6 steps
- Each step respects conditional logic (method only for install, scope only for install+copy)
- Skills are correctly filtered per action type
- Existing `./summon install --skill X --agent Y` still works non-interactively
- Cancel at any step exits cleanly with `clack.outro()`

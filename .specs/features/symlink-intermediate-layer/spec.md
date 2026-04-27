# Spec: Symlink Intermediate Layer for Skill Installation

## Problem

The current symlink installation mode creates direct symlinks from each agent's `installDir` to the source skill in `packages/spells/skills/`. This has several issues:

1. **No project-level visibility** — There's no way to see which skills are symlinked into a project without scanning every agent directory.
2. **No single source of truth** — Each agent symlink independently points to the source, making bulk operations (update, remove) require per-agent traversal.
3. **Scope is UI-only** — The `selectScope()` step collects a value that is never used in execution (`flow.ts:173-179`), creating user confusion.

## Solution

Introduce `.agents/skills/` as an intermediate symlink hub for symlink-mode installations:

- **Source** (`packages/spells/skills/<name>/SKILL.md`) → **Hub** (`.agents/skills/<name>/SKILL.md`) → **Agent** (`<agent-installDir>/<name>/SKILL.md`)
- Copy mode remains unchanged: source → agent directly.

## Goals

1. `.agents/skills/` becomes the project-level manifest of symlinked skills
2. Agent directories contain symlinks to the hub, not to the source
3. Update/remove operations work through the hub (single point of control)
4. TUI flow simplified: scope selection hidden when symlink mode is chosen
5. Discovery correctly identifies hub-linked skills vs direct copies

## Non-Goals

- Changing copy-mode behavior
- Adding new agents
- Changing skill authoring format (SKILL.md structure)
- Modifying the CLI subcommand interface

## Success Criteria

- `arcanum install --method symlink` creates `.agents/skills/<name>/SKILL.md` symlink to source, then per-agent symlinks to hub
- `arcanum install --method copy` works exactly as before (no `.agents/skills/` involvement)
- `arcanum remove` for symlinked skills removes agent symlinks AND hub entry
- `arcanum update` for symlinked skills only needs to verify hub→source link integrity
- `arcanum list` shows skills with their installation method (symlink-hub vs copy)
- Scope selection step is skipped in TUI when symlink method is chosen
- Version bumped to 0.0.9

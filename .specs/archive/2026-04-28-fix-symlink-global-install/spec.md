# Fix Symlink Global Install

## Problem

The symlink skill installation method in `packages/summon` has two bugs that prevent global-scope agents (e.g., `claude-code`, `opencode`) from correctly installing skills via symlink:

1. **Scope bypass (flow.ts:117-118):** When the user selects "symlink" as installation method, the TUI hardcodes `scope = "local"`, completely skipping scope selection. This means global agents never get their skills installed to the global hub path (`~/.agents/skills/`).

2. **Hub path always local (installer.ts:208 + L46-48):** `getHubSkillPath()` always resolves relative to `process.cwd()`, producing `<cwd>/.agents/skills/<name>` regardless of agent scope. There is no global skills hub resolver in `paths.ts`.

## Expected Behavior

| Method   | Scope   | Hub location                          | Agent gets               |
|----------|---------|---------------------------------------|--------------------------|
| symlink  | global  | `~/.agents/skills/<skillName>/`       | Symlink → hub's SKILL.md |
| symlink  | project | `<projectRoot>/.agents/skills/<skillName>/` | Symlink → hub's SKILL.md |
| copy     | any     | N/A (direct copy)                     | SKILL.md copied directly |

For symlink + global: the **full skill folder** is copied to `~/.agents/skills/<skillName>/`, then a symlink is created from the agent's installDir pointing to the hub's SKILL.md.

For symlink + project: behavior remains as currently intended — hub at `<projectRoot>/.agents/skills/<skillName>/`.

Copy method: **no changes** — continues to copy SKILL.md directly to agent installDir.

## Scope

Medium — 5 files affected, localized logic changes, no new dependencies.

## Success Criteria

- [ ] Symlink method respects agent's actual scope (global vs project)
- [ ] Global agents get hub at `~/.agents/skills/<skillName>/`
- [ ] Project agents get hub at `<projectRoot>/.agents/skills/<skillName>/`
- [ ] Copy method behavior is completely unchanged
- [ ] Tests cover both global and project scope symlink installation
- [ ] Existing tests continue to pass

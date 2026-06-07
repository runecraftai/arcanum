# Design: Symlink Intermediate Layer

## Architecture

### Two-Tier Symlink Chain

```
Source (packages/spells/skills/spec-driven/SKILL.md)
   ↓ symlink
Hub (.agents/skills/spec-driven/SKILL.md)
   ↓ symlink (per agent)
Agent (~/.claude/skills/spec-driven/SKILL.md)
Agent (.cursor/rules/spec-driven/SKILL.md)
```

For copy mode (unchanged):
```
Source (packages/spells/skills/spec-driven/SKILL.md)
   ↓ file copy
Agent (~/.claude/skills/spec-driven/SKILL.md)
```

### Directory Structure

```
.agents/
  skills/
    spec-driven/
      SKILL.md          → symlink to ../../packages/spells/skills/spec-driven/SKILL.md
      .skill-meta.json  → symlink to ../../packages/spells/skills/spec-driven/.skill-meta.json
```

The hub mirrors the skill's subdirectory structure. The symlink from hub to source uses a relative path so the project remains portable.

## Key Decisions

### D1: Hub symlinks use relative paths
- **Decision:** All symlinks (source→hub and hub→agent) use relative paths
- **Rationale:** Project portability; absolute paths break when repo is cloned elsewhere
- **Impact:** `installer.ts` must compute relative paths between hub and source, and between agent installDir and hub

### D2: Scope selection removed for symlink mode
- **Decision:** When user selects symlink method, skip scope selection entirely
- **Rationale:** Symlink mode always uses the hub pattern regardless of agent scope (global/local). The hub is always project-local. Agent symlinks point to hub regardless of whether the agent dir is global (~/.claude/) or local (.cursor/).
- **Impact:** `flow.ts` conditionally skips `selectScope()` step; `method-select.ts` unchanged

### D3: Hub directory auto-created on first symlink install
- **Decision:** `installer.ts` creates `.agents/skills/` directory tree on demand via `fs.mkdirSync(recursive: true)`
- **Rationale:** No manual setup; directory appears only when symlink mode is first used
- **Impact:** Minor — single `mkdirSync` call before symlink creation

### D4: Discovery enhanced to detect hub entries
- **Decision:** `discovery.ts` gains a new function `discoverHubSkills()` that scans `.agents/skills/` and resolves symlink targets
- **Rationale:** Listing/status commands need to show hub-managed skills distinctly from direct copies
- **Impact:** `discovery.ts` gets ~20-30 lines of new logic

### D5: Remove operation cleans up both tiers
- **Decision:** `removeSkill()` checks if skill is hub-managed by checking if `.agents/skills/<name>/` exists
- If hub-managed: remove all agent symlinks pointing to hub entry, remove hub symlink, remove hub skill directory if empty
- If copy-managed: keep existing removal behavior
- **Impact:** `installer.ts` `removeSkill()` function needs hub-awareness

### D6: Update operation verifies chain integrity
- **Decision:** `updateSkill()` for hub-managed skills: (1) verify hub→source symlink is valid, (2) verify each agent→hub symlink is valid, (3) re-create any broken links
- **Rationale:** Symlinks can break if source moves; update should heal the chain
- **Impact:** `installer.ts` `updateSkill()` gains chain verification logic

### D7: .gitignore consideration
- **Decision:** `.agents/skills/` should NOT be gitignored — it's project configuration (symlinks to local paths)
- **Rationale:** Team members cloning the repo will see which skills are expected; symlinks may break on clone but `arcanum install` can repair them
- **Caveat:** Document that symlinks are developer-local and may need re-creation after clone

## File Change Map

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/summon/src/skills/installer.ts` | **Major** | New hub logic in install/update/remove |
| `packages/summon/src/skills/discovery.ts` | **Moderate** | New `discoverHubSkills()` function |
| `packages/summon/src/tui/flow.ts` | **Minor** | Skip scope step for symlink method |
| `packages/summon/src/tui/scope-select.ts` | **None** | No changes needed |
| `packages/summon/src/tui/method-select.ts` | **None** | No changes needed |
| `packages/summon/src/agents/registry.ts` | **None** | No changes needed |
| `packages/summon/src/agents/detector.ts` | **None** | No changes needed |
| `packages/summon/package.json` | **Trivial** | Version 0.0.8 → 0.0.9 |

## Edge Cases

1. **Agent installDir doesn't exist yet** — Create it (existing behavior, keep as-is)
2. **Hub skill already exists** — Overwrite/update the symlink (idempotent)
3. **Mixed methods for same skill** — Skill could be copy-installed in one agent and symlink-installed in another. Discovery should handle this gracefully by reporting per-agent method.
4. **Source skill deleted** — Hub symlink becomes dangling. `list` should show broken status. `update` should report error.
5. **`.agents/skills/` manually deleted** — Agent symlinks become dangling. `update` or `install` should recreate hub.

## Risks

- **Relative path computation complexity** — Mitigated by using Node.js `path.relative()` which handles this well
- **Cross-platform symlinks** — Windows symlinks require elevated permissions. Current codebase likely already handles this (or doesn't support Windows). No new risk introduced.

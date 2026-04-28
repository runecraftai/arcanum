# Design — Fix Symlink Global Install

## Decision 1: Global skills hub path

**Choice:** Add `resolveGlobalSkillsHub(skillName?: string)` to `packages/summon/src/utils/paths.ts`.

- Uses existing `resolveHome()` from the same file
- Returns `~/.agents/skills` (no arg) or `~/.agents/skills/<skillName>` (with arg)
- Reuses `SKILLS_DIR` constant from `constants.ts` (value: `.agents/skills`)

**Rationale:** `paths.ts` already has `resolveHome()`, `resolveAgentPath()`, and `resolveSpellsDir()` — this follows the existing pattern. No new file needed.

## Decision 2: Scope-aware hub path resolution

**Choice:** Modify `getHubSkillPath()` signature in `installer.ts` to accept scope:

```
getHubSkillPath(projectRoot: string, skillName: string, scope: "global" | "local" | "project") → string
```

- `scope === "global"` → delegates to `resolveGlobalSkillsHub(skillName)`
- `scope !== "global"` → current behavior: `path.join(projectRoot, SKILLS_DIR, skillName)`

**Rationale:** Minimal change surface. The function already exists and is called from `installSkill()` and `createHubSymlink()`. Adding a parameter keeps the API explicit.

## Decision 3: Flow scope selection fix

**Choice:** Remove the scope-skip shortcut for symlink in `flow.ts`. Symlink method should proceed through scope selection (step 5) like copy does, then advance to step 6.

Lines ~117-118 change from:
```
const nextStep = method === "symlink" ? 6 : 5;
const scope = method === "symlink" ? "local" : state.scope;
```
To:
```
const nextStep = 5; // always go through scope selection
// scope comes from state.scope after step 5 completes
```

**Rationale:** The scope selection step already correctly resolves global vs project based on agent registry. Skipping it was the root cause of Bug #1.

## Decision 4: installSkill scope propagation

**Choice:** `installSkill()` already receives the full skill/agent context. Extract the agent's scope and pass it to `getHubSkillPath()` and `createHubSymlink()`.

At `installer.ts:208`, change:
```
const hubPath = getHubSkillPath(cwd, skill.name);
```
To:
```
const hubPath = getHubSkillPath(cwd, skill.name, agent.scope);
```

Where `agent.scope` is already available in the function's context (from the agent parameter or state).

## Decision 5: createHubSymlink scope propagation

**Choice:** `createHubSymlink()` also calls `getHubSkillPath()` internally (at ~L63-91). It needs the same scope parameter threaded through.

Signature change:
```
createHubSymlink(projectRoot, skillName, skillSourcePath, scope) 
```

## Files Changed

| File | Change |
|------|--------|
| `packages/summon/src/utils/paths.ts` | Add `resolveGlobalSkillsHub()` |
| `packages/summon/src/skills/installer.ts` | Update `getHubSkillPath()`, `createHubSymlink()`, `installSkill()` signatures and logic |
| `packages/summon/src/tui/flow.ts` | Remove scope-skip for symlink (L117-118) |
| `packages/summon/src/skills/__tests__/installer.test.ts` | Add global scope symlink test cases |

## Risks

- **Low:** `getHubSkillPath` is exported — check no other callers exist. Scout confirmed it's only used in installer.ts.
- **Low:** `createHubSymlink` signature change — same, only called from `installSkill`.
- **None:** Copy method path is completely untouched.

# Integrate OpenCode Tmux Plugin as Spawn

## TL;DR
> **Summary**: Bring the external `opencode-tmux` plugin into Arcanum as a new `packages/spawn` workspace, rename its public face to `Spawn`, and wire OpenCode + docs so the plugin reads as Arcanum-native while still doing the same tmux-backed work.
> **Estimated Effort**: Medium

## Context
### Original Request
Integrate the external `opencode-tmux` plugin into the Arcanum monorepo under the name `spawn`, keep the corrected tmux behavior, preserve Arcanum lore/tone, and align the story with Guild’s flow: Wizard plans, Fighter executes.

### Key Findings
- Root workspace already covers `packages/*`, so a new `packages/spawn/` workspace should be picked up without widening the workspace glob.
- `.opencode/opencode.json` currently loads only `@runecraft/guild`.
- The external package on npm is `opencode-tmux@0.1.0`; its user-facing surface includes `OpencodeTmux`, `tmux_*` tools, `tmux Context`, and README/install examples.
- The external plugin’s behavior is tmux-specific: auto-inject context on session start/compaction and expose tmux read/list/send/restart tools.
- Arcanum docs already use lore-heavy names (`Guild`, `Wizard`, `Fighter`, `Summon`, `Grimoire`), so `Spawn` should read as a first-class artifact, not a vendor import.

### Risks / Unknowns
- Unknown whether OpenCode will resolve the new workspace package by npm name immediately, or whether `opencode.json` needs a file URL / local link for repo-dev.
- Unknown whether tool names should be fully renamed (`tmux_*` → `spawn_*`) or kept as compatibility aliases.
- Plugin order in `.opencode/opencode.json` may matter if Spawn and Guild both register hooks.

## Objectives
### Core Objective
Add a new Spawn workspace that ships the tmux plugin under Arcanum naming, with docs and config that make it feel native to the repo.

### Deliverables
- [ ] New `packages/spawn/` workspace exists and builds under the monorepo.
- [ ] Public package/plugin naming is `Spawn`, not `opencode-tmux`.
- [ ] `.opencode/opencode.json` loads Spawn alongside Guild.
- [ ] Root and package docs use Arcanum lore/tone and explain how Spawn fits the Wizard → Fighter flow.

### Definition of Done
- [ ] `packages/spawn` builds/tests cleanly.
- [ ] OpenCode can start from this repo and load the new Spawn plugin from `.opencode/opencode.json`.
- [ ] No user-facing docs in the repo still present `opencode-tmux` as the canonical name.

### Guardrails (Must NOT)
- [ ] Do not change the actual tmux-backed behavior while renaming the surface.
- [ ] Do not broaden the workspace layout beyond what is needed for the new plugin.
- [ ] Do not introduce new plugin features or unrelated refactors.

## TODOs

- [x] 1. Define the Spawn workspace shape
  **What**: Create the new workspace under `packages/spawn/` using the monorepo’s package conventions, mirroring the external plugin’s code into `src/` and deciding which metadata is preserved vs. rewritten for Arcanum.
  **Files**: `packages/spawn/package.json`, `packages/spawn/src/index.ts`, `packages/spawn/tsconfig.json`, `packages/spawn/README.md`
  **Acceptance**: Bun/Turbo sees `packages/spawn` as a workspace package; build entrypoint and package metadata are ready for the renamed plugin.

- [x] 2. Rename the public plugin surface to Spawn
  **What**: Replace user-facing `opencode-tmux` branding with `Spawn` across the package metadata, exported symbol name, README text, and plugin-facing labels while preserving tmux-backed runtime behavior.
  **Files**: `packages/spawn/package.json`, `packages/spawn/src/index.ts`, `packages/spawn/README.md`
  **Acceptance**: The canonical package name, README title, and exported plugin identity all read as Spawn; any intentional compatibility aliases are explicitly decided and documented.

- [ ] 3. Wire Spawn into OpenCode config
  **What**: Update the repo’s OpenCode config so Spawn is loaded alongside Guild, and resolve whether package-name loading is sufficient or whether a local link/file target is needed for repo-dev.
  **Files**: `.opencode/opencode.json`, `.opencode/package.json` (only if local linkage is required)
  **Acceptance**: OpenCode can boot from this repo and recognize both plugins without manual one-off setup.

- [ ] 4. Update Arcanum-facing docs and naming
  **What**: Refresh the root artifact table and Spawn docs so the plugin reads as an Arcanum artifact, with explicit language that ties Spawn to the Wizard-plans / Fighter-executes flow.
  **Files**: `README.md`, `packages/spawn/README.md`
  **Acceptance**: Repo-level docs present Spawn as a native Arcanum artifact and explain its role in the Guild workflow without mentioning `opencode-tmux` as the canonical name.

- [x] 5. Verify the integration path end to end
  **What**: Run the package build/test path and an OpenCode startup smoke check that exercises the new config and confirms Spawn loads cleanly with Guild.
  **Files**: None
  **Acceptance**: Build/test passes for the new workspace; OpenCode debug/startup smoke confirms the plugin is loadable from the repo config.

## Verification
- [x] `bun test` or the package-specific test command passes for `packages/spawn`
- [x] `bun run build` (or the package’s build command) succeeds for `packages/spawn`
- [ ] OpenCode starts with `.opencode/opencode.json` and loads Spawn + Guild together
- [ ] Repo docs contain `Spawn` as the canonical name and no longer present `opencode-tmux` as the primary brand

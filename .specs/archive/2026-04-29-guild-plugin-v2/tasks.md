# Guild Plugin V2 — Tasks

## Phase 0: Schema & Types Foundation

- [x] 0.1 Extend Zod schemas in `src/schema.ts`
  - Files: `packages/guild/src/schema.ts`
  - Add `SkillsConfigSchema` with `auto_discover` (boolean, default true) and `paths` (optional object with `global` defaulting to `"~/.config/opencode/skills/"`, `legacy` defaulting to `"~/.config/opencode/.agents/skills/"`, and `project` defaulting to `".agents/skills/"`)
  - Add `CustomAgentSchema` with `prompt_file` (optional string), `skills` (optional string array), `model` (optional string)
  - Add `CustomAgentsConfigSchema` as `z.record(z.string(), CustomAgentSchema)`
  - Add `WorkflowStepSchema` as discriminated union on `type` field: `"agent"` variant (id, agent, mode, input?, output?, on_error?) and `"gate"` variant (id, gate, on_reject?, on_approve?)
  - Add `WorkflowSchema` with `description` (optional) and `steps` (array, min 1)
  - Add `WorkflowsConfigSchema` as `z.record(z.string(), WorkflowSchema)`
  - Extend `GuildConfigSchema` with three new optional fields: `skills`, `custom_agents`, `workflows`
  - Acceptance: Existing V1 config parses without error. Full V2 config with all three sections parses correctly. Invalid configs rejected with descriptive Zod errors.

- [x] 0.2 Create skills types in `src/skills/types.ts`
  - Files: `packages/guild/src/skills/types.ts`
  - Export `DiscoveredSkill` type: `{ name: string, description: string, category?: string, version?: string, tags: string[], filePath: string, source: "global" | "legacy" | "project", targetAgents: string[], valid: boolean, validationErrors?: string[] }`
  - Export `SkillDiscoveryResult` type: `{ skills: DiscoveredSkill[], errors: string[] }`
  - Export `SkillFrontmatter` type: `{ name: string, description?: string, category?: string, version?: string, tags?: string[], target_agents?: string[] }`
  - Acceptance: Types compile, are importable from the module. Source includes `"legacy"` literal.

- [x] 0.3 Create agent config types in `src/agents/types.ts`
  - Files: `packages/guild/src/agents/types.ts`
  - Export `ResolvedAgentConfig` type: `{ promptFile?: string, promptContent?: string, skills: ResolvedSkillRef[], model?: string }`
  - Export `ResolvedSkillRef` type: `{ name: string, found: boolean, skill?: DiscoveredSkill }`
  - Export `AgentConfigResult` type: `{ found: boolean, config?: ResolvedAgentConfig, warnings: string[] }`
  - Acceptance: Types compile, reference `DiscoveredSkill` from skills/types.

- [x] 0.4 Create workflow types in `src/workflows/types.ts`
  - Files: `packages/guild/src/workflows/types.ts`
  - Export `WorkflowState` type: `{ workflowName: string, goal: string, steps: WorkflowStepDef[], currentStepIndex: number, stepOutputs: Record<string, string>, status: WorkflowStatus, resumeToken: string, startedAt: string, updatedAt: string }`
  - Export `WorkflowStatus` type: `"running" | "waiting_for_gate" | "completed" | "ended" | "error"`
  - Export `WorkflowResponse` type: `{ status: WorkflowStatus, currentStep?: { id: string, type: string }, agent?: string, prompt?: string, gate?: string, resumeToken: string, progress: { completed: number, total: number, currentStepId: string } }`
  - Export `StepResult` type: `{ stepId: string, output?: string, decision?: "approve" | "reject" }`
  - Acceptance: Types compile, are self-contained within workflows module.

- [x] 0.5 Update `src/types.ts` to re-export V2 types
  - Files: `packages/guild/src/types.ts`
  - Add re-exports: `export type { DiscoveredSkill, SkillDiscoveryResult } from "./skills/types.js"`
  - Add re-exports: `export type { ResolvedAgentConfig, AgentConfigResult } from "./agents/types.js"`
  - Add re-exports: `export type { WorkflowState, WorkflowResponse } from "./workflows/types.js"`
  - Acceptance: All V2 types accessible via `import { ... } from "./types.js"`. Existing V1 type exports preserved.

## Phase 1: Skills Discovery (Feature A)

- [x] 1.1 Create frontmatter parser in `src/skills/discovery.ts`
  - Files: `packages/guild/src/skills/discovery.ts`
  - Implement `parseFrontmatter(content: string): SkillFrontmatter | null` function
  - Extract content between first pair of `---` markers using regex
  - Parse line-by-line: `key: value` pairs, detect arrays via `[item1, item2]` syntax
  - Handle edge cases: missing frontmatter returns null, malformed lines skipped with warning
  - Acceptance: Parses the exact frontmatter format from existing skill files. Returns null for files without `---` markers. Array values correctly split.

- [x] 1.2 Create directory scanner in `src/skills/discovery.ts`
  - Files: `packages/guild/src/skills/discovery.ts`
  - Implement `scanDirectory(dirPath: string, source: "global" | "legacy" | "project"): Promise<DiscoveredSkill[]>` function
  - Read directory, filter for `.md` files (exclude registry.json, README, etc.)
  - For each `.md` file: read content, call `parseFrontmatter`, construct `DiscoveredSkill` with the given `source` tag
  - If frontmatter missing or invalid: set `valid: false`, populate `validationErrors`
  - Required frontmatter fields for validity: `name` (description defaults to empty string if missing)
  - Handle directory not existing: return empty array (no error)
  - Resolve `~` in paths to `os.homedir()`
  - Acceptance: Scans real directory, returns DiscoveredSkill array. Missing directory returns []. Invalid files included with valid=false. Source field correctly set.

- [x] 1.3 Create registry compatibility layer in `src/skills/registry-compat.ts`
  - Files: `packages/guild/src/skills/registry-compat.ts`
  - Implement `loadRegistry(dirPath: string): Promise<Record<string, RegistrySkillMeta> | null>` function
  - Check for `registry.json` in dirPath, parse with jsonc-parser if found
  - Implement `mergeRegistryMetadata(legacySkills: DiscoveredSkill[], registry: Record<string, RegistrySkillMeta> | null): DiscoveredSkill[]` function
  - Merge logic: for skills present in both legacy scan and registry, registry metadata fields overwrite frontmatter fields (name, description, target_agents)
  - For skills only in registry (referencing a file), attempt to load the file and create DiscoveredSkill with source `"legacy"`
  - Acceptance: When registry.json exists in legacy path, its metadata takes precedence over frontmatter within that source. When absent, legacy-scanned skills pass through unchanged. No crash on malformed registry.json.

- [x] 1.4 Create main discovery orchestrator in `src/skills/discovery.ts`
  - Files: `packages/guild/src/skills/discovery.ts`
  - Implement `discoverSkills(config: SkillsConfig): Promise<SkillDiscoveryResult>` function
  - Discovery order (lowest to highest priority):
    1. Global: `~/.config/opencode/skills/` → source `"global"`
    2. Legacy: `~/.config/opencode/.agents/skills/` → source `"legacy"` (+ registry.json merge)
    3. Project: `.agents/skills/` relative to project root → source `"project"`
  - Call `scanDirectory` for each path with correct source tag
  - Call `loadRegistry` + `mergeRegistryMetadata` only for the legacy directory
  - Deduplication by name: higher-priority source wins (project > legacy > global)
  - Collect all errors/warnings into `errors` array
  - Acceptance: Returns unified skill list from all three directories. Project skills override legacy, legacy overrides global, on name conflict. Errors collected, not thrown.

## Phase 2: Agent Config Resolution (Feature B)

- [x] 2.1 Create path validator in `src/agents/validator.ts`
  - Files: `packages/guild/src/agents/validator.ts`
  - Implement `validatePromptFilePath(filePath: string, projectRoot: string): { valid: boolean, error?: string }` function
  - Rules: must be relative (no leading `/`), no `..` segments, no null bytes, must end in `.md`, resolved path must be within projectRoot
  - Use `path.resolve(projectRoot, filePath)` and check it starts with projectRoot
  - Acceptance: `".agents/sage.md"` passes. `"../etc/passwd"` fails. `"/absolute/path.md"` fails. `"valid/path.txt"` fails (not .md). Path with null byte fails.

- [x] 2.2 Create skill reference validator in `src/agents/validator.ts`
  - Files: `packages/guild/src/agents/validator.ts`
  - Implement `validateSkillRefs(skillNames: string[], discoveredSkills: DiscoveredSkill[]): { resolved: ResolvedSkillRef[], warnings: string[] }` function
  - For each skill name: look up in discovered skills by name, set `found` flag
  - Unfound skills: add warning `"Skill '<name>' referenced in custom_agents but not discovered"`
  - Acceptance: All found skills have `found: true` with skill reference. Missing skills have `found: false` with warning.

- [x] 2.3 Create agent config resolver in `src/agents/resolver.ts`
  - Files: `packages/guild/src/agents/resolver.ts`
  - Implement `resolveAgentConfig(agentName: string, customAgents: CustomAgentsConfig, discoveredSkills: DiscoveredSkill[], projectRoot: string): Promise<AgentConfigResult>` function
  - If agent not in custom_agents: return `{ found: false, warnings: [] }`
  - Validate prompt_file path (call validatePromptFilePath), read file content if valid
  - Validate skill references (call validateSkillRefs)
  - Assemble `ResolvedAgentConfig` with prompt_content loaded from disk
  - Acceptance: Returns resolved config with prompt content loaded. Invalid prompt_file produces error in warnings, config still returned without prompt. Missing agent returns found=false.

## Phase 3: Workflow Engine (Feature C)

- [x] 3.1 Create template interpolation in `src/workflows/interpolation.ts`
  - Files: `packages/guild/src/workflows/interpolation.ts`
  - Implement `interpolateTemplate(template: string, stepOutputs: Record<string, string>): string` function
  - Replace `{{step_id.output}}` patterns with values from stepOutputs map
  - If referenced step_id not in map: leave placeholder as-is (step hasn't run yet)
  - No nested interpolation, no expression evaluation — pure string replacement
  - Acceptance: `"Use {{explore.output}} to plan"` with `{ explore: "findings..." }` → `"Use findings... to plan"`. Unknown refs left as-is.

- [x] 3.2 Create gate handler in `src/workflows/gates.ts`
  - Files: `packages/guild/src/workflows/gates.ts`
  - Implement `handleGateStep(step: GateStepDef, decision?: "approve" | "reject"): { action: "wait" | "advance" | "jump" | "end", targetStepId?: string }` function
  - No decision provided: return `{ action: "wait" }`
  - Decision "approve": return `{ action: "advance" }` or `{ action: "jump", targetStepId }` if `on_approve` specified
  - Decision "reject": return `{ action: "end" }` or `{ action: "jump", targetStepId }` if `on_reject` is a step id (not "end")
  - Acceptance: Gate without decision returns wait. Approve advances. Reject with "end" ends. Reject with step id jumps.

- [x] 3.3 Create workflow state persistence in `src/workflows/state.ts`
  - Files: `packages/guild/src/workflows/state.ts`
  - Implement `generateResumeToken(): string` — `crypto.randomUUID()`
  - Implement `persistState(state: WorkflowState, sessionDir: string): Promise<void>` — write JSON to `.specs/sessions/<workflowName>-<resumeToken>.json`
  - Implement `loadState(resumeToken: string, sessionDir: string): Promise<WorkflowState | null>` — scan session dir for matching file
  - Ensure sessionDir exists (create `.specs/sessions/` if needed)
  - Acceptance: State round-trips through persist→load. Missing state returns null. Directory created if absent.

- [x] 3.4 Create workflow engine in `src/workflows/engine.ts`
  - Files: `packages/guild/src/workflows/engine.ts`
  - Implement `WorkflowEngine` class with constructor taking `workflows` config and `sessionDir` string
  - Method `start(workflowName: string, goal: string): Promise<WorkflowResponse>` — create initial state, advance to first step
  - Method `resume(resumeToken: string, stepOutput?: string, gateDecision?: "approve" | "reject"): Promise<WorkflowResponse>` — load state, record output/decision, advance
  - Private method `advanceToNextStep(state: WorkflowState): Promise<WorkflowResponse>` — core step execution loop
  - For agent steps: construct prompt with interpolated input template + goal, return STEP_READY with agent name and prompt
  - For gate steps: call handleGateStep, return WAITING_FOR_GATE or advance based on result
  - On error in any step: follow on_error transition (default: end workflow)
  - Persist state after every state change
  - Acceptance: Engine starts workflow, returns first step info. Resume with output advances to next step. Gate pauses return waiting status. Workflow completes when all steps done.

## Phase 4: Tool Registration & Integration

- [x] 4.1 Add `skills_status` tool definition in `src/tools.ts`
  - Files: `packages/guild/src/tools.ts`
  - Add new tool via `tool()` helper: name `"skills_status"`, description `"List all discovered skills with metadata and validation status"`
  - Input schema: empty object `z.object({})`
  - Handler: read from skills cache (passed via closure or module-level ref), return `{ skills, discovery_paths: { global, legacy, project }, errors }`
  - `discovery_paths` should include all three resolved paths: global (`~/.config/opencode/skills/`), legacy (`~/.config/opencode/.agents/skills/`), project (`.agents/skills/` resolved to absolute)
  - Acceptance: Tool registered, callable, returns discovered skills array with all metadata fields including correct `source` values.

- [x] 4.2 Add `agent_config` tool definition in `src/tools.ts`
  - Files: `packages/guild/src/tools.ts`
  - Add new tool: name `"agent_config"`, description `"Get resolved configuration for a named agent"`
  - Input schema: `z.object({ agent_name: z.string() })`
  - Handler: call `resolveAgentConfig` with agent name, discovered skills, project root
  - Acceptance: Tool registered, returns resolved config for known agent. Returns `{ found: false }` for unknown agent.

- [x] 4.3 Add `run_workflow` tool definition in `src/tools.ts`
  - Files: `packages/guild/src/tools.ts`
  - Add new tool: name `"run_workflow"`, description `"Execute or resume a declarative multi-agent workflow"`
  - Input schema: `z.object({ workflow: z.string(), goal: z.string(), resume_token: z.string().optional(), step_output: z.string().optional(), gate_decision: z.enum(["approve", "reject"]).optional() })`
  - Handler: if resume_token provided → call `engine.resume(...)`, else → call `engine.start(...)`
  - Acceptance: Tool starts new workflow. Tool resumes workflow with token. Tool handles gate decisions.

## Phase 5: Config & Plugin Entry Point Updates

- [x] 5.1 Update config loading in `src/config.ts`
  - Files: `packages/guild/src/config.ts`
  - Update `loadConfig` to handle new V2 sections from the extended `GuildConfigSchema`
  - Add `~` resolution for `skills.paths.global` and `skills.paths.legacy` (replace `~` with `os.homedir()`)
  - Add `skills.paths.project` resolution relative to projectDir
  - Default paths when `skills.paths` is omitted: global=`~/.config/opencode/skills/`, legacy=`~/.config/opencode/.agents/skills/`, project=`.agents/skills/`
  - Acceptance: V1-only config loads without error. V2 config with skills/custom_agents/workflows sections loads and validates. Tilde resolved in all three paths.

- [x] 5.2 Update hooks for skills re-discovery in `src/hooks.ts`
  - Files: `packages/guild/src/hooks.ts`
  - In `session:start` event handler: if `skills.auto_discover` is true, re-run `discoverSkills` and update cache
  - Preserve existing graphify context injection and agent-variants validation
  - Acceptance: Skills re-discovered on each new session. Existing hook behavior unchanged.

- [x] 5.3 Update plugin entry point in `src/index.ts`
  - Files: `packages/guild/src/index.ts`
  - After config load: run `discoverSkills(config.skills)` and cache result
  - Create `WorkflowEngine` instance if `config.workflows` exists
  - Pass skills cache and workflow engine to tool registration functions
  - Register three new tools (skills_status, agent_config, run_workflow) alongside existing agent_status tool
  - Acceptance: Plugin initializes all V2 features. All four tools registered. V1-only config still works (no skills/workflows initialized, only agent_status tool registered plus skills_status with empty results).

## Phase 6: Build & Validation

- [x] 6.1 Update build configuration if needed
  - Files: `packages/guild/package.json`, `packages/guild/tsconfig.json`
  - Verify `bun build src/index.ts` picks up new subdirectory modules
  - Verify `tsc --emitDeclarationOnly` generates declarations for all new files
  - Verify `generate-schema.ts` includes V2 schema sections in `dist/schema.json`
  - Acceptance: `bun run build` succeeds. `dist/index.js` contains all V2 code. `dist/index.d.ts` exports all V2 types. `dist/schema.json` includes skills, custom_agents, workflows sections.

- [x] 6.2 Verify backward compatibility
  - Files: (no file changes — verification only)
  - Load plugin with V1-only config (only `agents` and `graphify` sections)
  - Confirm `agent_status` tool still works
  - Confirm `skills_status` returns empty skills array (not an error)
  - Confirm no errors in plugin initialization
  - Acceptance: V1 config produces zero errors/warnings. All V1 functionality intact.

## Task Dependency Graph

```
Phase 0 (foundation) → Phase 1 (skills) ─┐
                     → Phase 2 (agents) ──┤→ Phase 4 (tools) → Phase 5 (integration) → Phase 6 (build)
                     → Phase 3 (workflows) ┘
```

Phases 1, 2, 3 can be executed in parallel after Phase 0.
Phase 4 depends on all of 1, 2, 3.
Phase 5 depends on Phase 4.
Phase 6 depends on Phase 5.

## Summary

- **Total tasks**: 19
- **New files**: 11
- **Modified files**: 6
- **Estimated scope**: Large (3 features, cross-cutting concerns)
- **Discovery paths**: 3-tier (global: `~/.config/opencode/skills/`, legacy: `~/.config/opencode/.agents/skills/`, project: `.agents/skills/`)

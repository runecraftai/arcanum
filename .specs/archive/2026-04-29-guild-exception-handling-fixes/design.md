# Guild Plugin V2 — Technical Design

## Architecture Overview

V2 extends the existing plugin structure with three new modules, each encapsulating one feature. The plugin entry point (`index.ts`) orchestrates initialization order: skills discovery → agent config resolution → workflow engine registration.

```
packages/guild/src/
├── index.ts              # Plugin entry — updated to init V2 modules
├── config.ts             # Config loading — updated with V2 schema sections
├── schema.ts             # Zod schemas — extended with V2 sections
├── types.ts              # Type exports — extended with V2 types
├── hooks.ts              # Existing hooks — minor updates
├── tools.ts              # Existing tools — add new tool registrations
├── skills/
│   ├── discovery.ts      # NEW: Filesystem scanning + frontmatter parsing
│   ├── registry-compat.ts # NEW: registry.json merge logic (legacy path)
│   └── types.ts          # NEW: Skill-specific types
├── agents/
│   ├── resolver.ts       # NEW: Agent config resolution + prompt_file loading
│   ├── validator.ts      # NEW: Path validation, skill reference validation
│   └── types.ts          # NEW: Agent config types
└── workflows/
    ├── engine.ts         # NEW: Sequential step executor
    ├── state.ts          # NEW: Workflow state persistence
    ├── interpolation.ts  # NEW: Template variable resolution
    ├── gates.ts          # NEW: Gate step handling
    └── types.ts          # NEW: Workflow types + Zod schemas
```

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | YAML frontmatter parsed with regex, not a dep | Skill frontmatter is simple key-value; avoids adding `yaml` dep. Use a focused parser (~30 lines). |
| D2 | Skills discovery runs once at plugin init, cached in memory | Skills don't change during a session. Re-scan on `session:start` event. |
| D3 | Workflow engine is synchronous step executor, not async graph | OpenCode tools are request-response. Steps execute sequentially via tool re-invocation pattern. |
| D4 | Gate steps return a structured pause response | Gates can't block JS execution. Instead, `run_workflow` returns state + "waiting for gate" status. Next `run_workflow` call with approval resumes. |
| D5 | Workflow state uses JSON files in `.specs/sessions/` | Simple, inspectable, no database. Matches existing project conventions. |
| D6 | `prompt_file` validated at config load time, not tool call time | Fail-fast on invalid paths; security boundary at the earliest point. |
| D7 | Template interpolation uses `{{step_id.output}}` syntax | Simple, readable, no injection risk since values come from previous step outputs (not user input). |
| D8 | All new Zod schemas use `.optional()` for V2 sections | Ensures V1 configs parse without modification. |
| D9 | Three-tier skill discovery with explicit priority order | skills.sh defines global (`~/.config/opencode/skills/`) and project (`.agents/skills/`) paths. Legacy Herald path (`~/.config/opencode/.agents/skills/`) preserved for backward compat at middle priority. Project always wins. |
| D10 | registry.json only checked in legacy path | Only `~/.config/opencode/.agents/skills/` historically had registry.json. skills.sh paths use frontmatter only. |

## Data Flows

### Flow A: Skills Discovery (Three-Tier)

```
plugin.init()
  → discoverSkills(config.skills)
    → scanDirectory("~/.config/opencode/skills/", "global")
        → parse frontmatter for each .md → DiscoveredSkill[]
    → scanDirectory("~/.config/opencode/.agents/skills/", "legacy")
        → parse frontmatter for each .md → DiscoveredSkill[]
        → loadRegistryCompat(legacyDir) → if registry.json exists, parse it
        → mergeRegistryMetadata(legacySkills, registry) → registry metadata wins within legacy source
    → scanDirectory(".agents/skills/", "project")
        → parse frontmatter for each .md → DiscoveredSkill[]
    → deduplicateByPriority(global, legacy, project)
        → same name: project > legacy > global
    → validate each skill (required fields: name)
    → return SkillDiscoveryResult { skills, errors }
  → cache in plugin closure
  → register skills_status tool (reads from cache)
```

### Flow B: Agent Config Resolution

```
plugin.init()
  → for each agent in custom_agents config:
    → validatePromptFilePath(prompt_file) → reject if absolute, has .., or escapes project root
    → resolveSkillRefs(skills, discoveredSkills) → warn if skill name not found
    → store resolved config in agent config map
  → register agent_config tool (reads from map)
```

### Flow C: Workflow Execution

```
run_workflow(workflowName, goal, resumeToken?)
  → if resumeToken: load state from .specs/sessions/<file>.json
  → else: create new state, resolve workflow definition from config
  → for each step (from current position):
    → if type === "gate":
      → if no approval provided: persist state, return WAITING_FOR_GATE response
      → if approved: advance to next step
      → if rejected: follow on_reject transition (end | jump to step)
    → if type === "agent" (default):
      → construct step context: goal + input template interpolated with previous outputs
      → return STEP_READY response with agent name, mode, constructed prompt
      → (Herald/caller invokes the agent externally, then calls run_workflow again with step output)
    → persist state after each step
  → when all steps complete: return WORKFLOW_COMPLETE
```

**Key insight for D3/D4**: The workflow engine does NOT directly invoke agents. It is a state machine that tells the caller which agent to invoke next and with what input. The caller (Herald) performs the actual agent delegation, then feeds the output back. This respects OpenCode's tool architecture where tools return data, not spawn sub-sessions.

## Zod Schemas (V2 Extensions)

### Skills Config Schema

```typescript
// In schema.ts
const SkillsConfigSchema = z.object({
  auto_discover: z.boolean().default(true),
  paths: z.object({
    global: z.string().default("~/.config/opencode/skills/"),
    legacy: z.string().default("~/.config/opencode/.agents/skills/"),
    project: z.string().default(".agents/skills/"),
  }).optional(),
});
```

### Custom Agents Config Schema

```typescript
const CustomAgentSchema = z.object({
  prompt_file: z.string().optional(),
  skills: z.array(z.string()).optional(),
  model: z.string().optional(),
});

const CustomAgentsConfigSchema = z.record(z.string(), CustomAgentSchema);
```

### Workflow Config Schema

```typescript
const WorkflowStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent").default("agent"),
    id: z.string(),
    agent: z.string(),
    mode: z.enum(["autonomous", "interactive"]).default("autonomous"),
    input: z.string().optional(),
    output: z.string().optional(),
    on_error: z.enum(["end", "continue"]).or(z.string()).default("end"),
  }),
  z.object({
    type: z.literal("gate"),
    id: z.string(),
    gate: z.string(),
    on_reject: z.enum(["end"]).or(z.string()).default("end"),
    on_approve: z.string().optional(),
  }),
]);

const WorkflowSchema = z.object({
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema).min(1),
});

const WorkflowsConfigSchema = z.record(z.string(), WorkflowSchema);
```

### Extended GuildConfigSchema

```typescript
const GuildConfigSchema = z.object({
  agents: z.record(AgentNameSchema, AgentVariantSchema).optional(),
  graphify: GraphifyConfigSchema.optional(),
  prompt: PromptConfigSchema.optional(),
  // V2 additions:
  skills: SkillsConfigSchema.optional(),
  custom_agents: CustomAgentsConfigSchema.optional(),
  workflows: WorkflowsConfigSchema.optional(),
});
```

## Tool Definitions

### `skills_status` (new tool)

- **Input**: `{}` (no params)
- **Output**: `{ skills: DiscoveredSkill[], discovery_paths: { global: string, legacy: string, project: string }, errors: string[] }`
- **DiscoveredSkill**: `{ name, description, category, version, tags, filePath, source: "global"|"legacy"|"project", targetAgents: string[], valid: boolean, validationErrors?: string[] }`

### `agent_config` (new tool)

- **Input**: `{ agent_name: string }`
- **Output**: `{ found: boolean, config?: { prompt_file?: string, prompt_content?: string, skills: ResolvedSkill[], model?: string }, warnings: string[] }`

### `run_workflow` (new tool)

- **Input**: `{ workflow: string, goal: string, resume_token?: string, step_output?: string, gate_decision?: "approve"|"reject" }`
- **Output**: `{ status: "STEP_READY"|"WAITING_FOR_GATE"|"WORKFLOW_COMPLETE"|"WORKFLOW_ENDED"|"ERROR", current_step?: WorkflowStep, agent?: string, prompt?: string, gate?: string, resume_token: string, progress: { completed: number, total: number, current_step_id: string } }`

## Security Considerations

### Prompt File Path Validation (`agents/validator.ts`)

```
Rules:
1. Must be relative (no leading /)
2. Must not contain .. segments
3. Must not contain null bytes
4. Resolved path must be within project root (realpath check)
5. Must end in .md
6. File must exist and be readable
```

Validation runs at config load time (fail-fast). If validation fails, the entire `custom_agents` entry for that agent is rejected with a clear error message logged via picocolors.

### Workflow Security

- Template interpolation only resolves `{{step_id.output}}` patterns — no arbitrary expressions
- Agent names in steps validated against known agent names
- Gate IDs are opaque strings — no code execution
- Workflow state files written only to `.specs/sessions/` (validated path)

## Frontmatter Parser Design

Minimal YAML-subset parser (no dep) that handles:
```yaml
---
name: spec-driven
description: Structured planning methodology
category: planning
version: 1.0.0
tags: [planning, specs]
target_agents: [sage]
---
```

Implementation: regex to extract between `---` markers, then line-by-line key-value parsing. Arrays detected by `[...]` syntax, split on comma. This covers the exact frontmatter format used by existing skills. If parsing fails, skill is marked `valid: false` with error details.

## File Change Summary

| File | Action | Scope |
|------|--------|-------|
| `src/schema.ts` | MODIFY | Add SkillsConfig, CustomAgents, Workflows schemas |
| `src/types.ts` | MODIFY | Add DiscoveredSkill, AgentConfig, WorkflowState types |
| `src/config.ts` | MODIFY | Resolve ~ in paths, pass skills/agents/workflows config |
| `src/index.ts` | MODIFY | Init skills discovery, agent resolver, workflow engine; register new tools |
| `src/tools.ts` | MODIFY | Add skills_status, agent_config, run_workflow tool definitions |
| `src/hooks.ts` | MODIFY | Re-scan skills on session:start if auto_discover enabled |
| `src/skills/discovery.ts` | CREATE | scanDirectory, parseFrontmatter, discoverSkills |
| `src/skills/registry-compat.ts` | CREATE | loadRegistry, mergeRegistryMetadata (legacy path only) |
| `src/skills/types.ts` | CREATE | DiscoveredSkill, SkillValidationResult |
| `src/agents/resolver.ts` | CREATE | resolveAgentConfig, loadPromptFile |
| `src/agents/validator.ts` | CREATE | validatePromptFilePath, validateSkillRefs |
| `src/agents/types.ts` | CREATE | ResolvedAgentConfig |
| `src/workflows/engine.ts` | CREATE | WorkflowEngine class, executeStep, advance |
| `src/workflows/state.ts` | CREATE | persistState, loadState, generateResumeToken |
| `src/workflows/interpolation.ts` | CREATE | interpolateTemplate, extractOutputRef |
| `src/workflows/gates.ts` | CREATE | handleGateStep, validateGateDecision |
| `src/workflows/types.ts` | CREATE | WorkflowState, StepResult, WorkflowResponse |

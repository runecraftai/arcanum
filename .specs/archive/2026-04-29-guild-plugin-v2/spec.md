# Guild Plugin V2 — Specification

## Problem Statement

The Guild plugin V1 provides basic agent status reporting and graphify context injection but lacks three critical capabilities for a mature multi-agent orchestration system:

1. **Skill discovery is manual** — Skills require a hand-maintained `registry.json` and Herald performs string concatenation to inject them. This is fragile, non-extensible, and invisible to the plugin ecosystem.
2. **Agent customization is scattered** — Per-agent prompt files, skill bindings, and model overrides live in disparate config files with no unified schema or validation.
3. **Workflows are implicit** — Multi-agent flows (Scout→Sage→Forge) are encoded in Herald's routing logic as prose instructions, not as declarative, inspectable, reusable definitions.

## Goals

| ID | Goal | Success Metric |
|----|------|----------------|
| G1 | Auto-discover skills from filesystem without registry | Skills found in global + legacy + project dirs appear in `skills_status` tool output |
| G2 | Unified per-agent customization block in config | `custom_agents.sage` config correctly resolves prompt_file, skills, model |
| G3 | Declarative workflow engine with gates | `run_workflow` tool executes a multi-step workflow, pausing at gates |
| G4 | Backward compatibility with V1 | Existing `agents`, `graphify`, `prompt` config sections continue to work |
| G5 | Zero runtime dependencies added | No new production deps beyond existing (zod, jsonc-parser, picocolors) |

## User Stories

### Feature A: Skills Discovery

- **US-A1**: As a developer, I want skills installed via skills.sh at `~/.config/opencode/skills/` (global) and `.agents/skills/` (project) to be auto-discovered so I don't need to maintain `registry.json`.
- **US-A2**: As a developer, I want legacy skills in `~/.config/opencode/.agents/skills/` (Herald's old agent-config directory) to be discovered for backward compatibility, with lowest priority.
- **US-A3**: As a developer, I want `skills_status` tool to show all discovered skills with metadata, validation status, source path, and source type (global/legacy/project).
- **US-A4**: As a developer, I want `registry.json` metadata (in the legacy path) to take precedence over frontmatter when both exist in that directory, for backward compatibility.
- **US-A5**: As a developer, I want invalid skill files (missing frontmatter, parse errors) to be reported with warnings, not crash the plugin.
- **US-A6**: As a developer, I want discovery priority to be: project > legacy > global (higher priority wins on name conflict).

### Feature B: Custom Agents Config

- **US-B1**: As a developer, I want to define per-agent prompt files, skill bindings, and model overrides in a single `custom_agents` config block.
- **US-B2**: As a developer, I want `prompt_file` content appended to the agent's base prompt, never replacing it.
- **US-B3**: As a developer, I want `skills` references validated against discovered skills from Feature A.
- **US-B4**: As a developer, I want `agent_config` tool to return the resolved configuration for a given agent name.
- **US-B5**: As a developer, I want path traversal attacks (e.g., `../../../etc/passwd`) in `prompt_file` blocked with clear error messages.

### Feature C: Workflow Engine

- **US-C1**: As a developer, I want to define multi-step agent workflows declaratively in config.
- **US-C2**: As a developer, I want `run_workflow` tool to execute workflows step-by-step, passing outputs between steps via template interpolation.
- **US-C3**: As a developer, I want gate steps to pause execution and require user approval before continuing.
- **US-C4**: As a developer, I want `on_reject`, `on_approve`, `on_error` transitions to control flow at each step.
- **US-C5**: As a developer, I want workflow execution state persisted to `.specs/sessions/` for recovery and auditability.
- **US-C6**: As a developer, I want workflows to be composable — a step can reference another workflow.

## Constraints

| Constraint | Detail |
|------------|--------|
| Runtime | Bun 1.3.5+, ESM only, TypeScript strict |
| Schema | Zod v4 for all validation |
| Plugin API | @opencode-ai/plugin hooks: `tool.execute.before`, `event`, `session.created` |
| Custom tools | Via `tool()` helper with Zod schema |
| Build | `bun build` + `tsc --emitDeclarationOnly` → `dist/` |
| Backward compat | V1 config must still parse without errors |
| Security | No path traversal in prompt_file; no arbitrary code execution in workflows |
| Dependencies | No new production dependencies |

## Skills Discovery Paths

| Priority | Source | Path | Notes |
|----------|--------|------|-------|
| 1 (lowest) | `"global"` | `~/.config/opencode/skills/` | skills.sh global install path |
| 2 | `"legacy"` | `~/.config/opencode/.agents/skills/` | Herald's old agent-config dir; has registry.json |
| 3 (highest) | `"project"` | `.agents/skills/` (relative to project root) | skills.sh project install path |

On name conflict, higher-priority source wins. Legacy source also checks for `registry.json` and merges its metadata over frontmatter within that source.

## Acceptance Criteria (System-Level)

- [ ] AC-1: Plugin loads with V1-only config (no `skills`, `custom_agents`, `workflows` sections) without errors
- [ ] AC-2: Plugin loads with full V2 config and all three feature sections active
- [ ] AC-3: `skills_status` tool returns discovered skills from global, legacy, and project directories
- [ ] AC-4: `agent_config` tool returns merged config for a named agent
- [ ] AC-5: `run_workflow` tool executes a 3-step workflow with gate pause
- [ ] AC-6: Invalid skill files produce warnings, not crashes
- [ ] AC-7: Path traversal in `prompt_file` is rejected at config validation time
- [ ] AC-8: Build produces `dist/index.js`, `dist/index.d.ts`, `dist/schema.json` without errors
- [ ] AC-9: Project-scoped skills override global skills of the same name
- [ ] AC-10: Legacy skills from `~/.config/opencode/.agents/skills/` override global but are overridden by project

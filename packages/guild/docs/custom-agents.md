# Custom agents

Custom agents extend Guild with new roles beyond the eight built-ins. Define them under `custom_agents` in your config — each entry is a fully self-contained agent with its own prompt, model, tools, skills, and delegation triggers.

## Custom agents vs agent overrides

Before reaching for a custom agent, consider whether an agent override suffices:

| | Agent override (`agents.<name>`) | Custom agent (`custom_agents.<name>`) |
| --- | --- | --- |
| Scope | Modify one of the eight built-ins | Define an entirely new agent |
| Prompt | `prompt_append` or `prompt` replacement | Full `prompt` or `prompt_file` |
| Mode | Inherits built-in's mode | Configurable (`subagent`, `primary`, `all`) |
| Category / cost | Inherited | Configurable for delegation table |
| Skills | Assigned to existing role | Assigned to new role |
| Triggers | Not available | Delegation triggers for Bard integration |

**Create a custom agent when:**
- You need a role that has no built-in equivalent (e.g., docs writer, release manager).
- You want the agent to appear in Bard's delegation table with its own triggers and cost.
- You need the agent to be independently selectable as a primary agent.

**Override a built-in when:**
- You want to tune an existing role's model, temperature, or tools.
- A few sentences in `prompt_append` can express the change.

## Supported fields

All fields are optional unless noted.

| Field | Type | Description |
| --- | --- | --- |
| `prompt` | `string` | System prompt — inline text. Mutually exclusive with `prompt_file`; `prompt_file` takes priority if both are set. |
| `prompt_file` | `string` | Path to a `.md` file containing the system prompt, resolved relative to the config file. |
| `model` | `string` | Model identifier (e.g. `anthropic/claude-sonnet-4`). Required unless `fallback_models` is set. |
| `display_name` | `string` | Human-readable name shown in the UI. Defaults to the agent name. |
| `mode` | `subagent \| primary \| all` | How the agent can be invoked. Defaults to `subagent`. |
| `fallback_models` | `string[]` | Fallback chain tried at runtime if the primary model fails. Use provider-qualified names. |
| `category` | `exploration \| specialist \| advisor \| utility` | Grouping used in Bard's delegation table. Defaults to `utility`. |
| `cost` | `FREE \| CHEAP \| EXPENSIVE` | Cost classification shown in the delegation table. Defaults to `CHEAP`. |
| `temperature` | `number` | Sampling temperature (0–2). |
| `top_p` | `number` | Top-p sampling (0–1). |
| `maxTokens` | `number` | Maximum tokens in the response. |
| `modelOptions` | `Record<string, unknown>` | Provider-specific passthrough (e.g. `reasoningEffort`, `thinking`). |
| `tools` | `Record<string, boolean>` | Tool permissions — `true` enables, `false` denies. |
| `skills` | `string[]` | Skill names to load into the prompt before the agent prompt. |
| `triggers` | `{ domain: string; trigger: string }[]` | Delegation triggers shown in Bard's delegation table. |
| `description` | `string` | Short description shown alongside the agent name in the delegation table. |

**`prompt_append` is not supported.** Custom agents use full prompt replacement (`prompt` or `prompt_file`). Use `agents.<name>.prompt_append` to append to a built-in agent.

## `prompt` vs `prompt_file`

- **`prompt`**: Inline string. Good for short prompts or when the prompt is specific to one deployment.
- **`prompt_file`**: Path to a `.md` file. Preferred for anything longer than a paragraph, or when the prompt is shared across environments. The file is loaded at startup and cached.

If both `prompt` and `prompt_file` are set, `prompt_file` wins. If the file cannot be resolved, Guild falls back to the inline `prompt` value.

```jsonc
// prompt_file takes priority
{
  "custom_agents": {
    "my-agent": {
      "prompt": "Fallback prompt if the file is missing.",
      "prompt_file": "agents/my-agent.md",
      "model": "anthropic/claude-sonnet-4"
    }
  }
}
```

## Examples

### docs-writer

A specialist that produces and maintains documentation. Registered as a subagent so Bard can delegate doc tasks without it being a top-level choice.

```jsonc
{
  "custom_agents": {
    "docs-writer": {
      "prompt": "You are a technical writer who produces clear, concise documentation. Write or update .md files following the project's documentation style guide. Prefer short sentences, concrete examples, and correct Markdown formatting. Do not generate code unless explicitly asked.",
      "model": "anthropic/claude-sonnet-4",
      "category": "specialist",
      "cost": "CHEAP",
      "tools": {
        "read": true,
        "glob": true,
        "write": true,
        "edit": true,
        "bash": false
      },
      "triggers": [
        { "domain": "Documentation", "trigger": "Writing or updating .md files, README sections, or inline code comments" },
        { "domain": "Documentation", "trigger": "Reviewing docs for clarity and correctness" }
      ],
      "description": "Produces and maintains clear, concise technical documentation."
    }
  }
}
```

### release-manager

A primary agent that orchestrates release workflows — bumping versions, updating changelogs, tagging, and coordinating the release checklist.

```jsonc
{
  "custom_agents": {
    "release-manager": {
      "prompt_file": "agents/release-manager.md",
      "model": "anthropic/claude-sonnet-4",
      "mode": "primary",
      "display_name": "Release Manager",
      "category": "advisor",
      "cost": "EXPENSIVE",
      "tools": {
        "bash": true,
        "read": true,
        "glob": true,
        "write": true,
        "edit": true,
        "todowrite": true,
        "grep": true
      },
      "triggers": [
        { "domain": "Releases", "trigger": "Cutting a release, bumping versions, updating changelogs, or tagging releases" },
        { "domain": "Releases", "trigger": "Running the release checklist or publishing to npm" }
      ],
      "description": "Orchestrates the full release lifecycle — versioning, changelogs, tagging, and publishing."
    }
  }
}
```

The referenced `agents/release-manager.md` might look like:

```markdown
# Release Manager

You orchestrate the end-to-end release process.

## Workflow

1. Confirm the release scope and version bump type (patch / minor / major).
2. Verify CI is green on the target branch.
3. Update the CHANGELOG — move the Unreleased section under the new version with today's date.
4. Bump the version in package.json.
5. Run schema checks if the Guild config schema was modified.
6. Create a signed commit with the release tag.
7. Run the publish step and confirm the package reaches npm.

## Constraints

- Never force-push to protected branches.
- Never skip the CI gate.
- Always verify the published version matches the local bump.
```

### migration-planner

A specialist for legacy system migrations. Uses a lower temperature for focused, deterministic planning output.

```jsonc
{
  "custom_agents": {
    "migration-planner": {
      "prompt": "You are a migration specialist who plans incremental migrations of legacy systems. Use the strangler fig pattern wherever possible — wrap existing functionality before replacing it. Break large migrations into safe, reversible steps. Always document the rollback plan before executing any migration step.",
      "model": "anthropic/claude-sonnet-4",
      "category": "specialist",
      "cost": "EXPENSIVE",
      "temperature": 0.3,
      "maxTokens": 4096,
      "tools": {
        "read": true,
        "grep": true,
        "glob": true,
        "bash": true,
        "edit": true,
        "write": true
      },
      "triggers": [
        { "domain": "Migration", "trigger": "Planning a legacy system migration, monolith decomposition, or cross-language rewrite" },
        { "domain": "Migration", "trigger": "Proposing an incremental migration strategy or strangler fig pattern" }
      ],
      "description": "Plans incremental migrations of legacy systems using safe, reversible steps."
    }
  }
}
```

### qa-specialist

A subagent focused on test strategy, coverage analysis, and quality gates. Denies write tools to prevent self-review bias.

```jsonc
{
  "custom_agents": {
    "qa-specialist": {
      "prompt_file": "agents/qa-specialist.md",
      "model": "anthropic/claude-sonnet-4",
      "category": "specialist",
      "cost": "CHEAP",
      "temperature": 0.2,
      "tools": {
        "read": true,
        "glob": true,
        "grep": true,
        "bash": true,
        "write": false,
        "edit": false
      },
      "skills": ["playwright-skill"],
      "triggers": [
        { "domain": "QA", "trigger": "Analyzing test coverage, identifying gaps, or proposing new test cases" },
        { "domain": "QA", "trigger": "Designing a test strategy for a new feature or refactor" },
        { "domain": "QA", "trigger": "Running tests, interpreting results, or triaging failures" }
      ],
      "description": "Analyzes test coverage, designs test strategies, and validates quality gates."
    }
  }
}
```

## See also

- [Agents](agents.md) — the eight built-in agents and the recommended customization order.
- [Configuration](configuration.md) — `custom_agents` config reference.
- [Skills](skills.md) — assigning skills to agents.
- [Orchestration](orchestration.md) — endorsed patterns and anti-patterns for composing agents (read before wiring a `custom_agents` entry that calls other agents).
- [prompt_append](prompt-append.md) — appending to built-in agents (not available for custom agents).
- [Model guide](model-guide.md) — model string format and provider prefixes.

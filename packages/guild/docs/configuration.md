# Configuration

Guild reads JSONC configuration from two optional locations. The two files are merged at startup; project values win on scalars and disabled-list keys, while agents, custom_agents, and categories are deep-merged.

This page documents the runtime merge rules and the top-level config sections you can set. For a field-level reference, use the generated JSON schema (see [Schema](#schema)).

## Config file locations

| Scope | Path (preferred → fallback) | Loaded when |
| --- | --- | --- |
| User | `~/.config/opencode/guild-opencode.jsonc` → `~/.config/opencode/guild-opencode.json` | Always (if present) |
| Project | `.opencode/guild-opencode.jsonc` → `.opencode/guild-opencode.json` | Always (if present) |

Both files are optional. If neither is present, Guild starts with built-in defaults.

The loader uses `jsonc-parser`, so both `.jsonc` and `.json` extensions are accepted. Comments (`//`, `/* */`) and trailing commas are supported in the runtime parser, even though the published schema artifact is plain JSON.

## Merge behavior

When both files exist, the loader reads the user file first and the project file second, then passes both to `mergeConfigs`:

| Field | Merge behavior |
| --- | --- |
| `agents` | Deep-merged per agent key. Per-agent fields are themselves deep-merged. |
| `custom_agents` | Deep-merged per custom agent key. |
| `categories` | Deep-merged per category key. |
| `disabled_hooks`, `disabled_tools`, `disabled_agents`, `disabled_skills` | String-array union (de-duplicated). |
| `background`, `tmux` | Project value wins if present; otherwise user value is used. |
| `experimental` | Shallow-merged key by key, with project values winning on scalar fields. |
| All other top-level scalars (e.g. `log_level`) | Project value wins if present. |

Notes:

- The loader attempts to recover from validation errors by dropping the failing top-level section. Other sections are preserved, and a warning is logged. If recovery fails entirely, the plugin falls back to built-in defaults so OpenCode still loads.
- Disabled-list keys are always **unions**, never replacements. To remove an entry, remove it from both files.
- Agent overrides are **additive** by design. Use `prompt_append` and `skills` for incremental customization; reserve `prompt` and `tools` for explicit overrides.

## Top-level sections

The current top-level keys are listed below in the order they appear in the schema. Every section is optional.

| Section | Purpose |
| --- | --- |
| `$schema` | IDE/schema URL hint (see [Schema](#schema)). |
| `agents` | Per-builtin-agent overrides (model, prompt, tools, skills, etc.). |
| `custom_agents` | User-defined agents in addition to the eight built-ins. |
| `categories` | Domain-specific Ranger worker specializations. |
| `disabled_hooks` | Hook names to skip at runtime. |
| `disabled_tools` | Tool names to hide from agent tool lists. |
| `disabled_agents` | Built-in agent names to skip registering. |
| `disabled_skills` | Skill names to skip loading. |

See [Disabling features](disabling-features.md) for all five disabling keys and the [Categories recipe](categories.md) for pattern-based domain routing.
| `skill_directories` | Extra relative directories to scan for skills. |
| `background` | Concurrency and stale-timeout settings for background agents. |
| `analytics` | Opt-in analytics and fingerprinting switches. |
| `continuation` | Recovery, idle, and todo continuation behavior. |
| `tmux` | Optional tmux layout for long-running sessions (preview). |
| `experimental` | Plugin load timeout, context-window thresholds. |
| `workflows` | Workflow discovery extras and disabled workflow names. |
| `log_level` | `DEBUG` / `INFO` / `WARN` / `ERROR`; overrides the `GUILD_LOG_LEVEL` env var. |

For field-level detail on each section, see the matching reference page:

- [Agents](agents.md) and [Skills](skills.md) for `agents`, `custom_agents`, `categories`, `disabled_*`, `skill_directories`.
- [Continuation](continuation.md) for `continuation`.
- [Analytics](analytics.md) for `analytics`.
- [Background agents](background-agents.md) for `background`.
- [Workflows — authoring](workflows/authoring.md) for `workflows`.

## Schema

Guild ships a generated JSON schema at `schema/guild-config.schema.json` in this repository. The schema is regenerated from the Zod source by running:

```bash
bun run schema:config
```

To check the checked-in schema is current:

```bash
bun run schema:config:check
```

### Editor integration

The published npm package includes `schema/guild-config.schema.json`, so you can point `$schema` at the published file directly. Use the version you have installed:

  ```jsonc
  {
    "$schema": "https://unpkg.com/@runecraft/guild@<version>/schema/guild-config.schema.json"
  }
  ```

You can also use `@latest`, but a pinned version keeps editor validation aligned with the installed release.

## Examples

The examples below are short by design. See the [Full Example recipe](full-example.md) for a complete production-ready config you can copy and adapt.

### Agent override

```jsonc
{
  "agents": {
    "bard": {
      "model": "anthropic/claude-sonnet-4",
      "fallback_models": [
        "openai/gpt-5-mini",
        "google/gemini-2.5-pro"
      ],
      "temperature": 0.2,
      "prompt_append": "Prefer additive changes and explicit acceptance criteria."
    }
  }
}
```

See the [Prompt append recipe](prompt-append.md) for a full guide to `prompt_append` and the [Custom agents recipe](custom-agents.md) for a comparison with `custom_agents`.

The `fallback_models` field defines an ordered list of models to try if the primary model fails at runtime. See [Model guide](model-guide.md#fallback-models) for the full semantics, eligible error types, and the one-shot failover guard.

### Skill assignment

```jsonc
{
  "agents": {
    "fighter": {
      "skills": ["guild-execute", "guild-verify"]
    }
  },
  "disabled_skills": ["guild-commit-learning"]
}
```

### Category specialist

```jsonc
{
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["apps/web/**", "packages/ui/**"],
      "prompt_append": "Stay within the frontend app boundary; surface cross-cutting concerns to the planner."
    }
  }
}
```

### Continuation

```jsonc
{
  "continuation": {
    "recovery": { "compaction": true },
    "idle": { "enabled": true, "work": true, "workflow": false }
  }
}
```

### Analytics (opt-in)

```jsonc
{
  "analytics": {
    "enabled": true,
    "use_fingerprint": false
  }
}
```

## Validate

After editing, restart OpenCode and run `/guild-health`. The health report shows which config files were loaded and any section-level validation warnings.

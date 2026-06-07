# Prompt append

`prompt_append` is a string field on built-in agents and category Rangers that appends additional instructions to the agent's base prompt without replacing it. This is the recommended way to shape agent behavior additively.

## How it works

When an agent starts, Guild loads its base prompt and appends the `prompt_append` value as a trailing section. The base prompt is preserved in full — `prompt_append` only adds to it.

Use `prompt_append` when you want an agent to follow a specific convention, remind it of a boundary, or tune its behavior — without rewriting the whole system prompt.

```jsonc
{
  "agents": {
    "fighter": {
      "prompt_append": "Prefer small, focused commits over large diffs."
    }
  }
}
```

**Validates against schema:** `agents.fighter.prompt_append` is a string field under the `agents` override object. No additional validation required. ✅

## Comparing customization layers

Guild offers three additive layers for shaping agent behavior. Choose the right one for the job:

| Layer | What it does | Best for |
| --- | --- | --- |
| `skills` | Injects a full skill document into the prompt | Teaching a multi-step workflow or reusable pattern |
| `prompt_append` | Appends a string to the base prompt | One-off reminders, conventions, or boundary constraints |
| `prompt` | Replaces the base prompt entirely | When additive customization cannot express the change |

**Rule of thumb:** If a few sentences can express the change, use `prompt_append`. If you need a structured document with sections and examples, write a skill.

## `prompt_append` vs `prompt`

`prompt_append` keeps the agent's system instructions intact:

```
[base prompt]
[... agent default behavior ...]

[prompt_append]
[your additional instructions]
```

`prompt` replaces everything:

```
[your full prompt — base is gone]
```

Because `prompt_append` preserves the base, upgrades to Guild's built-in prompts will be inherited automatically. A `prompt` replacement is frozen and may drift from future defaults.

**When to use `prompt` instead:** when you need to fundamentally reframe the agent's role or remove default behavior. Prefer `prompt_append` in all other cases.

## `prompt_append` vs `skills`

`prompt_append` is a single string. Skills are multi-section documents with frontmatter. They serve different purposes:

- **`prompt_append`**: One or two sentences. A constraint, a convention, or a single behavioral nudge.
- **Skills**: A full document with procedural steps, examples, and conventions. Used when the agent needs to follow a repeatable workflow.

Example `prompt_append`:

```jsonc
{
  "agents": {
    "rogue": {
      "prompt_append": "Prefer glob over find for directory searches."
    }
  }
}
```

Same outcome as a skill, but without the file overhead for a single-line constraint.

**Validates against schema:** `agents.rogue.prompt_append` is a string field. ✅

## Examples per agent

### Bard

```jsonc
{
  "agents": {
    "bard": {
      "model": "openai/gpt-5-mini",
      "prompt_append": "Before delegating, confirm the plan has explicit acceptance criteria."
    }
  }
}
```

**Validates against schema:** `agents.bard.prompt_append` is a string field. `model` uses the `provider/model-id` format required by the schema. ✅

### Fighter

```jsonc
{
  "agents": {
    "fighter": {
      "prompt_append": "Prefer additive changes and explicit acceptance criteria. Surface blockers early."
    }
  }
}
```

**Validates against schema:** `agents.fighter.prompt_append` is a string field. ✅

### Rogue

```jsonc
{
  "agents": {
    "rogue": {
      "model": "opencode-go/deepseek-v4-flash",
      "prompt_append": "Always summarize file paths relative to the project root. Never print absolute paths."
    }
  }
}
```

**Validates against schema:** `agents.rogue.prompt_append` is a string field. `model` uses the `opencode-go/` provider prefix required by the schema. ✅

### Wizard

```jsonc
{
  "agents": {
    "wizard": {
      "model": "openai/gpt-5.3-codex",
      "prompt_append": "Plans must include a dependency graph and a rollback section for each non-idempotent step."
    }
  }
}
```

**Validates against schema:** `agents.wizard.prompt_append` is a string field. `model` uses the `openai/` provider prefix. ✅

### Cleric

```jsonc
{
  "agents": {
    "cleric": {
      "model": "opencode-go/qwen3.5-plus",
      "review_models": ["anthropic/claude-sonnet-4"],
      "prompt_append": "Reject only for true blocking issues. Do not bikeshed on style preferences unless the project has an explicit lint rule."
    }
  }
}
```

**Validates against schema:** `agents.cleric.review_models` items must be provider-qualified (`<provider>/<model-id>`). `anthropic/claude-sonnet-4` matches the schema pattern `^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$`. ✅

### Paladin

```jsonc
{
  "agents": {
    "paladin": {
      "model": "opencode-go/minimax-m2.5",
      "review_models": ["anthropic/claude-opus-4.6"],
      "prompt_append": "When auditing auth flows, trace the token from issuance to validation and flag any missing校验 steps."
    }
  }
}
```

**Validates against schema:** `agents.paladin.review_models` items are provider-qualified. `anthropic/claude-opus-4.6` passes the schema pattern. ✅

### Ranger (base agent)

```jsonc
{
  "agents": {
    "ranger": {
      "model": "opencode/minimax-m2.5",
      "prompt_append": "Default Ranger: generic doer. Prefer small, focused edits over large refactors."
    }
  }
}
```

**Validates against schema:** `agents.ranger.prompt_append` is a string field. ✅

### Categories (Ranger variants)

```jsonc
{
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["apps/web/**", "packages/ui/**"],
      "prompt_append": "Stay within the frontend app boundary. Surface cross-cutting concerns to the planner rather than implementing them directly."
    },
    "data": {
      "model": "openai/gpt-5-mini",
      "patterns": ["packages/data/**", "services/etl/**"],
      "prompt_append": "Prefer columnar operations over row-by-row iteration. Document schema changes in the data catalog."
    },
    "backend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["services/api/**", "packages/core/**"],
      "prompt_append": "Validate all external inputs at the boundary. Do not assume caller is trusted."
    }
  }
}
```

**Validates against schema:** `categories.*.prompt_append` is a string field under the category object. All `model` values use the `<provider>/<model-id>` format. ✅

## Common mistakes

### Mistake 1: Using `prompt` when `prompt_append` suffices

```jsonc
// ❌ Avoid — overwrites the base prompt entirely
{
  "agents": {
    "fighter": {
      "prompt": "Execute tasks one by one. Prefer small commits."
    }
  }
}
```

```jsonc
// ✅ Prefer — appends without replacing
{
  "agents": {
    "fighter": {
      "prompt_append": "Execute tasks one by one. Prefer small commits."
    }
  }
}
```

When you use `prompt`, you lose every upgrade to the base prompt — new defaults, safety rails, and behavioral improvements in a Guild release will not reach your agent. Use `prompt_append` as the default and reserve `prompt` for cases where additive customization genuinely cannot express the change.

### Mistake 2: Putting `prompt_append` under `custom_agents`

`custom_agents` does not support `prompt_append`. Custom agents are defined with `prompt` (a full string) or `prompt_file` (a path to a file), not with additive append:

```jsonc
// ❌ Invalid — prompt_append is not a valid field for custom_agents
{
  "custom_agents": {
    "my-agent": {
      "prompt_append": "Additional instructions."
    }
  }
}
```

The schema rejects `prompt_append` under `custom_agents` (it is not listed in the `custom_agents` additionalProperties). Custom agents always use full prompt replacement via `prompt` or `prompt_file`.

```jsonc
// ✅ Correct — custom_agents uses prompt or prompt_file
{
  "custom_agents": {
    "my-agent": {
      "prompt": "You are a specialized code reviewer focused on performance patterns.",
      "model": "anthropic/claude-sonnet-4"
    }
  }
}
```

### Mistake 3: Confusing `prompt_append` with `skills`

`prompt_append` is a single string. A skill is a document with frontmatter, sections, and examples. They are not interchangeable:

| | `prompt_append` | Skills |
| --- | --- | --- |
| Format | String | Markdown with YAML frontmatter |
| Best for | One-off constraints, reminders | Multi-step workflows, conventions |
| Scoped to | One agent | Can be shared across agents |
| Maintenance | Inline in config | Separate file, versioned |

If you find yourself writing more than a few sentences in `prompt_append`, extract it into a skill.

### Mistake 4: Overriding the base `ranger` when using categories

When you define `categories`, each category gets its own Ranger agent. The base `ranger` agent still exists as a fallback. If you want generic doer work to also use a cheaper model, set `prompt_append` (and optionally `model`) on the base `ranger` agent separately:

```jsonc
// ❌ Missed — base ranger keeps the default (potentially expensive) model
{
  "categories": {
    "frontend": { "model": "anthropic/claude-sonnet-4" }
  }
}
```

```jsonc
// ✅ Complete — base ranger and category rangers are both tuned
{
  "agents": {
    "ranger": {
      "model": "opencode/minimax-m2.5",
      "prompt_append": "Generic doer. Keep changes minimal."
    }
  },
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "prompt_append": "Frontend specialist. Use framework idioms."
    }
  }
}
```

## See also

- [Agents](agents.md) — the eight built-in agents and the recommended customization order.
- [Skills](skills.md) — SKILL.md format and skill assignment.
- [Configuration](configuration.md) — full agent override example.
- [Model guide](model-guide.md) — model string format and provider prefixes.
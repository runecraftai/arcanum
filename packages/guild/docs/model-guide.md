# Model guide

Guild delegates model selection to OpenCode, but every agent has a default model and every agent can be overridden. This page documents the model string format, the defaults that ship with Guild, and how to choose models for cost and capability.

For the configuration fields, see [Configuration](configuration.md#agents). For background-specific overrides, see [Background agents](background-agents.md).

## Model string format

Models are identified by `<provider>/<model-id>`:

- `openai/gpt-5-mini`
- `anthropic/claude-sonnet-4`
- `opencode/minimax-m2.5`
- `google/gemini-2.5-pro`

The provider prefix is required. Bare model names are not supported.

OpenCode is responsible for resolving the provider. If a provider is not configured in your environment, the agent fails to start with a clear error. See [Troubleshooting](troubleshooting.md#model-not-found).

## Default models

Guild ships with sensible defaults. The defaults favor small, fast models for subagents and a more capable model for Bard.

| Agent | Default model | Why |
| --- | --- | --- |
| Bard | `openai/gpt-5-mini` | Orchestration needs reasoning and tool use. |
| Fighter | `openai/gpt-5-mini` | Step execution needs reasoning and tool use. |
| Ranger (base) | `opencode/minimax-m2.5` | Generic doer, kept cheap. |
| Wizard | `openai/gpt-5.3-codex` | Planning benefits from a capable coder model. |
| Rogue | `opencode-go/deepseek-v4-flash` | Fast and free — used for context gathering. |
| Warlock | `opencode-go/qwen3.6-plus` | Research benefits from a strong generalist. |
| Cleric | `opencode-go/qwen3.5-plus` | Review needs a careful reader. |
| Paladin | `opencode-go/minimax-m2.5` | Security reviews benefit from a careful model. |

Rogue and Warlock are intentionally free-tier defaults because they are high-volume, low-stakes agents. If you want them to use a more capable model, override them in your config.

## Overriding models

### Per agent

```jsonc
{
  "agents": {
    "wizard": { "model": "anthropic/claude-sonnet-4" },
    "rogue":  { "model": "openai/gpt-5-mini" }
  }
}
```

This is the most common override. Use it when one specific agent is too slow, too expensive, or too weak for your workflow.

### Per category Ranger

```jsonc
{
  "categories": {
    "frontend": { "model": "anthropic/claude-sonnet-4" },
    "data":     { "model": "openai/gpt-5-mini" }
  }
}
```

The category model overrides the base Ranger model only for that category's dedicated agent. The base `ranger` agent keeps its default.

### Per review model variant

```jsonc
{
  "review_models": {
    "anthropic/claude-sonnet-4": { "enabled": true }
  }
}
```

When you list a model in `review_models`, Guild registers parallel Cleric and Paladin variants named `cleric-review-<model>` and `paladin-review-<model>`. The base Cleric and Paladin keep their defaults; the variants are addressable separately. Use them when you want a more capable review on a specific run without changing the default for every run.

### Per background role

The `background` config can specify per-role models (planner, executor, reviewer). See [Background agents](background-agents.md).

### Per skill

A skill's frontmatter can include a `model` field. When the skill is active, the model override is applied for that step. Use this to bring a stronger model to a narrow part of the work without changing the agent's default.

## Cost vs capability

A practical decision tree:

1. **Is the task high-volume, low-stakes?** (Rogue context gathering, Warlock lookups, Ranger generic doer) — keep defaults or downgrade further to a free model.
2. **Is the task execution-shaped?** (Fighter driving a plan) — use a model that is good at tool use. Defaults are usually right.
3. **Is the task creative or planning-shaped?** (Wizard, Bard design work) — invest in a stronger model. The cost is small relative to the cost of a bad plan.
4. **Is the task review-shaped?** (Cleric, Paladin) — a careful reader beats a fast one. Promote to a stronger model for code that touches auth, crypto, or external integrations.

## Free-tier usage

If you are on a free tier or want to minimize cost:

- Keep Bard on a free-tier model and let it delegate to free-tier subagents.
- Use Rogue and Warlock's free defaults.
- Reserve paid models for Wizard and Cleric — the highest-leverage points in the workflow.

The full default model set uses a mix of providers specifically to keep costs low while preserving capability where it matters.

## Common pitfalls

- **Forgetting the provider prefix.** `gpt-5-mini` is rejected. Use `openai/gpt-5-mini`.
- **Overriding everything.** The defaults are tuned. Override only the agents that are not working for you.
- **Skipping the base `ranger` model.** If you set per-category models and the base Ranger still defaults to a paid model, generic doer work will still be expensive. Set a free-tier model on the base `ranger` agent too.
- **Confusing `model` with `models`.** The field is `model` (singular). `models` is not recognized.

## See also

- [Configuration — Agents](configuration.md#agents)
- [Background agents](background-agents.md)
- [Agents](agents.md)

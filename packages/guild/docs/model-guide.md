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

This is the most common override. Use it when one specific agent is too slow, too expensive, or too weak for your workflow. See [Prompt append recipe](prompt-append.md) for the recommended way to adjust behavior additively.

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
  "agents": {
    "cleric": {
      "model": "anthropic/claude-sonnet-4",
      "review_models": [
        "anthropic/claude-opus-4.6",
        "openai/gpt-5"
      ]
    }
  }
}
```

When you list a model in `review_models`, Guild registers parallel Cleric and Paladin variants named `cleric-review-<model>` and `paladin-review-<model>`. The base Cleric and Paladin keep their defaults; the variants are addressable separately. Use them when you want a more capable review on a specific run without changing the default for every run.

### Per background role

The `background` config can specify per-role models (planner, executor, reviewer). See [Background agents](background-agents.md).

### Per skill

A skill's frontmatter can include a `model` field. When the skill is active, the model override is applied for that step. Use this to bring a stronger model to a narrow part of the work without changing the agent's default.

## Fallback models

Every agent supports a `fallback_models` field — an ordered list of model strings that Guild uses when the primary model is unavailable. This field works for both built-in agents and custom agents.

```jsonc
{
  "agents": {
    "bard": {
      "model": "openai/gpt-5-mini",
      "fallback_models": [
        "anthropic/claude-sonnet-4",
        "google/gemini-2.5-pro"
      ]
    }
  }
}
```

### Model resolution precedence

When Guild resolves which model an agent should use, it follows this deterministic order:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | `model` (explicit override) | Always wins. If set, this model is used regardless of any fallback chain. |
| 2 | `uiSelectedModel` | The model the user selected in the UI. Only applies to agents with mode `primary` or `all`. |
| 3 | `categoryModel` | The model defined for a Ranger category. Only used if the model is available. |
| 4 | `fallback_models` (custom chain) | The user-defined fallback chain for this agent. Used before the built-in native chain. |
| 5 | Built-in native fallback chain | Guild's built-in chain for each agent (see table below). |
| 6 | `systemDefaultModel` | The system-level default model from OpenCode. |
| 7 | Offline best-guess | First entry in the active fallback chain, even if not confirmed available. |
| 8 | Hardcoded default | `anthropic/claude-opus-4.6` as a last resort. |

**Key rule:** `model` is a terminal override — if it is set, `fallback_models` is ignored for initial resolution. The fallback chain is used at runtime for failover (see below).

### Built-in native fallback chains

If you do not define `fallback_models`, each built-in agent has a native chain:

| Agent | Native fallback chain |
|-------|----------------------|
| Bard | `anthropic/claude-opus-4.6` → `anthropic/claude-opus-4` → `openai/gpt-5` |
| Fighter | `anthropic/claude-sonnet-4.6` → `anthropic/claude-sonnet-4` → `openai/gpt-5` |
| Ranger | `anthropic/claude-sonnet-4.6` → `anthropic/claude-sonnet-4` → `openai/gpt-5` |
| Wizard | `anthropic/claude-opus-4.6` → `anthropic/claude-opus-4` → `openai/gpt-5` |
| Rogue | `anthropic/claude-haiku-4.5` → `anthropic/claude-haiku-4` → `google/gemini-3-flash` |
| Warlock | `anthropic/claude-haiku-4.5` → `anthropic/claude-haiku-4` → `google/gemini-3-flash` |
| Cleric | `anthropic/claude-sonnet-4.6` → `anthropic/claude-sonnet-4` → `openai/gpt-5` |
| Paladin | `anthropic/claude-opus-4.6` → `anthropic/claude-opus-4` → `openai/gpt-5` |

## Runtime failover

When an agent's model fails during execution, Guild may automatically retry with the next model in the fallback chain — but **only for eligible OpenAI errors**.

### Eligible errors (automatic failover)

Failover is triggered only when the error originates from OpenAI and matches one of these conditions:

| Reason | Patterns matched |
|--------|-----------------|
| **quota** | `quota exceeded`, `insufficient_quota`, `you've exceeded your current quota`, `billing limit`, `usage limit` |
| **rate_limit** | `rate limit`, `rate_limit_exceeded`, `too many requests`, `429`, `requests per minute/day`, `tokens per minute/day` |
| **model_unavailable** | `model unavailable`, `model_not_found`, `model is overloaded`, `service unavailable`, `503`, `502`, `504`, `529`, `bad gateway`, `gateway timeout` |

### Non-eligible errors (no failover)

The following do **NOT** trigger automatic failover:

- Invalid API key or authentication errors
- Invalid prompt or tool errors
- Permission or policy errors
- Errors from non-OpenAI providers (Anthropic, Google, etc.)
- Any error that cannot be confidently classified

**Design principle:** fail closed. When in doubt, Guild does not switch models.

### One-shot guard

To prevent infinite retry loops, Guild allows **at most one automatic failover attempt per execution** (identified by `sessionId:agent`). If the fallback model also fails, the error propagates normally — no further retries are attempted.

### Failover flow

1. Agent call with primary model fails
2. Error is classified by the OpenAI failover classifier
3. If not eligible → error propagates immediately
4. If eligible → check one-shot guard
5. If guard blocks → error propagates (loop prevented)
6. If guard allows → select next model from agent's fallback chain
7. Re-execute once with the fallback model
8. If fallback succeeds → continue normally
9. If fallback fails → propagate error, mark guard

### Observability

Every failover decision is logged with structured fields:

```
[failover:eligible_retry] session=abc agent=bard openai/gpt-5-mini → anthropic/claude-sonnet-4 reason=quota
[failover:blocked_loop] session=abc agent=bard already attempted for this execution
[failover:error_ignored] session=abc provider=openai reason=none
[failover:retry_succeeded] session=abc anthropic/claude-sonnet-4
[failover:retry_failed] session=abc anthropic/claude-sonnet-4 also failed
```

Set `log_level: "DEBUG"` in your Guild config to see these events. Search the OpenCode log for `[failover:` to find all failover-related entries.

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
- [Full Example recipe](full-example.md) — a complete production-ready config with provider-qualified model strings.

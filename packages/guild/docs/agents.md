# Agents

Guild registers eight built-in agents, each scoped to a specific role in the development lifecycle. This page describes what each agent does, which mode it runs in, and how to think about delegating work to it.

For configuration fields, see [Configuration](configuration.md). For how agents load skills, see [Skills](skills.md).

## Agent modes

Every agent has a `mode` that controls how OpenCode uses it.

| Mode | Behavior |
| --- | --- |
| `primary` | Selectable as the main session agent. Bard and Fighter are primaries. |
| `subagent` | Callable only via delegation from a primary agent. Wizard, Rogue, Warlock, Cleric, and Paladin are subagents. |
| `all` | Selectable as a primary **and** callable as a subagent. Ranger uses `all` because it can be both directly invoked and dispatched via the category system. |

You can override the mode via `agents.<name>.mode` in your config. See [Configuration](configuration.md).

## The eight built-in agents

### Bard (Guildmaster) — primary

The central team lead. Bard plans tasks, coordinates work, and delegates to specialized agents. Bard is the default landing agent when a Guild session starts.

**When to use directly**: high-level planning, system design, or any task that needs full multi-agent orchestration. Bard also accepts the `ultrawork` keyword for maximum effort, parallel agents, and deep execution.

### Fighter (Execution Lead) — primary

The execution orchestrator. Fighter drives todo-list execution of multi-step plans, focusing on sequential implementation without spawning broad subagent trees. Use Fighter after a plan exists and you want to execute it.

**When to use directly**: implementation tasks that have a clear plan, or any multi-step coding work where you want the model to track progress through todos.

### Ranger (Specialist) — `all`

A domain-specific specialist worker. The base Ranger agent is a generic fallback. When you define `categories` in your config, Guild registers a dedicated `ranger-<category-name>` agent for each one with its own model, prompt, and tool overrides. Fighter routes work to category Rangers based on file path patterns.

**When to use directly**: domain work in a specific category, or as a generic doer for tasks that should not require high-cost models.

See [Configuration — Category specialist example](configuration.md#category-specialist) and the [category](README.md) section below.

### Wizard (Planner) — subagent

The strategic planner. Wizard analyzes requirements, produces detailed implementation plans with research and dependency mapping, and writes the plan to `.guild/plans/`. Wizard is invoked by Bard (or by running the planning skill) when a plan is needed.

**When to use**: planning a new feature, decomposing a large task, or producing a research-backed approach to a complex problem.

### Rogue (Scout) — subagent

A fast, read-only codebase explorer. Rogue uses grep, glob, and read tools to navigate a codebase without writing anything. Rogue is the cheapest agent — use it for context gathering before any edit.

**When to use**: finding patterns and usages across files, understanding how an existing subsystem works, or gathering context for an edit.

**When to avoid**: when the file path is already known, when the work is a single-file change, or when a single grep would do.

### Warlock (Researcher) — subagent

Performs external documentation lookups and reference searches. Warlock provides synthesized answers with source citations.

**When to use**: "How does X work in library Y?", "What is the official API for…?", or any question that needs an external reference rather than local code.

### Cleric (Reviewer) — subagent

Reviews completed work and plans with a critical but fair eye. Cleric rejects only for true blocking issues and avoids bikeshedding.

**When to use**: after a multi-file implementation, before executing a complex plan, when you are unsure if the work meets the acceptance criteria, or after two or more revision attempts on the same task.

**When to avoid**: single-file trivial changes, typos, or when the user explicitly asks to skip review.

### Paladin (Security) — subagent

Audits code changes for security vulnerabilities and specification compliance with a skeptical bias.

**When to use**: after changes that touch auth, crypto, tokens, or input handling; when implementing OAuth, OIDC, WebAuthn, JWT, or similar protocols; or after changes to CORS, CSP, or security headers.

**When to avoid**: pure documentation or README changes, CSS-only changes, or test-only changes that do not modify security test assertions.

## Categories and the Ranger system

Guild supports a lightweight **category system** for domain-specific routing. When you define `categories` in your config, each entry creates a dedicated Ranger agent:

- The agent name is `ranger-<category-name>`.
- It inherits Ranger's base tool policy and prompt.
- It can override the model, prompt (`prompt_append`), temperature, and tools.
- `patterns` is a list of glob patterns that Fighter uses to route work to this category's Ranger.

Example:

```jsonc
{
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["apps/web/**", "packages/ui/**"],
      "prompt_append": "Stay within the frontend app boundary."
    }
  }
}
```

The base `ranger` agent remains as a generic fallback. To disable a category's Ranger entirely, list `ranger-<category-name>` in `disabled_agents`.

## Review model variants

For Cleric and Paladin, you can supply `review_models` in an agent override. Guild creates a parallel variant of the reviewer (e.g. `cleric-review-anthropic/claude-sonnet-4`) registered as a subagent that Bard can route to when an explicit review model is preferred. The original Cleric/Paladin is unaffected.

## Customizing agents

Prefer additive customization. The recommended order is:

1. **Skills** — assign skills via `agents.<name>.skills` to inject domain expertise.
2. **`prompt_append`** — append additional instructions without replacing the base prompt. See [Prompt append recipe](prompt-append.md).
3. **`temperature`, `top_p`, `model`** — adjust sampling or model without touching the prompt.
4. **`prompt`** — full replacement. Use only when the additive approach cannot express the change.
5. **`tools`** — explicit allow/deny per tool. Booleans only; an empty object merges no overrides.

See [Configuration — Agent override example](configuration.md#agent-override) for a concrete snippet.

## Model fallback and runtime failover

Each built-in agent has a native fallback chain (documented in [Model guide](model-guide.md#built-in-native-fallback-chains)). You can override this chain per agent using `fallback_models` in your config.

### How it works

- **Initial resolution:** Guild picks the model using the precedence defined in [Model guide](model-guide.md#model-resolution-precedence). The explicit `model` override always wins.
- **Runtime failover:** If the chosen model fails during execution with an **eligible OpenAI error** (quota exceeded, rate limit / 429, or model unavailable), Guild automatically retries once with the next model in the agent's fallback chain.
- **One-shot guard:** Only one automatic failover is allowed per execution. If the fallback also fails, the error propagates normally.
- **Conservative classification:** Errors from non-OpenAI providers, authentication failures, invalid prompts, and permission errors do NOT trigger failover. When in doubt, Guild fails closed.

### Configuring per-agent fallback

```jsonc
{
  "agents": {
    "bard": {
      "model": "openai/gpt-5-mini",
      "fallback_models": ["anthropic/claude-sonnet-4", "google/gemini-2.5-pro"]
    }
  }
}
```

For the full list of eligible errors, failover flow, and observability details, see [Model guide — Runtime failover](model-guide.md#runtime-failover).

## Disabling agents

To prevent a built-in agent from registering, add its name to `disabled_agents`:

```jsonc
{ "disabled_agents": ["paladin"] }
```

`disabled_agents` is a **union** across user and project files — remove the entry from both files to bring the agent back. See [Configuration](configuration.md#merge-behavior) and [Disabling features](disabling-features.md).

## See also

- [Configuration](configuration.md) — `agents`, `custom_agents`, and `categories` fields.
- [Skills](skills.md) — assigning skills to agents.
- [Architecture](architecture.md) — how the agent registry is built at startup.

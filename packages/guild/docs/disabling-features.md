# Disabling features

Guild exposes five mechanisms to shrink the active surface area at startup. Use them to remove features you do not need, tighten security posture, or prevent unwanted agent behavior in specific environments.

## The five disabling keys

| Key | What it disables | Merge behavior |
| --- | --- | --- |
| `disabled_agents` | Built-in agent names and category Ranger names (`ranger-<category>`) | Union (user + project) |
| `disabled_tools` | Tool names from all agent tool lists | Union (user + project) |
| `disabled_hooks` | Hook names from the plugin runtime surface | Union (user + project) |
| `disabled_skills` | Skill names from the skill loader | Union (user + project) |
| `agents.<name>.disable` | A specific agent instance when the schema flag is set | Scalar override (project wins) |

All five arrays are **union-merged** across user and project config files. This means an entry in either file disables the feature. To re-enable a feature, remove the entry from **both** files.

> **Merge behavior recap:** The loader calls `mergeConfigs` which produces a union (de-duplicated) of each disabled list. Project-level scalars win on conflict. See [Configuration](configuration.md#merge-behavior) for the full merge table.

## `disabled_agents`

Removes agents from the registry entirely. Fighter will not route to a disabled agent and it will not appear in the agent list.

```jsonc
{
  "disabled_agents": ["paladin", "ranger-frontend"]
}
```

- `paladin` — removes the Paladin security subagent.
- `ranger-frontend` — prevents the category Ranger for the `frontend` category from registering. Files that would have matched its patterns fall through to the base `ranger` or the next matching category.

See [Agents — disabling agents](agents.md#disabling-agents) and [Categories — disabling a category Ranger](categories.md#disabling-a-category-ranger).

## `disabled_tools`

Removes tools from every agent's tool list at startup. Agents will not see or call the listed tools regardless of their built-in policy.

```jsonc
{
  "disabled_tools": ["bash", "webfetch"]
}
```

> **Security note:** Disabling a tool does not uninstall it from OpenCode. A determined actor with access to the OpenCode instance could re-enable it via a plugin override. Use this for reducing accidental exposure, not as a hard security boundary.

## `disabled_hooks`

Removes runtime hooks from the plugin. Hooks run code at specific lifecycle points (e.g., before a tool call, after a completion). Disabling a hook prevents Guild from invoking it.

```jsonc
{
  "disabled_hooks": ["on_tool_call", "on_completion"]
}
```

> **Note:** Disabling a core hook may degrade Guild functionality. Check the hook documentation or the source at `packages/guild/src/application/hooks/` before disabling an unfamiliar hook name.

## `disabled_skills`

Prevents skills from being loaded into any agent's prompt. This applies to bundled Guild skills, user-level skills, and project-level skills.

```jsonc
{
  "disabled_skills": ["guild-commit-learning", "guild-handoff"]
}
```

To re-enable, remove the entry from both config files. See [Skills — disabling skills](skills.md#disabling-skills).

## `agents.<name>.disable`

When the schema supports the `disable` flag on an agent entry, setting it to `true` suppresses that agent at registration time — equivalent to adding it to `disabled_agents`, but expressed per-agent inline:

```jsonc
{
  "agents": {
    "warlock": {
      "disable": true
    }
  }
}
```

This is useful when you want to keep the agent in the config alongside other overrides (e.g., a model change) and disable it in a single place.

> **Validate disable** — Run `/guild-health` after updating any disabling config. The agent list should not include the disabled entry, and the health report confirms which config files were loaded.

## Example setups

### Minimal — lean team

A two-person team that only uses Bard and Fighter, no reviewers or specialists:

```jsonc
{
  "disabled_agents": [
    "wizard",
    "rogue",
    "warlock",
    "cleric",
    "paladin",
    "ranger"
  ],
  "disabled_skills": [
    "guild-commit-learning",
    "guild-handoff",
    "guild-review",
    "guild-security"
  ]
}
```

> **Validate minimal** — After restarting OpenCode, run `/guild-health`. The agent list should show only `bard` and `fighter`. Skills should not include any `guild-*` entries.

### Security-conscious — restricted tools and no external agents

A security-sensitive environment that disables tool access and external-research agents:

```jsonc
{
  "disabled_agents": ["warlock", "paladin"],
  "disabled_tools": ["bash", "webfetch", "github_personal"],
  "disabled_hooks": ["on_completion"]
}
```

> **Validate security** — Run `/guild-health` to confirm agents and tools are absent. Attempt a task that would normally invoke `warlock`; it should fall through to the base `ranger` or report as unavailable.

### Category-Ranger — domain teams with selective routing

A monorepo with three category Rangers, where the `infra` category is restricted to senior engineers and the base `ranger` is disabled to enforce explicit category routing:

```jsonc
{
  "disabled_agents": ["ranger"],
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["apps/web/**", "packages/ui/**"],
      "prompt_append": "Stay within the frontend app boundary."
    },
    "backend": {
      "model": "openai/gpt-5-mini",
      "patterns": ["apps/api/**", "services/**", "packages/core/**"]
    },
    "infra": {
      "model": "openai/gpt-5-mini",
      "patterns": ["infra/**", "deploy/**", "k8s/**", "terraform/**"],
      "prompt_append": "Follow immutable infrastructure patterns. Document rollback steps."
    }
  }
}
```

> **Validate category routing** — Create a task touching `infra/terraform/main.tf`. Fighter should route to `ranger-infra` and not to the base `ranger`. Confirm via `/guild-health` that `ranger-infra` is registered and `ranger` is not.

## See also

- [Configuration](configuration.md) — merge rules and the full field reference.
- [Agents](agents.md) — built-in agent list and mode table.
- [Categories](categories.md) — pattern-based routing and category Ranger registration.
- [Skills](skills.md) — skill discovery, assignment, and the bundled skill list.
- [Architecture](architecture.md) — plugin entry, config loading, and the agent registry.
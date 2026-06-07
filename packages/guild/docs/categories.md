# Categories

Categories route domain-specific work to specialized Ranger agents. When you define `categories` in your config, Guild registers a `ranger-<category>` agent for each one. Fighter uses glob `patterns` to dispatch tasks to the right agent automatically.

Categories are lightweight specializations. For a new role with its own triggers, model, and delegation behavior, use [Custom agents](custom-agents.md) instead.

## `ranger-<category>` registration

Every category entry creates a dedicated Ranger agent with the name `ranger-<category>`. For example, a category named `frontend` produces an agent called `ranger-frontend`.

The agent inherits Ranger's base tool policy and prompt, then applies your overrides:

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

The base `ranger` agent remains as a generic fallback for tasks that do not match any pattern.

> **Validate registration** — After adding a category, restart OpenCode and run `/guild-health`. The agent list should include `ranger-frontend` (or your category name) alongside the eight built-ins.

## Pattern-based routing

Fighter inspects each task's file paths and matches them against the `patterns` defined in each category. The first category whose patterns match the task's files receives the delegation.

**How matching works:**

- Patterns are glob expressions evaluated against the full absolute file path.
- Multiple patterns per category are supported; a match on any one pattern is sufficient.
- If no category pattern matches, Fighter delegates to the base `ranger` agent.
- Exact category preference is deterministic: the first category with a matching pattern wins.

**Pattern examples:**

| Pattern | Matches |
| --- | --- |
| `apps/web/**` | All files under `apps/web/` at any depth |
| `packages/ui/**` | All files under `packages/ui/` |
| `**/*.test.ts` | Test files anywhere in the tree |
| `infra/**/*.tf` | Terraform files under `infra/` |

> **Tip:** Keep patterns specific enough to avoid unintended overlap. If two categories both match a file, the first category in your config wins.

## Categories vs skills

Categories and skills solve different problems:

| | Category | Skill |
| --- | --- | --- |
| Scope | Agent-level — creates a dedicated `ranger-<category>` agent | Prompt-level — injects content into any agent's prompt |
| Routing | File-pattern matching via Fighter | Assigned explicitly in config or triggered by the agent |
| Override | Model, prompt, temperature, tools per category agent | Domain knowledge and conventions |
| Persistence | Configured once, applies everywhere | Can be loaded or disabled per agent |

Use categories when you want work to be routed to a domain specialist based on file location. Use skills when you want to inject specific guidance or workflows into any agent's prompt. The two are complementary — a category Ranger can also have skills assigned via `agents.ranger-<category>.skills`.

## Domain examples

### Frontend

```jsonc
{
  "categories": {
    "frontend": {
      "model": "anthropic/claude-sonnet-4",
      "patterns": ["apps/web/**", "packages/ui/**", "apps/mobile/**"],
      "prompt_append": "Prefer component composition over prop drilling. Use the existing design system tokens before creating new CSS variables. Surface API contract gaps to the planner before implementing."
    }
  }
}
```

### Backend

```jsonc
{
  "categories": {
    "backend": {
      "model": "openai/gpt-5-mini",
      "patterns": ["apps/api/**", "services/**", "packages/core/**"],
      "prompt_append": "Follow existing API conventions. Validate inputs at the boundary. Write idempotent operations where possible."
    }
  }
}
```

### Infrastructure

```jsonc
{
  "categories": {
    "infra": {
      "model": "openai/gpt-5-mini",
      "patterns": ["infra/**", "deploy/**", "k8s/**", "terraform/**", "ansible/**"],
      "prompt_append": "Prefer immutable infrastructure patterns. Document any manual steps required for rollback. Ensure secrets are never hardcoded."
    }
  }
}
```

### Documentation

```jsonc
{
  "categories": {
    "docs": {
      "model": "openai/gpt-5-mini",
      "patterns": ["docs/**", "README.md", "CHANGELOG.md", "**.md"],
      "prompt_append": "Write concise, concrete sentences. Use correct Markdown formatting. Include code examples only when they add clarity beyond a description."
    }
  }
}
```

> **Note:** `**.md` matches Markdown files at any depth. If you have other categories that also match `.md` files, put the more specific patterns first (e.g., `docs/**/*.md` before `**.md`) so that the most targeted category wins.

## Disabling a category Ranger

To prevent a category's Ranger from registering, add `ranger-<category>` to `disabled_agents`:

```jsonc
{
  "disabled_agents": ["ranger-frontend", "ranger-infra"]
}
```

This removes the agent from the registry entirely. Fighter will skip that category when routing — files that would have matched its patterns fall through to the base `ranger` or the next matching category.

> **Validate disable** — Run `/guild-health` after updating `disabled_agents`. The agent list should no not include the disabled `ranger-<category>` entry.

> **Merge behavior:** `disabled_agents` is a union across user and project config files. To re-enable a category Ranger, remove its entry from both files.

## See also

- [Agents — Ranger](agents.md#ranger-specialist--all) — the base Ranger agent and its mode.
- [Configuration](configuration.md) — `categories` config reference and merge rules.
- [Custom agents](custom-agents.md) — for roles that need their own triggers and delegation behavior beyond category routing.
- [Skills](skills.md) — assigning domain-specific guidance to any agent.
- [Model guide](model-guide.md) — model string format and provider-qualified names.
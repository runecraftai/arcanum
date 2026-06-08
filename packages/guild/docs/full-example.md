# Full Configuration Example

This page shows a complete `.opencode/guild-opencode.jsonc` you can copy, paste, and adapt. Every top-level section is included with representative values. Lines prefixed with `//` are JSONC comments — they are stripped by the parser and are safe to leave in.

> **Validate after editing.** Restart OpenCode and run `/guild-health`. The health report lists which config files were loaded and flags any section-level validation warnings.

---

```jsonc
// .opencode/guild-opencode.jsonc
// ──────────────────────────────────────────────────────────────────────────────
// Guild — full configuration reference
// Schema: https://unpkg.com/@runecraft/guild@<version>/schema/guild-config.schema.json
// ──────────────────────────────────────────────────────────────────────────────
{
  // IDE / schema hint — keep this so your editor can offer autocomplete.
  // Replace <version> with the Guild version you are targeting.
  "$schema": "https://unpkg.com/@runecraft/guild@<version>/schema/guild-config.schema.json",

  // ── Agents ─────────────────────────────────────────────────────────────────
  // Override any built-in agent's model, prompt, tools, skills, or sampling
  // parameters. See: docs/agents.md
  "agents": {
    // The Guildmaster — plans and orchestrates.
    "bard": {
      // Provider-qualified model name. See docs/model-guide.md.
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": [
        "openrouter/openai/gpt-4o-mini",
        "openrouter/google/gemini-2.5-pro"
      ],
      "temperature": 0.7,
      "top_p": 0.95,
      "prompt_append": "Think out loud before delegating. Surface risks early.",
      // Enable guild-execute and guild-verify skills for Bard.
      "skills": ["guild-execute", "guild-verify"]
    },

    // The execution lead — drives multi-step implementation.
    "fighter": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": ["openrouter/openai/gpt-4o-mini"],
      // Lower temperature keeps the executor focused and deterministic.
      "temperature": 0.3,
      "prompt_append": "Prefer additive changes and explicit acceptance criteria.",
      "skills": ["guild-execute", "guild-verify", "tlc-spec-driven"]
    },

    // Domain specialist — configured below under `categories`.
    "ranger": {
      "model": "openrouter/openai/gpt-4o-mini",
      "fallback_models": ["openrouter/google/gemini-2.5-flash"],
      "temperature": 0.4
    },

    // The strategic planner — subagent only.
    "wizard": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "temperature": 0.6
    },

    // Fast read-only explorer — subagent only.
    "rogue": {
      "model": "openrouter/openai/gpt-4o-mini",
      "temperature": 0.3
    },

    // External documentation researcher — subagent only.
    "warlock": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "temperature": 0.5
    },

    // Code and plan reviewer — subagent only.
    // Provide a separate review model variant for Cleric.
    "cleric": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      // review_models must be provider-qualified.
      "review_models": [
        "openrouter/openai/gpt-4o-mini",
        "openrouter/anthropic/claude-3-5-sonnet-latest"
      ]
    },

    // Security auditor — subagent only.
    "paladin": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "review_models": ["openrouter/openai/gpt-4o-mini"]
    }
  },

  // ── Custom agents ─────────────────────────────────────────────────────────
  // Define additional agents beyond the eight built-ins. Each custom agent is
  // registered as a subagent and can be invoked by name from any primary agent.
  // See: docs/custom-agents.md
  "custom_agents": {
    "devops": {
      "display_name": "DevOps Engineer",
      "description": "Handles CI/CD pipelines, Docker, Kubernetes, and infrastructure-as-code.",
      "category": "specialist",
      "cost": "EXPENSIVE",
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": ["openrouter/openai/gpt-4o-mini"],
      "temperature": 0.4,
      "prompt": "You are a senior DevOps engineer. You write, review, and debug CI/CD configurations, Dockerfiles, Helm charts, and Terraform modules. Prefer GitOps patterns and declarative configuration.",
      "skills": ["aws-advisor", "best-practices"]
    },

    "data-engineer": {
      "display_name": "Data Engineer",
      "description": "Builds ETL pipelines, data models, and analytics infrastructure.",
      "category": "specialist",
      "cost": "EXPENSIVE",
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "temperature": 0.5,
      "prompt": "You are a data engineer. You design and implement ETL pipelines, SQL transformations, data warehouse schemas, and streaming architectures. Prefer dbt, Apache Airflow, and Spark patterns."
    },

    "ux-researcher": {
      "display_name": "UX Researcher",
      "description": "Conducts user research, accessibility audits, and design critiques.",
      "category": "advisor",
      "cost": "CHEAP",
      "model": "openrouter/openai/gpt-4o-mini",
      "temperature": 0.6,
      "prompt": "You are a UX researcher and accessibility specialist. You evaluate interfaces for WCAG 2.1 compliance, conduct heuristic reviews, and suggest evidence-based improvements."
    },

    // A utility agent that auto-triggers in specific contexts.
    "changelog-writer": {
      "display_name": "Changelog Writer",
      "description": "Generates Keep a Changelog formatted entries from git diffs.",
      "category": "utility",
      "cost": "FREE",
      "model": "openrouter/openai/gpt-4o-mini",
      "temperature": 0.3,
      "triggers": [
        {
          "domain": "git",
          "trigger": "commit"
        }
      ],
      "prompt": "You write concise, Keep a Changelog formatted entries for each commit. Group by Added / Changed / Fixed / Removed / Security."
    }
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  // Domain-specific specializations for the Ranger agent. Each entry creates a
  // `ranger-<name>` agent (e.g. ranger-frontend). Fighter routes work to a
  // category Ranger when a file path matches one of its `patterns`.
  // See: docs/categories.md
  "categories": {
    "frontend": {
      "description": "React, Next.js, CSS, and UI component work.",
      // Provider-qualified model name.
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": ["openrouter/openai/gpt-4o-mini"],
      "temperature": 0.4,
      "patterns": [
        "apps/web/**",
        "packages/ui/**",
        "packages/design-system/**",
        "*.css",
        "*.module.css"
      ],
      "prompt_append": "Stay within the frontend app boundary. Surface cross-cutting concerns to the planner.",
      "tools": {
        // Explicitly enable the Chrome DevTools MCP (if available).
        "chrome-devtools": true,
        // Deny access to infrastructure tools in this category.
        "terraform": false,
        "kubectl": false
      }
    },

    "backend": {
      "description": "Server-side APIs, databases, and service infrastructure.",
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": ["openrouter/openai/gpt-4o-mini"],
      "patterns": [
        "apps/api/**",
        "apps/services/**",
        "packages/core/**",
        "packages/db/**"
      ],
      "prompt_append": "Prefer transactional patterns and explicit error handling. Avoid blocking I/O in hot paths.",
      "tools": {
        "bash": true,
        "psql": true
      }
    },

    "infra": {
      "description": "Kubernetes, Terraform, CI/CD, and cloud infrastructure.",
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "fallback_models": ["openrouter/openai/gpt-4o-mini"],
      "patterns": [
        "k8s/**",
        "terraform/**",
        ".github/workflows/**",
        "Dockerfile*",
        "docker-compose*.yml"
      ],
      "prompt_append": "Apply infrastructure-as-code best practices. Validate Terraform plans before applying.",
      "tools": {
        "kubectl": true,
        "terraform": true,
        "docker": true
      }
    },

    "data": {
      "description": "ETL pipelines, data models, SQL, and analytics.",
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "patterns": [
        "pipelines/**",
        "dbt/**",
        "warehouse/**",
        "*.sql"
      ],
      "prompt_append": "Prefer idempotent transformations. Document schema changes in migration files."
    }
  },

  // ── Background agents ──────────────────────────────────────────────────────
  // Tune concurrency limits and stale timeouts for background work.
  // See: docs/background-agents.md
  "background": {
    // Maximum number of agents that can run concurrently across all providers.
    "defaultConcurrency": 4,
    // Per-provider concurrency ceiling — prevents one provider from saturating
    // the shared pool.
    "providerConcurrency": {
      "openrouter/openai": 2,
      "openrouter/anthropic": 4,
      "openrouter/google": 2
    },
    // Per-model concurrency ceiling — useful for rate-limited models.
    "modelConcurrency": {
      "openrouter/openai/gpt-4o-mini": 3,
      "openrouter/anthropic/claude-sonnet-4-20250514": 2,
      "openrouter/google/gemini-2.5-pro": 2
    },
    // Milliseconds before a background agent is considered stale and terminated.
    // Must be >= 60000 (1 minute).
    "staleTimeoutMs": 300000
  },

  // ── Continuation ──────────────────────────────────────────────────────────
  // Control recovery behavior, idle continuation, and todo-prompt persistence.
  // See: docs/continuation.md
  "continuation": {
    // Recovery options — triggered when a session resumes after interruption.
    "recovery": {
      // Enable message compaction on recovery to stay within context limits.
      "compaction": true
    },
    // Idle continuation — controls what happens when the agent has no active
    // work in flight.
    "idle": {
      // Enable idle continuation (default: false — must be opted in).
      "enabled": true,
      // Continue executing work from the active todo list.
      "work": true,
      // Continue executing the active workflow step.
      "workflow": true,
      // Re-prompt with the current todo list when the session resumes.
      "todo_prompt": true
    }
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  // Opt-in telemetry. Disabled by default.
  // See: docs/analytics.md
  "analytics": {
    // Enable anonymous usage analytics.
    "enabled": false,
    // Use a persistent fingerprint (derived from machine ID) instead of a
    // session-scoped one. Improves cross-session cohort accuracy.
    "use_fingerprint": false
  },

  // ── Log level ─────────────────────────────────────────────────────────────
  // Overrides the GUILD_LOG_LEVEL environment variable.
  // DEBUG · INFO · WARN · ERROR
  "log_level": "INFO",

  // ── Disabled features ──────────────────────────────────────────────────────
  // Uncomment and adjust the arrays below to disable specific parts of Guild.
  // All arrays default to [] (nothing disabled).
  //
  // "disabled_hooks": [],
  // "disabled_tools": [],
  // "disabled_agents": [],
  // "disabled_skills": [],

  // ── Skill directories ──────────────────────────────────────────────────────
  // Extra relative directories to scan for skills (in addition to the built-in
  // skill locations). Paths are relative to the config file's directory.
  //
  // "skill_directories": [".skills", "../shared-skills"],

  // ── Tmux layout ──────────────────────────────────────────────────────────
  // Optional tmux integration for long-running multi-agent sessions (preview).
  // See: docs/background-agents.md#tmux-preview
  //
  // "tmux": {
  //   "enabled": false,
  //   "layout": "main-horizontal",
  //   "main_pane_size": 60
  // },

  // ── Experimental ─────────────────────────────────────────────────────────
  // Unstable knobs — subject to change between releases.
  //
  // "experimental": {
  //   // Milliseconds to wait for a plugin to load before timing out (min: 1000).
  //   "plugin_load_timeout_ms": 5000,
  //   // Context window usage thresholds at which to emit a warning / critical log.
  //   "context_window_warning_threshold": 0.75,
  //   "context_window_critical_threshold": 0.90
  // },

  // ── Workflows ─────────────────────────────────────────────────────────────
  // Additional workflow discovery directories and disabled workflow names.
  // See: docs/workflows/overview.md
  //
  // "workflows": {
  //   "directories": [".guild/workflows", "../shared-workflows"],
  //   "disabled_workflows": ["legacy-migration-planner"]
  // }
}
```

## What to validate after pasting

After you drop the snippet into `.opencode/guild-opencode.jsonc` (or `~/.config/opencode/guild-opencode.jsonc`) and restart OpenCode, run:

```
/guild-health
```

The health report confirms:

- **Which config files were loaded** — user, project, or both.
- **Per-section validation status** — any section that fails schema validation is flagged with a warning. The loader will still start; it drops only the invalid section.
- **Registered agents and categories** — confirms your custom agents and `ranger-*` category agents appeared.
- **Skill scan results** — lists skills found in each configured directory.

If you see a validation warning, check the field name and type against the schema linked at the top of the snippet. JSONC comments (`//`) are stripped before validation, so they cannot cause errors.

## Next steps

| Goal | Where to go |
|---|---|
| Understand each config section | [Configuration](configuration.md) |
| Set per-agent model overrides | [Agents](agents.md) |
| Build a custom agent | [Custom agents](custom-agents.md) |
| Configure domain routing | [Categories](categories.md) |
| Tune background work | [Background agents](background-agents.md) |
| Adjust continuation behavior | [Continuation](continuation.md) |
| Set up analytics | [Analytics](analytics.md) |
| Author workflows | [Workflows — authoring](workflows/authoring.md) |

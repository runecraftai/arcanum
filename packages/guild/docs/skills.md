# Skills

Skills are markdown documents that inject domain-specific expertise into an agent's prompt at startup. Guild ships a set of bundled skills, supports project- and user-level custom skills, and lets you disable or reassign skills through your config.

## SKILL.md format

A skill is a directory containing a `SKILL.md` file. The first block is YAML frontmatter; the rest of the file is the skill body that gets prepended to the agent's prompt.

Minimal example:

```markdown
---
name: my-skill
description: >
  Short description of what the skill does and when agents should use it.
---

# my-skill

Skill body — instructions, conventions, and any concrete examples
the agent should follow when this skill is active.
```

### Frontmatter fields

| Field | Required | Purpose |
| --- | --- | --- |
| `name` | Yes | The skill's identifier. Used to assign skills in config and to disable them. Skills without a `name` are skipped. |
| `description` | No | Human-readable description. Surfaced in agent prompts. |
| `model` | No | A model override applied when the skill is active. |
| `tools` | No | A list of tool names to enable when the skill is active. |

Anything outside the recognized frontmatter keys is ignored by the parser.

## Where Guild looks for skills

Skills are discovered from four sources, in this order of precedence (highest first):

1. **OpenCode API** — skills returned by the running OpenCode instance for the current project.
2. **Project filesystem** — `.opencode/skills/<skill-name>/SKILL.md`.
3. **User filesystem** — `~/.config/opencode/skills/<skill-name>/SKILL.md`.
4. **Extra config directories** — paths listed in `skill_directories` (each relative to the project root, must not contain `..`).
5. **Guild package builtins** — `packages/guild/skills/<skill-name>/SKILL.md`.

When the same `name` appears in multiple sources, the higher-precedence source wins.

The OpenCode API is queried first; if it returns nothing, Guild falls back to scanning the filesystem. This means you can ship skills inside a project without configuring anything in OpenCode — drop the file in `.opencode/skills/` and it will be discovered.

## Bundled skills

The Guild package ships the following skills under `packages/guild/skills/`:

| Skill | Purpose |
| --- | --- |
| `guild-commit-learning` | Capture reusable lessons from a session. |
| `guild-execute` | Execute approved tasks with minimal scope and steady progress. |
| `guild-handoff` | Hand off work between agents with a clean context boundary. |
| `guild-init` | Initialize a new feature or project context. |
| `guild-load` | Load existing project context into a new session. |
| `guild-plan` | Produce a Wizard-style plan for an upcoming change. |
| `guild-research` | Research external docs and references. |
| `guild-review` | Run a Cleric-style review pass on completed work. |
| `guild-scope` | Scope a request before planning. |
| `guild-security` | Run a Paladin-style security audit. |
| `guild-ship` | Finalize and ship a completed change. |
| `guild-spec` | Drive a spec-driven workflow. |
| `guild-verify` | Verify a change against acceptance criteria. |

Skills are versioned with the package. New skills land in a Guild release; outdated skills are removed in a release that calls them out.

## Assigning skills to agents

Assign skills per agent in your Guild config:

```jsonc
{
  "agents": {
    "fighter": {
      "skills": ["guild-execute", "guild-verify"]
    },
    "wizard": {
      "skills": ["guild-spec", "guild-scope", "guild-plan"]
    }
  }
}
```

When an agent has assigned skills, Guild loads the skill body and prepends it to the agent's base prompt at runtime. The agent then has the skill's instructions in context from the start of the session.

Bard and Fighter consume skills through this assignment path. Other built-in agents run on their base prompt unless you override them with `agents.<name>.skills`.

## Disabling skills

To skip a skill entirely (e.g. you do not want the bundled skill to load on top of your customizations), add its name to `disabled_skills`:

```jsonc
{ "disabled_skills": ["guild-commit-learning"] }
```

`disabled_skills` is a **union** across user and project files — to re-enable a skill, remove the entry from both files.

## Extra skill directories

For monorepos or shared skill libraries, list extra relative directories under `skill_directories`:

```jsonc
{ "skill_directories": ["packages/shared-skills", "tooling/skills"] }
```

Each entry must be a relative path (no leading `/`, no `..` segments). Guild resolves each entry against the project root and scans it for `SKILL.md` files.

## Authoring tips

- Keep the `name` lowercase, short, and stable. The name is part of your config and a rename is a breaking change for any user.
- Put the **single most important behaviour** in the first paragraph. Agents scan the top of the skill before anything else.
- Use the body for procedural detail, conventions, and worked examples. Avoid repeating the description.
- Prefer additive skills over `prompt` replacement on agents. Skills are easier to disable and reason about.

## See also

- [Configuration](configuration.md) — `agents.<name>.skills`, `disabled_skills`, `skill_directories`.
- [Agents](agents.md) — how skills fit into agent customization.
- [Troubleshooting — Skills not loading](troubleshooting.md#skills-not-loading).

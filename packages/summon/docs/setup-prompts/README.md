# Manual Setup Prompts

These are the original one-shot setup prompts that used to back the `/setup-*` slash commands in `@runecraft/summon`. As of v0.16.0, summon installs these tools **directly** via `summon tools install` — no slash command, no LLM delegation.

If you'd rather run the setup by hand (e.g., on a remote box where the LLM agent isn't available, or you want full shell control), the prompts here are the exact instructions the agent used to receive. Each one starts with `Goal:` and is followed by numbered `Instructions:`. They are the source of truth that the installer was built from.

## Why both?

`summon tools install` exists so the common case ("install this on my machine") is one command, no prompting, idempotent. The manual prompts exist so:

- Operators can audit exactly what the installer does before running it.
- Users on a non-interactive shell (SSH session, CI container) can still follow the same recipe.
- Power users can adapt the steps to flavors of Linux/macOS that the installer doesn't know about.

## When to use which

| Situation | Use |
|---|---|
| Local dev machine, macOS or Linux, default tools | `summon tools install` |
| Need to control exactly which commands run | `summon tools install markitdown --dry-run` |
| You want to read the steps before running | Open the matching `.md` below |
| CI / non-interactive | Read the `.md`, paste steps into your Dockerfile or script |
| A platform we don't support (e.g. Windows native, NixOS) | Follow the `.md` manually |

## Files

| File | What it installs |
|---|---|
| [`graphify.md`](./setup-graphify.md) | Graphify knowledge graph generator for the repo |
| [`dynamic-context-pruning.md`](./setup-dynamic-context-pruning.md) | OpenCode DCP plugin (auto-prune context) |
| [`markitdown.md`](./setup-markitdown.md) | Microsoft markitdown (PDF / Office → Markdown) |
| [`context7.md`](./setup-context7.md) | Upstash Context7 MCP (version-specific docs) |
| [`exa.md`](./setup-exa.md) | Exa MCP web search |
| [`grep-app.md`](./setup-grep-app.md) | grep.app MCP code search |
| [`agents-md.md`](./setup-agents-md.md) | Bootstrap repo-root `AGENTS.md` |
| [`agents-template.md`](./agents-template.md) | The actual template copied into `AGENTS.md` |

## Difference from the installer

The installer does a few things the manual prompts punted to the LLM:

- **Detects the OS once** (`linux` vs `macos`) instead of asking the agent to.
- **Skips if already present** — checks `which <bin>` and `~/.config/opencode/opencode.json` before re-installing.
- **Merges MCP entries** into `opencode.json` with a deep-merge (other config keys are preserved). The original prompts said "edit the file"; the installer just edits it.
- **Writes API keys as `${ENV_VAR}` references**, not literals. The manual prompt says "store it under `environment.CONTEXT7_API_KEY`"; the installer writes `environment: { CONTEXT7_API_KEY: "${CONTEXT7_API_KEY}" }` and tells you to set the actual value in your shell profile.

If a step in the installer fails, the prompt's "print the exact error plus proposed fix" line is still relevant — the installer's `summon tools list` is the diagnostic equivalent.

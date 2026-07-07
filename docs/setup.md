# AI Coding Agent Setup Guide

> A practical guide to setting up your AI coding agent environment with tools, MCPs, and best practices.

This guide is **tool-agnostic**. The steps work with any AI coding agent CLI — [OpenCode](https://opencode.ai), [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), [Windsurf](https://codeium.com/windsurf), [Cline](https://github.com/cline/cline), and others. Where setup differs per tool, it is noted explicitly.

> **Note:** Some steps below can take several minutes. Steps that install or configure tools globally are marked with a scope indicator.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Git** | Installed and on PATH |
| **Node.js ≥ 18** | Required by several MCP servers |
| **An AI coding agent** | OpenCode, Claude Code, Cursor, Windsurf, etc. |

---

## Step 1: Give Your Agent Context

### Step 1.1 — Agent Instructions File

The standard way to give your agent behavioral guidelines is a global instructions file. Each agent reads a different filename:

| Agent | Global instructions file |
|-------|--------------------------|
| OpenCode | `~/.config/opencode/AGENTS.md` |
| Claude Code | `~/.claude/CLAUDE.md` |
| Cursor | `~/.cursor/rules/` |
| Windsurf | `~/.codeium/windsurf/memories/global_rules.md` |
| Cline | Via the "Custom Instructions" field in settings |

This file teaches your agent how to behave across all projects: when to ask vs. act, how to handle ambiguity, coding discipline, safety rules, and quality bar.

**Reference implementation** — the following principles are a solid starting point, adapted from a production global `AGENTS.md`:

```markdown
## Operating Principles

### Think Before Coding
- Do not silently assume intent when a request is ambiguous.
- State relevant uncertainty and ask one concise clarification question when needed.
- Surface important tradeoffs when multiple reasonable approaches exist.
- Push back when the requested approach is riskier, larger, or less maintainable than a simpler alternative.
- Stop and ask when you do not understand the code, the goal, or the constraints well enough to proceed safely.

### Simplicity First
- Implement the smallest correct change that satisfies the request.
- Do not add speculative features, abstractions, compatibility layers, configurability, or workflows.
- Keep code local and direct unless reuse is real and immediate.
- Prefer deleting accidental complexity over adding more structure around it.
- If a solution feels overengineered, simplify it before presenting it.

### Surgical Changes
- Touch only files required by the task.
- Do not reformat, rename, reorganize, or refactor adjacent code as a drive-by improvement.
- Preserve existing project style, even when it differs from your preference.
- Remove unused code only when your current change made it unused.
- Every changed line should trace directly to the user's request.

### Goal-Driven Execution
- Convert non-trivial tasks into explicit success criteria.
- Prefer reproducing bugs before fixing them when practical.
- Verify changes with the narrowest relevant tests, type checks, linters, or manual checks.
- Continue iterating until the stated goal is met or a real blocker is reached.

## Working Rules
- Inspect the codebase before editing; do not rely on guesses about structure or conventions.
- Do not use destructive commands (git reset --hard, mass deletion) unless explicitly requested.
- Never revert, overwrite, or clean up user changes unless explicitly asked.
- Do not commit, amend, push, create branches, or open pull requests unless explicitly requested.

## Planning
- For simple one-step tasks, act directly.
- For non-trivial or multi-file tasks, create a short plan with clear verification steps.

## Testing And Verification
- Run the most relevant available check for the files changed.
- Prefer narrow tests first; run broader suites when the change is broad or risky.
- Fix failures caused by your change before finishing.

## Security And Safety
- Do not expose secrets, tokens, private keys, credentials, or sensitive user data.
- Treat external input, shell commands, generated files, and network data as untrusted unless proven otherwise.
- Prefer secure defaults and explicit failure modes.
```

You can also add a **per-repository** instructions file at the repo root (e.g. `AGENTS.md`, `CLAUDE.md`) for project-specific context: architecture decisions, domain vocabulary, coding conventions. Most agents merge global + local instructions automatically.

**Verify**: Start a new session and ask your agent to summarize its operating principles. It should reflect what you wrote.

### Step 1.2 — Graphify (Knowledge Graph)

[Graphify](https://github.com/safishamsi/graphify) builds a structural knowledge graph of your repository, giving your agent richer context about how the codebase is organized.

> **Warning:** Close memory-intensive applications before running. Processing a large repo can use 6 GB+ of RAM.

**Prompt for your agent:**

```
Goal: Install Graphify globally and initialize a knowledge graph for this repository.

Instructions:
1. If this is a git repository, append `**/graphify-out/` and `.graphify*` to `.gitignore` (create if missing). Skip lines that already exist.
2. Install Graphify globally (user-scope, not per-repo) following the latest instructions at:
   https://github.com/safishamsi/graphify
   Detect my OS and use the matching commands. On failure, print the exact error and proposed fix before retrying.
3. Register Graphify as an MCP/tool in your agent's global config so it is always active.
4. Initialize Graphify for the current repository and rebuild `graphify-out` from scratch.
5. Exclude vendor/build/minified noise (node_modules, bin, obj, dist, build, .next, .nuxt, *.min.*, packages, vendor). Add or update the Graphify ignore config accordingly.
6. After completion, print:
   - the number of indexed files/nodes/edges
   - the Graphify version and install path
   - every config file changed
   - how to query the graph from your agent.

pip install --upgrade graphifyy
pip install graphifyy[sql]
/graphify .
```

**Verify**: Your agent should be able to answer structural questions about the codebase using the graph.

> **Tip:** `AGENTS.md` and Graphify complement each other. `AGENTS.md` is better for high-level project guidance; the graph is better for detailed structural context.

### Step 1.3 — OKF Knowledge Wiki

Maintain a persistent, living knowledge base alongside your codebase using [Google's Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — a pattern popularized by [Andrej Karpathy's LLM wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

Instead of agents blindly reading large numbers of files, they query a curated set of interlinked markdown files that capture architecture decisions, conventions, and known pitfalls. The knowledge compounds over time and is versionable in git.

**If you use Guild**, run `guild-init` in your project — it scaffolds the OKF bundle automatically under `.guild/knowledge/`:

```
.guild/knowledge/
├── index.md        # Bundle root — agents start here
├── decisions.md    # Architectural decisions log
├── conventions.md  # Coding standards and patterns
└── gotchas.md      # Known pitfalls and fix patterns
```

**If you don't use Guild**, create the same structure manually and add this instruction to your `AGENTS.md`:

```markdown
## Knowledge Base

For any question about the codebase, first navigate the knowledge base at `.guild/knowledge/index.md`.
Use specific paths from the index instead of reading multiple raw files.
Update the relevant knowledge file whenever you discover a new convention, decision, or pitfall.
```

> **Tip:** Graphify (Step 1.2) and the OKF wiki complement each other. Graphify gives agents a structural graph of relationships; the OKF wiki gives them curated, human-verified understanding. Use both.

---

## Step 2: Give Your Agent Tools (MCPs)

MCP (Model Context Protocol) servers extend your agent with new capabilities — web search, document reading, code search, and more. They run as local or remote processes and are registered in your agent's config file.

Before adding tools, verify your base environment:

- `git --version` — should succeed
- `node --version` and `npm --version` — both should work from the same shell you use for your agent
- If a global install succeeds but the command is missing, check your PATH

Common quick fixes:
- **Command not found**: restart the terminal so PATH changes are picked up
- **Wrong Node version**: switch to the expected version before installing packages globally

> **Using a different agent?** The prompts below are written for OpenCode and reference `~/.config/opencode/opencode.json` as the global config. If you use another agent, adapt the prompt: replace the config path with your agent's equivalent (e.g. `~/.claude/settings.json` for Claude Code, `.cursor/mcp.json` for Cursor) and ask your agent to follow the latest official MCP setup docs for that tool.

### Step 2.1 — Reading Document Formats

Install [markitdown](https://github.com/microsoft/markitdown) from Microsoft to give your agent the ability to read common document formats (PDFs, Office files, etc.).

**Prompt for OpenCode:**

```
Goal: Install Microsoft markitdown globally and expose it as an MCP in OpenCode.

Instructions:
1. Install markitdown globally (user-scope) following the latest instructions at:
   https://github.com/microsoft/markitdown
   Detect my OS and use the matching commands. Prefer `pipx` if available so the install is isolated.
2. Register markitdown (or its MCP server variant if provided upstream) in ~/.config/opencode/opencode.json
   under the `mcp` key, following the schema at https://opencode.ai/config.json.
3. On any step failure, print the exact error plus proposed fix before retrying.
4. Print the installed version, install path, and config snippet added.
5. Verify by converting one sample file (PDF, DOCX, or XLSX) and report the result.
```

> **Other agents:** Replace step 2 with: *"Register markitdown in `<your agent's global MCP config>`"* and point your agent to its own MCP documentation.

### Step 2.2 — Up-to-Date Library Documentation

Install [Context7](https://github.com/upstash/context7) from Upstash to give your agent on-demand access to current, version-specific documentation and code examples for any library or framework.

**Prompt for OpenCode:**

```
Goal: Install Upstash Context7 and expose it as an MCP in OpenCode.

Instructions:
1. Install the Context7 MCP server globally (user-scope) following the latest instructions at:
   https://github.com/upstash/context7
   Requires Node.js >= v18.
   If an API key is needed, get one from https://context7.com/dashboard and store it as an environment
   variable — never hardcode it in a committed file.
2. Register the Context7 MCP server in ~/.config/opencode/opencode.json under the `mcp` key,
   following the schema at https://opencode.ai/config.json.
3. Print the installed version, install path, and config snippet added.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by resolving one library and fetching its docs (e.g. "Bun workspaces") and report the result.
```

> **Other agents:** Replace step 2 with your agent's MCP config path and registration format.

### Step 2.3 — Web Search

Install the [Exa MCP server](https://github.com/exa-labs/exa-mcp-server) to give your agent fast, clean web search that returns ready-to-use content instead of raw result pages.

**Prompt for OpenCode:**

```
Goal: Install the Exa web-search MCP server and expose it in OpenCode.

Instructions:
1. Configure the Exa MCP server (user-scope, global) following the latest instructions at:
   https://github.com/exa-labs/exa-mcp-server
   Prefer the hosted remote endpoint https://mcp.exa.ai/mcp.
   An Exa API key is required: get one from https://dashboard.exa.ai and store it as an environment
   variable in my global config — never hardcode it in a committed file.
2. Register the Exa MCP server in ~/.config/opencode/opencode.json under the `mcp` key,
   following the schema at https://opencode.ai/config.json.
3. Print the configured endpoint and config snippet added.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by running one web search and report the result.
```

> **Other agents:** Replace step 2 with your agent's MCP config path. The Exa endpoint and API key setup are the same regardless of agent.

### Step 2.4 — Search Real-World Code on GitHub

Install the [grep.app MCP server](https://mcp.grep.app) to let your agent search literal code patterns across a million-plus public GitHub repositories for real-world usage examples. No API key required.

**Prompt for OpenCode:**

```
Goal: Install the grep.app code-search MCP server and expose it in OpenCode.

Instructions:
1. Configure the grep.app MCP server (user-scope, global) using the hosted HTTP endpoint:
   https://mcp.grep.app
   No API key is required.
2. Register it in ~/.config/opencode/opencode.json under the `mcp` key using an HTTP/remote transport
   entry, following the schema at https://opencode.ai/config.json.
3. Print the configured endpoint and config snippet added.
4. On any step failure, print the exact error plus proposed fix before retrying.
5. Verify by searching for one code pattern (e.g. `useEffect(`) and report the result.
```

> **Other agents:** Replace step 2 with your agent's MCP config path. The grep.app endpoint is the same for all agents.

---

## Step 3: Safety Net

Install the [cc-safety-net plugin](https://github.com/kenryu42/claude-code-safety-net) to prevent critical mistakes like deleting files or pushing directly to main.

**Prompt for OpenCode:**

```
Goal: Install the cc-safety-net plugin in OpenCode to prevent critical mistakes.

Instructions:
1. Fetch and follow the latest official installation guide at:
   https://github.com/kenryu42/claude-code-safety-net
   Follow the instructions for OpenCode specifically.
2. Install the plugin globally in ~/.config/opencode/opencode.json under the `plugin` key.
3. Print the plugin version, config file modified, and exact config snippet added.
4. Verify by restarting OpenCode and confirming the plugin is registered.
```

> **Other agents:** This plugin was originally built for Claude Code and has OpenCode support. For Cursor, Windsurf, or others, check the repo for support status or look for an equivalent guardrail extension in your agent's marketplace.

---

## Step 4: Context Optimization

Install the [OpenCode DCP plugin](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) to automatically manage conversation context and reduce token usage. The plugin prunes irrelevant or low-value parts of the conversation history while keeping essential information.

**For OpenCode, run from your shell:**

```bash
opencode plugin @tarquinen/opencode-dcp@latest --global
```

Restart OpenCode and verify by executing the `/DCP` command.

> **Other agents:** This plugin is OpenCode-specific. Check your agent's extension marketplace for a context-pruning or token-optimization equivalent.

---

## Step 5: Install Skills

Skills are packaged instructions that extend your agent's capabilities — teaching it new workflows, patterns, and specialized knowledge. Think of them as plugins for your AI assistant.

### Step 5.1 — Arcanum's Own Spells

Arcanum ships its own skill scrolls via the [`@runecraft/spells`](../packages/spells/) package and the [`summon`](../packages/summon/) CLI.

```bash
# Install spells into your agent globally
npx @runecraft/summon
```

Follow the interactive wizard to select which spells to install and to which agent.

### Step 5.2 — Tech Leads Club Skills

[Agent Skills by Tech Leads Club](https://agent-skills.techleads.club/skills/) is a secure, validated skill registry that works with Claude Code, Cursor, Windsurf, Cline, OpenCode, and more.

```bash
npx @tech-leads-club/agent-skills
```

The interactive wizard lets you browse by category, select skills, choose your target agent, and set scope (global or local).

**Useful CLI shortcuts:**

```bash
# List available skills
agent-skills list

# Install specific skills
agent-skills install -s tlc-spec-driven coding-guidelines docs-writer

# Install to a specific agent
agent-skills install -s my-skill -a claude-code

# Install globally
agent-skills install -s my-skill -g
```

Browse the full catalog at: [agent-skills.techleads.club/skills](https://agent-skills.techleads.club/skills/)

**Recommended skills to start with:**

| Skill | What it does |
|-------|-------------|
| `tlc-spec-driven` | Structured planning: Specify → Design → Tasks → Implement |
| `coding-guidelines` | Reduces common LLM coding mistakes |
| `tdd` | Red-green-refactor loop for test-driven development |
| `security-best-practices` | Language-specific security reviews |
| `docs-writer` | Standards for writing clear documentation |

### Step 5.3 — Matt Pocock's Skills

[mattpocock/skills](https://github.com/mattpocock/skills) — battle-tested engineering skills focused on real-world software development practices.

```bash
npx skills@latest add mattpocock/skills
```

After installation, run `/setup-matt-pocock-skills` in your agent to configure issue tracker, triage labels, and doc layout.

**Recommended skills:**

| Skill | What it does |
|-------|-------------|
| `/grill-with-docs` | Grilling session that builds your project's domain model and updates `CONTEXT.md` |
| `/improve-codebase-architecture` | Scans for deepening opportunities, presents an HTML report |
| `/tdd` | TDD with red-green-refactor loop |
| `/diagnosing-bugs` | Disciplined diagnosis loop: reproduce → minimise → hypothesise → fix |
| `/to-prd` | Turns a conversation into a PRD and publishes it to your issue tracker |

Browse the full list at: [github.com/mattpocock/skills](https://github.com/mattpocock/skills)

---

## Tips for Daily Use

- **Refine before executing** — Before asking your agent to implement something, ask it to restate the task and list its assumptions. Correct it, then let it run. This single habit drastically reduces wasted runs.
- **One topic per session** — Start a fresh session per task. Long sessions accumulate irrelevant context and increase cost while reducing accuracy.
- **Match model to task** — Use a strong reasoning model for planning and refactors; a faster, cheaper model for mechanical edits. Most agents let you switch mid-session.
- **Read the diff** — Always review what the agent changed before committing. Treat it like a junior developer's PR.
- **Write down recurring corrections** — When you keep correcting the same thing, move it into `AGENTS.md` (or a skill) so the agent learns it permanently.
- **Run `/improve-codebase-architecture` regularly** — AI-assisted development accelerates software entropy. Run this skill every few days to keep the codebase clean.

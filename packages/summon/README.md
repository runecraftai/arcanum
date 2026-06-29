# Summon

Interactive CLI for installing Arcanum agent skills. Built on [citty](https://github.com/unjs/citty) and [@clack/prompts](https://github.com/bombshell-dev/clack).

> Part of the [Arcanum](../../README.md) monorepo. See the root README for the full picture.

## Install

```bash
# One-off, no install needed
npx @runecraft/summon

# Or globally
npm install -g @runecraft/summon
summon

# Or with bun
bunx @runecraft/summon
```

Requires Node 18+ (works equally well with `npx`, `npm`, `bunx`, or `pnpm dlx`).

## Quickstart

### Install skills (interactive TUI)

```bash
npx @runecraft/summon install
```

Or just `npx @runecraft/summon` (no subcommand) — same flow.

The wizard walks you through:

1. **Detect agents** — Claude Code, Cursor, OpenCode, Windsurf, Cline, GitHub Copilot, Roo Code, Aider, Kiro. Detected ones are pre-selected.
2. **Choose action** — Install / Update / Remove / **Install slash commands**.
3. **Pick skills** from the catalog (multi-select, grouped by category).
4. **Choose method**:
   - **Copy** (recommended) — self-contained, works everywhere.
   - **Symlink** — updates automatically from source (best for development).
5. **Choose scope**:
   - **Local** — this project only (writes to `<project>/.agents/skills/<name>/` hub).
   - **Global** — available everywhere (writes to `~/.config/opencode/skills/<name>/` hub).
6. **Confirm** the summary, then run.

#### Method × Scope (orthogonal)

`method` and `scope` control different things and are independent choices:

| `method` \ `scope` | `local` | `global` |
|---|---|---|
| `copy` | `cp SKILL.md → <agent.installDir>/<name>.md`. Snapshot. `scope` is **ignored**. | Same as `local`. `scope` is **ignored**. |
| `symlink` | Hub at `<projectRoot>/.agents/skills/<name>/`, agent → hub → `node_modules`. | Hub at `~/.config/opencode/skills/<name>/`, agent → hub → `node_modules`. |

In short: `method` = **how** the file is installed (mechanism). `scope` = **where the symlink hub lives** (only relevant when `method=symlink`; for `copy`, the agent's `installDir` from `agents/registry.ts` is always used).

### Install slash commands

Generate slash-command files for detected AI runtimes so you can invoke skills with one keystroke (`/plan`, `/review`, `/test`, etc.).

```bash
npx @runecraft/summon install-commands
```

The TUI asks you to:

1. **Pick one or more project roots** (default: current directory). Type extra absolute paths separated by commas to apply in multiple projects at once.
2. **For each detected runtime, choose a location**:
   - `local` writes to the project.
   - `global` writes to `$HOME`.
3. **Confirm** the targets, then generate.

#### Supported runtimes

| Runtime | Local markers | Global path | Output (local) | Output (global) |
|---|---|---|---|---|
| Claude Code | `.claude/`, `CLAUDE.md` | `~/.claude/` | `<project>/.claude/commands/<name>.md` | `~/.claude/commands/<name>.md` |
| OpenCode | `.opencode/`, `opencode.json`, `opencode.jsonc` | `~/.config/opencode/` | `<project>/.opencode/commands/<name>.md` | `~/.config/opencode/commands/<name>.md` |
| Cursor | `.cursor/`, `.cursorrules` | _(none)_ | `<project>/.cursor/rules/<name>.mdc` | _(skipped)_ |

The 15 emitted commands (defined in `src/commands/registry.ts`) split into two kinds:

- **Invokers** (8) — `/plan`, `/review`, `/test`, `/simplify`, `/ship`, `/security`, `/debug`, `/harden`. Each command body loads the corresponding skill.
- **Standalone** (7) — `/setup-graphify`, `/setup-dynamic-context-pruning`, `/setup-markitdown`, `/setup-context7`, `/setup-exa`, `/setup-grep-app`, `/setup-agents-md`. Each command body embeds a one-shot setup prompt directly. No skill is required and they are never skipped because of a missing skill.

Standalone commands live as `src/commands/prompts/*.md` and are inlined into the published bundle at build time.

#### Example output

A generated `.opencode/commands/review.md` looks like:

```markdown
---
description: Review changes with five-axis critique
---

Current staged diff:

!`git diff --staged`

Load the `code-review-and-quality` skill and execute its process.

$ARGUMENTS
```

#### Behavior

- **Built-in collision detection**: `/review` is skipped for Claude Code (it ships a built-in `review` command) but emitted for OpenCode and Cursor.
- **Auto-install of missing skills**: when an invoker command's target skill is not already installed, `install-commands` copies the skill into the target runtime's skills dir (using `copy` method by default) before generating the command. The summary reports `Installed N/M missing skill(s)`. Set `installMissingSkills: false` from the API to fall back to skip-and-warn.
- **Missing-skill skip**: only triggered when `installMissingSkills: false` is set, or when the target skill is not in the bundled spells catalog. **Standalone commands are never skipped** — they embed the prompt directly and have no skill to depend on.
- **Invokers without a skill at runtime**: even with auto-install, an older command file may still point at a skill that was later removed. The generated invoker body includes a fallback line: `If the skill is unavailable, install it first with: \`npx @runecraft/summon install\`.`
- **Idempotent**: re-running overwrites in place, no duplicates.
- **No-runtime exit**: if no supported runtime is detected in any chosen project root, the command exits with code 1 and a clear message.

## Commands

| Command | What it does |
|---|---|
| `summon` _(no subcommand)_ | Launches the interactive TUI wizard. |
| `summon install` | Same TUI flow (explicit). |
| `summon install-commands` | Generate `/plan`, `/review`, `/test`, … for detected runtimes, with TUI picker for projects and per-runtime local/global. |
| `summon list` | Show installed skills grouped by agent. |
| `summon update` | Refresh installed skills to the latest catalog. |
| `summon remove` | Uninstall selected skills from agents. |

**TUI integration:** running `summon install` ends with a prompt **"Generate slash commands for installed skills?"** — answering *yes* reuses the same project + location picker, defaulting to the just-installed skills.

## Stack

- **[citty](https://github.com/unjs/citty)** — lightweight CLI framework with lazy-loaded subcommands.
- **[@clack/prompts](https://github.com/bombshell-dev/clack)** — interactive terminal prompts with rich formatting.

## Development

```bash
cd packages/summon

# Run from source (no build needed)
bun run dev

# Build a Node-compatible binary at dist/summon.js
bun run build

# Verify the build (catches Bun-only APIs that would break Node)
bun run build:verify

# Run the test suite
bun test
```

Modify `src/cli.ts` for the main entry point, `src/commands/<sub>.ts` for subcommands, and `src/tui/<prompt>.ts` for interactive prompts.

## Publishing

The build uses Bun's bundler with `--target node` and the published package must work with both `npx` and `bunx`. Two critical constraints:

1. **`import.meta.dir` must not leak into the bundle** — it's Bun-only and `undefined` in Node.js. The `build:verify` script checks this automatically.
2. **`workspace:*` must be resolved to a real version** — npm doesn't understand the `workspace:` protocol. `bun pm pack` handles this automatically.

### Steps

```bash
cd packages/summon
```

1. **Bump the version** in `package.json`.
2. **Build and verify**:
   ```bash
   bun run build && bun run build:verify
   ```
3. **Create the tarball** (resolves `workspace:*` → actual versions):
   ```bash
   bun pm pack
   ```
4. **Publish with npm** (using the tarball so workspace deps are resolved):
   ```bash
   npm publish runecraft-summon-<VERSION>.tgz --otp <OTP>
   ```
5. **Clean up**:
   ```bash
   rm runecraft-summon-<VERSION>.tgz
   ```
6. **Verify** the published version works:
   ```bash
   npx @runecraft/summon@<VERSION>
   ```

### Why not `npm publish` directly?

`npm publish` from a workspace package publishes `"workspace:*"` as-is, which npm registries can't resolve. Using `bun pm pack` + `npm publish <tarball>` ensures the tarball contains resolved versions.

### Why not `bun publish`?

`bun publish` resolves workspace deps automatically but may have auth issues with npm tokens. If it works for you, you can use it instead of steps 3-5:

```bash
bun publish --otp <OTP>
```

---

## License

MIT

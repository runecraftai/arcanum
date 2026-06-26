# Summon

CLI installer for Arcanum agent skills. Currently a scaffold using citty and @clack/prompts.

## Overview

**Summon** is the command-line interface for installing and managing Arcanum agent skills. It provides interactive prompts to guide users through the installation process.

**Current Status**: Scaffold — basic CLI structure is in place, but the `install` command prints "not yet implemented".

## Building

```bash
bun run build
```

This compiles `src/cli.ts` into a standalone Bun binary at `dist/summon`.

## Usage

```bash
./dist/summon install
```

The install command will prompt for skill selections and destinations (coming soon).

### Install slash commands

Generate slash-command files for detected AI runtimes so users can invoke skills with one keystroke (`/review`, `/test`, `/ship`, etc.).

```bash
./dist/summon install-commands
```

Supported runtimes:

| Runtime | Detection markers | Output |
|---------|-------------------|--------|
| Claude Code | `.claude/` or `CLAUDE.md` | `.claude/commands/<name>.md` |
| OpenCode | `.opencode/`, `opencode.json`, or `opencode.jsonc` | `.opencode/commands/<name>.md` |
| Cursor | `.cursor/` or `.cursorrules` | `.cursor/rules/<name>.mdc` |

The 8 emitted commands (defined in `src/commands/registry.ts`) are: `/plan`, `/review`, `/test`, `/simplify`, `/ship`, `/security`, `/debug`, `/harden`. Each command body loads the corresponding skill.

**Behavior:**
- Per-runtime built-in collision detection: `/review` is skipped for Claude Code (built-in command) but emitted for OpenCode and Cursor.
- Skips commands whose target skill is not installed; warns per skip.
- Exits with code 1 and a clear message when no supported runtime is detected.
- Re-running overwrites idempotently (no duplicates).

**TUI integration:** when run as `summon install` (no subcommand), the TUI flow ends with a "Generate slash commands for installed skills?" prompt that runs the same flow against the just-installed skills.

## Stack

## Stack

- **citty**: Lightweight CLI framework with lazy-loaded subcommands
- **@clack/prompts**: Interactive terminal prompts with rich formatting

## Development

Modify `src/cli.ts` for the main entry point and add commands to `src/commands/`.

## Publishing

The build uses Bun's bundler with `--target node` and the published package must work with both `npx` and `bunx`. Two critical constraints:

1. **`import.meta.dir` must not leak into the bundle** — it's Bun-only and `undefined` in Node.js. The `build:verify` script checks this automatically.
2. **`workspace:*` must be resolved to a real version** — npm doesn't understand the `workspace:` protocol. `bun pm pack` handles this automatically.

### Steps

```bash
cd packages/summon
```

1. **Bump the version** in `package.json`

2. **Build and verify**
   ```bash
   bun run build && bun run build:verify
   ```

3. **Create the tarball** (resolves `workspace:*` → actual versions)
   ```bash
   bun pm pack
   ```

4. **Publish with npm** (using the tarball so workspace deps are resolved)
   ```bash
   npm publish runecraft-summon-<VERSION>.tgz --otp <OTP>
   ```

5. **Clean up**
   ```bash
   rm runecraft-summon-<VERSION>.tgz
   ```

6. **Verify** the published version works
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

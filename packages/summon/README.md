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

## Stack

- **citty**: Lightweight CLI framework with lazy-loaded subcommands
- **@clack/prompts**: Interactive terminal prompts with rich formatting

## Development

Modify `src/cli.ts` for the main entry point and add commands to `src/commands/`.

---

## License

MIT

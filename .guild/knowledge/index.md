# Arcanum Knowledge Base

> Living documentation for the Arcanum monorepo. Start here for any codebase question.

## Quick Navigation

| File | Purpose |
|------|---------|
| [decisions.md](./decisions.md) | Architectural decisions and rationale |
| [conventions.md](./conventions.md) | Coding standards, naming, and patterns |
| [gotchas.md](./gotchas.md) | Known pitfalls and fix patterns |

## Project Overview

Arcanum is a TypeScript/Bun monorepo shipping AI tooling for the OpenCode editor.

### Core Packages

| Package | Purpose |
|---------|---------|
| `@runecraft/guild` | Multi-agent orchestration (8 RPG-themed agents) |
| `@runecraft/runes` | Persistent cross-session memory (SQLite) |
| `@runecraft/spells` | Agent skill scrolls (SKILL.md files) |
| `@runecraft/summon` | CLI installer for spells |
| `@runecraft/spawn` | tmux subagent pane manager |
| `@runecraft/grimoire` | Shared Biome + TypeScript configs |
| `@runecraft/familiar` | Internal Pi runtime (private) |

### Tech Stack

- **Runtime**: Bun 1.3.5 (primary), Node.js ≥ 18 (compatibility)
- **Language**: TypeScript (strict, ESNext, ESM)
- **Monorepo**: Bun workspaces + Turborepo v2
- **Lint/format**: Biome 1.9.2
- **Tests**: `bun test`
- **Versioning**: Changesets (independent semver)

## How to Use This Knowledge Base

1. **For codebase questions**: Start here, then follow the relevant link
2. **For conventions**: Check `conventions.md` before writing code
3. **For architectural context**: See `decisions.md` for why things are built this way
4. **For debugging**: Look up `gotchas.md` for known issues and fixes

## Updating This Knowledge Base

When you discover a new convention, decision, or pitfall:
- Add it to the appropriate file (`conventions.md`, `decisions.md`, or `gotchas.md`)
- Keep entries concise and actionable
- Include file paths and line numbers when referencing code

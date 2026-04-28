# Arcanum

A Bun monorepo for agent skills, CLI tools, and shared configurations for the Runecraft AI ecosystem.

---

## Packages

| Package | npm name | Description | Status |
|---------|----------|-------------|--------|
| **spells** | `@runecraft/spells` | Agent skill definitions (7 skills) | Active |
| **grimoire** | `@runecraft/grimoire` | Shared Biome and TypeScript configs | Active |
| **summon** | `@runecraft/summon` | CLI installer for agent skills | Scaffold |
| **guild** | `@runecraft/guild` | Agent party/swarm configurations | Placeholder |

---

## Getting Started

### Install Dependencies

```bash
bun install
```

This uses Bun workspaces to resolve all local packages as symlinks in `node_modules/@runecraft/`.

### Build All Packages

```bash
bunx turbo build
```

Turborepo orchestrates builds across all packages with caching and parallel execution.

---

## Development

- **Lint**: `bunx turbo lint`
- **Test**: `bunx turbo test`
- **Build**: `bunx turbo build`

For documentation on individual packages, see `packages/<package>/README.md`.

---

## Architecture

- **Bun Workspaces**: Native workspace support for local package resolution
- **Turborepo v2**: Task orchestration with caching and parallelization
- **Changesets**: Independent versioning per package
- **Biome**: Unified linting and formatting via grimoire

See `.specs/features/arcanum-monorepo-migration/` for architecture decisions.

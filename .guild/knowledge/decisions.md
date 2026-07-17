# Architectural Decisions

> Record of significant architectural choices and their rationale.

## Decision Log

### D001: Monorepo with Bun Workspaces

**Date**: Initial setup  
**Status**: Active  
**Context**: Need to manage multiple related packages with shared dependencies.  
**Decision**: Use Bun workspaces + Turborepo v2 for monorepo management.  
**Rationale**: 
- Bun provides fast install and build times
- Native workspace support without extra tooling
- Turborepo handles task orchestration and caching  
**Consequences**: 
- Cross-package deps must use `workspace:*` (not relative paths)
- All packages share the same Biome config from `packages/grimoire/`

### D002: TypeScript Strict Mode with ESNext

**Date**: Initial setup  
**Status**: Active  
**Context**: Need type safety and modern JavaScript features.  
**Decision**: Enable TypeScript strict mode with ESNext target and ESM modules.  
**Rationale**: 
- Catches bugs at compile time
- ESM for tree-shaking and modern tooling
- ESNext for latest language features  
**Consequences**: 
- All code must be fully typed
- No `any` types without explicit justification

### D003: Biome for Linting and Formatting

**Date**: Initial setup  
**Status**: Active  
**Context**: Need consistent code style across all packages.  
**Decision**: Use Biome 1.9.2 as unified linter and formatter.  
**Rationale**: 
- Single tool for both linting and formatting
- Faster than ESLint + Prettier combo
- Configured centrally in `packages/grimoire/biome.json`  
**Consequences**: 
- No `eslint-disable` comments allowed
- Tabs for indentation, 100-char line limit

### D004: RPG-Themed Agent Architecture

**Date**: Initial setup  
**Status**: Active  
**Context**: Building multi-agent orchestration for AI coding assistants.  
**Decision**: Use RPG-themed agents (Rogue, Wizard, Cleric, etc.) with specialized roles.  
**Rationale**: 
- Memorable naming convention
- Clear role separation (exploration, planning, execution, review)
- Engaging user experience  
**Consequences**: 
- Each agent has specific capabilities and restrictions
- Agents communicate through defined handoff protocols

### D005: SQLite for Persistent Memory

**Date**: Initial setup  
**Status**: Active  
**Context**: Need cross-session memory for AI agents.  
**Decision**: Use SQLite-backed storage in `@runecraft/runes`.  
**Rationale**: 
- Zero-config embedded database
- Reliable ACID transactions
- Easy to backup and migrate  
**Consequences**: 
- Memory is local-only (no sync by default)
- Schema migrations needed for version updates

### D006: Skills as SKILL.md Files

**Date**: Initial setup  
**Status**: Active  
**Context**: Need portable agent instructions that work across different AI tools.  
**Decision**: Package skills as SKILL.md files in `@runecraft/spells`.  
**Rationale**: 
- Plain markdown is human-readable and editable
- Works with Cursor, Claude, Copilot, and OpenCode
- Easy to version control and share  
**Consequences**: 
- Skills must be self-contained
- No executable code in skill files

### D007: Changesets for Versioning

**Date**: Initial setup  
**Status**: Active  
**Context**: Need independent versioning for each package.  
**Decision**: Use Changesets for semver management.  
**Rationale**: 
- Independent versioning per package
- Automated changelog generation
- Integration with CI/CD  
**Consequences**: 
- Must add changeset for any user-facing change
- `familiar` and `grimoire` excluded from public releases

### D008: Conventional Commits

**Date**: Initial setup  
**Status**: Active  
**Context**: Need consistent commit history for automation.  
**Decision**: Enforce conventional commits via commitlint.  
**Rationale**: 
- Enables automated changelogs
- Clear commit history
- Integration with Changesets  
**Consequences**: 
- Must use format: `type(scope): description`
- Valid scopes: guild, runes, spells, summon, spawn, grimoire, familiar

### D009: No Comments in runes Package

**Date**: Initial setup  
**Status**: Active  
**Context**: `packages/runes/` has strict code quality requirements.  
**Decision**: No comments allowed in source files.  
**Rationale**: 
- Code must be self-explanatory through naming and types
- Reduces maintenance burden
- Forces better abstractions  
**Consequences**: 
- Complex logic must be extracted to well-named functions
- Documentation belongs in README, not inline

### D010: Zod Version Separation

**Date**: Initial setup  
**Status**: Active  
**Context**: Different packages have different validation needs.  
**Decision**: `guild` uses Zod v4, `spawn` uses Zod v3.  
**Rationale**: 
- `guild` needs latest features (pipeline, error formatting)
- `spawn` has stable API requirements
- Avoids breaking changes in production  
**Consequences**: 
- Never mix Zod versions in the same package
- Cross-package validation must use JSON serialization

## Updating This File

When making a new architectural decision:
1. Add a new entry with sequential ID (D0XX)
2. Include date, status, context, decision, rationale, and consequences
3. Keep entries concise but complete
4. Link to relevant code or documentation when possible

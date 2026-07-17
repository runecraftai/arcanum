# Coding Conventions

> Standards and patterns for writing code in the Arcanum monorepo.

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Source files | `kebab-case.ts` | `agent-runner.ts` |
| Test files | `*.test.ts` (colocated) | `agent-runner.test.ts` |
| Config files | `camelCase.json` | `package.json` |
| Documentation | `UPPER_CASE.md` | `README.md` |

## Code Style

### Indentation and Lines

- **Tabs** for indentation (not spaces)
- **100-character** line limit
- Trailing commas in multi-line structures

### Naming Conventions

```typescript
// Classes: PascalCase
class AgentRunner { }
class GuildPlugin { }

// Functions: camelCase
function createAgent() { }
function validateConfig() { }

// Variables: camelCase
const agentConfig = { };
const MAX_RETRIES = 3;

// Constants: UPPER_CASE for module-level
const DEFAULT_TIMEOUT = 5000;

// Types/Interfaces: PascalCase with descriptive names
interface AgentConfig { }
type PluginStatus = 'active' | 'inactive';
```

### Import Organization

```typescript
// 1. Node.js built-ins
import { join } from "node:path";

// 2. External packages
import { z } from "zod";

// 3. Internal package imports
import { createAgent } from "@runecraft/guild";
import { loadMemory } from "@runecraft/runes";

// 4. Local imports (relative paths)
import { validateConfig } from "./config.js";
import { AgentRunner } from "./agent-runner.js";
```

## TypeScript Conventions

### Strict Mode Rules

- No `any` types without explicit justification
- Prefer `unknown` over `any` for external data
- Use explicit return types for public functions
- Enable `noUncheckedIndexedAccess` for array safety

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface AgentConfig {
  name: string;
  model: string;
  temperature?: number;
}

// Use type for unions and intersections
type AgentStatus = "idle" | "running" | "error";

// Use type for computed types
type AgentNames = keyof typeof agents;
```

### Error Handling

```typescript
// Use custom error classes
class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly agent?: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

// Always handle errors explicitly
try {
  await agent.run();
} catch (error) {
  if (error instanceof AgentError) {
    logger.error(`Agent error: ${error.code}`, { agent: error.agent });
  } else {
    throw error;
  }
}
```

## Package-Specific Rules

### @runecraft/guild

- Read `packages/guild/AGENTS.md` before editing
- Uses Zod v4 for validation
- 8 specialized agents with defined roles
- Handoff protocol between agents

### @runecraft/runes

- Read `packages/runes/AGENTS.md` before editing
- **No comments in source files**
- Code must be self-explanatory
- SQLite-backed storage

### @runecraft/spawn

- Read `packages/spawn/AGENTS.md` before editing
- Uses Zod v3 (not v4)
- tmux pane management

### @runecraft/familiar

- Read `packages/familiar/CLAUDE.md` before editing
- Private package (not published)
- Internal Pi runtime

## Testing Conventions

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from "bun:test";

describe("AgentRunner", () => {
  beforeEach(() => {
    // Reset state before each test
  });

  it("should create agent with valid config", () => {
    const agent = createAgent({ name: "test", model: "gpt-4" });
    expect(agent.name).toBe("test");
  });

  it("should throw on invalid config", () => {
    expect(() => createAgent({ name: "" })).toThrow("Invalid name");
  });
});
```

### Test File Organization

- Co-locate tests with source files
- Use `tests/` directory for integration tests
- Use `src/__tests__/` for unit tests when colocated isn't practical

### Fixtures

```typescript
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Always use os.tmpdir() for test fixtures
const tempDir = await mkdtemp(join(tmpdir(), "test-"));
// Never write inside the package tree
```

## Commit Conventions

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code restructuring (no feature change) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, etc. |

### Scopes

Valid scopes are package names:
- `guild`, `runes`, `spells`, `summon`, `spawn`, `grimoire`, `familiar`

### Examples

```
feat(guild): add agent handoff protocol
fix(runes): handle SQLite connection timeout
docs(spells): update skill installation guide
refactor(spawn): extract tmux pane manager
```

## Documentation Conventions

### README Files

- Keep concise and actionable
- Include quick start guide
- Link to detailed docs in `docs/`

### Code Comments

- Explain **why**, not **what**
- Keep comments up-to-date
- Remove stale comments immediately

### API Documentation

- Use JSDoc for public APIs
- Include examples for complex functions
- Document error cases

## Updating This File

When discovering a new convention:
1. Add it to the appropriate section
2. Include code examples when helpful
3. Keep entries concise and actionable
4. Reference relevant files when possible

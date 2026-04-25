# Spells

Agent skill definitions for Arcanum. Each skill is a SKILL.md markdown file consumed by AI agents (Claude, Cursor, etc.) to perform specialized tasks.

## Available Skills

1. **spec-driven** — Orchestrates the full development lifecycle (planning, building, testing, review, shipping)
2. **planning** — Breaks down requirements into actionable subtasks
3. **incremental-build** — Builds features step-by-step with validation
4. **test-verification** — Validates implementation correctness via tests
5. **code-review** — Reviews code for quality, security, and patterns
6. **code-simplification** — Refactors and simplifies complex code
7. **shipping** — Prepares, validates, and releases features

## Usage

Skills are distributed as part of the `@runecraftai/spells` package. Install via:

```bash
bunx summon install
```

Or manually copy individual `skills/<skill-name>/SKILL.md` files to your agent's skill directory.

## License

MIT

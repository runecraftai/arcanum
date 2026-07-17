# Known Pitfalls and Fixes

> Common issues and their solutions. Check here before debugging.

## Cross-Package Issues

### G001: Zod Version Mixing

**Symptom**: Validation errors, schema mismatches, or runtime crashes when passing data between packages.  
**Cause**: `guild` uses Zod v4, `spawn` uses Zod v3. They have incompatible APIs.  
**Fix**: 
- Never import Zod directly in shared code
- Use JSON serialization for cross-package validation
- Check which version each package uses before editing

```typescript
// ❌ Wrong: mixing versions
import { z } from "zod"; // Which version?

// ✅ Correct: use package-specific import
// In guild:
import { z } from "zod/v4"; // or just "zod" (v4 is default)

// In spawn:
import { z } from "zod/v3";
```

### G002: Relative Paths in Dependencies

**Symptom**: Build errors, broken imports, or circular dependencies.  
**Cause**: Using relative paths instead of `workspace:*` for cross-package deps.  
**Fix**: Always use `workspace:*` in package.json:

```json
{
  "dependencies": {
    "@runecraft/guild": "workspace:*"
  }
}
```

### G003: runes/dist/index.js Not Importable by Node

**Symptom**: `node -e "import('./dist/index.js')"` fails.  
**Cause**: runes package must be Node.js-compatible, not just Bun.  
**Fix**:
- Avoid Bun-specific APIs in runes
- Test with `node -e "import('./dist/index.js')"` before marking done
- Use `node:` prefix for Node.js built-ins

## Build and Test Issues

### G004: Turborepo Cache Stale

**Symptom**: Changes not reflected in build output.  
**Cause**: Turborepo cached old build results.  
**Fix**:
```bash
# Clear Turborepo cache
rm -rf .turbo
turbo run build --force

# Or clear specific package cache
turbo run build --filter=@runecraft/guild --force
```

### G005: Biome Formatting Conflicts

**Symptom**: Code formatted differently in CI vs local.  
**Cause**: Different Biome versions or configurations.  
**Fix**:
- Always run `bun run lint` before committing
- Use the shared config from `packages/grimoire/biome.json`
- Never add local biome overrides

### G006: Tests Writing to Package Tree

**Symptom**: Git shows unexpected changes after tests.  
**Cause**: Tests writing fixtures inside the package directory.  
**Fix**: Always use `os.tmpdir()` for test fixtures:

```typescript
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDir = await mkdtemp(join(tmpdir(), "test-"));
// Write fixtures here, not in the package tree
```

## Agent System Issues

### G007: Agent Handoff Protocol Violation

**Symptom**: Agent receives invalid context or crashes during handoff.  
**Cause**: Not following the defined handoff protocol between agents.  
**Fix**:
- Read the agent's AGENTS.md before editing
- Use the defined handoff functions
- Validate context before passing to next agent

### G008: Memory Not Persisting Across Sessions

**Symptom**: Agent memory lost after restarting OpenCode.  
**Cause**: SQLite database not properly initialized or corrupted.  
**Fix**:
- Check `@runecraft/runes` database path
- Ensure proper initialization in plugin setup
- Verify SQLite file permissions

## Git and Versioning Issues

### G009: Changeset Not Added for User-Facing Change

**Symptom**: Version not bumped in release.  
**Cause**: Missing changeset file for user-facing change.  
**Fix**:
```bash
# Add changeset interactively
bun run changeset

# Or create manually in .changeset/
# Format: .changeset/<name>.md with content:
# ---
# "@runecraft/<package>": patch
# ---
# Description of change
```

### G010: Commit Message Format Invalid

**Symptom**: Commit rejected by commitlint hook.  
**Cause**: Not following conventional commit format.  
**Fix**: Use `bun run commit` for interactive prompts, or follow format:
```
type(scope): description

# Valid types: feat, fix, docs, style, refactor, perf, test, chore
# Valid scopes: guild, runes, spells, summon, spawn, grimoire, familiar
```

### G011: .guild/ Committed to Git

**Symptom**: Git shows `.guild/` in status.  
**Cause**: `.guild/` is gitignored but sometimes gets staged.  
**Fix**:
- Never commit files from `.guild/`
- Check `.gitignore` includes `.guild/`
- If already committed: `git rm -r --cached .guild/`

## Configuration Issues

### G012: OpenCode MCP Config Format Error

**Symptom**: "Incorrect type. Expected 'array'" or "Property args is not allowed".  
**Cause**: Local MCP servers expect `command` as an array, not separate `command` and `args`.  
**Fix**:
```json
{
  "mcp": {
    "server": {
      "type": "local",
      "command": ["python3", "-m", "server.module", "arg1", "arg2"],
      "enabled": true
    }
  }
}
```

### G013: Plugin Not Loading

**Symptom**: Plugin features not available in OpenCode.  
**Cause**: Plugin not properly installed or configured.  
**Fix**:
- Check plugin is in `opencode.json` plugin array
- Restart OpenCode after adding plugins
- Clear cache: `rm -rf ~/.cache/opencode/packages/<plugin>`

## Debugging Tips

### Quick Checks

1. **Build fails?** → Run `turbo run build --force`
2. **Tests fail?** → Check test fixtures use `os.tmpdir()`
3. **Lint errors?** → Run `bun run lint` and fix issues
4. **Import errors?** → Check `workspace:*` in dependencies
5. **Type errors?** → Run `bun run typecheck`

### Useful Commands

```bash
# Full clean rebuild
rm -rf .turbo node_modules packages/*/dist
bun install
turbo run build

# Run specific package tests
bun test --cwd packages/guild

# Check for Zod version mixing
grep -r "from \"zod\"" packages/ | grep -v node_modules

# Verify Node.js compatibility
node -e "import('./packages/runes/dist/index.js')"
```

## Adding New Gotchas

When discovering a new pitfall:
1. Add a new entry with sequential ID (G0XX)
2. Include clear symptom description
3. Explain the root cause
4. Provide a concrete fix with code examples
5. Link to relevant files when possible

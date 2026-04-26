# @runecraftai/familiar

Pi multi-agent orchestration config — Herald, Forge, Scout, Sage, Arbiter, Ward.

## Setup

```bash
# 1. Copy to ~/.pi
cp -r agents agent BUILD_PLAN.md ~/.pi/

# 2. Install extension dependencies
cd ~/.pi/agent/extensions && npm install

# 3. Create auth.json from template
cp agent/auth.json.example ~/.pi/agent/auth.json
# Then fill in your OAuth tokens (run `claude` CLI to authenticate)
```

## Structure

```
agents/              # Agent role definitions
  herald.md          # Orchestrator
  forge.md           # Developer
  scout.md           # Explorer
  sage.md            # Planner
  arbiter.md         # Reviewer
  ward.md            # Security auditor
  subagents/         # Subagent specs (explore, review, verify)
agent/
  settings.json      # Default provider/model config
  extensions/
    anthropic-pro.ts # Claude Pro/Max OAuth provider (raw fetch, no SDK)
    tmux-delegate/   # Multi-agent tmux session management
```

## Notes

- `anthropic-pro.ts` uses OAuth tokens from Claude CLI (`~/.claude/.credentials.json`)
- No build step — extensions run via jiti (pi's TypeScript runtime)
- `auth.json` contains secrets and is gitignored

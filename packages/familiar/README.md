# @runecraft/familiar

**Pi multi-agent orchestration** — Runecraft themed with Herald/Scout/Sage/Forge/Ward/Arbiter workflow

---

## Agents

| Agent | Role | Model |
|-------|------|-------|
| **Herald** | Orchestrator — coordinates all agents | minimax-m2.7 |
| **Scout** | Explorer — reads code, graph-first | deepseek-v4-flash |
| **Sage** | Planner — spec-driven methodology | deepseek-v4-pro |
| **Forge** | Executor — writes code | minimax-m2.7 |
| **Ward** | Security auditor | deepseek-v4-flash |
| **Arbiter** | Quality reviewer | deepseek-v4-flash |

## Modes

| Mode | Description |
|------|-------------|
| **NORMAL** | Orchestrator mode — delegate to agents |
| **PLAN** | Spec-driven mode — Shift+Tab to toggle |

## Extensions

| Extension | Description |
|-----------|-------------|
| `agent-team` | Dispatch agents with live tmux widgets |
| `agent-chain` | Sequential chains with $INPUT |
| `mode-cycler` | Shift+Tab for NORMAL ↔ PLAN |
| `subagent-widget` | Live status widgets |
| `security-guard` | Blocks dangerous commands |
| `theme-cycler` | Ctrl+X to cycle themes |

## Chains

```bash
/chain plan-build-review   # scout → sage → forge → arbiter
/chain investigate-fix      # scout → forge → arbiter
```

## Installation

```bash
# Clone and install
git clone https://github.com/ruizrica/agent-pi.git
cd agent-pi
./install.sh

# Or use pi install
pi install git:github.com/ruizrica/agent-pi
```

## Usage

```bash
# Load extensions
pi -e extensions/agent-team.ts \
   -e extensions/agent-chain.ts \
   -e extensions/mode-cycler.ts

# Dispatch an agent
/delegate scout "Explore auth module"

# Run a chain
/chain plan-build-review

# Toggle plan mode
Shift+Tab
```

## Theme

Runecraft-dark theme with purple accents:
- Background: #1a1b26
- Accent: #bb9af7 (purple)
- Cyan: #7dcfff

Apply with: `/theme runecraft-dark`

---

Built with ♥ for Runecraft

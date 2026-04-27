# Spec: summon-cli

**Feature**: Summon CLI — Interactive agent skill manager
**Package**: `@runecraft/summon`
**Scope**: Large
**Status**: Draft
**Date**: 2026-04-24

---

## 1. Problem

Arcanum ships 7 agent skills (spells) but has no way to install them into coding agents.
Users must manually copy skill files into agent-specific config directories.
Each agent has a different config path and structure, making manual setup error-prone.

## 2. Goal

Provide a single CLI tool (`summon`) that:
- Detects installed coding agents on the user's machine
- Lets users browse, install, update, and remove skills interactively
- Supports both copy and symlink installation methods
- Works via `npx @runecraft/summon` with zero config

## 3. User Stories

### US-1: First-time user installs skills
**As** a developer with multiple coding agents installed,
**I want** to run `npx @runecraft/summon` and be guided through skill installation,
**So that** I can set up agent skills without knowing each agent's config format.

### US-2: User updates skills
**As** a developer with previously installed skills,
**I want** to run `summon update` to refresh installed skills to latest versions,
**So that** my agents always have current skill definitions.

### US-3: User removes skills
**As** a developer who no longer wants certain skills,
**I want** to run `summon remove` to cleanly uninstall skills from agents,
**So that** agent config directories stay clean.

### US-4: User lists installed skills
**As** a developer,
**I want** to run `summon list` and see which skills are installed where,
**So that** I can audit my current setup.

## 4. Functional Requirements

### FR-1: Agent Detection
- Scan known config directory paths for each supported agent
- Support 9 agents: Claude Code, Cursor, Windsurf, Cline, OpenCode, GitHub Copilot, Roo Code, Aider, Kiro
- Detection is path-existence based (no binary checks)
- Agent config paths:
  | Agent | Detection Path |
  |-------|---------------|
  | Claude Code | `~/.claude/` |
  | Cursor | `.cursor/rules/` |
  | Windsurf | `.windsurf/rules/` |
  | Cline | `.clinerules/` |
  | OpenCode | `~/.config/opencode/` |
  | GitHub Copilot | `.github/copilot-instructions.md` |
  | Roo Code | `.roo/` |
  | Aider | `.aider/` |
  | Kiro | `.kiro/` |

### FR-2: Skill Metadata
- All 7 SKILL.md files must have YAML frontmatter with: name, description, category, version, tags
- Categories: Development, Quality, Architecture, Operations (mapped per skill)
- Skill registry loads metadata by parsing frontmatter from SKILL.md files

### FR-3: Interactive TUI Flow (default / `install` command)
- **Step 1 — Banner + Detection**: Show ASCII art banner, scan agents, display detected agents with "✓ detected" badges
- **Step 2 — Agent Selection**: Multi-select toggle list (space=toggle, enter=confirm)
- **Step 3 — Action Menu**: Install / Update / Remove
- **Step 4 — Skill Browse** (Install path): Browse skills by category with expandable tree, space=toggle, /=filter, tab=detail
- **Step 5 — Method**: Choose Copy (recommended) or SymLink
- **Step 6 — Execute**: Progress display with per-agent/per-skill status

### FR-4: Commands
| Command | Behavior |
|---------|----------|
| `summon` (no args) | Full interactive TUI flow |
| `summon install` | Interactive TUI flow (same as no args) |
| `summon update` | Detect installed skills → confirm → update in-place |
| `summon remove` | Detect installed skills → select → remove |
| `summon list` | Non-interactive: print table of installed skills per agent |

### FR-5: Installation Methods
- **Copy**: Read SKILL.md, write content to agent config directory (recommended)
- **Symlink**: Create symlink from agent config directory to source SKILL.md
- Installation path per agent must respect each agent's conventions

### FR-6: Skill Discovery (for update/remove)
- Scan agent config dirs for files matching known skill filenames or containing frontmatter with known skill names
- Track installation method (copy vs symlink) for proper update/removal

## 5. Non-Functional Requirements

- **NFR-1**: Runs on macOS, Linux, and Windows (path resolution must be cross-platform)
- **NFR-2**: Zero runtime dependencies beyond what's in package.json (citty, @clack/prompts)
- **NFR-3**: Binary compiles via `bun build --compile` for standalone distribution
- **NFR-4**: npm-publishable as `@runecraft/summon`, executable via `npx`
- **NFR-5**: Graceful degradation — if no agents detected, show helpful message instead of crash

## 6. Acceptance Criteria

- [ ] `npx @runecraft/summon` launches interactive TUI
- [ ] All 9 agents are detected when their config dirs exist
- [ ] All 7 skills have valid YAML frontmatter
- [ ] Install (copy) writes skill content to correct agent config path
- [ ] Install (symlink) creates working symlink to skill source
- [ ] `summon list` outputs table of installed skills (non-interactive)
- [ ] `summon update` refreshes previously installed skills
- [ ] `summon remove` cleanly deletes installed skill files/symlinks
- [ ] Works on macOS and Linux (Windows best-effort)

## 7. Out of Scope

- Auto-discovery of agents not in the known list
- Remote skill registries or fetching skills from npm
- Agent-specific skill adaptation (all agents get same SKILL.md content for now)
- Skill dependency management
- Version conflict resolution

## 8. Constraints

- Must use citty v0.1.6 for CLI framework (already in deps)
- Must use @clack/prompts v0.7.0 for TUI (already in deps)
- Must compile with `bun build --compile`
- Skills source: `packages/spells/skills/` directory

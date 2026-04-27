# Design: summon-cli

**Feature**: Summon CLI
**Scope**: Large
**Date**: 2026-04-24

---

## 1. Architecture Overview

```
packages/summon/
├── src/
│   ├── cli.ts                    # citty main + subcommand registration
│   ├── commands/
│   │   ├── install.ts            # install command (launches interactive flow)
│   │   ├── update.ts             # update command
│   │   ├── remove.ts             # remove command
│   │   └── list.ts               # list command (non-interactive)
│   ├── agents/
│   │   ├── registry.ts           # Agent definitions + config path map
│   │   ├── detector.ts           # Scan filesystem for installed agents
│   │   └── resolver.ts           # Resolve install target path per agent
│   ├── skills/
│   │   ├── loader.ts             # Parse SKILL.md frontmatter, build skill catalog
│   │   ├── discovery.ts          # Find installed skills in agent config dirs
│   │   └── installer.ts          # Copy/symlink skill files to agent dirs
│   ├── tui/
│   │   ├── banner.ts             # ASCII art banner
│   │   ├── agent-select.ts       # Multi-select agent picker
│   │   ├── action-menu.ts        # Install/Update/Remove action picker
│   │   ├── skill-browse.ts       # Category tree with skill selection
│   │   ├── method-select.ts      # Copy vs Symlink picker
│   │   └── progress.ts           # Execution progress display
│   └── utils/
│       ├── paths.ts              # Cross-platform path resolution (~, config dirs)
│       └── fs.ts                 # File operations (copy, symlink, exists, remove)
```

## 2. Module Design

### 2.1 Agent Registry (`agents/registry.ts`)

Static map of known agents and their configuration:

```typescript
interface AgentConfig {
  id: string;
  name: string;
  detectPaths: string[];        // paths to check (relative to ~/ or cwd)
  installDir: string;           // where to write skill files
  scope: 'global' | 'project'; // global (~/) or project-local (cwd)
}
```

Agent config map:

| Agent | Scope | Detection | Install Target |
|-------|-------|-----------|---------------|
| Claude Code | global | `~/.claude/` | `~/.claude/skills/` |
| Cursor | project | `.cursor/rules/` | `.cursor/rules/skills/` |
| Windsurf | project | `.windsurf/rules/` | `.windsurf/rules/skills/` |
| Cline | project | `.clinerules/` | `.clinerules/skills/` |
| OpenCode | global | `~/.config/opencode/` | `~/.config/opencode/skills/` |
| GitHub Copilot | project | `.github/copilot-instructions.md` | `.github/skills/` |
| Roo Code | project | `.roo/` | `.roo/skills/` |
| Aider | project | `.aider/` | `.aider/skills/` |
| Kiro | project | `.kiro/` | `.kiro/skills/` |

### 2.2 Agent Detector (`agents/detector.ts`)

```typescript
interface DetectedAgent {
  config: AgentConfig;
  detected: boolean;
  path: string;  // resolved absolute path where detected
}

function detectAgents(): Promise<DetectedAgent[]>
```

- Iterates agent registry
- For each agent, checks existence of detectPaths (resolved via utils/paths.ts)
- Returns all agents with detection status

### 2.3 Skill Loader (`skills/loader.ts`)

```typescript
interface SkillMeta {
  name: string;
  description: string;
  category: string;
  version: string;
  tags: string[];
  filePath: string;      // absolute path to SKILL.md
  content: string;       // full file content
}

function loadSkillCatalog(spellsDir: string): Promise<SkillMeta[]>
```

- Scans `packages/spells/skills/*/SKILL.md`
- Parses YAML frontmatter (between `---` markers)
- Returns structured skill metadata array

### 2.4 Skill Discovery (`skills/discovery.ts`)

```typescript
interface InstalledSkill {
  skill: SkillMeta;
  agent: AgentConfig;
  installPath: string;
  method: 'copy' | 'symlink';
}

function discoverInstalledSkills(agents: DetectedAgent[], catalog: SkillMeta[]): Promise<InstalledSkill[]>
```

- For each detected agent, scan installDir for files matching skill names
- Detect method: if file is symlink → 'symlink', else → 'copy'
- Match by filename pattern: `<skill-name>.md` or `SKILL.md` in skill-named subdirectory

### 2.5 Skill Installer (`skills/installer.ts`)

```typescript
interface InstallResult {
  skill: SkillMeta;
  agent: AgentConfig;
  success: boolean;
  error?: string;
}

function installSkill(skill: SkillMeta, agent: DetectedAgent, method: 'copy' | 'symlink'): Promise<InstallResult>
function removeSkill(installed: InstalledSkill): Promise<InstallResult>
function updateSkill(installed: InstalledSkill): Promise<InstallResult>
```

- `installSkill`: Creates agent installDir if needed, writes file (copy) or creates symlink
- `removeSkill`: Deletes file or unlinks symlink
- `updateSkill`: Re-reads source SKILL.md, overwrites target (copy) or re-links (symlink)

### 2.6 TUI Flow

Interactive flow orchestrated by `commands/install.ts`:

```
banner() → detectAgents() → agentSelect() → actionMenu()
                                                   │
                                 ┌─────────────────┼──────────────────┐
                                 ▼                 ▼                  ▼
                           skillBrowse()    updateFlow()       removeFlow()
                                 │
                                 ▼
                           methodSelect()
                                 │
                                 ▼
                           execute() + progress()
```

Each TUI step is a separate module using @clack/prompts primitives:
- `banner.ts`: `console.log` with styled ASCII art
- `agent-select.ts`: `clack.multiselect()` with detected badges
- `action-menu.ts`: `clack.select()` for Install/Update/Remove
- `skill-browse.ts`: `clack.groupMultiselect()` grouped by category
- `method-select.ts`: `clack.select()` for Copy/Symlink
- `progress.ts`: `clack.spinner()` + `clack.log` per operation

### 2.7 Utils

**`utils/paths.ts`**:
- `resolveHome(p: string): string` — expand `~/` to `os.homedir()`
- `resolveAgentPath(agent: AgentConfig): string` — resolve detection/install paths based on scope

**`utils/fs.ts`**:
- `exists(p: string): Promise<boolean>`
- `isSymlink(p: string): Promise<boolean>`
- `copyFile(src: string, dest: string): Promise<void>`
- `symlinkFile(src: string, dest: string): Promise<void>`
- `removeFile(p: string): Promise<void>`
- `ensureDir(p: string): Promise<void>`

## 3. Skill Frontmatter Schema

All 7 SKILL.md files need this YAML frontmatter:

```yaml
---
name: <kebab-case-name>
description: <one-line description>
category: <Development|Quality|Architecture|Operations>
version: "1.0.0"
tags: [tag1, tag2, tag3]
---
```

Skill-to-category mapping:

| Skill | Category | Tags |
|-------|----------|------|
| spec-driven | Architecture | [planning, lifecycle, specs] |
| incremental-build | Development | [build, iteration, tdd] |
| code-review | Quality | [review, feedback, standards] |
| code-simplification | Quality | [refactoring, simplicity, cleanup] |
| test-verification | Quality | [testing, verification, coverage] |
| planning | Architecture | [planning, tasks, breakdown] |
| shipping | Operations | [release, deploy, changelog] |

## 4. Data Flow

```
SKILL.md files (source of truth)
     │
     ▼ parse frontmatter
SkillMeta[] (in-memory catalog)
     │
     ├──► TUI browse/select ──► user picks skills + agents + method
     │                                    │
     │                                    ▼
     │                          installer.installSkill()
     │                                    │
     │                          ┌─────────┴─────────┐
     │                          ▼                   ▼
     │                     copy content        create symlink
     │                          │                   │
     │                          ▼                   ▼
     │                   agent config dir     agent config dir
     │
     └──► discovery.discoverInstalledSkills()
                    │
                    ▼
              InstalledSkill[] ──► list / update / remove flows
```

## 5. CLI Command Structure (citty)

```typescript
// cli.ts
const main = defineCommand({
  meta: { name: 'summon', description: 'Arcanum Agent Skill Manager' },
  subCommands: {
    install: () => import('./commands/install'),
    update:  () => import('./commands/update'),
    remove:  () => import('./commands/remove'),
    list:    () => import('./commands/list'),
  },
  run: () => {
    // No subcommand → launch interactive flow (same as install)
  }
});
```

## 6. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI framework | citty | Already in deps, lightweight, lazy-loads subcommands |
| TUI library | @clack/prompts | Already in deps, beautiful prompts, low footprint |
| Skill source | Parse SKILL.md frontmatter | Single source of truth, no separate registry file |
| Install target naming | `<skill-name>.md` in skills/ subdir | Avoids conflicts, easy to discover |
| Agent detection | Path existence only | Simple, no binary deps, cross-platform |
| No config file | Stateless | Install state derived from filesystem scanning |

## 7. Error Handling Strategy

- No agents detected → show message with list of supported agents and their config paths
- No skills found → error with path to expected spells directory
- Permission denied on write → report per-file, continue with others
- Symlink not supported (Windows) → fall back to copy with warning
- User cancels (Ctrl+C) → clean exit via clack.isCancel() checks

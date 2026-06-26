# Design: Agent Skills Cherry-Pick

## Overview

This feature ports 11 production-grade engineering skills and 2 reference checklists from `addyosmani/agent-skills` into `@runecraft/spells`, then teaches `@runecraft/summon` to emit slash commands for those skills in three runtimes (Claude Code, OpenCode, Cursor). The design is **decoupled from `@runecraft/guild`** per explicit product decision — no agent assignments, no persona mapping, no command router integration in this round.

The work proceeds in three layers:

1. **Content layer (Spells)** — port 11 skills + 2 references, with adapted frontmatter.
2. **Registry layer (Summon)** — declare a single TS const array mapping skills to commands.
3. **Generator layer (Summon)** — implement three per-runtime generators that emit the right artifact shape, plus a `summon install commands` flow that wires it all together.

## Design Principles

1. **Single source of truth**: the registry in `summon/src/commands/registry.ts` is the only place that knows which skills become commands and under what names. No frontmatter coupling, no manifest files.
2. **Decouple from Guild**: commands invoke **skills**, not agents. This matches the upstream "user is the orchestrator" rule and lets users who install only `spells + summon` (no Guild) get full value.
3. **Additive, not destructive**: the 11 new skills are purely additive. `spec-driven` and `git-commit-learning` are untouched. No breaking changes.
4. **Idempotent installs**: re-running `summon install commands` produces the same files (overwrite, not duplicate).
5. **Fail loud, not silent**: missing target skill, runtime collision with built-in commands, no supported runtime detected — all surface as warnings or exit-1, never as silent skip.
6. **Format-per-runtime**: each runtime has a documented command shape. We honor that shape exactly. No "generic command" abstraction that would force a lowest-common-denominator output.

## Current State

### `@runecraft/spells` today

- 2 skills: `spec-driven` (v4.1, 39 references) and `git-commit-learning` (v1.0)
- 0 reference checklists
- Package version: 0.10.0
- Frontmatter pattern: bilingual triggers + negative filters (set by `spec-driven` v4.1)

### `@runecraft/summon` today

- Subcommands: `install`, `update`, `remove`, `list` (all routed to the TUI flow via `runInteractiveFlow`)
- `src/agents/registry.ts` declares 9 runtimes (Claude Code, Cursor, Windsurf, Cline, OpenCode, Copilot, Roo Code, Aider, Kiro) with detection paths and install directories
- `src/agents/detector.ts` checks each runtime's detection paths
- No command-generation surface
- Package version: 0.11.0

### `@runecraft/guild` (not touched in this round)

- Already has `bard`, `fighter`, `wizard`, `ranger`, `rogue`, `warlock`, `cleric`, `paladin` agents
- Has 5 built-in slash commands: `/start-work`, `/run-workflow`, `/guild-health`, `/metrics`, `/token-report`
- Will be reconsidered for command integration in a future round

### Upstream `addyosmani/agent-skills`

- 23 lifecycle skills + 1 meta skill (24 total)
- 5 reference checklists
- 4 specialist agent personas
- 8 slash commands (`.claude/commands/*.md`)
- 7 session hooks
- License: MIT

---

## Architecture Approach

### Layer 1: Content porting (Spells)

Each upstream skill lands in `packages/spells/skills/<name>/SKILL.md`. The porting work is mechanical but disciplined:

1. **Fetch** the upstream `SKILL.md` (and any `references/`) via `gh api repos/addyosmani/agent-skills/contents/skills/<name>/SKILL.md`.
2. **Translate the frontmatter**: upstream uses a single-line `description`. We expand to:
   ```yaml
   ---
   name: code-review-and-quality
   description: Reviews code changes with five-axis critique. Use when reviewing a PR, after a multi-file implementation, or before merge. EN triggers: /review, code review, PR review, merge gate. PT triggers: revisar código, revisão de PR. Do NOT use for: typo fixes, single-line changes, or when the user explicitly skips review.
   ---
   ```
3. **Strip Claude Code-specific references** from the body: any mention of `marketplace`, `plugin.json`, `${CLAUDE_PROJECT_DIR}`, or `.claude/settings.json` is removed or generalized.
4. **Keep the body in English** (per product decision).
5. **Drop upstream attribution** (per product decision).
6. **Preserve structure**: Overview, When to Use, Process, Rationalizations table, Red Flags, Verification gate.

References that are domain-portable (testing patterns, DoD) go to `packages/spells/references/`. References that are runtime-specific or rarely useful stay out.

The 11 ported skills:

| # | Skill | Ported to | Notes |
|---|---|---|---|
| 1 | `using-agent-skills` | `packages/spells/skills/using-agent-skills/SKILL.md` | Meta-roter; needs adaptation to reference our 13-skill catalog instead of upstream's 24 |
| 2 | `idea-refine` | `packages/spells/skills/idea-refine/SKILL.md` | Direct port |
| 3 | `interview-me` | `packages/spells/skills/interview-me/SKILL.md` | Direct port |
| 4 | `test-driven-development` | `packages/spells/skills/test-driven-development/SKILL.md` | Direct port |
| 5 | `doubt-driven-development` | `packages/spells/skills/doubt-driven-development/SKILL.md` | Direct port |
| 6 | `debugging-and-error-recovery` | `packages/spells/skills/debugging-and-error-recovery/SKILL.md` | Direct port |
| 7 | `code-review-and-quality` | `packages/spells/skills/code-review-and-quality/SKILL.md` | Direct port |
| 8 | `code-simplification` | `packages/spells/skills/code-simplification/SKILL.md` | Direct port |
| 9 | `security-and-hardening` | `packages/spells/skills/security-and-hardening/SKILL.md` | Direct port |
| 10 | `deprecation-and-migration` | `packages/spells/skills/deprecation-and-migration/SKILL.md` | Direct port |
| 11 | `shipping-and-launch` | `packages/spells/skills/shipping-and-launch/SKILL.md` | Direct port |

The 2 ported references:

| File | Source |
|---|---|
| `packages/spells/references/testing-patterns.md` | Upstream `references/testing-patterns.md` |
| `packages/spells/references/definition-of-done.md` | Upstream `references/definition-of-done.md` |

### Layer 2: Command registry (Summon)

A single TS const array in `packages/summon/src/commands/registry.ts`:

```ts
export interface CommandMapping {
  name: string;          // command name, e.g. "review" → user types "/review"
  skill: string;         // skill directory name, e.g. "code-review-and-quality"
  description: string;   // shown in the host's command palette
  builtinName?: string;  // for collision detection: names of host built-ins to avoid
}

export const COMMANDS: CommandMapping[] = [
  { name: "plan",     skill: "idea-refine",               description: "Plan a feature with idea-refine and interview-me" },
  { name: "review",   skill: "code-review-and-quality",   description: "Review changes with five-axis critique", builtinName: "review" },
  { name: "test",     skill: "test-driven-development",   description: "Run or generate tests with TDD pyramid" },
  { name: "simplify", skill: "code-simplification",       description: "Simplify code with Chesterton's Fence and Rule of 500" },
  { name: "ship",     skill: "shipping-and-launch",       description: "Pre-launch checklist and feature flag rollout" },
  { name: "security", skill: "security-and-hardening",    description: "Security audit with OWASP and three-tier boundaries" },
  { name: "debug",    skill: "debugging-and-error-recovery", description: "Five-step debugging triage" },
  { name: "harden",   skill: "doubt-driven-development",  description: "Adversarial review: CLAIM → EXTRACT → DOUBT → RECONCILE" },
];
```

Design choices:
- 8 commands, not 11 (or 13): `using-agent-skills` is meta (no command); `interview-me` and `git-commit-learning` are not command-shaped (interview-me is invoked inside `/plan`; git-commit-learning is invoked at commit time).
- `description` is short and host-agnostic. Each generator embeds it in the right frontmatter field.
- `builtinName` is the runtime's built-in command with the same name, if any. Used for collision warnings.

### Layer 3: Per-runtime generators (Summon)

A `CommandGenerator` interface in `packages/summon/src/commands/generator.ts`:

```ts
export interface CommandGenerator {
  runtime: string;       // matches `AGENTS[].id`
  detect(projectRoot: string): Promise<boolean>;
  generate(mapping: CommandMapping, installDir: string): Promise<void>;
}
```

Three concrete implementations:

#### Claude Code generator (`generators/claude-code.ts`)

**Detection**: `.claude/` exists or `CLAUDE.md` exists in project root.

**Artifact**: `.claude/commands/<name>.md`

**Template**:
```markdown
---
description: <mapping.description>
---

Load the `<mapping.skill>` skill and execute its process.
```

**Location**: project root (`.claude/commands/`), created if missing.

#### OpenCode generator (`generators/opencode.ts`)

**Detection**: `.opencode/` exists or `opencode.json` / `opencode.jsonc` exists in project root.

**Artifact**: `.opencode/commands/<name>.md` (per-project) or `~/.config/opencode/commands/<name>.md` (global; default to project per current Summon behavior).

**Template**:
```markdown
---
description: <mapping.description>
---

Load the `<mapping.skill>` skill and execute its process.

$ARGUMENTS
```

The `$ARGUMENTS` placeholder lets users pass context (e.g., `/debug "TypeError: cannot read property 'foo' of undefined"`). For commands that benefit from git context (review, ship), the template uses `` !`git diff --staged` `` to inject the current diff.

**Location**: project root (`.opencode/commands/`), created if missing.

#### Cursor generator (`generators/cursor.ts`)

**Detection**: `.cursor/` exists or `.cursorrules` exists in project root.

**Artifact**: `.cursor/rules/<name>.mdc`

**Template**:
```mdc
---
description: <mapping.description>
globs:
alwaysApply: false
---

When the user types `/<name>`, load the `<mapping.skill>` skill and execute its process. If the user provides arguments, treat them as $ARGUMENTS.
```

Cursor's `alwaysApply: false` means the rule only triggers when the user explicitly invokes the command. The body instructs the agent on what to do when triggered.

**Location**: project root (`.cursor/rules/`), created if missing.

### Layer 3.5: Install flow (Summon)

A new command file `packages/summon/src/commands/install-commands.ts`:

```ts
export default defineCommand({
  meta: { name: "install-commands", description: "Install slash commands" },
  async run() {
    // 1. Detect installed runtimes
    const runtimes = await detectRuntimes(process.cwd());
    if (runtimes.length === 0) {
      console.error("No supported runtime detected (.claude/, .opencode/, or .cursor/)");
      process.exit(1);
    }

    // 2. For each runtime, load the corresponding generator
    // 3. For each generator, filter COMMANDS:
    //    - skip if target skill is not in installed skills
    //    - skip if name collides with runtime built-in (and user didn't opt-in)
    // 4. Generate files
    // 5. Print summary
  },
});
```

The command is registered in `cli.ts`:
```ts
subCommands: {
  install: () => import("./commands/install").then((m) => m.default),
  "install-commands": () => import("./commands/install-commands").then((m) => m.default),
  // ...
},
```

The TUI flow (`runInteractiveFlow`) is extended to offer commands as a step after skill selection, so `summon install` (no subcommand) still works as a one-shot interactive experience.

---

## Command-by-command UX

| Command | Skill | Body extras |
|---|---|---|
| `/plan` | `idea-refine` | Default behavior: divergent/convergent thinking to shape a proposal. If user responds with ambiguity, `/plan` chains into `interview-me` for one-question-at-a-time extraction. |
| `/review` | `code-review-and-quality` | Claude Code/Cursor: no extras. OpenCode: `` !`git diff --staged` `` injected into the prompt. |
| `/test` | `test-driven-development` | No extras. |
| `/simplify` | `code-simplification` | No extras. |
| `/ship` | `shipping-and-launch` | OpenCode: `` !`git log --oneline -10` `` for recent context. |
| `/security` | `security-and-hardening` | No extras. |
| `/debug` | `debugging-and-error-recovery` | Uses `$ARGUMENTS` to pass error message. |
| `/harden` | `doubt-driven-development` | No extras. |

The body extras are part of the template the generator emits, not runtime logic. They are static in the generated file.

---

## Verification Strategy

1. **Content verification**: for each of the 11 ported skills, diff the upstream `SKILL.md` against the local one to confirm only the expected edits (frontmatter expansion, Claude Code references removed, attribution stripped).
2. **Registry verification**: unit test that `COMMANDS` contains exactly 8 entries, that all `skill` fields resolve to existing directories, and that no `name` collides with a runtime built-in (per the optional `builtinName` field, with a warning-only policy).
3. **Generator verification**: unit tests for each generator, using a temp directory as project root. Assert that:
   - The correct path is created
   - The file content matches the expected template
   - Re-running overwrites idempotently (no duplicates)
4. **End-to-end smoke**: run `summon install-commands` in a temp project that has each of the three runtimes detected. Confirm 8 command files per runtime.
5. **Cross-runtime sanity**: open one generated file per runtime in a real host (if available) and confirm the command appears in the host's command palette.
6. **Build + lint + typecheck**: `bun run build`, `bunx turbo lint`, `bunx turbo typecheck` all pass.
7. **Existing skill regression**: `summon list` shows 13 skills (2 existing + 11 new), and installing `spec-driven` produces the same files as before.

---

## Documentation Impact

- `packages/spells/README.md` — update skill table from 2 rows to 13 rows; add `references/` section.
- `packages/spells/skills/<name>/README.md` — one per new skill, short summary + triggers.
- `packages/summon/README.md` — add "Install slash commands" section explaining the `install-commands` subcommand and the 3 supported runtimes.

---

## Risks

1. **Upstream content quality variance**: some upstream skills are well-written (code-review-and-quality) and some are scaffolds. Mitigation: skip scaffolds; only port the 11 that are battle-tested.
2. **Frontmatter drift**: the `using-agent-skills` meta-skill from upstream needs adaptation to reference our 13-skill catalog instead of upstream's 24. Mitigation: rewrite the dispatch table in that one skill; do a thorough cross-check.
3. **OpenCode command format evolution**: OpenCode's command format may add new placeholder syntax. Mitigation: the generator is the only file to update; skills stay stable.
4. **Cursor rule match precision**: Cursor's `alwaysApply: false` rule matching is less precise than Claude Code's `description`-based command palette. Users may need to type the rule name explicitly. Mitigation: document this in the skills README.
5. **Runtime detection false positives**: a project that has a stale `.claude/` directory from a prior experiment but no real Claude Code install will still trigger the generator. Mitigation: detection is purely path-based; downstream users will see empty command files and can delete them. Low risk.
6. **No upstream attribution**: per product decision, we strip attribution. Mitigation: keep a private internal note (`packages/spells/CHANGELOG.md` or similar) recording the source for future maintainers.
7. **Conventional commits must be followed**: the auto-changeset flow depends on `feat(spells):` and `feat(summon):` with the right scopes. Mitigation: document the commit pattern in `CONTRIBUTING.md` if not already; tasks.md includes a commit-conventions check.

---

## Execution Notes

- Keep the feature folder self-contained: `.specs/features/agent-skills-cherrypick/`.
- The spec/design/tasks are split into the three layers: content (Spells), registry (Summon), generators (Summon).
- Each layer has a clear "done when" criterion.
- The 8 commands are listed in the registry. Adding a 9th later is a one-line change.
- Guild is explicitly out of scope. If a future round wants commands to delegate to Guild agents, that round updates the generator bodies to include `agent: <name>` for OpenCode and adds a metadata field for the other runtimes.

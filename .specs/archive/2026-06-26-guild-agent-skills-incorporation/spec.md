# Guild Agent-Skills Incorporation Specification

## Problem Statement

The upstream `addyosmani/agent-skills` repository encodes a discipline of engineering workflows that the `@runecraft/guild` package (a standalone OpenCode plugin) does not capture today. The cherrypick spec (`.specs/features/agent-skills-cherrypick/`) deliberately leaves Guild out of scope — it ports skills and slash commands to `spells` and `summon`. The Guild package, however, ships fifteen bundled `guild-*` skills that are thin process documents (~25–30 lines each), an agents doc that describes what each agent does but **not** the orchestration patterns or anti-patterns they should follow, and a `.guild/knowledge/` system that has no concept of a *project-wide standing bar* — only per-task acceptance criteria in `plans/<slug>/tasks.md`.

Three concrete gaps:

1. **Skill anatomy is thin.** Bundled skills have frontmatter + Primary inputs + Guidance + Output. They lack: a numbered **Process** workflow, a **Rationalizations** table (excuse + rebuttal), **Red Flags** (signs something is wrong), and a **Verification** gate with explicit evidence requirements. The agent-skills repo enforces "every skill ends with evidence requirements — 'seems right' is never sufficient." Guild has no equivalent.
2. **No orchestration patterns doc.** Guild registers eight built-in agents, supports `custom_agents`, and exposes category-based routing. The agents doc enumerates the agents but does not document the *endorsed orchestration patterns* (direct invocation, single-persona command, parallel fan-out with merge, sequential pipeline, research isolation) or the *anti-patterns* (router persona, persona-calls-persona, paraphrasing orchestrator, deep persona trees). Users can build the anti-patterns by composing Bard + custom_agents + categories. There is no guardrail.
3. **No project-wide Definition-of-Done.** `guild-verify` reads `plans/<slug>/tasks.md` for per-task acceptance criteria. There is no slot for a *project-wide standing bar* that applies to every change in the consuming project. The cherrypick will port `definition-of-done.md` to `spells/references/` as installable **content** (a generic engineering template). The Guild needs the **mechanism** — a slot the runtime reads — in `.guild/knowledge/definition-of-done.md` of the consuming project.

We should adopt the agent-skills anatomy as the Guild authoring standard, retrofit the fifteen bundled skills, ship an orchestration patterns doc that protects `custom_agents` from the documented anti-patterns, and add the DoD slot that `guild-verify` and `guild-ship` consult alongside the per-task criteria.

## Goals

- [ ] Adopt the agent-skills skill anatomy (Overview → When to Use → Process → Rationalizations → Red Flags → Verification) as the canonical authoring standard documented in `packages/guild/docs/skills.md`.
- [ ] Retrofit all 15 bundled `guild-*` skills under `packages/guild/skills/<name>/SKILL.md` to the new anatomy. Every skill ends with an explicit Verification gate stating the evidence required to claim the skill ran successfully.
- [ ] Sync `packages/guild/docs/skills.md` bundled-skills table (currently lists 13) with reality (15 directories exist).
- [ ] Add `packages/guild/docs/orchestration.md` mapping Guild primitives (Bard lead, delegation subagents, category Rangers, `/start-work`, Cleric/Paladin review) onto the five endorsed orchestration patterns and four anti-patterns. Include a "Bard is a lead, not a meta-router" section.
- [ ] Wire orchestration doc from the docs index, `agents.md`, and `custom-agents.md` via cross-links. This doc is **independent** of the in-progress `guild-docs-customization-recipes` spec (that spec covers *config recipes*; this one covers *orchestration patterns*).
- [ ] Add `definition-of-done.md` to the `.guild/knowledge/` slot list in `.guild/architecture.md` and to the canonical loading order.
- [ ] Update `guild-init` to scaffold `.guild/knowledge/definition-of-done.md` (empty template) on first-run bootstrap.
- [ ] Update `guild-verify` and `guild-ship` skill bodies to read two criteria: (a) per-task from `plans/<slug>/tasks.md`, (b) project-wide from `knowledge/definition-of-done.md`. Graceful fallback when the file is absent (degrade to per-task only; do not fail).
- [ ] Document the DoD mechanism in a new `packages/guild/docs/definition-of-done.md` recipe explaining what to put in the file and how the agents consume it.
- [ ] Pass `bun run build`, `bunx turbo lint`, and the existing `packages/guild` test suite.
- [ ] Make every commit follow conventional commits with `feat(guild):` or `docs(guild):` scope so the auto-changeset flow produces a clean changelog.

## Out of Scope

| Item | Reason |
| --- | --- |
| Porting the 5 remaining reference checklists (`security-checklist`, `performance-checklist`, `accessibility-checklist`, `observability-checklist`, `orchestration-patterns`) into Guild-bundled content | Scope creep: Guild is a generic orchestrator; domain checklists belong in `spells/references/` (the cherrypick) where users opt in. The orchestration doc in this feature is *Guild-specific* guidance, not the upstream `orchestration-patterns.md` file. |
| Adding new built-in agents (`test-engineer`, `web-performance-auditor`) | Inflates the core. Users get the same coverage through `custom_agents` recipes (already documented in `custom-agents.md`) and category routing. |
| Session hooks (`session-start.sh`, `sdd-cache-pre.sh`, `simplify-ignore.sh`) | Coupled to Claude Code's `PreToolUse`/`PostToolUse`; OpenCode has no equivalent today. Cherrypick already excludes them. |
| Touching `packages/spells/` or `packages/summon/` | Explicit decoupling maintained. The cherrypick owns those packages. |
| Replacing `guild-verify` with a runtime gate that *enforces* evidence collection | Skills instruct agents; we do not change the runtime. The Verification gate is content-level discipline, not a runtime hook. |
| Auto-scaffolding a non-empty DoD (e.g., pulling a generic DoD from `spells/references/`) | DoD content is project-specific. `guild-init` scaffolds an empty template; the user fills it. |
| Migrating legacy `.specs/` or `.notebook/` DoD content into `.guild/knowledge/definition-of-done.md` | Fallback-to-legacy handling lives in `.guild/architecture.md` already; this feature does not change it. |
| Inline `prompt_append` changes to built-in agents | Out of scope. The orchestration doc tells users how to avoid anti-patterns; it does not mutate the eight built-in agents. |

---

## User Stories

### P1: Adopt the agent-skills anatomy as the Guild standard ⭐ MVP

**User Story**: As a Guild contributor, I want a documented skill anatomy so every bundled skill follows the same structure (Process / Rationalizations / Red Flags / Verification) and authors have a template to follow.

**Acceptance Criteria**:

1. WHEN the author opens `packages/guild/docs/skills.md` THEN it SHALL document the full anatomy: frontmatter, Overview, When to Use, Process, Rationalizations, Red Flags, Verification.
2. WHEN the anatomy doc explains the Rationalizations table THEN it SHALL state the format (excuse column + rebuttal column) and the purpose (counter-arguments to common agent rationalizations).
3. WHEN the anatomy doc explains the Verification section THEN it SHALL state the policy: every skill ends with explicit evidence requirements; "seems right" is never sufficient.
4. WHEN the bundled-skills table is shown THEN it SHALL list all 15 skills present under `packages/guild/skills/`.
5. WHEN authoring tips are given THEN they SHALL include: put the single most important behaviour in the first paragraph; keep Process steps numbered and atomic; keep the Rationalizations table ≥ 3 rows for any skill with steps an agent might want to skip.

**Independent Test**: Open `docs/skills.md`, confirm the anatomy section is present and the bundled-skills table lists 15 entries.

---

### P1: Retrofit all bundled skills to the new anatomy ⭐ MVP

**User Story**: As a Guild user, I want every bundled `guild-*` skill to follow the new anatomy so the agent has a Process workflow, anti-rationalization table, red flags, and a Verification gate to follow — not just a short Guidance list.

**Acceptance Criteria**:

1. WHEN any of the 15 bundled skills is loaded into an agent's prompt THEN the body SHALL contain the sections: Overview, When to Use, Process, Rationalizations, Red Flags, Verification.
2. WHEN a skill has a Process section THEN it SHALL list numbered, atomic steps.
3. WHEN a skill has a Rationalizations table THEN it SHALL have at least 3 rows for skills that include implementation, review, verification, or shipping steps (the rest may have fewer or none if no skip-rationalization applies).
4. WHEN a skill has a Verification section THEN it SHALL state the evidence required (file paths, command output, build/lint/test results) and SHALL include the rule "seems right is not evidence."
5. WHEN a skill currently has a "Primary inputs" / "Fallback rules" / "Output" / "See also" section THEN those SHALL be preserved (placed under appropriate new sections: Primary inputs goes under Overview, Output under Verification, See also at the end).
6. WHEN the retrofit touches an existing skill THEN no behaviour change SHALL occur beyond structural expansion and Rationalizations/Red Flags/Verification addition.

**Independent Test**: For each of the 15 skills, `grep -c "## Rationalizations" packages/guild/skills/<name>/SKILL.md` returns ≥ 1 and `grep -c "## Verification" packages/guild/skills/<name>/SKILL.md` returns ≥ 1.

---

### P1: Ship an orchestration patterns doc ⭐ MVP

**User Story**: As a Guild user composing `custom_agents` and category Rangers, I want a doc that names the endorsed orchestration patterns and the anti-patterns, mapped to Guild primitives, so I avoid building router Bards, persona-calls-persona chains, and deep trees.

**Acceptance Criteria**:

1. WHEN the user opens `packages/guild/docs/orchestration.md` THEN it SHALL define the five endorsed patterns: direct invocation, single-persona command, parallel fan-out with merge, sequential pipeline (user is orchestrator), research isolation.
2. WHEN the doc lists anti-patterns THEN it SHALL include: router persona (meta-orchestrator that decides which persona to call), persona-calls-persona, sequential orchestrator that paraphrases, deep persona trees.
3. WHEN each anti-pattern is described THEN it SHALL include a "How this would look in Guild" subsection naming the Guild primitives involved (e.g., router Bard = a `custom_agents` entry whose prompt is purely routing logic that re-invokes other agents).
4. WHEN the doc covers Bard's role THEN it SHALL have a "Bard is a lead, not a meta-router" section stating that Bard is the user-driven primary; delegation is user-initiated; Bard does not silently route work to satisfy a router prompt.
5. WHEN the doc is published THEN `docs/README.md` SHALL link to it from the Customization and Reference sections.
6. WHEN the doc is published THEN `docs/agents.md` SHALL cross-link to it from the "See also" section, and `docs/custom-agents.md` SHALL cross-link to it from the "See also" section.

**Independent Test**: `docs/orchestration.md` contains sections named "Endorsed patterns" and "Anti-patterns" and a section titled "Bard is a lead". `docs/README.md` contains a link to `orchestration.md`.

---

### P1: Add a project-wide Definition-of-Done slot to `.guild/knowledge/`

**User Story**: As a Guild user, I want `.guild/knowledge/definition-of-done.md` to be the project-wide standing bar that `guild-verify` and `guild-ship` check against, in addition to per-task `tasks.md` criteria, so my project's quality bar is enforced consistently across all plans.

**Acceptance Criteria**:

1. WHEN `.guild/architecture.md` is read THEN it SHALL list `definition-of-done.md` in the `knowledge/` table with its purpose (project-wide standing bar) and `knowledge/index.md` SHALL mention it.
2. WHEN the canonical loading order in `.guild/architecture.md` is followed THEN `definition-of-done.md` SHALL be loaded after `knowledge/index.md` and before plan-local state.
3. WHEN `guild-init` runs THEN it SHALL scaffold `.guild/knowledge/definition-of-done.md` with a template containing: header comment explaining the role, an empty "Project-wide standing bar" section, and a pointer to `plans/<slug>/tasks.md` for per-task criteria.
4. WHEN `guild-init` runs and the file already exists THEN it SHALL NOT overwrite the existing file.
5. WHEN `.guild/architecture.md` is updated THEN the "Plan-local vs global state boundary" table SHALL add a row for DoD (per-plan DoD lives in plan; project-wide DoD lives in knowledge).

**Independent Test**: After running `guild-init` in a fresh project, `.guild/knowledge/definition-of-done.md` exists. Running `guild-init` again does not modify the file's content if it was customized.

---

### P1: `guild-verify` and `guild-ship` consult two criteria ⭐ MVP

**User Story**: As a Guild user, I want `guild-verify` to check both per-task criteria (in `tasks.md`) and project-wide criteria (in `knowledge/definition-of-done.md`) so the agent does not declare a change verified against only one of the two.

**Acceptance Criteria**:

1. WHEN `guild-verify` runs THEN its Process SHALL list the per-task check first, then the project-wide check, and the Verification gate SHALL require evidence for both.
2. WHEN `guild-ship` runs THEN its Process SHALL include a "DoD gate" step that reads `knowledge/definition-of-done.md` and confirms every bar item is met before shipping.
3. WHEN `knowledge/definition-of-done.md` is absent THEN both skills SHALL degrade gracefully (skip the project-wide check, log a note in `plans/<slug>/notes.md`, continue with per-task only) and SHALL NOT exit with a hard failure.
4. WHEN the project-wide bar contains an item the agent cannot verify from the current change THEN the skill SHALL mark the item as "unable to verify" in the notes and SHALL NOT auto-pass it.
5. WHEN a project-wide bar item fails THEN the Verification gate SHALL fail the overall verification with a clear pointer to the failing item.

**Independent Test**: With an empty `.guild/knowledge/definition-of-done.md`, `guild-verify` still completes per-task verification and writes a notes entry stating "DoD project-wide bar: empty; skipped." With a populated bar containing an unmet item, the verification output lists the unmet item as a failure.

---

### P2: Document the DoD mechanism in a user-facing recipe

**User Story**: As a Guild user, I want a docs page that explains what to put in `.guild/knowledge/definition-of-done.md`, how `guild-verify` and `guild-ship` consume it, and how it differs from the per-task `tasks.md` criteria, so I can author a meaningful project-wide bar.

**Acceptance Criteria**:

1. WHEN the user opens `packages/guild/docs/definition-of-done.md` THEN it SHALL explain the distinction between project-wide bar (knowledge/definition-of-done.md) and per-task criteria (plans/<slug>/tasks.md).
2. WHEN examples are shown THEN they SHALL include: a minimal template, a populated example for a TypeScript monorepo, and a populated example for a frontend SPA.
3. WHEN the page describes consumption THEN it SHALL name the skills that read it (`guild-verify`, `guild-ship`) and the graceful-degradation behavior.
4. WHEN the page is published THEN `docs/README.md` SHALL link to it from the "Customize how agents think and act" or a new "Project state" section.
5. WHEN the page is published THEN `docs/skills.md` and `docs/agents.md` SHALL cross-link to it where relevant.

**Independent Test**: The page contains the phrase "project-wide standing bar" and links from `docs/README.md` resolve.

---

## Edge Cases

- WHEN a skill retrofit would inflate a thin skill (e.g., `guild-commit-learning`) past its useful length THEN the Rationalizations table MAY be omitted if no skip-rationalization applies; Red Flags and Verification SHALL still be present.
- WHEN the orchestration doc references an agent that does not exist (e.g., a future agent) THEN the doc SHALL use the current eight built-ins as examples; future agents are documented when they ship.
- WHEN `guild-init` runs in a non-fresh project (some `.guild/knowledge/` files already exist) THEN it SHALL only create the missing files; it SHALL NOT touch existing ones.
- WHEN `knowledge/definition-of-done.md` contains a non-Markdown file (e.g., a directory or a binary) THEN `guild-verify` SHALL treat the project-wide check as degraded and log a clear error in `plans/<slug>/notes.md`.
- WHEN two `custom_agents` entries are designed in a way that matches an anti-pattern (e.g., one that calls another) THEN the orchestration doc SHALL name the anti-pattern and the user is expected to refactor; Guild does not block the config at load time.
- WHEN the agent-skills upstream evolves its anatomy (new sections, renamed ones) THEN Guild SHALL NOT auto-follow; the Guild anatomy is fixed by this spec until a future spec revises it.
- WHEN `bun run build` runs after the retrofit THEN the bundled skills directory tree SHALL be unchanged (skills live in `packages/guild/skills/`, not under `dist/`).
- WHEN the retrofit touches `guild-init` and `guild-init` is the entry-point of the workflow THEN the existing init flow (legacy `.specs/` fallback) SHALL remain intact; only the addition of the new scaffold file is new behaviour.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-INCORP-01 | Anatomy doc | `packages/guild/docs/skills.md` (anatomy section) | Planned |
| GUILD-INCORP-02 | Bundled-skills table sync | `packages/guild/docs/skills.md` (table updated to 15 rows) | Planned |
| GUILD-INCORP-03..17 | Retrofit 15 skills | `packages/guild/skills/<name>/SKILL.md` × 15 | Planned |
| GUILD-INCORP-18 | Orchestration doc | `packages/guild/docs/orchestration.md` (new) | Planned |
| GUILD-INCORP-19 | Orchestration cross-links | `docs/README.md`, `docs/agents.md`, `docs/custom-agents.md` | Planned |
| GUILD-INCORP-20 | Architecture knowledge slot | `.guild/architecture.md` (knowledge table + loading order + boundary table) | Planned |
| GUILD-INCORP-21 | `guild-init` scaffolds DoD | `packages/guild/skills/guild-init/SKILL.md` | Planned |
| GUILD-INCORP-22 | `guild-verify` reads 2 criteria | `packages/guild/skills/guild-verify/SKILL.md` | Planned |
| GUILD-INCORP-23 | `guild-ship` reads 2 criteria | `packages/guild/skills/guild-ship/SKILL.md` | Planned |
| GUILD-INCORP-24 | DoD recipe doc | `packages/guild/docs/definition-of-done.md` (new) | Planned |
| GUILD-INCORP-25 | DoD doc cross-links | `docs/README.md` | Planned |
| GUILD-INCORP-26 | Build, lint, typecheck | Repo-level | Planned |
| GUILD-INCORP-27 | Test regression | `packages/guild/test/` + `*.test.ts` | Planned |

---

## Success Criteria

- [ ] `packages/guild/docs/skills.md` documents the full anatomy and lists 15 bundled skills.
- [ ] All 15 `packages/guild/skills/<name>/SKILL.md` files contain the sections `## Process`, `## Rationalizations`, `## Red Flags`, and `## Verification`.
- [ ] `packages/guild/docs/orchestration.md` exists with sections "Endorsed patterns", "Anti-patterns", and "Bard is a lead".
- [ ] `docs/README.md` links to `orchestration.md` and `definition-of-done.md`.
- [ ] `.guild/architecture.md` lists `definition-of-done.md` in the knowledge table and the canonical loading order.
- [ ] `packages/guild/skills/guild-init/SKILL.md` includes the DoD scaffold step.
- [ ] `packages/guild/skills/guild-verify/SKILL.md` and `guild-ship/SKILL.md` reference the project-wide bar and define graceful degradation when the file is absent.
- [ ] `packages/guild/docs/definition-of-done.md` exists with the distinction between project-wide bar and per-task criteria, plus populated examples.
- [ ] `bun run build` passes at the repo root.
- [ ] `bunx turbo lint` passes for `packages/guild`.
- [ ] `bun test` in `packages/guild` passes (no regression in the existing test suite).
- [ ] Commits use `feat(guild):` or `docs(guild):` scopes.
- [ ] No code change in `packages/spells/` or `packages/summon/` (decoupling maintained).

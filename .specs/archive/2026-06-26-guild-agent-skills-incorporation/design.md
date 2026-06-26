# Design: Guild Agent-Skills Incorporation

## Overview

This feature brings three discipline artifacts from upstream `addyosmani/agent-skills` into the `@runecraft/guild` package (a standalone OpenCode plugin). The work proceeds in three layers that share no runtime code:

1. **Skill anatomy + retrofit (15 skills)** — adopt the agent-skills anatomy as the canonical authoring standard; retrofit every bundled `guild-*` skill to follow it. The agent prompt now contains Process, Rationalizations, Red Flags, and Verification sections.
2. **Orchestration patterns doc** — a new `docs/orchestration.md` that maps Guild primitives onto the five endorsed orchestration patterns and the four anti-patterns. The doc is content, not runtime; it protects users from building router Bards, persona-calls-persona chains, and deep trees.
3. **Project-wide Definition-of-Done mechanism** — a new slot in `.guild/knowledge/definition-of-done.md` (consuming-project-owned), consulted by `guild-verify` and `guild-ship` alongside the per-task `tasks.md` criteria. The mechanism is file-reading via skill instructions; no new TS code.

The design is **content-first**: no new config schema, no new runtime hook, no changes to the agent registry, command router, or skill loader. The package's surface area is unchanged; what changes is what agents see in context and what the docs tell users to do.

## Design Principles

1. **Skill anatomy is the standard.** Every bundled skill follows the same structure. The anatomy is documented in `docs/skills.md` and enforced by code review, not by tooling.
2. **Anti-rationalization beats positive instructions.** Every Process section is paired with a Rationalizations table that names the excuses agents use to skip steps and rebuts them inline. This is the single biggest behaviour change: skills stop sounding like guidance and start sounding like workflows with anti-patterns called out.
3. **Verification is evidence, not intent.** Every skill ends with a Verification gate that names the specific evidence required (file paths, command output, lint/test/build status). "Seems right" is never sufficient. This is the same rule the upstream enforces.
4. **Orchestration doc is content, not enforcement.** The doc tells users which patterns to follow and which to avoid. Guild does not block anti-patterns at load time; the cost of a config-time check is too high for a benefit users can get from reading the doc.
5. **DoD is project-owned, not bundled.** `knowledge/definition-of-done.md` is scaffolded empty by `guild-init`; the consuming project writes its own bar. Generic DoD content lives in `spells/references/` (cherrypick) and can be copied in as a starter if the user wants.
6. **Graceful degradation everywhere.** If the DoD file is missing, malformed, or empty, `guild-verify` and `guild-ship` do not fail. They log a note, skip the project-wide check, and continue. This is the same fallback pattern `.guild/architecture.md` already uses for the legacy `.specs/` paths.
7. **Decouple from spells + summon.** This feature touches `packages/guild/` only. No commits in `packages/spells/` or `packages/summon/`. The cherrypick spec remains the source of truth for those packages.

## Current State

### Bundled skills today

`packages/guild/skills/` contains 15 directories. The `docs/skills.md` bundled-skills table lists 13. The 15 are:

| Directory | Listed in docs/skills.md? |
| --- | --- |
| `guild-commit-learning` | Yes |
| `guild-configurator` | No |
| `guild-execute` | Yes |
| `guild-handoff` | Yes |
| `guild-init` | Yes |
| `guild-load` | Yes |
| `guild-plan` | Yes |
| `guild-recon` | No |
| `guild-research` | Yes |
| `guild-review` | Yes |
| `guild-scope` | Yes |
| `guild-security` | Yes |
| `guild-ship` | Yes |
| `guild-spec` | Yes |
| `guild-verify` | Yes |

The two unlisted (`guild-configurator`, `guild-recon`) are real bundled skills that escaped the docs. The retrofit fixes the table.

### Skill shape today (sample: `guild-verify`)

```markdown
---
name: guild-verify
description: >
  Prove a Guild change works by running checks and comparing results
  against `.guild/plans/<slug>/tasks.md` acceptance criteria.
license: CC-BY-4.0
---

# guild-verify

Verify the change against evidence, not intent.

## Primary inputs
- `.guild/plans/<slug>/tasks.md`
- `.guild/plans/<slug>/spec.md`

## Guidance
- Run the smallest useful test set first
- Check type errors, regressions, and acceptance criteria
- Record environment-specific failures in `.guild/plans/<slug>/notes.md`

## Output
- Update `.guild/plans/<slug>/tasks.md` task status
- Update `.guild/plans/<slug>/state.md`
```

This is the shape for all 15 skills. No Process, no Rationalizations, no Red Flags, no Verification gate. An agent loading this skill sees guidance, not a workflow.

### Agents doc today

`docs/agents.md` describes the eight built-in agents (Bard, Fighter, Ranger, Wizard, Rogue, Warlock, Cleric, Paladin), the categories system, the review model variants, customization order (skills → prompt_append → temperature → prompt → tools), and model fallback. It does **not** document orchestration patterns or anti-patterns. A user reading it can build a router Bard with a `custom_agents` entry whose prompt is purely routing logic and there is no doc telling them not to.

### `.guild/architecture.md` knowledge slot today

The knowledge table lists `index.md`, `decisions.md`, `conventions.md`, `gotchas.md`. The canonical loading order loads `knowledge/index.md` then "relevant knowledge files." The plan-local vs global state boundary table has no row for project-wide standing bar.

---

## Architecture Approach

### Layer 1: Skill anatomy standard

The anatomy is documented in `docs/skills.md` under a new "Skill anatomy" section:

```markdown
## Skill anatomy

Every bundled skill follows the same structure. Authors of new skills SHALL use the same structure; the code review enforces it.

| Section | Purpose |
| --- | --- |
| Frontmatter | name (required), description (required, with bilingual triggers + negative filters), license, optional model/tools |
| Overview | One paragraph: what this skill does. First sentence states the single most important behaviour. |
| When to Use | Trigger conditions (what user intent activates this skill) and "Do NOT use for" negative filters. |
| Primary inputs | File paths the skill reads. Sub-section of Overview. |
| Process | Numbered, atomic steps. Each step is one action the agent can complete and verify. |
| Rationalizations | Table of common excuses agents use to skip Process steps + rebuttals. ≥ 3 rows for skills that include implementation, review, verification, or shipping steps. |
| Red Flags | Signs the skill is being misapplied or the work is going off the rails. |
| Verification | Evidence required to claim the skill ran successfully. Includes the rule: "'seems right' is not evidence." Names specific commands, file paths, and outputs. |
| Output | Side effects: file updates, status changes, handoff summaries. Sub-section of Verification. |
| See also | Cross-links to related skills and docs. |
```

### Layer 2: Skill retrofit pattern

For each of the 15 skills, the retrofit follows the same template. The current `Primary inputs`/`Guidance`/`Output`/`See also` structure is preserved by slotting into the new sections:

- `Primary inputs` → under **Overview** as a bullet list of file paths
- `Guidance` bullets → expanded into **Process** numbered steps where applicable; bullets that are not steps move to **When to Use** or **Red Flags** as appropriate
- `Output` → under **Verification** as the concrete artefacts the skill produces
- `See also` → at the end, unchanged
- New **Rationalizations** table authored per-skill (≥ 3 rows for the workflow-shaped skills)
- New **Red Flags** list (≥ 2 items per skill)
- New **Verification** gate stating the specific evidence required

The retrofit is content-only. No skill loader changes, no frontmatter schema changes.

#### Rationalizations table — design rules

Format:

```markdown
## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "The change is small, I can skip the spec." | Per-task acceptance criteria live in `tasks.md`; the spec is the contract that produced them. Skipping the spec breaks the contract. |
| "Tests will slow me down, I'll add them later." | The skill explicitly states tests are part of the Process; deferring them produces a verification gate failure. |
| "It compiles, that proves it works." | Compilation proves syntax, not behaviour. The Verification gate names the test/build/runtime evidence required. |
```

Each row is one excuse an agent might produce and one rebuttal that points back to the Process step the agent is trying to skip. The author writes the rows by anticipating failure modes, not by describing the happy path.

#### Red Flags — design rules

Format:

```markdown
## Red Flags

- `tasks.md` shows tasks marked done with no verification evidence recorded
- `notes.md` shows test failures recorded as "flaky" without re-run
- Spec acceptance criteria are paraphrased in `tasks.md` (drift)
```

A Red Flag is a sign that the skill is being misapplied or the work is going off the rails. The agent seeing the flag in context knows to investigate before continuing.

#### Verification — design rules

Format:

```markdown
## Verification

The skill is complete when ALL of the following evidence is present:

- `tasks.md` shows every task marked done with the verification evidence recorded
- The test suite passes (`bun test` in the affected package, with output captured)
- `state.md` reflects the new plan status
- "Seems right" is not evidence — every claim cites a file path, command, or runtime observation
```

The Verification section is the exit gate. The "seems right is not evidence" rule is repeated in every skill, verbatim, so the agent cannot miss it.

### Layer 3: Orchestration doc

`packages/guild/docs/orchestration.md` is a new docs page structured in four parts:

1. **Endorsed patterns** — five patterns from upstream, each with: a one-line description, a "Use when" trigger, a "How it looks in Guild" subsection naming the primitives (Bard, Wizard, category Rangers, `/start-work`, Cleric, Paladin), and a "Cost" note.
2. **Anti-patterns** — four anti-patterns from upstream, each with: a one-line description, a "Why it fails" rationale, and a "How this would look in Guild" subsection naming the specific anti-pattern shape users might build.
3. **Bard is a lead, not a meta-router** — a short section stating: Bard is the user-driven primary; delegation is user-initiated; Bard does not silently route work to satisfy a router prompt. Cross-links to `agents.md`.
4. **Decision flow** — a flowchart or table that helps a user pick which pattern to use given their task shape.

Cross-links go in:
- `docs/README.md` — "Customize how agents think and act" section gets a row: "Pick an orchestration pattern and avoid anti-patterns → [Orchestration](orchestration.md)"
- `docs/agents.md` — "See also" section adds: "Orchestration patterns and anti-patterns → [orchestration.md](orchestration.md)"
- `docs/custom-agents.md` — "See also" section adds: "Orchestration patterns and anti-patterns → [orchestration.md](orchestration.md)"

This doc is independent of the in-progress `guild-docs-customization-recipes` spec. That spec covers *config recipes* (`prompt_append`, `categories`, `custom_agents`, `disabling-features`, `full-example`). This doc covers *orchestration patterns*. Both are linked from the docs index; neither supersedes the other.

### Layer 4: DoD mechanism

Three changes:

1. **`.guild/architecture.md`** updates:
   - Knowledge table: add `definition-of-done.md` row with purpose "Project-wide standing bar (consumed by `guild-verify` and `guild-ship`; complements per-task `tasks.md` criteria)."
   - Canonical loading order: insert `definition-of-done.md` after `knowledge/index.md` and before "active `plans/<slug>/spec.md`".
   - Plan-local vs global state boundary table: add a row: "What is the project-wide quality bar?" → `knowledge/definition-of-done.md`.

2. **`guild-init` skill** updates:
   - Process gains a step: "Scaffold `.guild/knowledge/definition-of-done.md` if absent. Template: frontmatter-less markdown with a header comment, an empty `## Project-wide standing bar` section, and a `## Per-task criteria live in plans/<slug>/tasks.md` pointer section."
   - Behavior rules gain: "If the file already exists, do not touch it."

3. **`guild-verify` and `guild-ship` skills** update:
   - Process gains a project-wide check step: "Read `.guild/knowledge/definition-of-done.md` and confirm every bar item is met for the current change. If the file is absent, log a note in `plans/<slug>/notes.md` and continue with per-task only."
   - Verification gate gains: "Evidence for BOTH per-task criteria (in `tasks.md`) AND project-wide criteria (in `knowledge/definition-of-done.md` if present) is required. A note in `notes.md` records the DoD check status."

The mechanism is file-reading via skill instructions. No new TS code. The skill loader already reads the skill body and prepends it to the agent prompt; the agent already has tools to read `.guild/knowledge/` files.

#### DoD template (scaffolded by `guild-init`)

```markdown
# Definition of Done — project-wide standing bar

This file is the **project-wide standing bar** that `guild-verify` and `guild-ship` check against in addition to per-task criteria in `plans/<slug>/tasks.md`. It applies to every change in this project.

Fill in the items below. Each item is a bar the project's maintainers expect every change to clear. Items the agent cannot verify from a given change should be marked "unable to verify" in the verification notes, not auto-passed.

## Project-wide standing bar

<!-- Example items — replace with your project's bar. -->
- All public functions have explicit parameter and return types.
- No new lint or typecheck errors are introduced.
- README and inline documentation are updated where behaviour changes.
- Tests cover the new behaviour at the unit level.
- No secrets, tokens, or credentials are introduced in code, logs, or commits.

<!-- Add more items as needed. Keep each item independently checkable. -->

## Per-task criteria

Per-task acceptance criteria live in `plans/<slug>/tasks.md` for the active plan. The project-wide bar here is checked in **addition** to (not instead of) the per-task criteria.

## Maintenance

When the project's quality bar changes (e.g., a new lint rule is added, a new security requirement appears), update this file. The next `guild-verify` and `guild-ship` will use the new bar.
```

### Layer 5: DoD user-facing recipe

`packages/guild/docs/definition-of-done.md` is a new docs page that:

1. Explains the distinction between project-wide bar (`knowledge/definition-of-done.md`) and per-task criteria (`plans/<slug>/tasks.md`).
2. Shows the minimal template (copy of the scaffolded file).
3. Shows a populated example for a TypeScript monorepo (matches the Arcanum monorepo).
4. Shows a populated example for a frontend SPA (different bar: a11y, bundle size, route coverage).
5. Names the consuming skills (`guild-verify`, `guild-ship`) and the graceful-degradation behaviour.
6. Cross-links to `.guild/architecture.md` for the canonical loading order.

Cross-link: `docs/README.md` gains a "Project state" section with a link to the DoD recipe, placed between "Customize how agents think and act" and "Reference".

---

## Verification Strategy

1. **Anatomy compliance check** — for each of the 15 skills, `grep -c "## Process\|## Rationalizations\|## Red Flags\|## Verification" packages/guild/skills/<name>/SKILL.md` returns ≥ 4 (or ≥ 3 + a documented exception for thin skills with no skip-rationalization).
2. **Rationalizations coverage check** — for the workflow-shaped skills (execute, verify, review, ship, security, plan, spec, scope, init, handoff), the Rationalizations table has ≥ 3 rows.
3. **Orchestration doc presence** — `docs/orchestration.md` exists, contains the headings "Endorsed patterns", "Anti-patterns", "Bard is a lead". Cross-links from `docs/README.md`, `docs/agents.md`, `docs/custom-agents.md` resolve.
4. **DoD mechanism** — `.guild/architecture.md` knowledge table includes `definition-of-done.md`; loading order includes it; boundary table includes the DoD row. `guild-init` body includes the scaffold step. `guild-verify` and `guild-ship` bodies include the project-wide check step. The `docs/definition-of-done.md` page exists with the populated examples.
5. **Build + lint + typecheck** — `bun run build` at the repo root, `bunx turbo lint` and `bunx turbo typecheck` for `packages/guild` all pass.
6. **Test regression** — `bun test` in `packages/guild` passes (no regression in the existing test suite; the changes are content-only and should not affect any test).
7. **Decoupling check** — `git diff --stat packages/spells/ packages/summon/` shows no changes.

---

## Documentation Impact

| Doc | Change |
| --- | --- |
| `packages/guild/docs/skills.md` | Add anatomy section; fix bundled-skills table to 15 rows. |
| `packages/guild/skills/<name>/SKILL.md` × 15 | Retrofit to anatomy. |
| `packages/guild/docs/orchestration.md` | NEW. Patterns + anti-patterns + Bard-as-lead. |
| `packages/guild/docs/definition-of-done.md` | NEW. DoD recipe with examples. |
| `packages/guild/docs/README.md` | Add cross-links to `orchestration.md` and `definition-of-done.md`; add "Project state" section. |
| `packages/guild/docs/agents.md` | Cross-link to `orchestration.md`. |
| `packages/guild/docs/custom-agents.md` | Cross-link to `orchestration.md`. |
| `.guild/architecture.md` | Knowledge table row; loading order; boundary table row. |

## Risks

1. **Rationalizations table bloat.** A skill with 10 Rationalizations rows is hard to read. Mitigation: cap at 5–6 rows for any single skill; pick the highest-leverage rationalizations.
2. **Skill inflation.** A thin skill grows from 30 lines to 100+ lines. Mitigation: keep the Rationalizations table focused; do not duplicate the Process steps in prose. Acceptable cost for the behaviour change.
3. **DoD content varies wildly across projects.** Some projects will have a 3-item bar; others a 30-item bar. Mitigation: the mechanism is project-agnostic; the doc shows three scales (minimal, monorepo, frontend SPA) so users pick what fits.
4. **Orchestration doc may conflict with the in-progress `guild-docs-customization-recipes` spec.** Mitigation: that spec covers *config recipes* (`prompt_append`, `custom_agents`, `categories`, `disabling`, `full-example`); this one covers *orchestration patterns*. Both will be linked from the docs index. The two are orthogonal.
5. **Agent-skills upstream anatomy may evolve.** Mitigation: the Guild anatomy is fixed by this spec. Future upstream changes require a future spec to adopt them.
6. **DoD file becomes stale.** A project that updates its quality bar may forget to update the file. Mitigation: the doc's "Maintenance" section in the template tells the user to update the file when the bar changes; no auto-detection.
7. **A `custom_agents` entry that matches an anti-pattern loads successfully.** The orchestration doc is content, not enforcement. Mitigation: the cost of a runtime check is high (would need to parse prompts for routing patterns). The doc is sufficient for the current product surface.
8. **Bundled skills `guild-configurator` and `guild-recon` may be stubs.** Mitigation: read both skills during Phase 1 to confirm they have content; if they are stubs, retrofit is still a structural improvement and the table sync makes the docs honest about their existence.

---

## Execution Notes

- Keep the feature folder self-contained: `.specs/features/guild-agent-skills-incorporation/`.
- Spec / design / tasks are split into four phases: anatomy + retrofit (15), orchestration doc, DoD mechanism, verification.
- The 15 skill retrofits (Phase 1) are independent and can be done in any order or in parallel by multiple contributors. Each is a single commit.
- Commits MUST use `feat(guild):` for skill retrofit, anatomy doc update, orchestration doc, DoD skill changes, and DoD recipe doc; `docs(guild):` for cross-link updates and table sync. `chore(guild):` does not produce a changeset.
- The auto-changeset flow (`generate-from-commits.ts`) produces a clean changelog from these scopes; do not edit `CHANGELOG.md` manually.
- Do NOT modify `packages/spells/` or `packages/summon/`. Decoupling is a hard constraint, mirrored from the cherrypick spec.
- The DoD mechanism is content (skill instructions) only; no new TS code. Do not propose runtime hooks for DoD enforcement; that is out of scope.
- The orchestration doc and the DoD doc live under `packages/guild/docs/`, not under `.specs/`. They are user-facing documentation, not planning artifacts.

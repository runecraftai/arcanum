# Definition of Done

**Audience:** anyone setting up Guild for a project who wants a project-wide quality bar that every change clears — in addition to per-task `tasks.md` criteria.

The Definition of Done (DoD) is a **project-wide standing bar** that `guild-verify` and `guild-ship` check against, alongside the per-task criteria in `plans/<slug>/tasks.md`. It is one file in the canonical workspace: `.guild/knowledge/definition-of-done.md`. The file is scaffolded empty by `guild-init`; the project fills it in.

This page explains the distinction between the project-wide bar and the per-task criteria, shows what to put in the file, and names the consuming skills.

## The distinction

| | Per-task criteria | Project-wide bar |
|---|---|---|
| **Where** | `plans/<slug>/tasks.md` | `.guild/knowledge/definition-of-done.md` |
| **Scope** | This plan only | Every plan in the project |
| **Owned by** | The plan author (Wizard) | The project maintainer |
| **Updated when** | A task is added, removed, or re-scoped | The project's quality bar changes (e.g., new lint rule, new security requirement) |
| **Consumed by** | `guild-verify` (per-task check), `guild-review` | `guild-verify` (project-wide check), `guild-ship` (DoD gate) |

The two are complementary, not redundant. Per-task criteria are the contract for one feature. The project-wide bar is the contract for the project.

## What goes in the file

`guild-init` scaffolds the file with the structure below. Fill in the items; remove the example items. Each item should be independently checkable — a future agent should be able to read the item and answer `met` / `not met` / `unable to verify`.

```markdown
# Definition of Done — project-wide standing bar

This file is the **project-wide standing bar** that `guild-verify` and `guild-ship` check against in addition to per-task criteria in `plans/<slug>/tasks.md`. It applies to every change in this project.

Fill in the items below. Each item is a bar the project's maintainers expect every change to clear. Items the agent cannot verify from a given change should be marked `unable to verify` in the verification notes, not auto-passed.

## Project-wide standing bar

<!-- Example items — replace with your project's bar. -->
- All public functions have explicit parameter and return types.
- No new lint or typecheck errors are introduced.
- README and inline documentation are updated where behaviour changes.
- Tests cover the new behaviour at the unit level.
- No secrets, tokens, or credentials are introduced in code, logs, or commits.

## Per-task criteria

Per-task acceptance criteria live in `plans/<slug>/tasks.md` for the active plan. The project-wide bar here is checked in **addition** to (not instead of) the per-task criteria.

## Maintenance

When the project's quality bar changes (e.g., a new lint rule is added, a new security requirement appears), update this file. The next `guild-verify` and `guild-ship` will use the new bar.
```

## How `guild-verify` and `guild-ship` consume the file

`guild-verify` runs two checks:

1. **Per-task** — every row in `plans/<slug>/tasks.md` is `done` with verification evidence recorded inline.
2. **Project-wide** — every item in `knowledge/definition-of-done.md` is `met`, marked `unable to verify` in `notes.md`, or the file is absent/empty (in which case the check is skipped and a note is recorded).

`guild-ship` runs the same project-wide check as a **DoD gate** between per-task verification and the ship declaration. If a project-wide bar item fails, the gate fails and the change does not ship.

**Graceful degradation.** When the file is absent or empty, both skills continue with per-task checks only and log a note in `plans/<slug>/notes.md` (`DoD project-wide bar: absent/empty; skipped`). The note is the audit trail; do not skip the log.

**No auto-pass.** An item the agent cannot verify from the current change is recorded as `unable to verify` in `notes.md`. It is never auto-passed.

## Examples

### Minimal bar (1-3 items)

A small project that wants a lean DoD:

```markdown
## Project-wide standing bar

- No new lint or typecheck errors are introduced.
- Tests cover the new behaviour at the unit level.
- No secrets, tokens, or credentials are introduced in code, logs, or commits.
```

### TypeScript monorepo (Arcanum-style)

A larger project that ships multiple packages and uses conventional commits + changesets:

```markdown
## Project-wide standing bar

- All public functions have explicit parameter and return types (no implicit `any`).
- No new lint, typecheck, or test failures are introduced (`bun run build`, `bunx turbo lint`, `bunx turbo typecheck`, `bun test` in the affected package).
- The diff is contained to one feature; no drive-by refactors in unrelated packages.
- `knowledge/decisions.md` or `knowledge/gotchas.md` is updated if the change surfaces a cross-cutting lesson.
- Conventional commit scope is correct (`feat(<package>):`, `fix(<package>):`, `docs(<package>):`, `chore(<package>):`).
- No secrets, tokens, or credentials are introduced in code, logs, or commits.
- Public API changes are reflected in the package's `README.md` and inline JSDoc.
- New dependencies are added to the relevant `package.json` and pinned.
```

### Frontend SPA

A frontend project with a different bar (a11y, bundle size, route coverage):

```markdown
## Project-wide standing bar

- No new TypeScript or ESLint errors are introduced.
- The change is keyboard-accessible (every interactive element has a working keyboard alternative).
- Color-contrast and focus-ring changes pass an a11y check (axe, Lighthouse, or equivalent).
- New routes are covered by a smoke test (`@testing-library/react` or equivalent).
- Bundle size delta is documented in the PR if the change adds a new dependency or large module.
- No secrets, tokens, or credentials are introduced in code, logs, or commits.
- UI changes are reflected in Storybook (or the project's component catalogue) and the user-facing docs.
```

Pick the bar that fits the project. A 3-item bar that is consistently enforced beats a 30-item bar that is auto-passed.

## When the bar is empty

An empty bar is valid. `guild-verify` logs `DoD project-wide bar: empty/absent; skipped` and continues with per-task only. The slot still exists (the file is scaffolded by `guild-init`), so the next maintainer can fill it in without a config change.

Re-running `guild-init` does NOT modify an existing `.guild/knowledge/definition-of-done.md`. The file is yours to own.

## See also

- `.guild/architecture.md` — canonical loading order and `knowledge/` ownership.
- [Skills](skills.md) — the skill anatomy (Process / Rationalizations / Red Flags / Verification).
- [Agents](agents.md) — how agents load skills and consume `.guild/` state.
- `guild-verify` (skill) — runs the per-task + project-wide check.
- `guild-ship` (skill) — runs the DoD gate before declaring a change shipped.
- `guild-init` (skill) — scaffolds the DoD file on first-run bootstrap.

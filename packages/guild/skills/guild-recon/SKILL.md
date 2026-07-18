---
name: guild-recon
description: >
  Explore, trace, and discover codebase patterns before making changes.
  Use to find file locations, trace call chains, identify conventions, and surface unknown areas.
  Does not plan, delegate, or execute — only gathers and records findings.
license: CC-BY-4.0
---

# guild-recon

Discover what exists before deciding what to do.

## Overview

Explore the codebase to find file locations, trace call chains, identify conventions, and surface unknown areas. Record findings to `knowledge/` (cross-plan) or `plans/<slug>/notes.md` (plan-local). Do not plan, delegate, or execute — that is `guild-plan` and `guild-execute`. This skill identifies; it does not decide or schedule.

## When to Use

- The user wants to find files, symbols, or call chains before deciding what to change.
- The next step is exploration, not planning or implementation.
- A discovery may surface work that needs planning; capture it in `notes.md` and defer to `guild-plan`.

**Do NOT use for**: planning (use `guild-plan`), implementation (use `guild-execute`), spec authoring (use `guild-spec`), or verification (use `guild-verify`). This skill gathers and records; it does not decide.

## Primary inputs

- The codebase (read-only — no edits during recon)
- `.guild/knowledge/index.md` — prior knowledge entries to honour

## Primary outputs

| finding type | destination |
|--------------|-------------|
| Cross-plan conventions | `.guild/knowledge/conventions.md` |
| Architectural decisions | `.guild/knowledge/decisions.md` |
| Known pitfalls | `.guild/knowledge/gotchas.md` |
| Plan-local discoveries | `.guild/plans/<slug>/notes.md` |

## Process

1. Read the user's question and identify the target: a function, class, API, file pattern, or unknown area.
2. Use glob and grep to locate candidate files. Read the relevant code, not the surrounding code.
3. Trace the call chain: entry points, intermediate functions, exit points. Document with file paths and line numbers.
4. Identify conventions: naming, structure, error handling, test patterns. Distinguish "found this" from "concluded this".
5. Identify architecture: layers, boundaries, key dependencies. Summarize, not diagram.
6. Surface what is unknown, not just what is known. Record ambiguity in the destination file.
7. Write findings to the appropriate destination (see Primary outputs table). Do not write to `plans/<slug>/spec.md`, `design.md`, or `tasks.md` — those are for `guild-plan`.
8. If a finding surfaces work that needs planning, write to `notes.md` and defer to `guild-plan`. Do not schedule work from this skill.

## Discovery patterns

**File lookup**: Use glob and grep to locate relevant files. Report paths and line numbers, not contents.

**Flow tracing**: Trace a function, class, or API through its call chain. Document entry points and exit points.

**Convention discovery**: Find patterns in naming, structure, error handling. Record what you find.

**Architecture mapping**: Identify layers, boundaries, and key dependencies. Summarize, don't diagram.

## Search Strategy

Read `.guild/knowledge/index.md` first — prior knowledge entries tell you where to look and what conventions already apply. Then proceed through three phases, stopping when the target is found:

1. **Broad** — use glob patterns to map the project structure. Identify top-level directories, configuration files, and likely entry points. This phase finds *where* something lives, not *what* it does.

2. **Targeted** — use grep for symbols, function names, class definitions, API signatures, and import paths. Narrow from file clusters to specific files. This phase finds *what* connects to what.

3. **Deep** — read specific files and trace imports, call chains, and type references. Follow the code path from entry to exit. This phase finds *how* the code works.

Avoid reading files in phase 1 and searching blind in phase 3. Each phase answers the question the prior phase raised.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I'll also fix the bug I found while looking." | Step 7 says write findings only. Fixes belong in `guild-execute` after `guild-plan`. |
| "I'll write the new spec while I'm at it." | Step 7 forbids writing to `spec.md` / `design.md` / `tasks.md`. Specs are `guild-spec`'s job. |
| "I can hold the call chain in my head, no need to record it." | Step 3 requires documenting the call chain with paths and line numbers. Head-only traces are not handoffable. |
| "I'll write a quick plan and start." | Step 8 says defer to `guild-plan`. This skill identifies; it does not schedule. |
| "Conventions are obvious, no need to record." | Step 4 requires recording patterns with file paths. "Obvious" is the rationalization the table rebuts. |

## Red Flags

- A finding is recorded without a file path or line number.
- The skill wrote to `plans/<slug>/spec.md`, `design.md`, or `tasks.md`.
- The skill scheduled work (e.g., "we should do X next") instead of deferring to `guild-plan`.
- A "found this" is mixed with a "concluded this" without distinction.
- The destination file is `.guild/plans/<slug>/spec.md` instead of `notes.md`.

## Verification

The skill is complete when ALL of the following evidence is present:

- Findings are recorded to the correct destination (see Primary outputs table).
- Every finding cites a file path + line number (or a glob pattern + count).
- "Found" and "concluded" are distinguished.
- Unknown areas are recorded as unknown, not glossed over.
- No `spec.md`, `design.md`, or `tasks.md` was written.
- No work was scheduled; planning is deferred to `guild-plan`.

**"Seems right" is not evidence.** Every claim of "this is the current state" cites a file path and a line number.

## Boundaries

If a discovery surfaces work that needs planning, write findings to `notes.md` and defer to `guild-plan`. This skill identifies; it does not decide or schedule.

## See also

- [guild-research](guild-research) — targets a specific question; this skill is broader exploration.
- [guild-plan](guild-plan) — consumes the findings this skill produces.
- [guild-commit-learning](guild-commit-learning) — promotion rules for cross-plan findings.
- [.guild/architecture.md](/.guild/architecture.md) — knowledge/ ownership and state update rules.

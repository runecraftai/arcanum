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

## Scope (what this skill owns)

- File and symbol lookup (grep, glob, read)
- Call chain and dependency tracing
- Convention and pattern discovery
- Architecture and flow mapping
- Writing findings to `.guild/knowledge/` or plan-local notes

## Scope (what this skill does NOT own)

- Planning or task decomposition
- Orchestration or delegation
- Writing to `.guild/plans/` spec/design/task files
- Making implementation decisions
- Execution or verification

## Primary outputs

Findings are written to one of:

| finding type | destination |
|--------------|-------------|
| Cross-plan conventions | `.guild/knowledge/conventions.md` |
| Architectural decisions | `.guild/knowledge/decisions.md` |
| Known pitfalls | `.guild/knowledge/gotchas.md` |
| Plan-local discoveries | `.guild/plans/<slug>/notes.md` |

## Discovery patterns

**File lookup**: Use glob and grep to locate relevant files. Report paths, not contents.

**Flow tracing**: Trace a function, class, or API through its call chain. Document entry points and exit points.

**Convention discovery**: Find patterns in naming, structure, error handling. Record what you find.

**Architecture mapping**: Identify layers, boundaries, and key dependencies. Summarize, don't diagram.

## Guidance

- Surface what is unknown, not just what is known
- Be precise with file paths and line numbers
- Distinguish between "found this" and "concluded this"
- If finding is ambiguous, record the ambiguity
- Never write implementation guidance — only observations

## Boundaries

If a discovery surfaces work that needs planning, write findings to `notes.md` and defer to `guild-plan`. This skill identifies; it does not decide or schedule.
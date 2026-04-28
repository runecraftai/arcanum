# spec-driven v4.0.0

An 8-phase meta-skill that orchestrates the complete development lifecycle: MAP, SPEC, PLAN, BUILD, TEST, REVIEW, SIMPLIFY, SHIP. Routes user triggers to individual phase handlers.

⚠️ **v4 is a breaking change.** `docs/` is no longer used. Run `/init` to bootstrap `.specs/project/` and `/map` to generate codebase docs.

## Scope Tiers

| Scope | Effort | Artifacts |
|-------|--------|-----------|
| **Quick** | 1-3 | TASK.md only |
| **Medium** | 4-6 | spec.md + tasks.md |
| **Large** | 7-11 | spec.md + design.md + tasks.md |
| **Complex** | ≥12 | spec.md + context.md + design.md + tasks.md |

> **Note**: The Effort column (1-3, 4-6, 7-11, ≥12) refers to story-point or task-count estimation. Formal scope detection uses a weighted scoring matrix in `references/scope-detection.md` (scored 0-2 per signal: Files, Concepts, Ambiguity, Integrations, Risk).

## Triggers

**English:** `/init`, `/map`, `/spec`, `specify`, `write spec`, `/plan`, `plan this`, `/build`, `build this`, `/test`, `test this`, `/review`, `code review`, `/simplify`, `refactor`, `/ship`, `release`

**Português:** `inicializar projeto`, `mapear codebase`, `vamos especificar`, `preciso de um spec`, `vamos planejar`, `quebra em tarefas`, `vamos construir`, `implementar`, `vamos testar`, `teste isso`, `revisa isso`, `simplifica`, `refatora`, `vamos fazer release`, `versiona`

## Install

For the meta-skill (recommended):
```bash
node install.js
```

For all skills including this one:
```bash
node install.js --all
```

Or just this skill:
```bash
node install.js --skill spec-driven
```

## About

The spec-driven meta-skill is the master orchestrator that routes all 8 development lifecycle phases through a single entry point. It includes 35 supporting reference files for project initialization, codebase mapping, and each development phase.

**Key features:**
- `.specs/` directory structure for persistent project knowledge
- MAP phase for brownfield codebase documentation
- INIT phase for project bootstrap
- Knowledge chain verification for context quality
- Multi-agent delegation (Scout, Sage, Forge, Ward, Arbiter)
- Auto-skip rules for Quick/Medium scopes

All context files use `.specs/` paths exclusively. See `references/` for detailed phase documentation.

→ [Full documentation](../../README.md)

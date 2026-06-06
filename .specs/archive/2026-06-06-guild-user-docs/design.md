# Design: guild-user-docs

## Overview

This feature creates a repo-local documentation system for `@runecraft/guild`, modeled after the Weave repository/docs approach while preparing the content for a future polished site.

The design keeps documentation in two layers:

1. `packages/guild/README.md` remains the short landing page for GitHub/npm discovery.
2. `packages/guild/docs/` becomes the structured source of user and maintainer documentation.

## Current State

### What exists

- `packages/guild/README.md` includes overview, agents table, installation, uninstall, development, acknowledgments, and license.
- `packages/guild/schema/guild-config.schema.json` exists as the generated config schema.
- The package exposes multiple user-facing commands, agents, hooks, workflow behavior, analytics, and skills in code.

### Gaps

- No `packages/guild/docs/` directory exists.
- Configuration paths and merge behavior are not explained in human-friendly form.
- Built-in commands are not documented as a reference.
- Workflow, continuation, analytics, and skill behavior require source reading.
- Troubleshooting is limited to install-time npm/package issues.
- The README has to serve too many audiences if it becomes the only manual.

## Target State

The target docs structure is:

```text
packages/guild/docs/
├── README.md
├── getting-started.md
├── configuration.md
├── architecture.md
├── agents.md
├── model-guide.md
├── commands.md
├── continuation.md
├── analytics.md
├── skills.md
├── troubleshooting.md
├── background-agents.md
├── releases.md
├── workflows/
│   ├── overview.md
│   ├── authoring.md
│   └── controls.md
└── examples/
    └── workflows/
        ├── secure-feature.jsonc
        └── quick-fix.jsonc
```

## Documentation Architecture

### Layer 1: README landing page

The README should be optimized for quick discovery:

- What Guild is
- Highlights
- Install snippet
- First action or quickstart pointer
- Config file locations summary
- Core commands summary
- Links into `docs/`
- Development commands

The README should not include full configuration reference, full troubleshooting, or deep architecture.

### Layer 2: User onboarding and reference

P1 docs should be enough for a new user:

- `docs/README.md` as table of contents
- `docs/getting-started.md` for install and verification
- `docs/configuration.md` for config files, schema, and examples
- `docs/commands.md` for slash commands
- `docs/troubleshooting.md` for symptom-based diagnosis

### Layer 3: Product behavior docs

P2 docs should explain how Guild works in practice:

- `docs/agents.md`
- `docs/skills.md`
- `docs/continuation.md`
- `docs/analytics.md`
- `docs/workflows/*`

### Layer 4: Maintainer and advanced docs

P3 docs support maintainability and future site depth:

- `docs/architecture.md`
- `docs/model-guide.md`
- `docs/background-agents.md`
- `docs/releases.md`
- `docs/examples/workflows/*`

## Editorial Guidelines

- Use focused pages: one primary question per file.
- Use short, stable headings that can become site navigation later.
- Use relative links between docs pages.
- Prefer concise examples in `jsonc` for config and workflow examples.
- Mark opt-in, preview, and experimental features explicitly.
- Avoid promising behavior that is not implemented today.
- Prefer additive customization examples (`prompt_append`, `skills`) over full prompt replacement.
- Keep README concise and move deep details to docs.

## Weave Alignment

Guild should borrow the successful Weave pattern:

- README for package discovery and install.
- Docs directory for configuration, architecture, and reference material.
- Future site can productize the same source into guide-style pages.
- Schema caveats should be explicit: if the schema is not shipped in the npm package, point users to the repository/raw URL or vendoring.

## Initial Build Strategy

### Phase 1: User MVP

Create enough docs that a user can install, configure, run commands, and troubleshoot.

Outputs:

- README landing page rewrite
- `docs/README.md`
- `docs/getting-started.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/troubleshooting.md`

### Phase 2: Product Behavior

Document the core operating model after the user MVP is stable.

Outputs:

- `docs/agents.md`
- `docs/skills.md`
- `docs/continuation.md`
- `docs/analytics.md`

### Phase 3: Workflows and Advanced Reference

Document workflow authoring, architecture, models, background agents, releases, and examples.

Outputs:

- `docs/workflows/overview.md`
- `docs/workflows/authoring.md`
- `docs/workflows/controls.md`
- `docs/architecture.md`
- `docs/model-guide.md`
- `docs/background-agents.md`
- `docs/releases.md`
- `docs/examples/workflows/secure-feature.jsonc`
- `docs/examples/workflows/quick-fix.jsonc`

## Verification Strategy

This feature is documentation-heavy, so verification should combine source accuracy checks and reader-path checks.

- Source accuracy: compare docs against schema, command files, agent definitions, workflow types, continuation config, and analytics types.
- Link integrity: all README/docs links should resolve within the repo.
- First-user path: README -> getting started -> configuration -> commands -> troubleshooting should be coherent.
- Site readiness: docs should not depend on GitHub-only rendering quirks or README context.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Docs drift from source behavior | Users follow incorrect instructions | Verify docs against source during each phase |
| README becomes too long again | Discovery page becomes noisy | Keep deep detail in `docs/` |
| Future site needs a rewrite | Extra migration cost | Use site-ready page boundaries and links now |
| Docs imply features that are not ready | User confusion and support burden | Only document implemented behavior; mark preview/experimental |
| Too many docs created before quality pass | Large but shallow documentation | Prioritize P1 docs first, then expand |

## Exit Criteria

The plan is ready to execute when:

1. P1 docs have explicit tasks and verification criteria.
2. P2/P3 docs are sequenced after the user MVP.
3. README scope is constrained to landing page content.
4. Future site readiness is captured as an editorial constraint, not a site build task.

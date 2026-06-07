# Guild Command Argument Suggestions

## TL;DR
> **Summary**: Add argument suggestions for `/start-work` (incomplete plans), `/run-workflow` (discovered workflows), and `/metrics` (plan names + `all`) — but first confirm whether OpenCode's plugin command contract supports dynamic or static suggestions to avoid implementing unsupported behavior.
> **Estimated Effort**: Medium

## Context

### Original Request
Guild commands (`/start-work`, `/run-workflow`, `/metrics`) require exact names users must already know. Common mistakes result in corrective responses instead of successful execution.

### Key Findings
- Guild already has the data for suggestions (incomplete plans, discovered workflows, plan names)
- Unknown: whether OpenCode plugin command contract supports inline argument suggestions
- Design doc at `.specs/features/guild-command-argument-suggestions/design.md`
- Spec at `.specs/features/guild-command-argument-suggestions/spec.md`
- Current command metadata: name, description, agent, template, argumentHint — no suggestion field yet
- Outcome depends on T01 investigation — may result in graceful no-op if host doesn't support it

## Objectives

### Core Objective
Make Guild commands suggest valid values inline so users don't need to memorize plan/workflow names, while preserving compatibility with OpenCode versions that lack suggestion support.

### Definition of Done
- [ ] Host capability confirmed (dynamic, static, or unsupported)
- [ ] `/start-work` suggests incomplete plan names where supported
- [ ] `/run-workflow` suggests discovered workflow names where supported
- [ ] `/metrics` suggests `all` + plan names where supported
- [ ] Zero regression in environments without suggestion support
- [ ] Commands.md documents the final UX

## TODOs

- [ ] 1. Confirm OpenCode command suggestion support
  **What**: Inspect the OpenCode plugin command contract and current Guild integration to determine whether commands support static or dynamic argument suggestions. Check Guild command registration code, OpenCode integration types, adapter layer, and any available test fixtures.
  **Files**: `packages/guild/src/features/builtin-commands/commands.ts`, OpenCode integration types, plugin adapter
  **Acceptance**: The supported metadata shape is identified; it's clear whether dynamic providers, static suggestions, or only `argumentHint` are supported; result captured in implementation notes

- [ ] 2. Choose the compatibility strategy
  **What**: Based on T01 findings, select one path: dynamic suggestion provider, static suggestion metadata, or graceful no-op fallback. The path must preserve current command execution behavior.
  **Files**: Feature artifacts and implementation notes
  **Acceptance**: One path selected; current command execution preserved; path is narrow enough to implement without speculative host features

- [ ] 3. Extract or define reusable suggestion data helpers
  **What**: Reuse existing Guild discovery logic to create read-only helpers for suggestion data: list incomplete plans (for `/start-work`), list discovered workflows (for `/run-workflow`), list known plan names (for `/metrics`). Avoid duplicated filesystem scanning.
  **Files**: Plan/workflow discovery services near `packages/guild/src/domain/plans/` and workflow services
  **Acceptance**: Clear helper for incomplete plans; clear helper for workflows; clear helper for plan names; no unnecessary FS duplication

- [ ] 4. Add `/start-work` suggestions
  **What**: Implement argument suggestions for `/start-work` using incomplete plan names. Wire into command metadata or provider based on compatibility strategy from T02.
  **Files**: `packages/guild/src/features/builtin-commands/commands.ts`, suggestion provider layer
  **Acceptance**: `/start-work` exposes plan suggestions when host supports them; suggested values are executable plan names; missing-plan environments degrade safely

- [ ] 5. Add `/run-workflow` suggestions
  **What**: Implement argument suggestions for `/run-workflow` using discovered workflow names. Precedence must match current workflow discovery behavior.
  **Files**: `packages/guild/src/features/builtin-commands/commands.ts`, suggestion provider layer
  **Acceptance**: `/run-workflow` exposes workflow name suggestions when supported; precedence matches current discovery; empty-workflow environments degrade safely

- [ ] 6. Add `/metrics` suggestions
  **What**: Implement argument suggestions for `/metrics` exposing `all` and known plan names.
  **Files**: `packages/guild/src/features/builtin-commands/commands.ts`, suggestion provider layer
  **Acceptance**: `/metrics` suggests `all`; known plan names suggested when available; empty-plan environments still expose safe fallback

- [ ] 7. Verify command registration and fallback behavior
  **What**: Add or update tests for command metadata and fallback compatibility. Cover the supported suggestion path and the unsupported/fallback path. Ensure existing command execution behavior still passes.
  **Files**: Built-in command tests, plugin integration tests, or command adapter tests
  **Acceptance**: Tests cover both supported and fallback paths; existing tests still pass; no regression in environments without suggestion support

- [ ] 8. Document command suggestion UX
  **What**: Update `packages/guild/docs/commands.md` to explain which commands expose suggestions, the source of suggested values, that manual arguments still work, and no claim of unsupported autocomplete behavior.
  **Files**: `packages/guild/docs/commands.md`
  **Acceptance**: Docs mention suggestion support per command; source of values explained; manual args still documented; no unsupported claims

## Verification
- [ ] T01: Host capability confirmed (dynamic/static/no-support)
- [ ] T02: Compatibility strategy selected and documented
- [ ] T03: Reusable suggestion data helpers extracted (no FS duplication)
- [ ] T04: `/start-work` exposes plan suggestions (or graceful no-op)
- [ ] T05: `/run-workflow` exposes workflow suggestions (or graceful no-op)
- [ ] T06: `/metrics` exposes `all` + plan suggestions (or graceful no-op)
- [ ] T07: Tests pass for both supported and fallback paths
- [ ] T08: commands.md documents the final UX accurately

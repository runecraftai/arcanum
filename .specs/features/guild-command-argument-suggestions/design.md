# Design: Guild Command Argument Suggestions

## Overview

This feature adds argument suggestions to selected Guild commands while preserving compatibility with OpenCode environments that may not expose command suggestion APIs to plugins.

The work starts with a contract investigation step because Guild currently registers command metadata with `name`, `description`, `agent`, `template`, and `argumentHint`, but there is no confirmed evidence in the current Guild integration layer that dynamic command suggestions are already supported.

## Design Principles

1. **Capability-first**: Do not invent unsupported command metadata. First verify the host contract.
2. **Graceful degradation**: If the host does not support suggestions, keep current command behavior unchanged.
3. **Reuse existing discovery logic**: Plans and workflows are already discoverable in Guild; suggestion providers should build on that knowledge.
4. **MVP before polish**: String suggestions are sufficient initially; richer labels/descriptions are optional.
5. **Execution remains authoritative**: Suggestions help users choose values, but runtime validation still happens in command handlers.

## Current State

Guild currently defines built-in commands in `packages/guild/src/features/builtin-commands/commands.ts`.

Observed metadata today:

- `name`
- `description`
- `agent`
- `template`
- `argumentHint`

Current UX helpers:

- `/start-work` can list available plans after execution when the plan name is missing or invalid.
- `/run-workflow` can discover available workflows for execution.
- `/metrics` already accepts `[plan-name|all]` as a documented argument hint.

This means Guild already has the data needed for suggestions, but not necessarily the host contract support to expose it inline.

## Architecture Approach

### Step 1: Verify command suggestion support in OpenCode

Before code changes, inspect the OpenCode plugin command contract and any adapter points in Guild/OpenCode integration.

Possible outcomes:

1. **Dynamic suggestion provider supported**
Guild can register per-command providers that inspect project state at suggestion time.

2. **Static suggestion metadata only**
Guild can expose a fixed list or a partially resolved list at config time, but this may be insufficient for dynamic project state.

3. **No suggestion support**
Guild cannot implement true autocomplete yet; fallback work becomes documentation and command-response polish only.

The rest of this design assumes the preferred path is available, but implementation must branch based on the actual finding.

### Step 2: Add a suggestion layer for built-in commands

If supported, augment built-in command registration with suggestion metadata or providers.

Candidate structure:

- `/start-work` → `listIncompletePlans(directory)`
- `/run-workflow` → `discoverWorkflows(directory, workflowDirs)`
- `/metrics` → `['all', ...knownPlanNames]`

The exact field or callback shape depends on the host contract investigation.

### Step 3: Reuse shared discovery helpers

Avoid embedding filesystem scanning directly in command registration.

Preferred reuse sources:

- plan discovery already used by `/start-work`
- workflow discovery already used by `/run-workflow`
- plan name extraction utilities already used by work-state/plan services

If needed, extract small read-only helpers for:

- list incomplete plans
- list all known plan names
- list discovered workflow names with scope precedence applied

### Step 4: Preserve fallback path

Even with suggestions:

- `/start-work` still validates the selected plan.
- `/run-workflow` still validates the selected workflow.
- `/metrics` still handles missing or manual arguments normally.

This ensures suggestions improve UX without becoming the sole guardrail.

## Command-by-Command UX

### `/start-work`

Suggestion target:

- incomplete plan names only for MVP

Rationale:

- completed plans are not the main happy path
- current runtime already tells the user a plan is complete if selected manually

If richer metadata is supported, optional display text could include progress:

- `auth-feature` — `2/5 tasks done`

### `/run-workflow`

Suggestion target:

- discovered workflow names

If richer metadata is supported, optional display text could include description and scope.

### `/metrics`

Suggestion target:

- `all`
- known plan names

Rationale:

- `all` is always valid
- plan suggestions improve targeted metrics access

## Verification Strategy

1. Confirm host support in types/tests/docs before implementing suggestion metadata.
2. Add tests for command registration output if the command contract changes.
3. Add targeted tests for suggestion-provider data:
   - incomplete plans only for `/start-work`
   - discovered workflows for `/run-workflow`
   - `all` + plans for `/metrics`
4. Verify no regressions in command registration when suggestion support is absent.

## Documentation Impact

After implementation, update:

- `packages/guild/docs/commands.md`

Document:

- which commands expose suggestions,
- what values are suggested,
- what happens when no suggestions are available,
- that manually typed arguments still work.

## Risks

1. **Host capability mismatch**: OpenCode may not support plugin-provided argument suggestions.
2. **Static-only support**: a static contract may not fit project-local dynamic state.
3. **Discovery duplication**: command registration may tempt duplicated filesystem logic unless helper boundaries stay clean.
4. **UX inconsistency**: different commands may have different suggestion richness depending on available metadata.

## Execution Notes

This feature is separate from Guild documentation recipes and should remain in its own spec folder.

If host support is missing, implementation may stop after the capability investigation and record the fallback decision in the feature artifacts rather than pretending autocomplete exists.

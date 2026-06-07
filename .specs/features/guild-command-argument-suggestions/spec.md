# Guild Command Argument Suggestions Specification

## Problem Statement

Guild exposes built-in commands such as `/start-work`, `/run-workflow`, and `/metrics`, but their arguments currently depend on exact names that the user must already know. The current command metadata provides static `argumentHint` text, while the actual discovery of valid plan or workflow names happens only after command execution or by manually inspecting project files.

This creates avoidable friction:

- users must remember or retype exact plan names,
- common mistakes result in corrective responses instead of successful command execution,
- the command UX is weaker than the runtime knowledge Guild already has about plans and workflows.

We should add argument suggestions for Guild commands, starting with the commands whose valid inputs are already discoverable from project state.

## Goals

- [ ] Determine whether OpenCode's plugin command contract supports static or dynamic argument suggestions.
- [ ] Add command argument suggestions for `/start-work`.
- [ ] Add command argument suggestions for `/run-workflow`.
- [ ] Add command argument suggestions for `/metrics`.
- [ ] Reuse existing Guild discovery logic for plans and workflows where possible.
- [ ] Preserve current behavior when suggestions are unavailable or unsupported by the host.
- [ ] Document the resulting command UX clearly.

## Out of Scope

| Item | Reason |
| --- | --- |
| Reworking the overall command system in OpenCode | Guild should integrate with the host contract, not redesign it. |
| Fuzzy search, ranking, or usage-history personalization | The MVP only needs reliable valid suggestions. |
| Suggestions for every Guild command | This scope targets `/start-work`, `/run-workflow`, and `/metrics`. |
| Replacing post-execution fallback messages | Existing fallback behavior should remain as a safety net. |
| Documentation-only changes unrelated to command suggestion UX | This feature focuses on product behavior first. |

---

## User Stories

### P1: Suggest available plans for `/start-work` ⭐ MVP

**User Story**: As a Guild user, I want `/start-work` to suggest available plans so I can choose one without memorizing its exact name.

**Acceptance Criteria**:

1. WHEN the user types `/start-work` THEN Guild SHALL expose plan suggestions if the host supports command argument suggestions.
2. WHEN multiple plans exist THEN incomplete plans SHALL be suggested ahead of completed plans, or completed plans SHALL be omitted in the MVP.
3. WHEN no plans exist THEN Guild SHALL fail gracefully without breaking command registration.
4. WHEN the host does not support suggestions THEN current `/start-work` behavior SHALL remain unchanged.

**Independent Test**: In a project with multiple incomplete plans, opening command suggestions for `/start-work` shows valid plan names without executing the command.

---

### P1: Suggest available workflows for `/run-workflow` ⭐ MVP

**User Story**: As a Guild user, I want `/run-workflow` to suggest discovered workflow names so I can run a workflow without manually checking files.

**Acceptance Criteria**:

1. WHEN the user types `/run-workflow` THEN Guild SHALL expose available workflow names if the host supports command argument suggestions.
2. WHEN both project and user workflows exist THEN suggestion precedence SHALL match Guild's workflow discovery behavior.
3. WHEN workflow descriptions are available and the host supports richer suggestion metadata THEN Guild MAY surface descriptions alongside names.
4. WHEN no workflows exist THEN Guild SHALL fail gracefully without breaking command registration.

**Independent Test**: In a project with discovered workflows, `/run-workflow` suggestions show valid workflow names before execution.

---

### P2: Suggest plan names for `/metrics`

**User Story**: As a Guild user, I want `/metrics` to suggest `all` and known plan names so I can quickly request a targeted metrics report.

**Acceptance Criteria**:

1. WHEN the user types `/metrics` THEN Guild SHALL expose `all` and known plan names if the host supports suggestions.
2. WHEN no plans are known THEN Guild SHALL still offer `all`.
3. WHEN the host does not support suggestions THEN current `/metrics` behavior SHALL remain unchanged.

**Independent Test**: `/metrics` suggestions include `all` and plan names discovered from the project.

---

### P2: Preserve compatibility when suggestions are unsupported

**User Story**: As a maintainer, I want Guild to degrade gracefully so the feature does not break command registration in OpenCode versions that lack suggestion support.

**Acceptance Criteria**:

1. WHEN the host command contract lacks suggestion support THEN Guild SHALL continue registering commands with current `argumentHint` metadata.
2. WHEN suggestion support is partial or static-only THEN Guild SHALL use the strongest supported path without degrading command execution.
3. WHEN suggestions fail at runtime THEN command execution SHALL still work with manually entered arguments.

**Independent Test**: Run Guild against an environment without suggestion support and verify `/start-work`, `/run-workflow`, and `/metrics` still register and execute as before.

---

## Edge Cases

- WHEN plan names include spaces or punctuation THEN suggested values SHALL preserve the exact executable form expected by the command.
- WHEN a plan becomes complete after suggestion generation THEN command execution SHALL still validate the selected plan normally.
- WHEN workflow discovery returns duplicate names from multiple scopes THEN suggestion precedence SHALL match runtime discovery rules.
- WHEN metrics has no project plans yet THEN `all` SHALL remain a valid suggestion.
- WHEN the host supports only static hints and not dynamic providers THEN Guild SHALL retain `argumentHint` and avoid fabricating unsupported behavior.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-CMD-SUGGEST-01 | Suggest available plans for `/start-work` | Command metadata + plan suggestion provider | Planned |
| GUILD-CMD-SUGGEST-02 | Suggest available workflows for `/run-workflow` | Command metadata + workflow suggestion provider | Planned |
| GUILD-CMD-SUGGEST-03 | Suggest plan names for `/metrics` | Command metadata + metrics suggestion provider | Planned |
| GUILD-CMD-SUGGEST-04 | Preserve compatibility without support | Host capability check + fallback path | Planned |
| GUILD-CMD-SUGGEST-05 | Reuse existing discovery logic | Shared helper/refactor | Planned |
| GUILD-CMD-SUGGEST-06 | Document resulting UX | `packages/guild/docs/commands.md` | Planned |

---

## Success Criteria

- [ ] Guild confirms whether the host supports command argument suggestions and integrates accordingly.
- [ ] `/start-work` suggests valid plan names when support exists.
- [ ] `/run-workflow` suggests valid workflow names when support exists.
- [ ] `/metrics` suggests `all` and known plan names when support exists.
- [ ] No regression occurs in environments without suggestion support.
- [ ] Commands documentation reflects the final user experience.

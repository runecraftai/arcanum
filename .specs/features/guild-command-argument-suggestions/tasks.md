# Tasks: guild-command-argument-suggestions

**Design**: `.specs/features/guild-command-argument-suggestions/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Host Capability Investigation (Sequential)

```text
T01 -> T02
```

### Phase 2: Suggestion Data Reuse Design (Sequential)

```text
T02 -> T03
```

### Phase 3: Command Suggestion Implementation (Sequential)

```text
T03 -> T04 -> T05 -> T06
```

### Phase 4: Verification and Docs (Sequential)

```text
T06 -> T07 -> T08
```

---

## Task Breakdown

### T01: Confirm OpenCode command suggestion support

**What**: Inspect the OpenCode plugin command contract and current Guild integration to determine whether commands support static or dynamic argument suggestions.
**Where**: Guild command registration code, OpenCode integration types/docs/tests available in the repo or dependency surface
**Depends on**: None
**Requirement**: GUILD-CMD-SUGGEST-04

**Done when**:

- [ ] The supported command metadata shape is identified.
- [ ] It is clear whether dynamic providers, static suggestions, or only `argumentHint` are supported.
- [ ] The result is captured in this feature's implementation notes or follow-up artifacts.

### T02: Choose the compatibility strategy

**What**: Decide the implementation path based on host support findings.
**Where**: Feature artifacts and implementation notes
**Depends on**: T01
**Requirement**: GUILD-CMD-SUGGEST-04

**Done when**:

- [ ] One of the paths is selected: dynamic suggestions, static suggestions, or graceful no-op fallback.
- [ ] The selected path preserves current command execution behavior.
- [ ] The path is narrow enough to implement without speculative host features.

### T03: Extract or define reusable suggestion data helpers

**What**: Reuse or extract read-only helpers for command suggestion data.
**Where**: plan/workflow discovery helpers near existing services/hooks
**Depends on**: T02
**Requirement**: GUILD-CMD-SUGGEST-05

**Done when**:

- [ ] There is a clear way to list incomplete plans for `/start-work`.
- [ ] There is a clear way to list discovered workflows for `/run-workflow`.
- [ ] There is a clear way to list known plan names for `/metrics`.
- [ ] No duplicated filesystem scanning is introduced unnecessarily.

### T04: Add `/start-work` suggestions

**What**: Implement argument suggestions for `/start-work` using incomplete plan names.
**Where**: built-in command registration and any required suggestion provider layer
**Depends on**: T03
**Requirement**: GUILD-CMD-SUGGEST-01

**Done when**:

- [ ] `/start-work` exposes suggestions when the host contract supports them.
- [ ] Suggested values are executable plan names.
- [ ] Missing-plan environments degrade safely.

### T05: Add `/run-workflow` suggestions

**What**: Implement argument suggestions for `/run-workflow` using discovered workflow names.
**Where**: built-in command registration and any required suggestion provider layer
**Depends on**: T04
**Requirement**: GUILD-CMD-SUGGEST-02

**Done when**:

- [ ] `/run-workflow` exposes workflow name suggestions when supported.
- [ ] Precedence matches current workflow discovery behavior.
- [ ] Empty-workflow environments degrade safely.

### T06: Add `/metrics` suggestions

**What**: Implement argument suggestions for `/metrics` using `all` and known plan names.
**Where**: built-in command registration and any required suggestion provider layer
**Depends on**: T05
**Requirement**: GUILD-CMD-SUGGEST-03

**Done when**:

- [ ] `/metrics` suggests `all`.
- [ ] Known plan names are suggested when available.
- [ ] Empty-plan environments still expose a safe fallback.

### T07: Verify command registration and fallback behavior

**What**: Add or update tests for command metadata and fallback compatibility.
**Where**: built-in command tests, plugin integration tests, or command adapter tests as appropriate
**Depends on**: T06
**Requirement**: GUILD-CMD-SUGGEST-01, GUILD-CMD-SUGGEST-02, GUILD-CMD-SUGGEST-03, GUILD-CMD-SUGGEST-04

**Done when**:

- [ ] Tests cover the supported suggestion path.
- [ ] Tests cover the unsupported/fallback path if applicable.
- [ ] Existing command execution behavior still passes.

### T08: Document command suggestion UX

**What**: Update command documentation to explain available argument suggestions and fallback behavior.
**Where**: `packages/guild/docs/commands.md`
**Depends on**: T07
**Requirement**: GUILD-CMD-SUGGEST-06

**Done when**:

- [ ] Docs mention which commands expose suggestions.
- [ ] Docs explain the source of suggested values.
- [ ] Docs explain that manual arguments still work.
- [ ] Docs do not claim unsupported autocomplete behavior.

---

## Execution Guidance

- Keep this feature separate from `guild-docs-customization-recipes`.
- Do not assume host support before T01 confirms it.
- Prefer the smallest compatible implementation path.

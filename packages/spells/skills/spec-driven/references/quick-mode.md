# Quick Mode

Execute small, ad-hoc tasks with the same quality bar as feature work, without the full SPEC/PLAN pipeline.

## Entry Criteria

Use quick mode only when all criteria are true:

- The request fits in one clear sentence
- Expected change touches 3 files or fewer
- No new architecture, dependency, migration, or design decision is needed
- Verification is obvious before implementation starts
- The user is asking for a fix, config change, small tweak, dependency bump, or one-off script

Use the full pipeline when any criterion fails.

## Size Guardrails

- Max 3 touched files
- Max 5 atomic implementation steps
- Max 1 hour expected effort
- No new runtime dependency unless the user explicitly approves and the impact is understood
- No broad refactors or opportunistic cleanup

If the pre-implementation check reveals more than 5 steps or complex dependencies, stop quick mode and create a formal `.specs/features/<name>/tasks.md` instead.

## Process

### 1. Describe

Capture the task in `.specs/quick/NNN-slug/TASK.md` when tracking is useful or when the quick task is non-trivial.

```markdown
# Quick Task NNN: <Title>

**Date:** YYYY-MM-DD
**Status:** Planned | In Progress | Done | Blocked

## Description

<One sentence describing what and why>

## Files

- `<path>` — <expected change>

## Done When

- [ ] WHEN <condition> THEN <observable result>

## Verification

- [ ] <command or manual check>
```

### 2. Pre-Implementation Check

Before editing, state:

```markdown
Quick Task: <description>
Files: <only files expected to change>
Approach: <one sentence>
Verify: <commands/manual checks>
```

If this list exceeds guardrails, switch to full pipeline.

### 3. Implement

- Make the smallest correct change
- Touch only listed files unless verification reveals a necessary additional file
- Do not improve adjacent code unless required by the task
- Preserve current project style

### 4. Verify

Run the verification listed in the pre-implementation check. Do not mark done until verification passes or the failure is clearly unrelated and documented.

### 5. Track

For tracked quick tasks, write `.specs/quick/NNN-slug/SUMMARY.md`:

```markdown
# Summary: <Title>

**Date:** YYYY-MM-DD
**Status:** Done | Blocked

## Changed

- `<path>` — <what changed>

## Verification

- `<command>` — PASS | FAIL | NOT RUN (<reason>)

## Commit

Pending user approval | `<hash>` — <message>
```

Update `.specs/project/STATE.md` only when the quick task creates durable knowledge: a decision, blocker, lesson, todo, or deferred idea.

## Commit Policy

Quick tasks should still use one atomic commit when committed, but agents must not commit automatically. Commit only after explicit user approval.

Recommended message format:

```text
<type>(<scope>): <description>
```

Examples:

- `fix(auth): prevent 401 on token refresh`
- `chore(deps): update eslint to v9`

## Completion Criteria

Quick mode is complete when:

1. The requested change is implemented or a blocker is documented
2. Verification has passed or could not run for a stated reason
3. Any quick tracking artifacts are updated
4. No commit was made without explicit user approval

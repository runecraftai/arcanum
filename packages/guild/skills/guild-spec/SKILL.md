---
name: guild-spec
description: >
  Write the problem statement, goals, user stories, and acceptance criteria for a Guild feature.
  Use when creating `.guild/plans/<slug>/spec.md`.
license: CC-BY-4.0
---

# guild-spec

Turn a request into a testable feature spec.

## Overview

Drive a structured spec workflow that produces `spec.md` with problem statement, goals, out-of-scope items, user stories, edge cases, and success criteria. Each requirement gets a traceable ID that flows into `tasks.md`. The spec is the contract; `tasks.md` is the work breakdown; both must stay aligned.

## When to Use

- A new feature is being scoped and `.guild/plans/<slug>/spec.md` does not yet exist.
- The user wants a structured spec (problem → goals → stories → criteria) before planning.
- The next step is to commit to a feature shape, not to plan or implement it.

**Do NOT use for**: implementation (use `guild-execute`), task decomposition (use `guild-plan`), scope classification (use `guild-scope`), or verification (use `guild-verify`).

## Primary inputs

- `.guild/plans/<slug>/spec.md` — target artifact
- `.guild/context/project.md` — project identity
- `.guild/knowledge/decisions.md` — prior decisions to honour
- `.guild/knowledge/conventions.md` — applicable conventions
- `.guild/knowledge/gotchas.md` — known pitfalls to avoid

## Process

1. Read `context/project.md` to anchor the spec in the project's identity and tech stack.
2. Read `knowledge/decisions.md` and `knowledge/gotchas.md` to honour prior commitments and avoid known pitfalls.
3. State the problem in one paragraph. The first sentence names the user-visible pain.
4. List goals as bullet items. Each goal is one sentence and is independently checkable.
5. List out-of-scope items explicitly. Out-of-scope is a deliberate choice, not a leftover.
6. Write user stories in the `As a <role>, I want <capability>, so that <benefit>` shape. Each story has at least one acceptance criterion.
7. Assign traceable requirement IDs (e.g., `REQ-001`, `REQ-002`) to each acceptance criterion. The same IDs flow into `tasks.md`.
8. Capture edge cases as a bulleted list. Each edge case states the input and the expected behaviour.
9. Define success criteria as a markdown checklist using `- [ ]` per item (never emoji such as ✅) — see `guild-plan/references/FORMATS.md` for the canonical format. A success criterion is observable (a command, a file, a metric).
10. Save to `.guild/plans/<slug>/spec.md`.

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "I already know what to build." | Step 3 requires a written problem statement. Memory is not a contract; the spec is. |
| "The spec is overhead, let's just start coding." | Steps 4–9 produce the acceptance criteria that `tasks.md` is built from. Skipping the spec produces a `tasks.md` with no traceable requirement IDs. |
| "Edge cases can be handled when they come up." | Step 8 captures them up front. Late edge cases produce retrofits to `tasks.md` and verification. |
| "Out-of-scope is implicit, no need to list it." | Step 5 makes non-goals explicit. Implicit out-of-scope produces scope creep. |
| "Success criteria as bullets is fine, no need for IDs." | Step 7 requires traceable IDs. IDs are the link between `spec.md` and `tasks.md`; bullets without IDs break traceability. |

## Red Flags

- `spec.md` has no requirement IDs (or uses `REQ-?` placeholders).
- Goals and out-of-scope overlap (a goal that is also out-of-scope).
- User stories lack acceptance criteria or `so that <benefit>`.
- Success criteria are not observable (e.g., "code is clean").

## Verification

The skill is complete when ALL of the following evidence is present:

- `.guild/plans/<slug>/spec.md` exists with the sections: problem statement, goals, out-of-scope, user stories, edge cases, success criteria.
- Every acceptance criterion has a traceable `REQ-NNN` ID.
- Every success criterion is observable (a command, a file path, or a metric).
- `tasks.md` (when produced) reuses the same `REQ-NNN` IDs.

**"Seems right" is not evidence.** Every claim of "this feature is specified" cites the file path and the section that was written.

## See also

- [guild-scope](guild-scope) — runs first to classify the work; this skill writes the feature spec.
- [guild-plan](guild-plan) — consumes `spec.md` to produce `tasks.md`.
- [guild-verify](guild-verify) — checks acceptance criteria against actual evidence.
- [.guild/architecture.md](/.guild/architecture.md) — canonical layout for `plans/<slug>/`.

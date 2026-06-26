---
name: guild-security
description: >
  Review Guild changes for security issues like unsafe input handling, secrets,
  privilege escalation, or broken trust boundaries.
license: CC-BY-4.0
---

# guild-security

Focus on risk and trust boundaries.

## Overview

Inspect config, prompt, and filesystem interactions for unsafe input handling, secret exposure, and privilege leaks. Prefer explicit validation and least privilege. Cross-check against `knowledge/gotchas.md` for known patterns. Record findings in `notes.md` and update `knowledge/gotchas.md` when a new pitfall is discovered.

## When to Use

- A `.guild/plans/<slug>/` is in `ready-for-review` or `reviewed` and the diff touches config, prompt, filesystem, or any trust boundary.
- A new external input source is being introduced (HTTP, file upload, CLI arg, env var).
- The user wants a Paladin-style security pass before ship.

**Do NOT use for**: routine refactors with no I/O surface change; use `guild-review` for general code review. Use `guild-security` specifically when the diff crosses or creates a trust boundary.

## Primary inputs

- `.guild/plans/<slug>/spec.md` — security requirements
- `.guild/knowledge/gotchas.md` — known security pitfalls
- Config, prompt, and filesystem interaction code in the diff
- The plan's verification evidence in `notes.md`

## Process

1. Read the diff and identify every I/O surface: config file reads, prompt parsing, filesystem operations, network calls, env var usage.
2. Map each surface to a trust boundary: who can control the input, what is the worst case if it is malicious, what validation is in place.
3. Inspect path handling: flag `..` segments, symlink traversal, unanchored user input used in `path.join`.
4. Inspect secret handling: flag secrets in code, logs, or commits; flag `process.env.<NAME>` reads where the env is set from disk in a shared location.
5. Inspect prompt handling: flag prompts that interpolate user input without escaping, and config keys that drive prompt content from untrusted sources.
6. Cross-check against `knowledge/gotchas.md`. If a new pitfall is discovered, propose an addition to that file.
7. Write security findings to `notes.md` with file path, line number, and a concrete fix recommendation.
8. Update `knowledge/gotchas.md` only by explicit decision (see `guild-commit-learning`).

## Rationalizations

| Excuse | Rebuttal |
| --- | --- |
| "This is internal, no need for input validation." | Trust boundaries exist wherever input enters a process. Step 2 maps them; "internal" is not a justification to skip the map. |
| "The secret is in a private repo." | Step 4 flags secrets in code, logs, or commits regardless of repo visibility. Private repos are not a security control. |
| "We use a well-known library, it must be safe." | Step 6 cross-checks `knowledge/gotchas.md`. Library usage does not override a documented pitfall. |
| "We can add auth later." | Step 2 records the trust boundary now. "Later" leaves the boundary unrecorded in the audit trail. |
| "Path traversal can't happen, the user picks the file." | Step 3 anchors paths and checks `..` segments. The user picking the file does not eliminate the boundary. |

## Red Flags

- Secrets present in the diff (API keys, tokens, passwords, certificates).
- Trust boundary crossed without validation: user input read from disk, network, or env and used in a system call without sanitization.
- Path operations that use user-controlled segments without anchoring or `..` checks.
- Prompts that interpolate user input without explicit escaping or rejection.
- New external dependency that reads or writes filesystem / network without being added to `knowledge/gotchas.md`.

## Verification

The skill is complete when ALL of the following evidence is present:

- `notes.md` records every security finding with file path, line number, and a concrete fix.
- The diff was inspected for: I/O surface enumeration, trust boundary map, path handling, secret handling, prompt handling.
- `knowledge/gotchas.md` was read and cross-checked against the diff.
- Any new pitfall discovered has a proposed `knowledge/gotchas.md` entry recorded in `notes.md`.
- `state.md` reflects the security review status (`reviewed` or `blocked`).

**"Seems right" is not evidence.** Every claim of "this change is secure" cites a file path, a command, or a runtime observation.

## See also

- [guild-review](guild-review) — general code review (Cleric); this skill is the Paladin pass.
- [guild-verify](guild-verify) — runs the verification gate; security is a cross-cutting lens.
- [guild-commit-learning](guild-commit-learning) — promotion rule for new gotchas.
- [.guild/architecture.md](/.guild/architecture.md) — knowledge/ slot layout.

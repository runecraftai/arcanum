---
name: guild-security
description: >
  Review Guild changes for security issues like unsafe input handling, secrets,
  privilege escalation, or broken trust boundaries.
license: CC-BY-4.0
---

# guild-security

Focus on risk and trust boundaries.

## Primary inputs

- `.guild/plans/<slug>/spec.md` — security requirements
- `.guild/knowledge/gotchas.md` — known security pitfalls
- Config, prompt, and filesystem interaction code

## Guidance

- Inspect config, prompt, and filesystem interactions
- Flag unsafe path handling, secret exposure, and privilege leaks
- Prefer explicit validation and least privilege
- Check `.guild/knowledge/gotchas.md` for known patterns

## Output

- Note security findings in `.guild/plans/<slug>/notes.md`
- Update `.guild/knowledge/gotchas.md` if new pitfalls discovered
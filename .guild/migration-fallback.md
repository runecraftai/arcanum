# Legacy Fallback and Migration Behavior

**Purpose**: Define how Guild reads legacy `.specs/` and `.notebook/` during transition, when fallback stops, and how imports into `.guild/` work.

---

## Core Principle

**Legacy paths are read-only fallback. `.guild/` is always canonical.**

No code path, skill, or agent may treat `.specs/` or `.notebook/` as authoritative. These directories exist only to serve existing projects during migration. All writes go to `.guild/`.

---

## Fallback Order

When resolving any artifact (spec, tasks, notes, design), Guild checks in this order:

```
1. .guild/plans/<slug>/         ← canonical (always checked first)
2. .guild/knowledge/             ← canonical (cross-plan)
3. .guild/context/               ← canonical (project-level)
4. .specs/features/<slug>/       ← legacy fallback
5. .specs/quick/<slug>/           ← legacy fallback
6. .specs/project/               ← legacy fallback
7. .notebook/                    ← legacy fallback
```

**The first match wins.** No merging, no reconciliation — the canonical location takes precedence even if legacy content is fresher.

---

## Fallback Activation Rules

A legacy path is consulted **only if** the canonical equivalent is absent or empty.

| Canonical exists? | Legacy consulted? |
|-------------------|-------------------|
| `.guild/plans/<slug>/spec.md` exists | No (`.specs/` skipped entirely) |
| `.guild/plans/<slug>/` directory exists but `spec.md` missing | Yes — only for `spec.md` |
| `.guild/` directory does not exist | Yes — all legacy paths checked |
| `.guild/` exists but all subdirs empty | Yes — all legacy paths checked |

**Empty means**: file does not exist, or file exists but has zero meaningful content (whitespace-only counts as empty).

---

## What to Import from Legacy

When a legacy path is consulted and content is found, the content **may** be imported into `.guild/` for durability. Import is optional and follows this table:

| Legacy path | Import target | Import condition |
|-------------|---------------|------------------|
| `.specs/features/<slug>/spec.md` | `.guild/plans/<slug>/spec.md` | Plan is active or recently worked |
| `.specs/features/<slug>/tasks.md` | `.guild/plans/<slug>/tasks.md` | Tasks have remaining work |
| `.specs/features/<slug>/design.md` | `.guild/plans/<slug>/design.md` | Design has unreviewed decisions |
| `.specs/project/ROADMAP.md` | `.guild/context/roadmap.md` | Roadmap has future milestones |
| `.specs/project/STATE.md` | `.guild/context/state.md` | Project is ongoing |
| `.notebook/` | `.guild/plans/<slug>/notes.md` | Notes are plan-local discoveries |
| `.specs/` decisions, conventions, gotchas | `.guild/knowledge/` | Content is cross-plan relevant |

**Do not import**:
- Abandoned or completed plan content
- Duplicate content that already exists in `.guild/`
- Content from `.notebook/` that is clearly session-ephemeral (debug traces, temporary notes)

---

## How to Import

1. **On first canonical read**: If `.guild/plans/<slug>/spec.md` is missing but `.specs/features/<slug>/spec.md` exists, copy the content into `.guild/` and mark the legacy source as `## ⚠️ Migrated` in a comment at the top.
2. **On session end**: If legacy content was referenced during the session, add a note to `plans/<slug>/notes.md` listing what was consulted and whether it was imported.
3. **No automatic bulk import**: Import happens lazily, on-demand, when content is actually needed by an agent. This avoids polluting `.guild/` with unused legacy content.

---

## Stop Conditions for Legacy Fallback

Legacy fallback is **deprecated and must stop** when all of the following are true:

| Condition | Rationale |
|-----------|-----------|
| Project has `.guild/context/project.md` | Confirms `.guild/` is initialized |
| All active plans have `.guild/plans/<slug>/spec.md` | Confirms no plan depends on legacy |
| No `.specs/` writes have occurred in ≥ 30 days | Confirms agents are writing to `.guild/` |
| No `.notebook/` writes have occurred in ≥ 30 days | Confirms notebook behavior is updated |
| Migration audit completed (all legacy content imported or deliberately discarded) | Confirms no unknown content remains |

**When stop condition is met**: Remove legacy fallback candidates from `resolveSpecArtifactPath()` and update all skill descriptions to remove `.specs/` references. Document the cutoff date in `.guild/knowledge/decisions.md`.

---

## Migration Audit Checklist

For each legacy path consulted, document:
- [ ] What was found (file, content summary)
- [ ] Whether it was imported or intentionally skipped
- [ ] Why it was skipped (abandoned, duplicate, ephemeral)
- [ ] Date of decision

Store the audit log at `.guild/plans/<slug>/notes.md` under a `## Legacy Migration` heading. Do not store migration audit in `.specs/` or `.notebook/` — the audit belongs in the canonical home.

---

## Enforcement

| Rule | Enforcement |
|------|-------------|
| Never write to `.specs/` or `.notebook/` | Skills and code must only write to `.guild/` paths. The migration-map documents code paths that must be updated. |
| Canonical always wins over legacy | `resolveSpecArtifactPath()` must check `.guild/` before `.specs/`. See migration-map.md Risk R3. |
| Import is optional, not mandatory | Agents decide whether to import based on content relevance. Do not auto-import everything. |

---

## Reference

- Canonical layout: `.guild/architecture.md`
- Migration details: `.guild/migration-map.md`
- Plan-local vs global boundary: `.guild/architecture.md` → Plan-local vs global state boundary
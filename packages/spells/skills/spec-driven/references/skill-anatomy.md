# Skill Anatomy

A skill is a self-contained capability that follows the agent framework architecture.

## Skill Structure

```
skill-name/
├── SKILL.md                    ← Main skill definition
├── .skill-meta.json            ← Metadata and triggers
└── references/                 ← Supporting documentation
    ├── reference-1.md
    ├── reference-2.md
    └── ...
```

## SKILL.md Format

**Header (YAML frontmatter)**:
```yaml
---
name: skill-name
version: 1.0.0
description: "Brief description"
trigger: /trigger-word
scope: public|private
audience: target-users
license: CC-BY-4.0
---
```

**Phases**:
- LOAD: Load context and prerequisite data
- MAIN: Execute the skill's core logic
- LEARN: Capture knowledge and update shared docs

**Structure**:
1. Header + metadata
2. Quick Reference or table of contents
3. LOAD phase (inline or referenced)
4. Main phase(s)
5. LEARN phase (inline or referenced)
6. Supporting references list

## .skill-meta.json Format

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Skill description",
  "trigger": "/trigger-word",
  "scope": "public",
  "audience": "target-users",
  "phases": ["load", "main", "learn"]
}
```

## Naming Conventions

- Skill directories: kebab-case (e.g., `code-review`)
- Reference files: kebab-case.md (e.g., `review-axes.md`)
- Triggers: lowercase with slash prefix (e.g., `/review`)
- Versions: semver (1.0.0)

## Trigger Design

Good triggers are:
- Short and memorable (≤ 3 words)
- Action-oriented (verbs preferred)
- Unambiguous (don't conflict with other skills)
- Available in both English and Portuguese (PT)

Example triggers:
- `/spec` and `vamos especificar`
- `/build` and `vamos construir`
- `/review` and `revisa isso`

## Phase Patterns

### LOAD Phase
- Load context from docs/, .specs/, prior sessions
- Set up state for main phase
- Usually inline in SKILL.md for skills < 500 lines

### MAIN Phase(s)
- Skill-specific logic
- Multiple phases possible (e.g., PLAN, BUILD, TEST)
- Can be inline or referenced

### LEARN Phase
- Capture session knowledge
- Update docs/, sessions/, knowledge base
- Usually inline for cross-skill consistency

## Self-Contained vs. Meta-Skills

**Self-Contained Skill**:
- Focuses on one capability
- Can be installed and used independently
- Example: `code-review` skill

**Meta-Skill**:
- Orchestrates multiple skills or phases
- Routes to different capabilities based on trigger
- Example: `spec-driven` meta-skill (v3.0.0)

Meta-skills route to phase reference files rather than implementing all logic inline.

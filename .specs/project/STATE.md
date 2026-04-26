# Project State — Arcanum

## Current Architecture

### Skill System
- **Single Canonical Skill:** `spec-driven` (`~/.config/opencode/skills/spec-driven/`)
  - Phases: Research, Planning, Execution, Post-Execution
  - Handles all skill workflows via Herald-directed phases

### Removed Components
- **Standalone Skills (2026-04-25):**
  - `planning/` — merged into spec-driven planning phase
  - `shipping/` — merged into spec-driven post-execution phase
  - `incremental-build/` — empty stub, unified under execution
  - `test-verification/` — empty stub, covered by spec-driven execution phase
  - `code-simplification/` — empty stub, covered by spec-driven execution phase
  - `code-review/` — empty stub, covered by spec-driven execution phase
  - **Reason:** These were scaffolds; spec-driven provides all required phases

## Key Decision Log

- **Skill Consolidation (2026-04-25):** Removed 6 standalone skill stubs, unified around spec-driven model
   - All skill workflows now directed by Herald → Sage → Forge (or other agents) within spec-driven phases
   - Reduces complexity; single entry point for agent coordination

- **Spec-Driven Skill Architect Compliance (2026-04-25):** Applied skill-architect compliance fixes
   - Frontmatter cleanup: removed non-standard YAML fields, enriched description with bilingual triggers and negative filters
   - Added deterministic Dispatch Algorithm section
   - Added Error Handling table
   - Improves skill clarity and reduces ambiguity in agent dispatch

## Running Status
- ✓ Spec-driven skill operational
- ✓ No external standalone skills active
- ✓ Knowledge graph integration active (graphify)
- ✓ Wiki integration active (projets-wiki)

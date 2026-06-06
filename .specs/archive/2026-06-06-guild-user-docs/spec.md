# Guild User Documentation Specification

## Problem Statement

`@runecraft/guild` has a user-facing README, but the package does not yet have a complete documentation tree like the Weave repository. The current README explains the basic package identity, installation, agents, uninstall, and development commands, but the real product surface is broader: configuration files, slash commands, workflows, continuation behavior, analytics, skills, troubleshooting, and future site readiness.

We need repo-local docs that users can rely on now, while keeping the content structured enough to become the source for a future documentation site similar to `tryweave.io/docs`.

## Goals

- [ ] Create a repo-local documentation structure for Guild modeled after Weave's repository docs and public guide style
- [ ] Keep `packages/guild/README.md` as a concise landing page, not a full manual
- [ ] Document user-facing Guild behavior that currently exists in code but is not explained in docs
- [ ] Make documentation site-ready by using focused pages, stable headings, relative links, and small examples
- [ ] Clearly separate onboarding, reference, troubleshooting, and deeper technical material

## Out of Scope

| Item | Reason |
| --- | --- |
| Building the future documentation site | This phase creates the repo docs source first |
| Changing Guild runtime behavior | This is documentation planning and content work only |
| Adding new commands or features | Docs should describe existing behavior, not planned behavior |
| Rebranding package identity again | The package identity is `@runecraft/guild` |
| Full visual design system for the future site | The site design will be planned later |

---

## User Stories

### P1: User can install and verify Guild quickly ⭐ MVP

**User Story**: As a new OpenCode user, I want a short setup guide so that I can add Guild to `opencode.json`, restart OpenCode, and confirm it loaded.

**Why P1**: Installation is the first user interaction and must be clear before advanced docs matter.

**Acceptance Criteria**:

1. WHEN a user opens the Guild README THEN they SHALL see the package purpose, install snippet, and next docs links without reading a long manual.
2. WHEN a user opens `docs/getting-started.md` THEN they SHALL see prerequisites, install steps, and verification steps.
3. WHEN install troubleshooting is needed THEN the docs SHALL point to package names, restart behavior, cache hints, and `/guild-health` where applicable.

**Independent Test**: Review the README and getting-started page as a first-time user and verify that a minimal install path is possible without reading source code.

---

### P1: User can understand Guild configuration ⭐ MVP

**User Story**: As a Guild user, I want a clear configuration reference so that I know where config files live, how user and project config merge, and which top-level sections are supported.

**Why P1**: Config is one of Guild's primary extension points and currently requires reading source or schema.

**Acceptance Criteria**:

1. WHEN a user opens `docs/configuration.md` THEN it SHALL list `.opencode/guild-opencode.jsonc` and `~/.config/opencode/guild-opencode.jsonc` with priority.
2. WHEN both config levels exist THEN the docs SHALL explain deep merge, array union, and scalar precedence at a high level.
3. WHEN a user wants editor schema support THEN the docs SHALL explain `schema/guild-config.schema.json` and the raw GitHub URL/pinning approach.
4. WHEN advanced sections are shown THEN examples SHALL be short and accurate to the existing schema.

**Independent Test**: Compare the configuration page against `packages/guild/src/config/schema.ts` and `packages/guild/src/infrastructure/fs/config-fs-loader.ts` for path and schema accuracy.

---

### P1: User can discover commands and operational behavior ⭐ MVP

**User Story**: As a Guild user, I want a commands reference so that I understand when to use `/start-work`, `/run-workflow`, `/guild-health`, `/metrics`, and `/token-report`.

**Why P1**: Slash commands are core user interactions and are currently hidden in source code.

**Acceptance Criteria**:

1. WHEN a user opens `docs/commands.md` THEN each built-in command SHALL have purpose, syntax, expected behavior, and common failure modes.
2. WHEN analytics commands are documented THEN opt-in analytics requirements SHALL be explicit.
3. WHEN workflow commands are documented THEN the relationship between workflow definitions and `/run-workflow` SHALL be explained.

**Independent Test**: Compare the command docs against `packages/guild/src/application/commands/` and workflow command routing.

---

### P1: User can troubleshoot common failures ⭐ MVP

**User Story**: As a user, I want symptom-based troubleshooting so that I can resolve install, config, command, workflow, and skill issues without opening source files.

**Why P1**: Troubleshooting prevents support churn and makes docs useful when things fail.

**Acceptance Criteria**:

1. WHEN Guild does not load THEN troubleshooting SHALL cover `opencode.json`, exact package name, restart, OpenCode plugin installation, cache, and logs.
2. WHEN config is not applied THEN troubleshooting SHALL cover file paths, JSONC syntax, precedence, restart, and `/guild-health`.
3. WHEN `/start-work` or `/run-workflow` fails THEN troubleshooting SHALL describe missing plans/workflows and expected state directories.
4. WHEN skills or analytics do not work THEN troubleshooting SHALL point to the relevant docs and minimum checks.

**Independent Test**: Review troubleshooting headings as a user with only a symptom and verify there is a direct diagnostic path.

---

### P2: User can understand agents and customization

**User Story**: As a Guild user, I want agent and skill docs so that I understand what each agent does and how to customize behavior safely.

**Why P2**: Agent customization is valuable after the user can install and run Guild.

**Acceptance Criteria**:

1. WHEN a user opens `docs/agents.md` THEN the 8 built-in agents SHALL be described with roles, modes, and interaction patterns.
2. WHEN a user opens `docs/skills.md` THEN it SHALL explain built-in skills, custom skill locations, config assignment, and disabled skills.
3. WHEN customization examples are included THEN they SHALL prefer additive mechanisms like `prompt_append` and `skills` over full prompt replacement.

**Independent Test**: Compare docs against built-in agent definitions, skill directory contents, and config schema fields.

---

### P2: User can understand continuation, workflows, and analytics

**User Story**: As a power user, I want docs for execution, continuation, workflows, and analytics so that I can operate Guild intentionally during longer sessions.

**Why P2**: These features are important but not needed for first install.

**Acceptance Criteria**:

1. WHEN a user opens `docs/continuation.md` THEN it SHALL distinguish manual resume, compaction recovery, idle prompts, and todo continuation.
2. WHEN a user opens `docs/workflows/overview.md` THEN it SHALL explain what Guild workflows are and how they execute.
3. WHEN a user opens `docs/workflows/authoring.md` THEN it SHALL show the JSONC shape, step types, artifacts, and completion methods.
4. WHEN a user opens `docs/analytics.md` THEN it SHALL state analytics is opt-in and explain local storage, metrics, fingerprinting, and reports.

**Independent Test**: Compare docs against workflow types, continuation config, and analytics types/source.

---

### P3: Maintainer has deeper technical references

**User Story**: As a maintainer, I want architecture, model, background-agent, release, and example docs so that the package is easier to evolve and eventually publish as a site.

**Why P3**: These docs improve maintainability and future site depth, but they can follow the user MVP.

**Acceptance Criteria**:

1. WHEN a maintainer opens `docs/architecture.md` THEN it SHALL explain plugin initialization and major components.
2. WHEN a maintainer opens `docs/model-guide.md` THEN it SHALL give practical model selection guidance by agent/use case.
3. WHEN a maintainer opens `docs/background-agents.md` THEN it SHALL explain concurrency and stale timeout behavior.
4. WHEN a maintainer opens `docs/releases.md` THEN it SHALL capture package verification and release expectations.
5. WHEN example workflows exist THEN they SHALL be valid examples users can adapt.

**Independent Test**: Review references and ensure no page requires reading unlinked source code to understand the concept.

---

## Requirement Traceability

| Requirement ID | Story | Planned Artifact | Status |
| --- | --- | --- | --- |
| GUILD-DOCS-01 | Install and verify quickly | `packages/guild/README.md`, `docs/getting-started.md` | Planned |
| GUILD-DOCS-02 | Understand configuration | `docs/configuration.md` | Planned |
| GUILD-DOCS-03 | Discover commands | `docs/commands.md` | Planned |
| GUILD-DOCS-04 | Troubleshoot failures | `docs/troubleshooting.md` | Planned |
| GUILD-DOCS-05 | Understand agents/customization | `docs/agents.md`, `docs/skills.md` | Planned |
| GUILD-DOCS-06 | Understand continuation/workflows/analytics | `docs/continuation.md`, `docs/workflows/*`, `docs/analytics.md` | Planned |
| GUILD-DOCS-07 | Provide maintainer references | `docs/architecture.md`, `docs/model-guide.md`, `docs/background-agents.md`, `docs/releases.md` | Planned |
| GUILD-DOCS-08 | Prepare future site source | all docs pages and relative links | Planned |

---

## Success Criteria

- [ ] `packages/guild/README.md` acts as a concise landing page and links to detailed docs
- [ ] `packages/guild/docs/` exists with onboarding, reference, troubleshooting, and advanced topics
- [ ] P1 docs can guide a new user from install through basic command usage without source inspection
- [ ] Docs use accurate Guild names, paths, commands, and config fields
- [ ] The content can later be moved into a site generator with minimal restructuring

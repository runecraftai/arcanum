# Phylactery Background Agent Runtime Specification

**Status:** Opportunity — not yet specced (see ROADMAP.md §2.2)
**Phase:** Specify
**Started:** 2026-07-04
**Last Updated:** 2026-07-04
**Source:** `.specs/project/ROADMAP.md §2.2`

---

## Problem Statement

Guild currently runs subagents synchronously through the orchestrator: each agent runs in the same session, sequentially or in shallow parallel, and state is lost when the session ends. For long-running tasks (large refactors, multi-PR migrations, overnight processing), there is no mechanism to:
- Survive session restarts.
- Fan out across isolated git worktrees.
- Plan a DAG of agent tasks and execute them with test-gated merges.
- Coordinate peer-to-peer between agents without a central orchestrator bottleneck.

The awesome-opencode cluster (Mission Control, Pocket Universe, Ensemble, Background Agents, opencode-arise, Pilot, Subagent Reporter) shows mature demand but each is a standalone, non-Arcanum artifact.

## Goals

- [ ] Provide a persistent daemon process (`phylactery-daemon`) that survives OpenCode session restarts.
- [ ] Support worktree-isolated agent execution (each agent branch in its own `git worktree`).
- [ ] DAG-based task planning: define tasks with dependencies; Phylactery schedules and fans out.
- [ ] Test-gated merge trains: a worktree branch merges to main only after its test suite passes.
- [ ] Peer-to-peer agent coordination: agents can post events to each other via Phylactery's event bus without going through Guild's orchestrator.
- [ ] State resumption: a task interrupted by session restart resumes from its last checkpoint.
- [ ] Self-register slash-commands (`/phylactery-status`, `/phylactery-plan`, `/phylactery-cancel`) via `Hooks.config`.
- [ ] Integrate with Spawn for tmux pane visualisation of running background agents.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cloud/remote execution | Local-first; no cloud infra required. |
| Cross-machine agent coordination | Network complexity; v0.2+ concern. |
| Container/Docker isolation | Worktree isolation is sufficient for v0.1. |
| Scheduling by wall-clock time (cron-style) | DAG + manual trigger is enough for v0.1. |
| Full CI/CD pipeline replacement | Phylactery is agent-orchestration, not CI. |

---

## User Stories

### P1: Background task that survives session restart ⭐ MVP

**User Story:** As a developer, I want to start a large refactor task and close my terminal, returning later to find the agent has continued working.

**Acceptance Criteria:**

1. WHEN the user runs `/phylactery-plan "refactor X"` THEN Phylactery SHALL create a task record in `~/.runecraft/phylactery/tasks.db` with `status = "queued"`.
2. WHEN the OpenCode session ends THEN the Phylactery daemon SHALL continue running the task in the background.
3. WHEN the user reopens OpenCode AND the task is still running THEN `/phylactery-status` SHALL show the task's current state, last checkpoint, and elapsed time.
4. WHEN the daemon is not running THEN Phylactery SHALL auto-start it on plugin boot (via `Bun.spawn` + PID file at `~/.runecraft/phylactery/daemon.pid`).

**Independent Test:** Start a task, kill the OpenCode process, reopen it, run `/phylactery-status`, verify the task shows `running` with a recent checkpoint timestamp.

---

### P2: Worktree-isolated agent execution

**User Story:** As a developer, I want each background agent to run in its own git worktree so their changes don't conflict.

**Acceptance Criteria:**

1. WHEN a DAG task is dispatched to a background agent THEN Phylactery SHALL create a `git worktree add .phylactery/worktrees/<task-id> -b phyl/<task-id>` branch.
2. WHEN the agent completes THEN Phylactery SHALL run the configured test command in the worktree.
3. WHEN all tests pass THEN Phylactery SHALL open a merge PR (or a local merge commit if no remote) and clean up the worktree.
4. WHEN a worktree fails its tests THEN Phylactery SHALL mark the task `failed` and leave the worktree intact for inspection; it SHALL NOT auto-merge.

---

### P3: DAG planning and fan-out

**User Story:** As a developer, I want to describe a set of tasks with dependencies and have Phylactery execute them in the correct order, in parallel where safe.

**Acceptance Criteria:**

1. WHEN the user provides a DAG plan (via `/phylactery-plan` or a `phyl-plan.toml` file) THEN Phylactery SHALL parse the dependency graph and schedule leaf nodes first.
2. WHEN two tasks have no dependency between them THEN Phylactery SHALL execute them in parallel (each in its own worktree).
3. WHEN a task fails THEN all tasks that depend on it SHALL be marked `blocked` and not executed.
4. WHEN all tasks complete THEN Phylactery SHALL produce a summary report and emit a `phylactery.dag.completed` event that Guild can listen to.

---

### P4: Spawn TUI integration

**User Story:** As a developer, I want to see all running background agents in my Spawn tmux sidebar.

**Acceptance Criteria:**

1. WHEN Phylactery starts a background agent THEN it SHALL emit a `phylactery.agent.started` event that Spawn can render as a named tmux pane.
2. WHEN an agent completes or fails THEN Phylactery SHALL emit `phylactery.agent.completed` / `phylactery.agent.failed` for Spawn to update its pane status.
3. WHEN Spawn is not loaded THEN events are emitted but silently ignored (no crash).

---

## Edge Cases

- WHEN the daemon PID file exists but the process is dead THEN Phylactery SHALL detect the stale PID, remove it, and restart the daemon on next boot.
- WHEN two Phylactery instances try to acquire the same worktree THEN the second SHALL fail gracefully with a `[phylactery] Worktree <name> is locked` error.
- WHEN `git worktree add` fails (e.g., detached HEAD repo) THEN Phylactery SHALL fall back to a temp directory clone with a warning.
- WHEN the test command is not configured THEN Phylactery SHALL skip the test gate and merge directly (with a one-time warning).
- WHEN the user cancels a task via `/phylactery-cancel <task-id>` THEN Phylactery SHALL kill the agent process, remove the worktree, and mark the task `cancelled`.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| PHYL-01 | P1 | Pending |
| PHYL-02 | P1 | Pending |
| PHYL-03 | P1 | Pending |
| PHYL-04 | P1 | Pending |
| PHYL-05 | P2 | Pending |
| PHYL-06 | P2 | Pending |
| PHYL-07 | P2 | Pending |
| PHYL-08 | P2 | Pending |
| PHYL-09 | P3 | Pending |
| PHYL-10 | P3 | Pending |
| PHYL-11 | P3 | Pending |
| PHYL-12 | P3 | Pending |
| PHYL-13 | P4 | Pending |
| PHYL-14 | P4 | Pending |
| PHYL-15 | P4 | Pending |

**ID format:** `PHYL-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified

---

## Success Criteria

- [ ] A background task survives 20/20 simulated session restarts with state preserved.
- [ ] Worktree isolation: two parallel tasks modifying the same file do not corrupt each other.
- [ ] Test-gated merge: a task with failing tests is NOT merged (0 false merges in a 10-task sample).
- [ ] DAG fan-out: 3 independent tasks start simultaneously (verified by timestamp overlap in logs).
- [ ] `/phylactery-status` shows correct state after restart.
- [ ] Tests pass: `bun test --filter @runecraft/phylactery`.
- [ ] No `bin` field in published `package.json` (daemon is started internally via `Bun.spawn`).

---

## Open Questions (to resolve in Design phase)

1. **Daemon IPC:** How does the plugin communicate with the daemon process? Unix socket? Named pipe? HTTP on localhost? Choice affects reliability and cross-platform support.
2. **Agent execution model:** Does the daemon spawn a full `bunx opencode` subprocess per task, or does it use a lighter OpenCode SDK headless mode? The former is simpler but heavier.
3. **DAG input format:** Is `/phylactery-plan` interactive (agent fills in the DAG via conversation) or does it read a `phyl-plan.toml` file? Both? What's the MVP?
4. **Spawn coupling:** Is the Spawn integration a hard or soft dependency? Spawn is already shipped; we can make Phylactery emit events and Spawn subscribe — but does Spawn need changes?
5. **Test command configuration:** Where is the test command specified? `phylactery.toml`? `package.json#scripts.test`? Auto-detected from the repo?

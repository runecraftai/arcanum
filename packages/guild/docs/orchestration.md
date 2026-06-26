# Orchestration patterns and anti-patterns

**Audience:** anyone composing Guild agents (`built-in` + `custom_agents`) and category routing. This page names the orchestration shapes that work and the ones to avoid, mapped to Guild primitives. It is content, not enforcement: Guild does not block anti-patterns at config load time. Read it before wiring up multi-agent flows.

**See also:** [Agents](agents.md) — the eight built-ins and category routing. [Custom agents](custom-agents.md) — how to register `custom_agents`. [Skills](skills.md) — the anatomy of a skill body.

---

## Endorsed patterns

The five patterns below are the orchestration shapes that hold up under load. They are listed in roughly increasing order of coordination cost. Pick the lightest one that fits the work.

### 1. Direct invocation

The user calls one agent with one task. The agent runs to completion or hands off. No routing, no fan-out.

- **Use when:** the task fits one agent's mandate. "Run the test suite and report" → Fighter. "Audit the diff for security issues" → Paladin. "Spec the new feature" → Wizard.
- **How it looks in Guild:** the user (or Bard as a lead, see below) calls the agent directly via the OpenCode agent picker. The agent loads its assigned skills and runs.
- **Cost:** zero coordination. No intermediate state. Easy to verify.

### 2. Single-persona command

A single skill drives a single persona through a deterministic workflow. The skill encodes the process; the agent executes it.

- **Use when:** the work is a repeatable workflow owned by one persona. `guild-execute` (Fighter) implements `tasks.md`. `guild-verify` runs the verification gate. `guild-ship` finalizes the change.
- **How it looks in Guild:** the user invokes a `guild-*` skill; the skill is assigned to one agent; the agent runs the skill body. No agent-to-agent call.
- **Cost:** still low. The skill is the contract; the agent is the executor.

### 3. Parallel fan-out with merge

Multiple agents run in parallel on independent slices of a task. A merge step combines the results. The user (or Bard as a lead) is the merger.

- **Use when:** the task decomposes cleanly into independent slices, and the merge is well-defined. Example: three Rangers each research a different library; Bard merges the findings.
- **How it looks in Guild:** the user (or Bard) issues three `/start-work` invocations to three different Rangers, each scoped to a non-overlapping slice. Bard (or the user) collects the results and writes the merged output to `notes.md` or `spec.md`.
- **Cost:** medium. Requires clean slice boundaries and an explicit merge contract. If the slices overlap, the merge step becomes a re-orchestration — that is the failure mode (see anti-patterns below).

### 4. Sequential pipeline (user is orchestrator)

The user chains skills in a fixed order. Each step's output feeds the next. The user runs each step explicitly.

- **Use when:** the workflow is a pipeline and the user wants explicit control at each step. Example: `guild-spec` → `guild-plan` → `guild-execute` → `guild-verify` → `guild-review` → `guild-ship`.
- **How it looks in Guild:** the user runs each skill in turn. Each skill writes to a known artifact (`spec.md`, `tasks.md`, `notes.md`, `state.md`); the next skill reads it. No agent-to-agent call; the user is the join point.
- **Cost:** low to medium. Each step is auditable. The user pays the cost of staying in the loop.

### 5. Research isolation

An agent runs in isolation to gather facts without taking actions. Its output is a written record (`notes.md`, `knowledge/conventions.md`, or a research report) consumed by another agent or the user.

- **Use when:** the next step depends on facts the agent will discover, and those facts must be on paper before any planning or implementation. Example: `guild-recon` (Rogue) traces a call chain; `guild-research` looks up an upstream API.
- **How it looks in Guild:** the user invokes the recon or research skill; the agent writes findings to the destination file; the next skill (e.g., `guild-spec`) reads them.
- **Cost:** low. The isolation rule — no actions, only findings — is what keeps this pattern safe. A recon agent that also implements is no longer recon; it is an executor that happened to read first.

---

## Anti-patterns

The four shapes below are how a multi-agent Guild setup goes wrong. They are listed in roughly increasing order of damage. None of them is blocked at load time; the orchestration is content, not enforcement. Refactor when you see one in your config.

### A1. Router persona (meta-orchestrator)

A `custom_agents` entry whose prompt is purely routing logic — it inspects the user's request, picks which built-in to call, and re-invokes the built-in. The router sits between the user and every other agent.

- **Why it fails:** the router is a single point of failure for every request. Its routing logic is opaque (a prompt) and unverified. Every routing decision is a hidden model call. When the router is wrong, the whole flow is wrong, and the failure is hard to attribute because the router's prompt is the only artifact.
- **How this would look in Guild:** a `custom_agents` entry named `router` or `dispatcher` whose `prompt` is "Look at the user request. If it is about code, call Fighter. If it is about security, call Paladin. If it is about research, call Warlock. Otherwise, ask for clarification." with no own mandate. The agent has no domain of its own; it only routes.
- **Fix:** delete the router. The user is the router. Pick the agent directly; the OpenCode agent picker exists for this reason.

### A2. Persona-calls-persona

An agent's `prompt` or `prompt_append` includes instructions to invoke another built-in or `custom_agents` entry as a sub-call.

- **Why it fails:** Guild does not provide a first-class "agent calls agent" mechanism. The "call" has to be implemented as a re-invocation of the OpenCode agent picker, which means the called agent runs in a fresh context with no shared state. The calling agent cannot observe the called agent's work directly; it gets only the result string. This is hidden coupling, not delegation.
- **How this would look in Guild:** a `custom_agents` entry named `orchestrator` whose `prompt_append` says "If the user asks for security review, invoke Paladin and include the result in your response." Paladin runs in a separate context, with its own skill load, with no plan or `tasks.md` shared.
- **Fix:** make the user the orchestrator. The user invokes the second agent, collects the result, and passes it to the first. This is the sequential pipeline pattern; it is auditable because each step is a user action.

### A3. Sequential orchestrator that paraphrases

A `custom_agents` entry that runs a sequence of sub-tasks, each of which is a paraphrased instruction to a built-in. The orchestrator re-states the user's request in slightly different terms and hands it to a different agent each time.

- **Why it fails:** each paraphrase loses information. By the time the chain has run for three steps, the final agent's task description is a lossy compression of the original user request. The orchestrator's "value add" is exactly the loss. Verification is also broken: the user cannot tell which step introduced the drift.
- **How this would look in Guild:** a `custom_agents` entry whose `prompt` is "Step 1: restate the user's feature request as a spec. Step 2: hand the spec to a planner. Step 3: hand the plan to an executor. Step 4: hand the diff to a reviewer." Each step's input is a paraphrase of the previous step's output.
- **Fix:** write the spec yourself (or use `guild-spec` once), then run the skills in sequence. The user is the join point; the artifacts are the contract.

### A4. Deep persona trees

Three or more levels of `custom_agents` nesting, where the user calls a top-level agent that calls a mid-level agent that calls a leaf agent. The tree is configured in `custom_agents` and the leaf is a built-in.

- **Why it fails:** the tree is invisible to the user. The user only sees the top-level agent. Each level adds a context translation (see A3) and a hidden failure mode. The deeper the tree, the more lossy the chain, and the harder to debug when something goes wrong. The cost of debugging a deep tree is higher than the cost of writing a single skill that does the work.
- **How this would look in Guild:** `custom_agents` has entries `lead → senior → specialist → paladin`. `lead.prompt` invokes `senior`; `senior.prompt` invokes `specialist`; `specialist.prompt` invokes `paladin`. The user sees only `lead`.
- **Fix:** flatten. A `custom_agents` entry that wants `paladin`'s work should ask the user to invoke `paladin` and pass the result. A skill is a flat artifact, not a tree.

---

## Bard is a lead, not a meta-router

Bard is the user-driven primary. The user picks Bard (or Bard is the default in a project config) and Bard executes with the skills assigned to it. Bard is **not** a router and **not** a meta-orchestrator.

The distinction matters because both interpretations are superficially compatible with the same code: "Bard has the user's request and a set of skills; it runs them." The router interpretation says Bard reads the request, picks a skill, and runs it. The lead interpretation says Bard owns the work end-to-end, calling the user for direction at handoff boundaries.

Bard is a lead:

- Bard is the user-driven primary. The user picks Bard, not the other way around.
- Bard owns the work. Bard does not silently route to a sub-agent because a router prompt told it to. If Bard needs another persona, Bard asks the user.
- Bard's delegation is user-initiated. The user runs the second agent; Bard receives the result and continues.
- Bard's `prompt_append` and `prompt` describe Bard's own mandate, not routing logic. Bard is a domain owner, not a dispatcher.

If a `custom_agents` entry is described in a way that fits A1, A2, A3, or A4 above, it is not Bard. It is a router, a paraphrasing orchestrator, or a tree node. Refactor.

See [Agents](agents.md) for the eight built-ins and how to assign skills to them.

---

## Decision flow

Use this table to pick a pattern. Start at the top; the first match wins.

| If the task is... | Use this pattern | Why |
|-------------------|------------------|-----|
| A single skill workflow owned by one persona (e.g., `guild-execute`, `guild-verify`, `guild-ship`) | **Single-persona command** | The skill is the contract; the agent is the executor. |
| A simple request that fits one agent's mandate (e.g., "audit the diff") | **Direct invocation** | Zero coordination. Pick the agent and run. |
| A pipeline where each step's output feeds the next (`spec → plan → execute → verify → review → ship`) | **Sequential pipeline (user is orchestrator)** | Each step is auditable; the user is the join point. |
| A task that decomposes into independent slices with a clear merge | **Parallel fan-out with merge** | Slices run in parallel; the user or Bard merges. |
| A "what is in this codebase?" or "what does this API do?" question with no action required | **Research isolation** | Findings on paper first; planning comes after. |
| Anything that needs a router, a paraphrasing orchestrator, or a deep tree | **Refactor.** Pick one of the above. | Anti-patterns are not patterns. Flatten or remove. |

If the table does not give a clean answer, the task is probably not yet scoped. Run `guild-scope` first.

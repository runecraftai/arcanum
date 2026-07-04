# Runes Memory v0.2/v0.3 — Semantic + AST + Activation Specification

**Status:** Opportunity — v0.1 shipped; v0.2+ deferred (see STATE.md Deferred Ideas and ROADMAP.md §2.5)
**Phase:** Specify
**Started:** 2026-07-04
**Last Updated:** 2026-07-04
**Source:** `.specs/project/ROADMAP.md §2.5`, `.specs/project/STATE.md` Deferred Ideas

---

## Problem Statement

Runes v0.1 provides lexical FTS5 search over a per-repo SQLite store. Users testing it report that FTS5 alone is too brittle for "find me that conversation about X" queries where the vocabulary doesn't match exactly. The missing capabilities are:

- **v0.2:** Cross-tool memory paths (`.runes/` readable by both OpenCode and Claude Code/Cursor), `rune_judge` LLM-judged conflict detection, git sync of `.runes/` chunks.
- **v0.3:** Embedding-based semantic search (provider-pluggable, local-first via ONNX), tree-sitter AST-aware chunking, 4-layer activation model, background memory maintenance ("overnight dreamer" pattern), biological decay/boost.

The awesome-opencode cluster (Harness Memory, Magic Context, Lemma, OpenCodeRAG, Hipocampo, oc-mnemoria, OpenCode Claude Memory) validates the demand. Arcanum's advantage is doing this in a Bun-native plugin with no Python subprocess.

---

## v0.2 Goals (next release after v0.1)

- [ ] **Cross-tool memory paths:** `.runes/` directory structure readable by OpenCode, Claude Code, Cursor, and other agents that support file-based context injection.
- [ ] **`rune_judge` conflict detection:** When two memories describe the same concept differently, an LLM-judged tool detects the conflict and proposes a resolution.
- [ ] **Git sync of `.runes/` chunks:** Allow `git add .runes/` so memory travels with the repo across machines.
- [ ] **MCP server alongside native tools:** Expose the same `rune_*` tools via a stdio MCP server so non-OpenCode agents can use Runes.

## v0.3 Goals (after v0.2 stabilises)

- [ ] **Embedding-based semantic search** (provider-pluggable: local ONNX, OpenAI `text-embedding-3-small`, or Ollama). ONNX as `optionalDependency`.
- [ ] **Tree-sitter AST-aware chunking** (Bun-native, no Python subprocess). Chunks code by function/class rather than arbitrary token windows.
- [ ] **4-layer activation model** (inspired by Harness Memory): working memory → session memory → project memory → global memory, each with different retention and retrieval policies.
- [ ] **Decay/boost scoring** (Lemma-inspired): memories fade over time unless reinforced; user can boost a memory with `rune_boost`.
- [ ] **Background memory maintenance** (Magic Context "overnight dreamer"): a background process periodically deduplicates, re-ranks, and prunes stale memories.
- [ ] **TUI for memory browsing** (bonus): a `/runes-browse` slash-command with a paged TUI view.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cross-repo memory sharing | Per AD-005, memory is scoped per-repo to prevent silent leakage. |
| Cloud sync / backup | Local-first philosophy; git sync (v0.2) is the opt-in escape hatch. |
| Vector database (LanceDB, Pinecone, etc.) | Adds external service dependency; ONNX + SQLite vec extension is sufficient. |
| Memory for non-code artifacts (images, PDFs) | Out of scope for a code-first memory plugin. |
| Automatic memory injection on every turn | Per AD-006, injection is on-demand only. |

---

## User Stories

### P1 (v0.2): Cross-tool memory paths ⭐ v0.2 MVP

**User Story:** As a developer using both OpenCode and Claude Code on the same repo, I want a single `.runes/` directory that both agents can read and write to.

**Acceptance Criteria:**

1. WHEN Runes writes a memory chunk THEN it SHALL also write a corresponding file to `.runes/<slug>/<id>.md` in a format that any file-reading agent can consume.
2. WHEN a file exists in `.runes/` that was written by another agent THEN `rune_search` SHALL include it in results.
3. WHEN `.runes/` is committed to git and checked out on another machine THEN memories SHALL be available on that machine without re-running any import.

**Independent Test:** Write a memory in OpenCode; verify it appears as `.runes/<slug>/<id>.md`; read it from Claude Code's `/read` tool without any Runes-specific setup.

---

### P2 (v0.2): `rune_judge` conflict detection

**User Story:** As a developer, I want Runes to detect when two memories contradict each other and propose a resolution, so I don't accumulate stale or incorrect memories.

**Acceptance Criteria:**

1. WHEN `rune_store` is called with content that semantically overlaps (per FTS5 or embedding similarity > threshold) with an existing memory THEN Runes SHALL call `rune_judge` internally and surface the conflict to the agent.
2. WHEN `rune_judge` is called directly THEN it SHALL return a structured `Conflict` object with `memory_a`, `memory_b`, and a `suggested_resolution`.
3. WHEN the user resolves a conflict via `rune_resolve(id_a, id_b, resolution)` THEN both memories SHALL be replaced by the resolved version and the originals archived.

---

### P3 (v0.3): Semantic search via embeddings

**User Story:** As a developer, I want `rune_search "that conversation about the auth bug"` to return relevant memories even when the exact words don't match.

**Acceptance Criteria:**

1. WHEN `@runecraft/runes` is installed with the optional ONNX dependency THEN `rune_search` SHALL use cosine similarity on stored embeddings as a secondary ranking signal.
2. WHEN ONNX is not installed THEN `rune_search` SHALL fall back to FTS5 only (no degradation, no error).
3. WHEN a new memory is stored THEN its embedding SHALL be computed asynchronously and written to `memories.embedding` (BLOB column, not blocking the store operation).
4. WHEN the embedding provider is configured as `openai` in `runes.toml` THEN Runes SHALL use `text-embedding-3-small` instead of the local ONNX model.

---

### P4 (v0.3): AST-aware chunking

**User Story:** As a developer, I want memories about a function to be chunked at the function boundary, not at an arbitrary 512-token window.

**Acceptance Criteria:**

1. WHEN `rune_store` is called with a code snippet THEN Runes SHALL detect the language (via file extension or magic bytes) and use tree-sitter to chunk at function/class boundaries.
2. WHEN tree-sitter does not support the detected language THEN Runes SHALL fall back to the existing line-based chunker.
3. WHEN an AST chunk is stored THEN `memories.chunk_type` SHALL be set to `"ast"` and `memories.ast_node_type` SHALL record the node kind (e.g., `"function_declaration"`).

---

### P5 (v0.3): 4-layer activation model

**User Story:** As a developer, I want Runes to automatically promote frequently-accessed memories to a faster-retrieval "working memory" layer.

**Acceptance Criteria:**

1. WHEN a memory is accessed N times in a session THEN it SHALL be promoted to `layer = "working"` for that session.
2. WHEN a session ends THEN `layer = "working"` memories SHALL be demoted back to `layer = "session"` if access count drops below threshold.
3. WHEN `rune_context()` is called THEN it SHALL return working-memory items first, then session, then project, then global.
4. WHEN a memory has not been accessed in T days (configurable) THEN it SHALL be demoted one layer (decay).

---

## Edge Cases

- WHEN the ONNX model fails to load THEN Runes SHALL warn once and disable semantic search for that session; FTS5 continues.
- WHEN tree-sitter native bindings fail to compile THEN Runes SHALL warn and fall back to line-based chunking.
- WHEN `.runes/` git sync causes a merge conflict THEN Runes SHALL treat the conflict as two separate memories and run `rune_judge`.
- WHEN the background maintenance process is running AND the user writes a new memory THEN the write SHALL not be blocked by maintenance (WAL mode + separate connection).
- WHEN the MCP server is started but the port is taken THEN Runes SHALL try the next available port in range 3500–3510.

---

## Requirement Traceability

| Requirement ID | Version | Story | Status |
| --- | --- | --- | --- |
| RUNE2-01 | v0.2 | P1 | Pending |
| RUNE2-02 | v0.2 | P1 | Pending |
| RUNE2-03 | v0.2 | P1 | Pending |
| RUNE2-04 | v0.2 | P2 | Pending |
| RUNE2-05 | v0.2 | P2 | Pending |
| RUNE2-06 | v0.2 | P2 | Pending |
| RUNE3-01 | v0.3 | P3 | Pending |
| RUNE3-02 | v0.3 | P3 | Pending |
| RUNE3-03 | v0.3 | P3 | Pending |
| RUNE3-04 | v0.3 | P3 | Pending |
| RUNE3-05 | v0.3 | P4 | Pending |
| RUNE3-06 | v0.3 | P4 | Pending |
| RUNE3-07 | v0.3 | P4 | Pending |
| RUNE3-08 | v0.3 | P5 | Pending |
| RUNE3-09 | v0.3 | P5 | Pending |
| RUNE3-10 | v0.3 | P5 | Pending |
| RUNE3-11 | v0.3 | P5 | Pending |

**ID format:** `RUNE2-NN` (v0.2), `RUNE3-NN` (v0.3)
**Status values:** Pending → In Design → In Tasks → Implementing → Verified

---

## Success Criteria

### v0.2
- [ ] A memory written in OpenCode appears as a readable `.runes/<slug>/<id>.md` file.
- [ ] `rune_judge` detects a seeded contradiction (two memories with opposite claims) in a unit test.
- [ ] MCP server starts and responds to `tools/list` request.
- [ ] Tests pass: `bun test --filter @runecraft/runes`.

### v0.3
- [ ] Semantic search returns a relevant memory that FTS5 alone would miss (documented test fixture).
- [ ] Token reduction vs CLAUDE.md for 10 real sessions: ≥ 50% reduction (per ROADMAP success metric).
- [ ] AST chunking correctly splits a 300-line TypeScript file into per-function memories.
- [ ] 4-layer activation: working-memory items appear first in `rune_context()` output.
- [ ] ONNX absent → FTS5 fallback, zero errors.
- [ ] Tests pass: `bun test --filter @runecraft/runes`.
- [ ] ONNX is in `optionalDependencies`, not `dependencies`.

---

## Open Questions (to resolve per-version in Design phase)

### v0.2
1. **Cross-tool format:** What is the canonical `.runes/<slug>/<id>.md` frontmatter schema? Should it be compatible with Obsidian, Claude Code's `@files`, or just plain markdown?
2. **`rune_judge` model:** Should `rune_judge` use the current session's model (free, but incurs cost) or a separate dedicated small model?
3. **MCP server process model:** Stdio subprocess started by the plugin on demand, or a long-lived daemon (like Phylactery)?

### v0.3
4. **ONNX model choice:** Which embedding model ships as the default? `all-MiniLM-L6-v2` (22MB) is the smallest viable option. Does this violate "local-first" if it requires a download?
5. **tree-sitter in Bun:** Does Bun support tree-sitter's WASM bindings? Or do we need native N-API bindings? The latter risks `node-gyp` dependency we want to avoid.
6. **Decay parameters:** What are the default decay/boost time constants? Should they be configurable in `runes.toml` or hardcoded for v0.3?
7. **Background maintenance process:** Same Phylactery daemon, or a separate lightweight cron within the plugin?

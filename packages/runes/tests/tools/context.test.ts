import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createContextTool } from "../../src/tools/context";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-context-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("ctx-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "ctx-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callContext(
	args: Record<string, unknown>,
): Promise<{
	project: unknown;
	current_session: unknown;
	recent_memories: unknown[];
	relevant_memories: unknown[];
}> {
	const t = createContextTool(deps);
	const result = await t.execute(args as never, {
		sessionID: "s",
		messageID: "m",
		agent: "opencode",
		directory: "/tmp",
		worktree: "/tmp",
		abort: new AbortController().signal,
		metadata: () => {},
		ask: () => ({}) as never,
	});
	return JSON.parse(result as string);
}

describe("rune_context", () => {
	it("returns empty state for a fresh project", async () => {
		const r = await callContext({});
		expect(r.project).not.toBeNull();
		expect(r.current_session).toBeNull();
		expect(r.recent_memories).toEqual([]);
		expect(r.relevant_memories).toEqual([]);
	});

	it("returns recent memories ordered by created_at DESC", async () => {
		repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "first",
			what: "w1",
		});
		await new Promise((r) => setTimeout(r, 2));
		repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "second",
			what: "w2",
		});
		const r = await callContext({});
		expect(r.recent_memories.length).toBe(2);
		const titles = (r.recent_memories as { title: string }[]).map((m) => m.title);
		expect(titles[0]).toBe("second");
	});

	it("returns relevant memories when query is provided", async () => {
		repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "Use DDD for payments",
			what: "We chose DDD",
		});
		repo.saveMemory({
			projectId: deps.projectId,
			category: "corrections",
			title: "Never use any",
			what: "Avoid the any type",
		});
		const r = await callContext({ query: "payments" });
		expect(r.relevant_memories.length).toBeGreaterThan(0);
	});

	it("excludes soft-deleted memories from recent", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "Unique Phrase Theta",
			what: "content",
		});
		repo.softDeleteMemory(m.id);
		const r = await callContext({ query: "Theta" });
		expect(r.relevant_memories).toEqual([]);
	});

	it("returns active session when one is open", async () => {
		const s = repo.startSession(deps.projectId, "opencode");
		const r = await callContext({});
		expect((r.current_session as { id: string }).id).toBe(s.id);
	});
});

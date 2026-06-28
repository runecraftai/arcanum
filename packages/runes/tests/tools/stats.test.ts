import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createStatsTool } from "../../src/tools/stats";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-stats-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("stats-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "stats-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callStats(args: Record<string, unknown>): Promise<{
	total: number;
	by_category: Record<string, number>;
	last_activity_at: number | null;
}> {
	const t = createStatsTool(deps);
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

describe("rune_stats", () => {
	it("returns zeros on empty project", async () => {
		const r = await callStats({});
		expect(r.total).toBe(0);
		expect(r.last_activity_at).toBeNull();
	});

	it("counts by category", async () => {
		repo.saveMemory({ projectId: deps.projectId, category: "decisions", title: "a", what: "x" });
		repo.saveMemory({ projectId: deps.projectId, category: "decisions", title: "b", what: "y" });
		repo.saveMemory({ projectId: deps.projectId, category: "corrections", title: "c", what: "z" });
		const r = await callStats({});
		expect(r.total).toBe(3);
		expect(r.by_category.decisions).toBe(2);
		expect(r.by_category.corrections).toBe(1);
	});

	it("excludes soft-deleted memories", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "a",
			what: "x",
		});
		repo.softDeleteMemory(m.id);
		const r = await callStats({});
		expect(r.total).toBe(0);
	});

	it("last_activity_at is the max created_at", async () => {
		repo.saveMemory({ projectId: deps.projectId, category: "decisions", title: "a", what: "x" });
		const r = await callStats({});
		expect(r.last_activity_at).not.toBeNull();
	});
});

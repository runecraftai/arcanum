import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createDeleteTool } from "../../src/tools/delete";
import { createGetTool } from "../../src/tools/get";
import { createSearchTool } from "../../src/tools/search";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-delete-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("delete-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "delete-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callDelete(args: Record<string, unknown>): Promise<{ ok: boolean; soft_deleted_at?: number; error?: { code: string } }> {
	const t = createDeleteTool(deps);
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

async function callGet(args: Record<string, unknown>): Promise<{ ok: boolean }> {
	const t = createGetTool(deps);
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

async function callSearch(args: Record<string, unknown>): Promise<{ results: unknown[]; total: number }> {
	const t = createSearchTool(deps);
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

describe("rune_delete", () => {
	it("soft-deletes a memory and returns ok", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		const result = await callDelete({ id: m.id });
		expect(result.ok).toBe(true);
		expect(typeof result.soft_deleted_at).toBe("number");
	});

	it("subsequent get returns NOT_FOUND", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		await callDelete({ id: m.id });
		const got = await callGet({ id: m.id });
		expect(got.ok).toBe(false);
	});

	it("subsequent search excludes the deleted memory", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "Unique Phrase Omega",
			what: "unique content for soft delete test",
		});
		await callDelete({ id: m.id });
		const { results, total } = await callSearch({ query: "Omega" });
		expect(results).toEqual([]);
		expect(total).toBe(0);
	});

	it("returns NOT_FOUND for missing id", async () => {
		const result = await callDelete({ id: "missing" });
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("NOT_FOUND");
	});
});

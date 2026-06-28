import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createGetTool } from "../../src/tools/get";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-get-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("get-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "get-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callGet(args: Record<string, unknown>): Promise<{ ok: boolean; memory?: unknown; error?: { code: string } }> {
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

describe("rune_get", () => {
	it("returns the memory when found", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		const result = await callGet({ id: m.id });
		expect(result.ok).toBe(true);
		expect((result.memory as { id: string }).id).toBe(m.id);
	});

	it("returns NOT_FOUND when missing", async () => {
		const result = await callGet({ id: "missing-id" });
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("NOT_FOUND");
	});

	it("returns NOT_FOUND for soft-deleted memory", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		repo.softDeleteMemory(m.id);
		const result = await callGet({ id: m.id });
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("NOT_FOUND");
	});
});

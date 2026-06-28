import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createSaveTool } from "../../src/tools/save";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let projectId: number;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-save-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("save-test", "/tmp/test", null);
	projectId = project.id;
	deps = { repository: repo, projectSlug: "save-test", projectId };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callSave(args: Record<string, unknown>): Promise<{ ok: boolean; memory?: unknown; error?: { code: string; message: string } }> {
	const t = createSaveTool(deps);
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

describe("rune_save", () => {
	it("happy path with all fields", async () => {
		const result = await callSave({
			category: "decisions",
			title: "Use DDD",
			what: "We chose DDD",
			why: "Complex domain",
			where_ref: "src/payments/",
			learned: "Bounded contexts help",
			importance: 8,
		});
		expect(result.ok).toBe(true);
		expect((result.memory as { id: string }).id).toBeTruthy();
	});

	it("minimal path with only required fields", async () => {
		const result = await callSave({
			category: "corrections",
			title: "Avoid any",
			what: "We don't use any",
		});
		expect(result.ok).toBe(true);
	});

	it("rejects empty what (E-6)", async () => {
		const result = await callSave({
			category: "decisions",
			title: "t",
			what: "",
		});
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("EMPTY_WHAT");
	});

	it("rejects invalid category (E-7)", async () => {
		const result = await callSave({
			category: "bogus",
			title: "t",
			what: "w",
		});
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("INVALID_CATEGORY");
	});

	it("clamps importance to [1,10] (E-9)", async () => {
		const lo = await callSave({ category: "decisions", title: "t", what: "w", importance: 0 });
		const hi = await callSave({ category: "decisions", title: "t", what: "w", importance: 11 });
		expect(lo.ok).toBe(true);
		expect(hi.ok).toBe(true);
		const loMem = lo.memory as { importance: number };
		const hiMem = hi.memory as { importance: number };
		expect(loMem.importance).toBe(1);
		expect(hiMem.importance).toBe(10);
	});
});

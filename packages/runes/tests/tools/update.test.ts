import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createUpdateTool } from "../../src/tools/update";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-update-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("update-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "update-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callUpdate(
	args: Record<string, unknown>,
): Promise<{ ok: boolean; memory?: unknown; error?: { code: string } }> {
	const t = createUpdateTool(deps);
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

describe("rune_update", () => {
	it("updates a single field", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "old",
			what: "w",
		});
		const result = await callUpdate({ id: m.id, title: "new" });
		expect(result.ok).toBe(true);
		expect((result.memory as { title: string }).title).toBe("new");
	});

	it("returns NOT_FOUND when missing", async () => {
		const result = await callUpdate({ id: "missing", title: "x" });
		expect(result.ok).toBe(false);
		expect(result.error?.code).toBe("NOT_FOUND");
	});

	it("clamps importance on update", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		const result = await callUpdate({ id: m.id, importance: 99 });
		expect(result.ok).toBe(true);
		expect((result.memory as { importance: number }).importance).toBe(10);
	});
});

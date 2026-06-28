import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createSessionEndTool } from "../../src/tools/session-end";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-send-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("send-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "send-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callEnd(args: Record<string, unknown>): Promise<{ ok: boolean; error?: { code: string } }> {
	const t = createSessionEndTool(deps);
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

describe("rune_session_end", () => {
	it("ends a session with summary", async () => {
		const s = repo.startSession(deps.projectId, "opencode");
		const r = await callEnd({ session_id: s.id, summary: "did things" });
		expect(r.ok).toBe(true);
	});

	it("ends a session without summary", async () => {
		const s = repo.startSession(deps.projectId, "opencode");
		const r = await callEnd({ session_id: s.id });
		expect(r.ok).toBe(true);
	});

	it("returns NOT_FOUND for missing session", async () => {
		const r = await callEnd({ session_id: "missing" });
		expect(r.ok).toBe(false);
		expect(r.error?.code).toBe("NOT_FOUND");
	});
});

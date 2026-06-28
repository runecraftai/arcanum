import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createSessionStartTool } from "../../src/tools/session-start";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-sstart-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("sstart-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "sstart-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callStart(
	args: Record<string, unknown>,
): Promise<{ session_id: string; started_at: number; reused?: boolean }> {
	const t = createSessionStartTool(deps);
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

describe("rune_session_start", () => {
	it("starts a session", async () => {
		const r = await callStart({ agent: "opencode" });
		expect(r.session_id).toBeTruthy();
		expect(r.reused).toBe(false);
	});

	it("reuses an active session for the same agent", async () => {
		const first = await callStart({ agent: "opencode" });
		const second = await callStart({ agent: "opencode" });
		expect(second.session_id).toBe(first.session_id);
		expect(second.reused).toBe(true);
	});

	it("starts a new session after the previous one is ended", async () => {
		const first = await callStart({ agent: "opencode" });
		repo.endSession(first.session_id);
		const second = await callStart({ agent: "opencode" });
		expect(second.session_id).not.toBe(first.session_id);
	});
});

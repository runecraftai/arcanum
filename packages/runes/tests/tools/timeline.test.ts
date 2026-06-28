import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createTimelineTool } from "../../src/tools/timeline";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-timeline-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("tl-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "tl-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

async function callTimeline(
	args: Record<string, unknown>,
): Promise<{ sessions: Array<{ id: string; started_at: number }> }> {
	const t = createTimelineTool(deps);
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

describe("rune_timeline", () => {
	it("returns empty list when no sessions", async () => {
		const r = await callTimeline({});
		expect(r.sessions).toEqual([]);
	});

	it("returns sessions ordered by started_at DESC", async () => {
		const a = repo.startSession(deps.projectId, "opencode");
		await new Promise((r) => setTimeout(r, 2));
		const b = repo.startSession(deps.projectId, "opencode");
		const r = await callTimeline({});
		expect(r.sessions.length).toBe(2);
		expect(r.sessions[0].id).toBe(b.id);
		expect(r.sessions[1].id).toBe(a.id);
	});

	it("respects limit", async () => {
		for (let i = 0; i < 5; i++) {
			repo.startSession(deps.projectId, "opencode");
		}
		const r = await callTimeline({ limit: 3 });
		expect(r.sessions.length).toBe(3);
	});
});

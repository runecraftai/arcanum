import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/db/client";
import { Repository } from "../../src/db/repository";
import { createSearchTool } from "../../src/tools/search";
import type { Database } from "../../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let deps: { repository: Repository; projectSlug: string; projectId: number };

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-search-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("search-test", "/tmp/test", null);
	deps = { repository: repo, projectSlug: "search-test", projectId: project.id };
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

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

describe("rune_search", () => {
	beforeEach(() => {
		repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "Use DDD for payments",
			what: "We chose Domain-Driven Design for the payments service",
		});
		repo.saveMemory({
			projectId: deps.projectId,
			category: "corrections",
			title: "Never use any",
			what: "Avoid the any type in TypeScript code",
		});
		repo.saveMemory({
			projectId: deps.projectId,
			category: "architecture",
			title: "Hexagonal layers",
			what: "Domain layer at the center, infrastructure at the edge",
		});
	});

	it("matches keyword in title", async () => {
		const { results, total } = await callSearch({ query: "payments" });
		expect(total).toBeGreaterThan(0);
		expect((results[0] as { title: string }).title).toContain("payments");
	});

	it("matches keyword in what", async () => {
		const { results } = await callSearch({ query: "TypeScript" });
		expect(results.length).toBeGreaterThan(0);
	});

	it("filters by category", async () => {
		const { results } = await callSearch({ query: "use", category: "corrections" });
		expect(results.length).toBeGreaterThan(0);
		expect((results[0] as { category: string }).category).toBe("corrections");
	});

	it("respects limit", async () => {
		const { results } = await callSearch({ query: "the", limit: 1 });
		expect(results.length).toBeLessThanOrEqual(1);
	});

	it("excludes soft-deleted memories", async () => {
		const m = repo.saveMemory({
			projectId: deps.projectId,
			category: "decisions",
			title: "Unique Phrase Zeta",
			what: "unique content for soft delete test",
		});
		repo.softDeleteMemory(m.id);
		const { results, total } = await callSearch({ query: "Zeta" });
		expect(results).toEqual([]);
		expect(total).toBe(0);
	});

	it("returns zero results when nothing matches (E-8)", async () => {
		const { results, total } = await callSearch({ query: "nosuchwordxyz123" });
		expect(results).toEqual([]);
		expect(total).toBe(0);
	});
});

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../src/db/client";
import { Repository, ValidationError } from "../src/db/repository";
import type { Database } from "../src/db/client";

let sandbox = "";
let db: Database;
let repo: Repository;
let projectId: number;

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-repo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	db = openDatabase(sandbox);
	repo = new Repository(db);
	const project = repo.getOrCreateProject("test-slug", "/tmp/test", "https://github.com/foo/bar.git");
	projectId = project.id;
});

afterEach(() => {
	db.close();
	rmSync(sandbox, { recursive: true, force: true });
});

describe("Repository.getOrCreateProject", () => {
	it("creates a project when missing", () => {
		const created = repo.getOrCreateProject("new", "/tmp/new", null);
		expect(created.id).toBeGreaterThan(0);
		expect(created.slug).toBe("new");
	});

	it("returns the existing project on duplicate slug", () => {
		const first = repo.getOrCreateProject("dup", "/x", null);
		const second = repo.getOrCreateProject("dup", "/x", null);
		expect(second.id).toBe(first.id);
	});

	it("find by slug returns the project", () => {
		const p = repo.getProjectBySlug("test-slug");
		expect(p).not.toBeNull();
		expect(p?.id).toBe(projectId);
	});
});

describe("Repository.saveMemory", () => {
	it("creates a memory with required fields", () => {
		const m = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "Use DDD",
			what: "We chose DDD for the payments service",
		});
		expect(m.id).toBeTruthy();
		expect(m.category).toBe("decisions");
		expect(m.importance).toBe(5);
		expect(m.soft_deleted).toBe(0);
	});

	it("rejects empty title", () => {
		expect(() =>
			repo.saveMemory({ projectId, category: "decisions", title: "", what: "x" }),
		).toThrow(ValidationError);
	});

	it("rejects empty what (E-6)", () => {
		expect(() =>
			repo.saveMemory({ projectId, category: "decisions", title: "t", what: "" }),
		).toThrow(ValidationError);
	});

	it("rejects invalid category (E-7)", () => {
		expect(() =>
			repo.saveMemory({
				projectId,
				// @ts-expect-error — invalid on purpose
				category: "bogus",
				title: "t",
				what: "w",
			}),
		).toThrow(ValidationError);
	});

	it("clamps importance to [1,10] (E-9)", () => {
		const lo = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "low",
			what: "x",
			importance: 0,
		});
		const hi = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "high",
			what: "x",
			importance: 11,
		});
		expect(lo.importance).toBe(1);
		expect(hi.importance).toBe(10);
	});

	it("attaches session_id when provided", () => {
		const session = repo.startSession(projectId, "opencode");
		const m = repo.saveMemory({
			projectId,
			sessionId: session.id,
			category: "learnings",
			title: "t",
			what: "w",
		});
		expect(m.session_id).toBe(session.id);
	});
});

describe("Repository.searchMemories", () => {
	beforeEach(() => {
		repo.saveMemory({
			projectId,
			category: "decisions",
			title: "Use DDD for payments",
			what: "We chose Domain-Driven Design for the payments service",
		});
		repo.saveMemory({
			projectId,
			category: "corrections",
			title: "Never use any",
			what: "Avoid the any type in TypeScript code",
		});
		repo.saveMemory({
			projectId,
			category: "architecture",
			title: "Hexagonal layers",
			what: "Domain layer at the center, infrastructure at the edge",
		});
	});

	it("matches keyword in title", () => {
		const { results, total } = repo.searchMemories({ projectId, query: "payments" });
		expect(results.length).toBeGreaterThan(0);
		expect(total).toBeGreaterThan(0);
	});

	it("matches keyword in what", () => {
		const { results } = repo.searchMemories({ projectId, query: "TypeScript" });
		expect(results.some((r) => r.title === "Never use any")).toBe(true);
	});

	it("filters by category", () => {
		const { results } = repo.searchMemories({
			projectId,
			query: "use",
			category: "corrections",
		});
		expect(results.every((r) => r.category === "corrections")).toBe(true);
	});

	it("respects limit", () => {
		const { results } = repo.searchMemories({ projectId, query: "the", limit: 1 });
		expect(results.length).toBeLessThanOrEqual(1);
	});

	it("returns zero results when nothing matches (E-8)", () => {
		const { results, total } = repo.searchMemories({ projectId, query: "nonsensicalxyz123" });
		expect(results).toEqual([]);
		expect(total).toBe(0);
	});
});

describe("Repository.getMemory", () => {
	it("returns the memory by id", () => {
		const m = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		const fetched = repo.getMemory(m.id);
		expect(fetched?.id).toBe(m.id);
	});

	it("returns null when missing", () => {
		expect(repo.getMemory("does-not-exist")).toBeNull();
	});
});

describe("Repository.updateMemory", () => {
	it("updates a single field and bumps updated_at", async () => {
		const m = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "old",
			what: "w",
		});
		await new Promise((r) => setTimeout(r, 2));
		const updated = repo.updateMemory(m.id, { title: "new" });
		expect(updated?.title).toBe("new");
		expect(updated?.updated_at).toBeGreaterThanOrEqual(m.updated_at);
	});

	it("returns null when not found", () => {
		expect(repo.updateMemory("missing", { title: "x" })).toBeNull();
	});

	it("clamps importance on update", () => {
		const m = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "t",
			what: "w",
		});
		const updated = repo.updateMemory(m.id, { importance: 99 });
		expect(updated?.importance).toBe(10);
	});
});

describe("Repository.softDeleteMemory", () => {
	it("soft-deletes and excludes from search", () => {
		const m = repo.saveMemory({
			projectId,
			category: "decisions",
			title: "Unique Keyword Phrase AlphaBeta",
			what: "Unique content for testing soft delete",
		});
		const result = repo.softDeleteMemory(m.id);
		expect(result.ok).toBe(true);

		const fetched = repo.getMemory(m.id);
		expect(fetched).toBeNull();

		const { results, total } = repo.searchMemories({ projectId, query: "AlphaBeta" });
		expect(results).toEqual([]);
		expect(total).toBe(0);
	});

	it("returns ok=false on missing id", () => {
		const result = repo.softDeleteMemory("missing");
		expect(result.ok).toBe(false);
	});
});

describe("Repository.sessions", () => {
	it("starts and ends a session with summary", () => {
		const s = repo.startSession(projectId, "opencode");
		expect(s.ended_at).toBeNull();
		const ok = repo.endSession(s.id, "did things");
		expect(ok).toBe(true);

		const sessions = repo.listSessions("test-slug");
		const found = sessions.find((x) => x.id === s.id);
		expect(found?.summary).toBe("did things");
		expect(found?.ended_at).not.toBeNull();
	});

	it("ends without summary", () => {
		const s = repo.startSession(projectId, "opencode");
		expect(repo.endSession(s.id)).toBe(true);
	});

	it("returns false when ending a non-existent session", () => {
		expect(repo.endSession("missing")).toBe(false);
	});

	it("findActiveSession returns the in-progress one", () => {
		const a = repo.startSession(projectId, "opencode");
		const b = repo.startSession(projectId, "opencode");
		repo.endSession(a.id);
		const active = repo.findActiveSession(projectId, "opencode");
		expect(active?.id).toBe(b.id);
	});
});

describe("Repository.stats", () => {
	it("returns zeros on an empty project", () => {
		const stats = repo.getStats("test-slug");
		expect(stats.total).toBe(0);
		expect(stats.last_activity_at).toBeNull();
	});

	it("counts by category and excludes soft-deleted", () => {
		repo.saveMemory({ projectId, category: "decisions", title: "a", what: "x" });
		repo.saveMemory({ projectId, category: "decisions", title: "b", what: "y" });
		const c = repo.saveMemory({ projectId, category: "corrections", title: "c", what: "z" });
		repo.softDeleteMemory(c.id);
		const stats = repo.getStats("test-slug");
		expect(stats.total).toBe(2);
		expect(stats.by_category.decisions).toBe(2);
		expect(stats.by_category.corrections).toBe(0);
	});

	it("last_activity_at is the max created_at", () => {
		repo.saveMemory({ projectId, category: "decisions", title: "a", what: "x" });
		const stats = repo.getStats("test-slug");
		expect(stats.last_activity_at).not.toBeNull();
	});
});

describe("Repository.purge and rebuild", () => {
	it("purgeSoftDeleted removes only soft-deleted rows", () => {
		const a = repo.saveMemory({ projectId, category: "decisions", title: "a", what: "x" });
		const b = repo.saveMemory({ projectId, category: "decisions", title: "b", what: "y" });
		repo.softDeleteMemory(a.id);
		const removed = repo.purgeSoftDeleted();
		expect(removed).toBe(1);
		expect(repo.getMemory(a.id)).toBeNull();
		expect(repo.getMemory(b.id)).not.toBeNull();
	});
});

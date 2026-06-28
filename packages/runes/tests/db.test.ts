import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrations";
import type { Database } from "../src/db/client";

let sandbox = "";
let db: Database;

function freshDb(): Database {
	const dir = join(sandbox, "case");
	mkdirSync(dir, { recursive: true });
	return openDatabase(dir);
}

describe("db/migrations", () => {
	beforeEach(() => {
		sandbox = join(tmpdir(), `runes-test-db-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(sandbox, { recursive: true });
		db = freshDb();
	});

	afterEach(() => {
		db.close();
		rmSync(sandbox, { recursive: true, force: true });
	});

	it("creates all expected tables", () => {
		const rows = db
			.prepare("SELECT name FROM sqlite_master WHERE type IN ('table') ORDER BY name")
			.all() as { name: string }[];
		const names = rows.map((r) => r.name);
		expect(names).toContain("projects");
		expect(names).toContain("sessions");
		expect(names).toContain("memories");
		expect(names).toContain("memories_fts");
	});

	it("creates FTS triggers", () => {
		const rows = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name")
			.all() as { name: string }[];
		const names = rows.map((r) => r.name);
		expect(names).toContain("memories_ai");
		expect(names).toContain("memories_ad");
		expect(names).toContain("memories_au");
	});

	it("is idempotent (run twice without error)", () => {
		expect(() => runMigrations(db)).not.toThrow();
	});

	it("keeps memories_fts in sync after inserts and updates", () => {
		const project = db
			.prepare("INSERT INTO projects (slug, root_path, remote_url, created_at) VALUES (?, ?, ?, ?)")
			.run("p", "/x", null, Date.now());
		const projectId = Number(project.lastInsertRowid);
		for (let i = 0; i < 10; i++) {
			db.prepare(
				`INSERT INTO memories
				(id, project_id, session_id, category, title, what, why, where_ref, learned, importance, soft_deleted, created_at, updated_at)
				VALUES (?, ?, NULL, 'decisions', ?, ?, NULL, NULL, NULL, 5, 0, ?, ?)`,
			).run(`id-${i}`, projectId, `title-${i}`, `what-${i}`, Date.now(), Date.now());
		}
		const liveCount = (db.prepare("SELECT COUNT(*) AS c FROM memories WHERE soft_deleted = 0").get() as { c: number }).c;
		const ftsCount = (db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number }).c;
		expect(liveCount).toBe(10);
		expect(ftsCount).toBe(10);

		// Update one — should keep FTS in sync.
		db.prepare("UPDATE memories SET what = ? WHERE id = ?").run("updated content", "id-0");
		const ftsAfterUpdate = (db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number }).c;
		expect(ftsAfterUpdate).toBe(10);

		// Soft delete — should remove from FTS via trigger.
		db.prepare("UPDATE memories SET soft_deleted = 1 WHERE id = ?").run("id-0");
		const ftsAfterSoft = (db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number }).c;
		expect(ftsAfterSoft).toBe(9);
	});

	it("rebuildFts recovers from drift", async () => {
		const { Repository } = await import("../src/db/repository");
		const project = db
			.prepare("INSERT INTO projects (slug, root_path, remote_url, created_at) VALUES (?, ?, ?, ?)")
			.run("p", "/x", null, Date.now());
		const projectId = Number(project.lastInsertRowid);
		for (let i = 0; i < 5; i++) {
			db.prepare(
				`INSERT INTO memories
				(id, project_id, session_id, category, title, what, why, where_ref, learned, importance, soft_deleted, created_at, updated_at)
				VALUES (?, ?, NULL, 'decisions', ?, ?, NULL, NULL, NULL, 5, 0, ?, ?)`,
			).run(`id-${i}`, projectId, `title-${i}`, `what-${i}`, Date.now(), Date.now());
		}
		const firstRow = db
			.prepare("SELECT rowid FROM memories WHERE id = ?")
			.get("id-2") as { rowid: number } | undefined;
		expect(firstRow).toBeDefined();
		db.prepare("DELETE FROM memories_fts WHERE rowid = ?").run(firstRow!.rowid);
		expect(
			(db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number }).c,
		).toBe(4);

		const repo = new Repository(db);
		repo.rebuildFts();
		expect(
			(db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number }).c,
		).toBe(5);
	});

	it("openDatabase creates the file when missing", () => {
		expect(existsSync(join(sandbox, "case", "runes.db"))).toBe(true);
	});
});

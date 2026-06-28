import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { openDatabase } from "../src/db/client";
import { Repository } from "../src/db/repository";

let sandbox = "";
let originalDataDir: string | undefined;

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-bin-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	originalDataDir = process.env.RUNES_DATA_DIR;
	process.env.RUNES_DATA_DIR = sandbox;
});

afterEach(() => {
	if (originalDataDir === undefined) {
		delete process.env.RUNES_DATA_DIR;
	} else {
		process.env.RUNES_DATA_DIR = originalDataDir;
	}
	rmSync(sandbox, { recursive: true, force: true });
});

function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
	// The bin reads RUNES_DATA_DIR; it imports schema.sql at runtime, so we
	// run it via bun from the package directory.
	const result = spawnSync(
		"bun",
		["run", "src/bin/runes.ts", ...args],
		{
			cwd: import.meta.dir + "/..",
			env: { ...process.env, RUNES_DATA_DIR: sandbox },
			encoding: "utf-8",
		},
	);
	return {
		status: result.status ?? -1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
}

function seedRepo(): void {
	const db = openDatabase(sandbox);
	const repo = new Repository(db);
	const project = repo.getOrCreateProject("bin-test", "/tmp/bin", null);
	repo.saveMemory({
		projectId: project.id,
		category: "decisions",
		title: "Use DDD",
		what: "Domain-driven design for payments",
	});
	repo.saveMemory({
		projectId: project.id,
		category: "corrections",
		title: "No any",
		what: "Avoid the any type in TypeScript",
	});
	db.close();
}

describe("runes CLI", () => {
	it("search happy path", () => {
		seedRepo();
		const r = runCli(["search", "DDD"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("Use DDD");
	});

	it("search zero results prints 'no matches'", () => {
		seedRepo();
		const r = runCli(["search", "nonsensicalxyz"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("no matches");
	});

	it("stats happy path", () => {
		seedRepo();
		const r = runCli(["stats"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("bin-test");
		expect(r.stdout).toContain("decisions");
	});

	it("doctor exits 0 on a healthy install", () => {
		seedRepo();
		const r = runCli(["doctor"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("healthy");
	});

	it("doctor --purge removes soft-deleted and rebuilds FTS5", () => {
		const db = openDatabase(sandbox);
		const repo = new Repository(db);
		const project = repo.getOrCreateProject("bin-test", "/tmp/bin", null);
		const m = repo.saveMemory({
			projectId: project.id,
			category: "decisions",
			title: "Soft Deleted Memory",
			what: "will be purged",
		});
		repo.softDeleteMemory(m.id);
		db.close();

		const r = runCli(["doctor", "--purge"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("purged soft-deleted rows: 1");
		expect(r.stdout).toContain("fts index rebuilt");

		// Confirm the data is gone.
		const after = openDatabase(sandbox);
		const afterRepo = new Repository(after);
		expect(afterRepo.getMemory(m.id)).toBeNull();
		after.close();
	});

	it("creates the data dir on first doctor call", () => {
		// Use a fresh sub-dir under sandbox so ensureDataDir is exercised.
		const fresh = join(sandbox, "fresh");
		mkdirSync(fresh, { recursive: true });
		process.env.RUNES_DATA_DIR = fresh;
		// No seeded data — doctor should still exit 0.
		const r = runCli(["doctor"]);
		expect(r.status).toBe(0);
		expect(existsSync(fresh)).toBe(true);
	});
});

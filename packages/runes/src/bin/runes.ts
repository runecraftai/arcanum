#!/usr/bin/env node
import { loadDatabaseSync } from "../db/sqlite";
import { Repository } from "../db/repository";
import { resolveDataDir, ensureDataDir } from "../lib/paths";
import { runMigrations } from "../db/migrations";

const MAX_TITLE_LENGTH = 60;
const SEARCH_LIMIT = 20;
const NODE_MAJOR_MIN = 22;
const HELP_TEXT = `runes — inspect your project's memory

Usage:
  runes search <query>      Search memories (prints a markdown table)
  runes stats               Show per-category counts
  runes doctor [--purge]    Check the install; with --purge, hard-delete soft-deleted rows
  runes help                Show this help
`;

function printHelp(): void {
	console.log(HELP_TEXT);
}

function formatDate(ms: number): string {
	return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
}

function truncate(value: string, max: number): string {
	return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function openRepo(): { repo: Repository; close: () => void } {
	const dataDir = resolveDataDir();
	const DatabaseSync = loadDatabaseSync();
	const db = new DatabaseSync(`${dataDir}/runes.db`);
	db.exec("PRAGMA journal_mode = WAL");
	db.exec("PRAGMA foreign_keys = ON");
	runMigrations(db);
	const repo = new Repository(db);
	return { repo, close: () => db.close() };
}

function probeSqlite(): { ok: boolean; error?: string } {
	try {
		const Ctor = loadDatabaseSync() as new (path: string) => {
			exec: (sql: string) => void;
			close: () => void;
		};
		const probe = new Ctor(":memory:");
		probe.exec("CREATE VIRTUAL TABLE _probe USING fts5(x)");
		probe.close();
		return { ok: true };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : String(err) };
	}
}

function cmdSearch(query: string): void {
	const { repo, close } = openRepo();
	try {
		const rows = repo.searchAllProjects(query, SEARCH_LIMIT);
		if (rows.length === 0) {
			console.log("no matches");
			return;
		}
		console.log("| # | project | category | title | created_at |");
		console.log("| - | ------- | -------- | ----- | ---------- |");
		rows.forEach((r, i) => {
			const title = truncate(r.title, MAX_TITLE_LENGTH);
			console.log(
				`| ${i + 1} | ${r.project_slug} | ${r.category} | ${title} | ${formatDate(r.created_at)} |`,
			);
		});
	} finally {
		close();
	}
}

function cmdStats(): void {
	const { repo, close } = openRepo();
	try {
		const allProjects = repo.listProjects();
		if (allProjects.length === 0) {
			console.log("no projects yet");
			return;
		}
		let grandTotal = 0;
		for (const p of allProjects) {
			const s = repo.getStats(p.slug);
			console.log(`\n# ${p.slug}`);
			console.log(`  total: ${s.total}`);
			console.log(`  last activity: ${s.last_activity_at ? formatDate(s.last_activity_at) : "—"}`);
			for (const cat of Object.keys(s.by_category) as (keyof typeof s.by_category)[]) {
				const c = s.by_category[cat];
				if (c > 0) {
					console.log(`  ${cat}: ${c}`);
					grandTotal += c;
				}
			}
		}
		console.log(`\ngrand total: ${grandTotal}`);
	} finally {
		close();
	}
}

function reportDriftAndRebuild(repo: Repository, purge: boolean): { ok: boolean } {
	const memCount = repo.memoriesRowCount();
	const ftsCount = repo.ftsRowCount();
	console.log(`memories (live): ${memCount}`);
	console.log(`memories_fts:    ${ftsCount}`);

	if (memCount !== ftsCount) {
		console.log(`\nDrift detected. Run \`runes doctor --purge\` to rebuild.`);
		if (!purge) return { ok: false };
		repo.rebuildFts();
		console.log(`rebuilt memories_fts: ${repo.ftsRowCount()}`);
	}

	if (purge) {
		const removed = repo.purgeSoftDeleted();
		console.log(`purged soft-deleted rows: ${removed}`);
		repo.rebuildFts();
		console.log("fts index rebuilt");
	}

	return { ok: true };
}

async function cmdDoctor(purge: boolean): Promise<number> {
	const nodeVersion = process.versions.node;
	const nodeMajor = Number.parseInt(nodeVersion.split(".")[0] ?? "0", 10);
	if (nodeMajor < NODE_MAJOR_MIN) {
		console.error(`runes: Node >= ${NODE_MAJOR_MIN} required (you have ${nodeVersion}).`);
		console.error("Upgrade Node and re-run.");
		return 1;
	}

	const probe = probeSqlite();
	if (!probe.ok) {
		console.error(`runes: node:sqlite / FTS5 unavailable: ${probe.error}`);
		return 1;
	}

	const dataDir = await ensureDataDir();
	console.log(`data dir: ${dataDir}`);

	const { repo, close } = openRepo();
	try {
		const { ok } = reportDriftAndRebuild(repo, purge);
		if (!ok) return 1;
		console.log("\nrunes: healthy");
		return 0;
	} finally {
		close();
	}
}

async function dispatch(args: string[]): Promise<number> {
	const sub = args[0];

	if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
		printHelp();
		return 0;
	}

	if (sub === "search") {
		const query = args.slice(1).join(" ").trim();
		if (!query) {
			console.error("runes: search requires a query");
			return 1;
		}
		cmdSearch(query);
		return 0;
	}

	if (sub === "stats") {
		cmdStats();
		return 0;
	}

	if (sub === "doctor") {
		return cmdDoctor(args.includes("--purge"));
	}

	console.error(`runes: unknown subcommand '${sub}'`);
	printHelp();
	return 1;
}

dispatch(process.argv.slice(2)).then(
	(code) => process.exit(code),
	(err) => {
		console.error(err);
		process.exit(1);
	},
);

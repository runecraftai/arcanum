import { join } from "node:path";
import { runMigrations } from "./migrations";
import { loadDatabaseSync } from "./sqlite";

export type Database = ReturnType<typeof loadDatabaseSync> extends new (p: string) => infer D
	? D
	: never;

export interface OpenDatabaseOptions {
	retryCount?: number;
	retryDelayMs?: number;
}

export function openDatabase(dataDir: string, options: OpenDatabaseOptions = {}): Database {
	const { retryCount = 1, retryDelayMs = 100 } = options;
	const dbPath = join(dataDir, "runes.db");
	const DatabaseSync = loadDatabaseSync();

	let lastError: unknown = null;
	for (let attempt = 0; attempt <= retryCount; attempt++) {
		try {
			const db = new DatabaseSync(dbPath);
			db.exec("PRAGMA journal_mode = WAL");
			db.exec("PRAGMA foreign_keys = ON");
			db.exec("PRAGMA busy_timeout = 5000");
			runMigrations(db);
			return db;
		} catch (error) {
			lastError = error;
			if (attempt < retryCount) {
				const until = Date.now() + retryDelayMs;
				while (Date.now() < until) {
					/* spin briefly */
				}
			}
		}
	}
	throw new Error(
		`runes: could not open database at ${dbPath}. ` +
			`Run \`runes doctor\` for diagnostics. ` +
			`Underlying error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
	);
}

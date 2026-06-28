import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSync } from "node:sqlite";

export const SCHEMA_VERSION = 1;

function loadSchema(): string {
	// Resolve relative to this file. Works both under src/ (ts) and dist/ (built).
	const here = dirname(fileURLToPath(import.meta.url));
	const candidates = [join(here, "schema.sql"), join(here, "..", "..", "src", "db", "schema.sql")];
	for (const candidate of candidates) {
		try {
			return readFileSync(candidate, "utf-8");
		} catch {
			// try next
		}
	}
	throw new Error("runes: could not locate schema.sql");
}

export function runMigrations(db: DatabaseSync): void {
	const schema = loadSchema();
	db.exec(schema);

	db.exec(
		`CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
	);
	db.prepare(
		`INSERT INTO schema_meta (key, value) VALUES ('version', ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
	).run(String(SCHEMA_VERSION));
}

// SQLite backend shim.
//
// In production (Node 22+), this uses `node:sqlite` (stable, no extra deps).
// In bun (used for `bun test`), this falls back to `bun:sqlite`, which is
// API-compatible for the subset we use (exec, prepare, close, run, all, get).
//
// The runtime target remains Node 22+ (see AD-002); bun is only for tests.

import type { DatabaseSync } from "node:sqlite";

export type DatabaseSyncCtor = new (path: string) => DatabaseSync;

let cached: DatabaseSyncCtor | null = null;

export function loadDatabaseSync(): DatabaseSyncCtor {
	if (cached) return cached;
	try {
		// Node 22+ (stable node:sqlite). Required in production.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const nodeSqlite = require("node:sqlite") as { DatabaseSync: DatabaseSyncCtor };
		cached = nodeSqlite.DatabaseSync;
		return cached;
	} catch {
		// bun fallback for `bun test`.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const bunSqlite = require("bun:sqlite") as { Database: DatabaseSyncCtor };
		cached = bunSqlite.Database;
		return cached;
	}
}

export type { DatabaseSync };

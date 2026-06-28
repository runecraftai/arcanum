import type { DatabaseSync } from "node:sqlite";

export type DatabaseSyncCtor = new (path: string) => DatabaseSync;

let cached: DatabaseSyncCtor | null = null;

function loadFromNode(): DatabaseSyncCtor {
	const nodeSqlite = require("node:sqlite") as { DatabaseSync: DatabaseSyncCtor };
	return nodeSqlite.DatabaseSync;
}

function loadFromBun(): DatabaseSyncCtor {
	const bunSqlite = require("bun:sqlite") as { Database: DatabaseSyncCtor };
	return bunSqlite.Database;
}

export function loadDatabaseSync(): DatabaseSyncCtor {
	if (cached) return cached;
	cached = isBun() ? loadFromBun() : loadFromNode();
	return cached;
}

function isBun(): boolean {
	return typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";
}

export type { DatabaseSync };

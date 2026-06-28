import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { z } from "zod";
import type { Database } from "./client";
import { type Memory, type MemoryCategory, type Project, type Session, type Stats } from "./types";
import { MEMORY_CATEGORIES } from "./types";

export const MemoryCategorySchema = z.enum(
	MEMORY_CATEGORIES as unknown as [MemoryCategory, ...MemoryCategory[]],
);

const ImportanceSchema = z.number().int();

export interface SaveMemoryInput {
	projectId: number;
	sessionId?: string | null;
	category: MemoryCategory;
	title: string;
	what: string;
	why?: string | null;
	whereRef?: string | null;
	learned?: string | null;
	importance?: number;
}

export interface SearchMemoryInput {
	projectId: number;
	query: string;
	category?: MemoryCategory;
	limit?: number;
}

export interface UpdateMemoryInput {
	title?: string;
	what?: string;
	why?: string | null;
	whereRef?: string | null;
	learned?: string | null;
	importance?: number;
}

function nowMs(): number {
	return Date.now();
}

function clampImportance(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) return 5;
	return Math.min(10, Math.max(1, Math.floor(value)));
}

function generateId(): string {
	return randomUUID();
}

function rowToMemory(row: Record<string, unknown>): Memory {
	return {
		id: row.id as string,
		project_id: row.project_id as number,
		session_id: (row.session_id as string | null) ?? null,
		category: row.category as MemoryCategory,
		title: row.title as string,
		what: row.what as string,
		why: (row.why as string | null) ?? null,
		where_ref: (row.where_ref as string | null) ?? null,
		learned: (row.learned as string | null) ?? null,
		importance: row.importance as number,
		soft_deleted: (row.soft_deleted as 0 | 1) ?? 0,
		created_at: row.created_at as number,
		updated_at: row.updated_at as number,
	};
}

function rowToSession(row: Record<string, unknown>): Session {
	return {
		id: row.id as string,
		project_id: row.project_id as number,
		agent: row.agent as string,
		started_at: row.started_at as number,
		ended_at: (row.ended_at as number | null) ?? null,
		summary: (row.summary as string | null) ?? null,
	};
}

export class Repository {
	constructor(private readonly db: Database) {}

	getOrCreateProject(slug: string, rootPath: string, remoteUrl: string | null = null): Project {
		const existing = this.db
			.prepare("SELECT * FROM projects WHERE slug = ?")
			.get(slug) as Record<string, unknown> | undefined;
		if (existing) {
			return {
				id: existing.id as number,
				slug: existing.slug as string,
				root_path: existing.root_path as string,
				remote_url: (existing.remote_url as string | null) ?? null,
				created_at: existing.created_at as number,
			};
		}
		const createdAt = nowMs();
		const result = this.db
			.prepare(
				"INSERT INTO projects (slug, root_path, remote_url, created_at) VALUES (?, ?, ?, ?)",
			)
			.run(slug, rootPath, remoteUrl, createdAt);
		const id = Number(result.lastInsertRowid);
		return { id, slug, root_path: rootPath, remote_url: remoteUrl, created_at: createdAt };
	}

	getProjectBySlug(slug: string): Project | null {
		const row = this.db.prepare("SELECT * FROM projects WHERE slug = ?").get(slug) as
			| Record<string, unknown>
			| undefined;
		if (!row) return null;
		return {
			id: row.id as number,
			slug: row.slug as string,
			root_path: row.root_path as string,
			remote_url: (row.remote_url as string | null) ?? null,
			created_at: row.created_at as number,
		};
	}

	startSession(projectId: number, agent: string): Session {
		const id = generateId();
		const startedAt = nowMs();
		this.db
			.prepare(
				"INSERT INTO sessions (id, project_id, agent, started_at) VALUES (?, ?, ?, ?)",
			)
			.run(id, projectId, agent, startedAt);
		return {
			id,
			project_id: projectId,
			agent,
			started_at: startedAt,
			ended_at: null,
			summary: null,
		};
	}

	endSession(sessionId: string, summary?: string | null): boolean {
		const endedAt = nowMs();
		const result = this.db
			.prepare("UPDATE sessions SET ended_at = ?, summary = ? WHERE id = ?")
			.run(endedAt, summary ?? null, sessionId);
		return result.changes > 0;
	}

	saveMemory(input: SaveMemoryInput): Memory {
		const categoryParsed = MemoryCategorySchema.safeParse(input.category);
		if (!categoryParsed.success) {
			throw new ValidationError("INVALID_CATEGORY", `category must be one of: ${MEMORY_CATEGORIES.join(", ")}`);
		}
		if (!input.title || input.title.trim().length === 0) {
			throw new ValidationError("EMPTY_TITLE", "title is required and cannot be empty");
		}
		if (input.title.length > 200) {
			throw new ValidationError("TITLE_TOO_LONG", "title must be at most 200 characters");
		}
		if (!input.what || input.what.trim().length === 0) {
			throw new ValidationError("EMPTY_WHAT", "what is required and cannot be empty");
		}
		if (input.what.length > 4000) {
			throw new ValidationError("WHAT_TOO_LONG", "what must be at most 4000 characters");
		}
		if (typeof input.importance === "number") {
			ImportanceSchema.parse(input.importance);
		}

		const id = generateId();
		const now = nowMs();
		const importance = clampImportance(input.importance);
		this.db
			.prepare(
				`INSERT INTO memories
				(id, project_id, session_id, category, title, what, why, where_ref, learned, importance, soft_deleted, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
			)
			.run(
				id,
				input.projectId,
				input.sessionId ?? null,
				categoryParsed.data,
				input.title,
				input.what,
				input.why ?? null,
				input.whereRef ?? null,
				input.learned ?? null,
				importance,
				now,
				now,
			);
		return this.getMemory(id) as Memory;
	}

	searchMemories(input: SearchMemoryInput): { results: Memory[]; total: number } {
		const limit = Math.min(100, Math.max(1, input.limit ?? 20));
		const query = input.query.trim();
		if (query.length === 0) {
			return { results: [], total: 0 };
		}

		const ftsQuery = query.replace(/"/g, '""');
		const categoryFilter = input.category
			? "AND m.category = ?"
			: "";
		const params: SQLInputValue[] = [`\"${ftsQuery}\"`, input.projectId];
		if (input.category) {
			params.push(input.category);
		}
		params.push(limit);

		const rows = this.db
			.prepare(
				`SELECT m.* FROM memories m
				 INNER JOIN memories_fts f ON f.rowid = m.rowid
				 WHERE memories_fts MATCH ? AND m.project_id = ? AND m.soft_deleted = 0 ${categoryFilter}
				 ORDER BY rank
				 LIMIT ?`,
			)
			.all(...params) as Record<string, unknown>[];

		const totalRow = this.db
			.prepare(
				`SELECT COUNT(*) AS c FROM memories_fts f
				 INNER JOIN memories m ON m.rowid = f.rowid
				 WHERE memories_fts MATCH ? AND m.project_id = ? AND m.soft_deleted = 0 ${categoryFilter}`,
			)
			.get(...(input.category ? [`\"${ftsQuery}\"`, input.projectId, input.category] : [`\"${ftsQuery}\"`, input.projectId])) as { c: number };

		return {
			results: rows.map(rowToMemory),
			total: totalRow.c,
		};
	}

	getMemory(id: string): Memory | null {
		const row = this.db
			.prepare("SELECT * FROM memories WHERE id = ? AND soft_deleted = 0")
			.get(id) as Record<string, unknown> | undefined;
		if (!row) return null;
		return rowToMemory(row);
	}

	updateMemory(id: string, fields: UpdateMemoryInput): Memory | null {
		const existing = this.db
			.prepare("SELECT id FROM memories WHERE id = ? AND soft_deleted = 0")
			.get(id) as { id: string } | undefined;
		if (!existing) return null;

		const updates: string[] = [];
		const params: SQLInputValue[] = [];

		if (fields.title !== undefined) {
			if (fields.title.length === 0 || fields.title.length > 200) {
				throw new ValidationError("INVALID_TITLE", "title must be 1-200 characters");
			}
			updates.push("title = ?");
			params.push(fields.title);
		}
		if (fields.what !== undefined) {
			if (fields.what.length === 0 || fields.what.length > 4000) {
				throw new ValidationError("INVALID_WHAT", "what must be 1-4000 characters");
			}
			updates.push("what = ?");
			params.push(fields.what);
		}
		if (fields.why !== undefined) {
			updates.push("why = ?");
			params.push(fields.why);
		}
		if (fields.whereRef !== undefined) {
			updates.push("where_ref = ?");
			params.push(fields.whereRef);
		}
		if (fields.learned !== undefined) {
			updates.push("learned = ?");
			params.push(fields.learned);
		}
		if (fields.importance !== undefined) {
			ImportanceSchema.parse(fields.importance);
			updates.push("importance = ?");
			params.push(clampImportance(fields.importance));
		}

		if (updates.length === 0) return this.getMemory(id);

		updates.push("updated_at = ?");
		params.push(nowMs());
		params.push(id);

		this.db.prepare(`UPDATE memories SET ${updates.join(", ")} WHERE id = ?`).run(...params);
		return this.getMemory(id);
	}

	softDeleteMemory(id: string): { ok: boolean; soft_deleted_at: number | null } {
		const now = nowMs();
		const result = this.db
			.prepare("UPDATE memories SET soft_deleted = 1, updated_at = ? WHERE id = ? AND soft_deleted = 0")
			.run(now, id);
		if (result.changes === 0) {
			return { ok: false, soft_deleted_at: null };
		}
		return { ok: true, soft_deleted_at: now };
	}

	listSessions(projectSlug: string, limit = 20): Session[] {
		const rows = this.db
			.prepare(
				`SELECT s.* FROM sessions s
				 INNER JOIN projects p ON p.id = s.project_id
				 WHERE p.slug = ?
				 ORDER BY s.started_at DESC
				 LIMIT ?`,
			)
			.all(projectSlug, limit) as Record<string, unknown>[];
		return rows.map(rowToSession);
	}

	listProjects(): Project[] {
		const rows = this.db
			.prepare("SELECT * FROM projects ORDER BY created_at DESC")
			.all() as Record<string, unknown>[];
		return rows.map((r) => ({
			id: r.id as number,
			slug: r.slug as string,
			root_path: r.root_path as string,
			remote_url: (r.remote_url as string | null) ?? null,
			created_at: r.created_at as number,
		}));
	}

	searchAllProjects(
		query: string,
		limit = 20,
	): Array<Memory & { project_slug: string }> {
		const ftsQuery = query.replace(/"/g, '""');
		const rows = this.db
			.prepare(
				`SELECT m.*, p.slug AS project_slug FROM memories m
				 INNER JOIN projects p ON p.id = m.project_id
				 INNER JOIN memories_fts f ON f.rowid = m.rowid
				 WHERE memories_fts MATCH ? AND m.soft_deleted = 0
				 ORDER BY rank
				 LIMIT ?`,
			)
			.all(`"${ftsQuery}"`, limit) as Record<string, unknown>[];
		return rows.map((r) => ({
			...rowToMemory(r),
			project_slug: r.project_slug as string,
		}));
	}

	findActiveSession(projectId: number, agent: string): Session | null {
		const row = this.db
			.prepare(
				"SELECT * FROM sessions WHERE project_id = ? AND agent = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
			)
			.get(projectId, agent) as Record<string, unknown> | undefined;
		return row ? rowToSession(row) : null;
	}

	getStats(projectSlug: string): Stats {
		const rows = this.db
			.prepare(
				`SELECT m.category, COUNT(*) AS c, MAX(m.created_at) AS last
				 FROM memories m
				 INNER JOIN projects p ON p.id = m.project_id
				 WHERE p.slug = ? AND m.soft_deleted = 0
				 GROUP BY m.category`,
			)
			.all(projectSlug) as { category: string; c: number; last: number | null }[];

		const by_category: Record<MemoryCategory, number> = {
			project_rules: 0,
			architecture: 0,
			constraints: 0,
			config_values: 0,
			naming: 0,
			decisions: 0,
			corrections: 0,
			learnings: 0,
		};

		let total = 0;
		let lastActivity: number | null = null;
		for (const r of rows) {
			if (MEMORY_CATEGORIES.includes(r.category as MemoryCategory)) {
				by_category[r.category as MemoryCategory] = r.c;
				total += r.c;
				if (r.last && (lastActivity === null || r.last > lastActivity)) {
					lastActivity = r.last;
				}
			}
		}

		return { total, by_category, last_activity_at: lastActivity };
	}

	recentMemories(projectId: number, limit = 10): Memory[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM memories WHERE project_id = ? AND soft_deleted = 0 ORDER BY created_at DESC LIMIT ?",
			)
			.all(projectId, limit) as Record<string, unknown>[];
		return rows.map(rowToMemory);
	}

	rebuildFts(): void {
		this.db.exec("BEGIN");
		try {
			this.db.exec("DELETE FROM memories_fts");
			const rows = this.db
				.prepare("SELECT rowid, id, project_id, title, what, why, where_ref, learned FROM memories")
				.all() as {
				rowid: number;
				id: string;
				project_id: number;
				title: string;
				what: string;
				why: string | null;
				where_ref: string | null;
				learned: string | null;
			}[];
			const insert = this.db.prepare(
				"INSERT INTO memories_fts (rowid, id, project_id, title, what, why, where_ref, learned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			);
			for (const r of rows) {
				insert.run(
					r.rowid,
					r.id,
					r.project_id,
					r.title,
					r.what,
					r.why,
					r.where_ref,
					r.learned,
				);
			}
			this.db.exec("COMMIT");
		} catch (err) {
			this.db.exec("ROLLBACK");
			throw err;
		}
	}

	purgeSoftDeleted(): number {
		const before = this.db
			.prepare("SELECT COUNT(*) AS c FROM memories WHERE soft_deleted = 1")
			.get() as { c: number };
		this.db.prepare("DELETE FROM memories WHERE soft_deleted = 1").run();
		return before.c;
	}

	ftsRowCount(): number {
		const row = this.db.prepare("SELECT COUNT(*) AS c FROM memories_fts").get() as { c: number };
		return row.c;
	}

	memoriesRowCount(): number {
		const row = this.db
			.prepare("SELECT COUNT(*) AS c FROM memories WHERE soft_deleted = 0")
			.get() as { c: number };
		return row.c;
	}
}

export class ValidationError extends Error {
	constructor(
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "ValidationError";
	}
}

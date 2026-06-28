import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";
import type { Memory } from "../db/types";

const ContextSchema = z.object({
	project_slug: z.string().min(1).optional(),
	query: z.string().max(500).optional(),
});

export type ContextInput = z.infer<typeof ContextSchema>;

function byImportanceThenRecency(a: Memory, b: Memory): number {
	if (b.importance !== a.importance) return b.importance - a.importance;
	return b.created_at - a.created_at;
}

export function createContextTool(deps: ToolDeps) {
	return tool({
		description:
			"Get a snapshot of the project's memory: project identity, the most recent active session (if any), the 10 most recent memories, and (when `query` is provided) up to 10 memories matching the query ordered by importance. Use this at the start of a task to recall what has been decided/learned in prior sessions.",
		args: ContextSchema.shape,
		async execute(args, _ctx) {
			const input = args as ContextInput;
			const project = deps.repository.getProjectBySlug(deps.projectSlug);
			const activeSession = deps.repository.findActiveSession(deps.projectId, "opencode");
			const recent = deps.repository.recentMemories(deps.projectId, 10);

			const relevant_memories: Memory[] =
				input.query && input.query.trim().length > 0
					? deps.repository
							.searchMemories({ projectId: deps.projectId, query: input.query, limit: 10 })
							.results.sort(byImportanceThenRecency)
							.slice(0, 10)
					: [];

			return JSON.stringify({
				project: project
					? {
							slug: project.slug,
							root_path: project.root_path,
							remote_url: project.remote_url,
						}
					: null,
				current_session: activeSession,
				recent_memories: recent,
				relevant_memories,
			});
		},
	});
}

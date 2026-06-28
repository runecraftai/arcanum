import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const SearchSchema = z.object({
	query: z.string().min(1).max(500),
	category: z
		.enum([
			"project_rules",
			"architecture",
			"constraints",
			"config_values",
			"naming",
			"decisions",
			"corrections",
			"learnings",
		])
		.optional(),
	limit: z.number().int().min(1).max(100).optional(),
});

export type SearchInput = z.infer<typeof SearchSchema>;

export function createSearchTool(deps: ToolDeps) {
	return tool({
		description:
			"Search the project's memory store using full-text search over titles and content. Returns matching memories, ordered by FTS5 rank. Soft-deleted memories are excluded. Use this when the user references past work or you need to recall what was decided/learned/corrected before.",
		args: SearchSchema.shape,
		async execute(args, _ctx) {
			const input = args as SearchInput;
			const result = deps.repository.searchMemories({
				projectId: deps.projectId,
				query: input.query,
				category: input.category,
				limit: input.limit ?? 20,
			});
			return JSON.stringify(result);
		},
	});
}

import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const StatsSchema = z.object({
	project_slug: z.string().min(1).optional(),
});

export type StatsInput = z.infer<typeof StatsSchema>;

export function createStatsTool(deps: ToolDeps) {
	return tool({
		description:
			"Get memory statistics for the project: total count, per-category counts, and the timestamp of the most recent memory. Soft-deleted memories are excluded.",
		args: StatsSchema.shape,
		async execute(args, _ctx) {
			const input = args as StatsInput;
			void input;
			const stats = deps.repository.getStats(deps.projectSlug);
			return JSON.stringify(stats);
		},
	});
}

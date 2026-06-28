import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const TimelineSchema = z.object({
	project_slug: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
});

export type TimelineInput = z.infer<typeof TimelineSchema>;

export function createTimelineTool(deps: ToolDeps) {
	return tool({
		description:
			"List the most recent sessions for this project, ordered by started_at DESC. Each session includes its id, agent, start/end timestamps, optional summary, and memory count.",
		args: TimelineSchema.shape,
		async execute(args, _ctx) {
			const input = args as TimelineInput;
			const limit = input.limit ?? 20;
			const sessions = deps.repository.listSessions(deps.projectSlug, limit);
			return JSON.stringify({ sessions });
		},
	});
}

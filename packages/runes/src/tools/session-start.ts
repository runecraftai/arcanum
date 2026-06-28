import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const SessionStartSchema = z.object({
	project_slug: z.string().min(1).optional(),
	agent: z.string().min(1).default("opencode"),
});

export type SessionStartInput = z.infer<typeof SessionStartSchema>;

export function createSessionStartTool(deps: ToolDeps) {
	return tool({
		description:
			"Start a new session for this project. Returns the session id and start timestamp. If a session for the same agent is already active, it is reused (idempotent).",
		args: SessionStartSchema.shape,
		async execute(args, _ctx) {
			const input = args as SessionStartInput;
			const agent = input.agent ?? "opencode";
			const existing = deps.repository.findActiveSession(deps.projectId, agent);
			if (existing) {
				return JSON.stringify({
					session_id: existing.id,
					started_at: existing.started_at,
					project: { slug: deps.projectSlug },
					reused: true,
				});
			}
			const session = deps.repository.startSession(deps.projectId, agent);
			return JSON.stringify({
				session_id: session.id,
				started_at: session.started_at,
				project: { slug: deps.projectSlug },
				reused: false,
			});
		},
	});
}

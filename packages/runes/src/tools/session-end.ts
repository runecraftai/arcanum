import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const SessionEndSchema = z.object({
	session_id: z.string().min(1),
	summary: z.string().max(2000).optional(),
});

export type SessionEndInput = z.infer<typeof SessionEndSchema>;

export function createSessionEndTool(deps: ToolDeps) {
	return tool({
		description:
			"Mark a session as ended. Optionally attach a summary describing what was done. The session then appears in `rune_timeline` with the summary attached.",
		args: SessionEndSchema.shape,
		async execute(args, _ctx) {
			const input = args as SessionEndInput;
			const ok = deps.repository.endSession(input.session_id, input.summary ?? null);
			if (!ok) {
				return JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } });
			}
			return JSON.stringify({ ok: true });
		},
	});
}

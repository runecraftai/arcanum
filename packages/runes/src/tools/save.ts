import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import { ValidationError } from "../db/repository";
import type { ToolDeps } from "./types";

const SaveInputSchema = z.object({
	category: z.enum([
		"project_rules",
		"architecture",
		"constraints",
		"config_values",
		"naming",
		"decisions",
		"corrections",
		"learnings",
	]),
	title: z.string().min(1).max(200),
	what: z.string().min(1).max(4000),
	why: z.string().max(2000).optional(),
	where_ref: z.string().max(500).optional(),
	learned: z.string().max(2000).optional(),
	importance: z.number().int().min(1).max(10).optional(),
	session_id: z.string().optional(),
});

export type SaveInput = z.infer<typeof SaveInputSchema>;

export function createSaveTool(deps: ToolDeps) {
	return tool({
		description:
			"Save a memory to the project's persistent memory store. Use this when you make or learn something durable — a decision, a correction, a convention, a config value, a name rule, an architecture note, a constraint, or a learning. The `category` field controls how the memory is grouped. Memories persist across sessions and are recalled on demand via rune_context or rune_search.",
		args: SaveInputSchema.shape,
		async execute(args, _ctx) {
			try {
				const input = args as SaveInput;
				const memory = deps.repository.saveMemory({
					projectId: deps.projectId,
					sessionId: input.session_id ?? null,
					category: input.category,
					title: input.title,
					what: input.what,
					why: input.why ?? null,
					whereRef: input.where_ref ?? null,
					learned: input.learned ?? null,
					importance: input.importance,
				});
				return JSON.stringify({ ok: true, memory });
			} catch (err) {
				if (err instanceof ValidationError) {
					return JSON.stringify({
						ok: false,
						error: { code: err.code, message: err.message },
					});
				}
				throw err;
			}
		},
	});
}

import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import { ValidationError } from "../db/repository";
import type { ToolDeps } from "./types";

const UpdateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(200).optional(),
	what: z.string().min(1).max(4000).optional(),
	why: z.string().max(2000).nullable().optional(),
	where_ref: z.string().max(500).nullable().optional(),
	learned: z.string().max(2000).nullable().optional(),
	importance: z.number().int().min(1).max(10).optional(),
});

export type UpdateInput = z.infer<typeof UpdateSchema>;

export function createUpdateTool(deps: ToolDeps) {
	return tool({
		description:
			"Update fields of an existing memory by id. Only the fields you provide are changed. Returns the updated memory or a NOT_FOUND error. Importance is clamped to [1,10]. Soft-deleted memories cannot be updated.",
		args: UpdateSchema.shape,
		async execute(args, _ctx) {
			const input = args as UpdateInput;
			try {
				const memory = deps.repository.updateMemory(input.id, {
					title: input.title,
					what: input.what,
					why: input.why,
					whereRef: input.where_ref,
					learned: input.learned,
					importance: input.importance,
				});
				if (!memory) {
					return JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } });
				}
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

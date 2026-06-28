import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const DeleteSchema = z.object({
	id: z.string().min(1),
});

export type DeleteInput = z.infer<typeof DeleteSchema>;

export function createDeleteTool(deps: ToolDeps) {
	return tool({
		description:
			"Soft-delete a memory by id. The memory is hidden from search and get, but remains in storage for audit. Use `runes doctor --purge` to hard-delete soft-deleted rows. Returns NOT_FOUND if the id does not exist or is already deleted.",
		args: DeleteSchema.shape,
		async execute(args, _ctx) {
			const input = args as DeleteInput;
			const result = deps.repository.softDeleteMemory(input.id);
			if (!result.ok) {
				return JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } });
			}
			return JSON.stringify({ ok: true, soft_deleted_at: result.soft_deleted_at });
		},
	});
}

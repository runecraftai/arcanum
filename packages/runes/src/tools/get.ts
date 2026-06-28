import { z } from "zod";
import { tool } from "@opencode-ai/plugin";
import type { ToolDeps } from "./types";

const GetSchema = z.object({
	id: z.string().min(1),
});

export type GetInput = z.infer<typeof GetSchema>;

export function createGetTool(deps: ToolDeps) {
	return tool({
		description:
			"Fetch a single memory by its id. Returns the full memory record, or a NOT_FOUND error if the id does not exist or the memory was soft-deleted.",
		args: GetSchema.shape,
		async execute(args, _ctx) {
			const input = args as GetInput;
			const memory = deps.repository.getMemory(input.id);
			if (!memory) {
				return JSON.stringify({ ok: false, error: { code: "NOT_FOUND" } });
			}
			return JSON.stringify({ ok: true, memory });
		},
	});
}

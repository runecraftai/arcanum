import { z } from "zod";

export const RunesConfigSchema = z.object({
	disabled_skills: z.array(z.string()).optional(),
	disabled_tools: z.array(z.string()).optional(),
	data_dir: z.string().optional(),
	importance_floor: z.number().int().min(1).max(10).optional(),
});

export type RunesConfig = z.infer<typeof RunesConfigSchema>;

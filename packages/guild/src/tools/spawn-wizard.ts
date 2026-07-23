import { z } from "zod"
import type { ToolDefinition } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { buildSpawnWizardEffect } from "../runtime/opencode/spawn-wizard-builder"
import type { SpawnWizardSessionEffect } from "../runtime/opencode/effects"

export interface SpawnWizardOutput {
	ok: boolean
	effect: SpawnWizardSessionEffect | null
	warnings: string[]
}

const s = tool.schema

export function createSpawnWizardTool(): ToolDefinition {
	return tool({
		description:
			"Spawn an interactive Wizard planning session to produce an implementation-ready plan for a given goal.",
		args: {
			goal: s.string(),
		},
		async execute(args, ctx) {
			const warnings: string[] = []

			try {
				const goal = args.goal.trim()
				if (!goal) {
					const output: SpawnWizardOutput = {
						ok: false,
						effect: null,
						warnings: ["goal must be a non-empty string"],
					}
					return JSON.stringify(output)
				}

				const sessionId = ctx.sessionID
				if (!sessionId) {
					const output: SpawnWizardOutput = {
						ok: false,
						effect: null,
						warnings: ["sessionID not available in tool context"],
					}
					return JSON.stringify(output)
				}

				const effect = buildSpawnWizardEffect({ sessionId, goal })

				const output: SpawnWizardOutput = { ok: true, effect, warnings }
				return JSON.stringify(output)
			} catch (err) {
				const msg = `Unexpected error: ${err instanceof Error ? err.message : String(err)}`
				warnings.push(msg)
				const output: SpawnWizardOutput = {
					ok: false,
					effect: null,
					warnings,
				}
				return JSON.stringify(output)
			}
		},
	})
}

export const SpawnWizardArgsSchema = z.object({
	goal: z.string(),
})

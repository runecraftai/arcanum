import { existsSync, mkdirSync, renameSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import type { ToolDefinition } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { PLANS_DIR } from "../features/work-state/constants"

const SlugRegex = /^[a-z0-9-]+$/

export interface ArchivePlanOutput {
	ok: boolean
	warnings: string[]
}

export interface ArchivePlanDeps {
	directory: string
	rename?: (from: string, to: string) => void
}

const s = tool.schema

export function createArchivePlanTool(deps: ArchivePlanDeps): ToolDefinition {
	const { directory, rename = renameSync } = deps

	return tool({
		description:
			"Archive a completed plan by moving it into .guild/plans/archive/<slug>/",
		args: {
			slug: s.string(),
		},
		async execute(args) {
			const warnings: string[] = []

			if (!SlugRegex.test(args.slug)) {
				const output: ArchivePlanOutput = {
					ok: false,
					warnings: [`Invalid slug "${args.slug}". Must match ${SlugRegex}`],
				}
				return JSON.stringify(output)
			}

			const plansDir = join(directory, PLANS_DIR)
			const sourceDir = join(plansDir, args.slug)
			const archiveDir = join(plansDir, "archive")

			if (!existsSync(sourceDir)) {
				const output: ArchivePlanOutput = {
					ok: false,
					warnings: [`Plan directory not found: ${sourceDir}`],
				}
				return JSON.stringify(output)
			}

			if (!existsSync(archiveDir)) {
				mkdirSync(archiveDir, { recursive: true })
			}

			const destDir = join(archiveDir, args.slug)

			try {
				rename(sourceDir, destDir)
				const output: ArchivePlanOutput = { ok: true, warnings }
				return JSON.stringify(output)
			} catch (err) {
				const output: ArchivePlanOutput = {
					ok: false,
					warnings: [
						...warnings,
						`Failed to move: ${err instanceof Error ? err.message : String(err)}`,
					],
				}
				return JSON.stringify(output)
			}
		},
	})
}

export const ArchivePlanArgsSchema = z.object({
	slug: z.string(),
})

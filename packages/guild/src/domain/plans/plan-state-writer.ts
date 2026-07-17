import { existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import type { WorkState } from "../../features/work-state/types"
import type { PlanRepository } from "./plan-repository"

export interface PlanStateWriterInput {
	planRepository: PlanRepository
	directory: string
	workState: WorkState
	status: "draft" | "planned" | "in-progress" | "review" | "blocked" | "done"
	blocker?: string | null
	nextAction?: string | null
}

export function writePlanState(input: PlanStateWriterInput): boolean {
	const { planRepository, directory, workState, status, blocker, nextAction } = input

	const planPath = workState.active_plan
	const planName = planRepository.getPlanName(planPath)
	const progress = planRepository.getPlanProgress(planPath)

	const stateDir = dirname(planPath)
	const statePath = join(stateDir, "state.md")

	const today = new Date().toISOString().split("T")[0]

	const blockerLine = blocker ? `- **Blocker**: ${blocker}` : "- **Blocker**: None"
	const nextActionLine = nextAction ? `- **Next Action**: ${nextAction}` : "- **Next Action**: Continue to next unchecked task"

	const content = `# Status: ${planName}

- **Status**: ${status}
${blockerLine}
${nextActionLine}
- **Last Updated**: ${today}
- **Progress**: ${progress.completed}/${progress.total} tasks completed
`

	try {
		if (!existsSync(stateDir)) {
			mkdirSync(stateDir, { recursive: true })
		}

		writeFileSync(statePath, content, "utf-8")
		return true
	} catch {
		return false
	}
}

export function refreshPlanState(
	planRepository: PlanRepository,
	directory: string,
	workState: WorkState,
): boolean {
	return writePlanState({
		planRepository,
		directory,
		workState,
		status: "in-progress",
		blocker: null,
		nextAction: "Continue to next unchecked task",
	})
}

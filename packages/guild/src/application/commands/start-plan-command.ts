import type { RuntimeEffect } from "../../runtime/opencode/effects"

export function executeStartPlanCommand(input: { sessionId: string; argumentsText: string }): RuntimeEffect[] {
  const goal = input.argumentsText.trim()
  if (!goal) {
    return []
  }

  return [{
    type: "spawnWizardSession",
    sessionId: input.sessionId,
    title: goal,
    contextInjection: `## Planning Handoff\n**Goal**: ${goal}\n**Summary**: Start an interactive planning session with the user and produce an implementation-ready plan.\n**Open questions**: Capture any ambiguity with the question tool before drafting the plan.\n**Relevant context**: Read the current codebase, reuse existing patterns, and keep the user in the loop.\n**Plan file**: \\.guild/plans/<slug>/plan.md\n**Progress**: 0/0 tasks\n\nYou are now in the foreground planning session. Continue speaking directly with the user.`,
  }]
}

import type { RuntimeEffect } from "../../runtime/opencode/effects"
import { buildSpawnWizardEffect } from "../../runtime/opencode/spawn-wizard-builder"

export function executeStartPlanCommand(input: { sessionId: string; argumentsText: string }): RuntimeEffect[] {
  const goal = input.argumentsText.trim()
  if (!goal) {
    return []
  }

  return [buildSpawnWizardEffect({ sessionId: input.sessionId, goal })]
}

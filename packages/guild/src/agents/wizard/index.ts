import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { WIZARD_DEFAULTS } from "./default"

export const createWizardAgent: AgentFactory = (model: string): AgentConfig => ({
  ...WIZARD_DEFAULTS,
  model,
  mode: "all",
})
createWizardAgent.mode = "all"

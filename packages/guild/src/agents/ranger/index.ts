import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { RANGER_DEFAULTS } from "./default"

export const createRangerAgent: AgentFactory = (model: string): AgentConfig => ({
  ...RANGER_DEFAULTS,
  model,
  mode: "all",
})
createRangerAgent.mode = "all"

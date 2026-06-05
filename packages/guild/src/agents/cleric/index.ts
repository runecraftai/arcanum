import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { CLERIC_DEFAULTS } from "./default"

export const createClericAgent: AgentFactory = (model: string): AgentConfig => ({
  ...CLERIC_DEFAULTS,
  tools: { ...CLERIC_DEFAULTS.tools },
  model,
  mode: "subagent",
})
createClericAgent.mode = "subagent"

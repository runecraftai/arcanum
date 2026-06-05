import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { ROGUE_DEFAULTS } from "./default"

export const createRogueAgent: AgentFactory = (model: string): AgentConfig => ({
  ...ROGUE_DEFAULTS,
  tools: { ...ROGUE_DEFAULTS.tools },
  model,
  mode: "subagent",
})
createRogueAgent.mode = "subagent"

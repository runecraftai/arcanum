import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { PALADIN_DEFAULTS } from "./default"

export const createPaladinAgent: AgentFactory = (model: string): AgentConfig => ({
  ...PALADIN_DEFAULTS,
  tools: { ...PALADIN_DEFAULTS.tools },
  model,
  mode: "subagent",
})
createPaladinAgent.mode = "subagent"

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory } from "../types"
import { WARLOCK_DEFAULTS } from "./default"

export const createWarlockAgent: AgentFactory = (model: string): AgentConfig => ({
  ...WARLOCK_DEFAULTS,
  tools: { ...WARLOCK_DEFAULTS.tools },
  model,
  mode: "subagent",
})
createWarlockAgent.mode = "subagent"

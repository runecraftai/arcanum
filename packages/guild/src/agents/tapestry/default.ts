import type { AgentConfig } from "@opencode-ai/sdk"
import { composeTapestryPrompt } from "./prompt-composer"

export const TAPESTRY_DEFAULTS: AgentConfig = {
  temperature: 0.1,
  description: "Fighter (Execution Lead)",
  skills: ["guild-load", "guild-execute", "guild-verify", "guild-handoff"],
  tools: {
    call_weave_agent: true,
    task: true,
  },
  prompt: composeTapestryPrompt(),
}

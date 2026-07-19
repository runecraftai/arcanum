import type { AgentConfig } from "@opencode-ai/sdk"
import { composeFighterPrompt, FIGHTER_SKILL_NAMES } from "./prompt-composer"

export const FIGHTER_DEFAULTS: AgentConfig = {
  temperature: 0.1,
  description: "Fighter (Execution Lead)",
  skills: FIGHTER_SKILL_NAMES,
  tools: {
    call_guild_agent: true,
    task: true,
  },
  prompt: composeFighterPrompt(),
}

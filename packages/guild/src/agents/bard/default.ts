import type { AgentConfig } from "@opencode-ai/sdk"
import { composeBardPrompt, BARD_SKILL_NAMES } from "./prompt-composer"

export const BARD_DEFAULTS: AgentConfig = {
  temperature: 0.1,
  description: "Bard (Guildmaster)",
  skills: BARD_SKILL_NAMES,
  tools: {
    guild_spawn_wizard: true,
  },
  prompt: composeBardPrompt(),
}

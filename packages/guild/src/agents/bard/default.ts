import type { AgentConfig } from "@opencode-ai/sdk"
import { composeBardPrompt } from "./prompt-composer"

export const BARD_DEFAULTS: AgentConfig = {
  temperature: 0.1,
  description: "Bard (Guildmaster)",
  skills: ["guild-init", "guild-load", "guild-scope", "guild-spec", "guild-plan", "guild-handoff", "guild-ship"],
  prompt: composeBardPrompt(),
}

import type { AgentConfig } from "@opencode-ai/sdk"
import { composeFighterPrompt } from "./prompt-composer"

export const FIGHTER_DEFAULTS: AgentConfig = {
  temperature: 0.1,
  description: "Fighter (Execution Lead)",
  skills: ["guild-load", "guild-execute", "guild-verify", "guild-handoff", "git-worktree"],
  tools: {
    call_guild_agent: true,
    task: true,
  },
  prompt: composeFighterPrompt(),
}

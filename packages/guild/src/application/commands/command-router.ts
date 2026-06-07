import type { AgentConfig } from "@opencode-ai/sdk"
import { BUILTIN_COMMANDS } from "../../features/builtin-commands/commands"
import type { CreatedHooks } from "../../hooks/create-hooks"
import type { RuntimeEffect } from "../../runtime/opencode/effects"
import { executeMetricsCommand } from "./metrics-command"
import { executeTokenReportCommand } from "./token-report-command"
import { executeGuildHealthCommand } from "./guild-health-command"

export function routeCommandExecuteBefore(input: {
  command: string
  sessionId: string
  argumentsText: string
  directory: string
  hooks: CreatedHooks
  agents: Record<string, AgentConfig>
}): RuntimeEffect[] {
  switch (input.command) {
    case "start-work":
      return [
        {
          type: "appendPromptText",
          text: renderStartWorkPrompt({
            sessionId: input.sessionId,
            argumentsText: input.argumentsText,
          }),
        },
      ]
    case "token-report":
      return executeTokenReportCommand(input.directory)
    case "metrics":
      return executeMetricsCommand({
        directory: input.directory,
        argumentsText: input.argumentsText,
        analyticsEnabled: input.hooks.analyticsEnabled,
      })
    case "guild-health":
      return executeGuildHealthCommand(input.agents)
    default:
      return []
  }
}

function renderStartWorkPrompt(input: { sessionId: string; argumentsText: string }): string {
  return BUILTIN_COMMANDS["start-work"].template
    .replace(/\$SESSION_ID/g, input.sessionId)
    .replace(/\$TIMESTAMP/g, new Date().toISOString())
    .replace(/\$ARGUMENTS/g, input.argumentsText)
}

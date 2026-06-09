import { BUILTIN_COMMANDS } from "../../features/builtin-commands/commands"
import type { RuntimeEffect } from "../../runtime/opencode/effects"

export function executeStartHandoffCommand(input: { sessionId: string; argumentsText: string }): RuntimeEffect[] {
  return [
    {
      type: "appendPromptText",
      text: BUILTIN_COMMANDS["start-handoff"].template
        .replace(/\$SESSION_ID/g, input.sessionId)
        .replace(/\$TIMESTAMP/g, new Date().toISOString())
        .replace(/\$ARGUMENTS/g, input.argumentsText),
    },
  ]
}

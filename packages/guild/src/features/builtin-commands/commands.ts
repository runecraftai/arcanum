import type { BuiltinCommand, BuiltinCommandName } from "./types"
import { START_WORK_TEMPLATE } from "./templates/start-work"
import { METRICS_TEMPLATE } from "./templates/metrics"
import { RUN_WORKFLOW_TEMPLATE } from "./templates/run-workflow"
import { renderBuiltinCommandEnvelope } from "../../runtime/opencode/protocol"

export const BUILTIN_COMMANDS: Record<BuiltinCommandName, BuiltinCommand> = {
  "start-work": {
    name: "start-work",
    description: "Start executing a Guild plan created by Wizard",
    agent: "fighter",
    template: `<command-instruction>
${START_WORK_TEMPLATE}
</command-instruction>
${renderBuiltinCommandEnvelope({
  command: "start-work",
  arguments: "$ARGUMENTS",
  sessionId: "$SESSION_ID",
  timestamp: "$TIMESTAMP",
})}
<session-context>Session ID: $SESSION_ID  Timestamp: $TIMESTAMP</session-context>
<user-request>$ARGUMENTS</user-request>`,
    argumentHint: "[plan-name]",
  },
  "token-report": {
    name: "token-report",
    description: "Show token usage and cost report across sessions",
    agent: "bard",
    template: `<command-instruction>
Display the token usage report that has been injected below. Present it clearly to the user.
</command-instruction>
${renderBuiltinCommandEnvelope({
  command: "token-report",
  arguments: "$ARGUMENTS",
})}
<token-report>$ARGUMENTS</token-report>`,
  },
  "metrics": {
    name: "metrics",
    description: "Show Guild analytics and plan metrics reports",
    agent: "bard",
    template: `<command-instruction>
${METRICS_TEMPLATE}
</command-instruction>
${renderBuiltinCommandEnvelope({
  command: "metrics",
  arguments: "$ARGUMENTS",
})}
<metrics-data>$ARGUMENTS</metrics-data>`,
    argumentHint: "[plan-name|all]",
  },
  "run-workflow": {
    name: "run-workflow",
    description: "Run a multi-step workflow",
    agent: "bard",
    template: `<command-instruction>
${RUN_WORKFLOW_TEMPLATE}
</command-instruction>
${renderBuiltinCommandEnvelope({
  command: "run-workflow",
  arguments: "$ARGUMENTS",
  sessionId: "$SESSION_ID",
  timestamp: "$TIMESTAMP",
})}
<session-context>Session ID: $SESSION_ID  Timestamp: $TIMESTAMP</session-context>
<user-request>$ARGUMENTS</user-request>`,
    argumentHint: "<workflow-name> [\"goal\"]",
  },
  "guild-health": {
    name: "guild-health",
    description: "Show Guild config health and any validation issues",
    agent: "bard",
    template: `<command-instruction>
Display the Guild health report below to the user. Present warnings and errors prominently.
If there are no issues, confirm that Guild config is healthy.
</command-instruction>
${renderBuiltinCommandEnvelope({
  command: "guild-health",
  arguments: "$ARGUMENTS",
})}
<guild-health>$ARGUMENTS</guild-health>`,
  },
}

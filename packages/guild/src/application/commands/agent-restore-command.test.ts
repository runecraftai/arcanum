import { describe, expect, it } from "bun:test"
import { executeStartWorkCommand } from "./start-work-command"
import { executeRunWorkflowCommand } from "./run-workflow-command"

describe("agent restore command effects", () => {
  it("emits restoreAgent alongside switchAgent for /start-work", () => {
    const effects = executeStartWorkCommand({
      hooks: {
        startWork: () => ({ contextInjection: "plan", switchAgent: "fighter" }),
      } as never,
      promptText: "/start-work",
      sessionId: "sess-start",
      parsedEnvelope: { kind: "builtin-command", command: "start-work" } as never,
      isWorkflowCommand: false,
    })

    expect(effects).toEqual([
      { type: "switchAgent", agent: "fighter" },
      { type: "restoreAgent", sessionId: "sess-start", agent: "fighter" },
      { type: "appendPromptText", text: "plan" },
    ])
  })

  it("emits restoreAgent alongside switchAgent for /run-workflow", () => {
    const effects = executeRunWorkflowCommand({
      hooks: {
        workflowStart: () => ({ contextInjection: "workflow", switchAgent: "cleric" }),
      } as never,
      promptText: "/run-workflow",
      sessionId: "sess-wf",
      parsedEnvelope: { kind: "builtin-command", command: "run-workflow" } as never,
      isRunWorkflowCommand: true,
    })

    expect(effects).toEqual([
      { type: "switchAgent", agent: "cleric" },
      { type: "restoreAgent", sessionId: "sess-wf", agent: "cleric" },
      { type: "appendPromptText", text: "workflow" },
    ])
  })
})

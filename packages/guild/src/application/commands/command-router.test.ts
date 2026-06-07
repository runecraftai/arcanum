import { describe, expect, it } from "bun:test"
import { routeCommandExecuteBefore } from "./command-router"

describe("routeCommandExecuteBefore", () => {
  it("injects the start-work prompt for /start-work", () => {
    const effects = routeCommandExecuteBefore({
      command: "start-work",
      sessionId: "sess-123",
      argumentsText: "guild-docs-customization-recipes",
      directory: "/tmp/guild",
      hooks: {
        analyticsEnabled: false,
      } as never,
      agents: {},
    })

    expect(effects).toHaveLength(1)
    expect(effects[0]).toEqual(expect.objectContaining({
      type: "appendPromptText",
      text: expect.stringContaining("guild-docs-customization-recipes"),
    }))
    expect((effects[0] as { type: string; text: string }).text).toContain("<session-context>")
    expect((effects[0] as { type: string; text: string }).text).toContain("Session ID: sess-123")
    expect((effects[0] as { type: string; text: string }).text).toContain("command-name")
  })

  it("is a no-op for unsupported commands", () => {
    const effects = routeCommandExecuteBefore({
      command: "unknown",
      sessionId: "sess-123",
      argumentsText: "",
      directory: "/tmp/guild",
      hooks: {
        analyticsEnabled: false,
      } as never,
      agents: {},
    })

    expect(effects).toEqual([])
  })
})

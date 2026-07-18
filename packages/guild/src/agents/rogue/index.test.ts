import { describe, it, expect } from "bun:test"
import { createRogueAgent } from "./index"

describe("createRogueAgent", () => {
  it("is a callable factory", () => {
    expect(typeof createRogueAgent).toBe("function")
  })

  it("has mode subagent", () => {
    expect(createRogueAgent.mode).toBe("subagent")
  })

  it("sets model from argument", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.model).toBe("grok-code-fast")
  })

  it("has a non-empty prompt", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(typeof config.prompt).toBe("string")
    expect(config.prompt!.length).toBeGreaterThan(0)
  })

  it("denies write tool", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.tools?.["write"]).toBe(false)
  })

  it("denies edit tool", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.tools?.["edit"]).toBe(false)
  })

  it("denies task tool", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.tools?.["task"]).toBe(false)
  })

  it("denies call_guild_agent tool", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.tools?.["call_guild_agent"]).toBe(false)
  })

  it("has guild-recon in skills", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.skills).toContain("guild-recon")
  })

  it("references guild-recon in prompt", () => {
    const config = createRogueAgent("grok-code-fast")
    expect(config.prompt).toInclude("guild-recon")
  })
})

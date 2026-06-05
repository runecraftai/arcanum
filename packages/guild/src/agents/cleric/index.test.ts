import { describe, it, expect } from "bun:test"
import { createClericAgent } from "./index"

describe("createClericAgent", () => {
  it("is a callable factory", () => {
    expect(typeof createClericAgent).toBe("function")
  })

  it("has mode subagent", () => {
    expect(createClericAgent.mode).toBe("subagent")
  })

  it("sets model from argument", () => {
    const config = createClericAgent("claude-opus-4")
    expect(config.model).toBe("claude-opus-4")
  })

  it("has a non-empty prompt", () => {
    const config = createClericAgent("claude-opus-4")
    expect(typeof config.prompt).toBe("string")
    expect(config.prompt!.length).toBeGreaterThan(0)
  })

  it("denies write tool", () => {
    const config = createClericAgent("claude-opus-4")
    expect(config.tools?.["write"]).toBe(false)
  })

  it("denies edit tool", () => {
    const config = createClericAgent("claude-opus-4")
    expect(config.tools?.["edit"]).toBe(false)
  })

  it("denies task tool", () => {
    const config = createClericAgent("claude-opus-4")
    expect(config.tools?.["task"]).toBe(false)
  })

  it("denies call_guild_agent tool", () => {
    const config = createClericAgent("claude-opus-4")
    expect(config.tools?.["call_guild_agent"]).toBe(false)
  })

  it("description contains Reviewer or Auditor", () => {
    const config = createClericAgent("claude-opus-4")
    const desc = config.description ?? ""
    expect(desc.toLowerCase()).toMatch(/reviewer|auditor/)
  })
})

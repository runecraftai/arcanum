import { describe, it, expect } from "bun:test"
import { createWizardAgent } from "./index"

describe("createWizardAgent", () => {
  it("is a callable factory", () => {
    expect(typeof createWizardAgent).toBe("function")
  })

  it("has mode all", () => {
    expect(createWizardAgent.mode).toBe("all")
  })

  it("sets model from argument", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(config.model).toBe("claude-opus-4")
  })

  it("has a non-empty prompt", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(typeof config.prompt).toBe("string")
    expect(config.prompt!.length).toBeGreaterThan(0)
  })

  it("documents interactive and automatic modes", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(config.prompt).toContain("MODE: interactive")
    expect(config.prompt).toContain("MODE: automatic")
    expect(config.prompt).toContain("OpenCode `ask_user` tool")
  })

  it("routes codebase searches to Rogue and external research to Warlock", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(config.prompt).toContain("call_guild_agent` to delegate to Rogue first for codebase searches")
    expect(config.prompt).toContain("call_guild_agent` to delegate to Warlock for external docs")
  })

  it("prefers Guild skills before generic skills", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(config.prompt).toContain("Prefer Guild's own skills first")
    expect(config.prompt).toContain("guild-load")
  })

  it("denies guild_spawn_wizard tool (Bard-only)", () => {
    const config = createWizardAgent("claude-opus-4")
    expect(config.tools?.guild_spawn_wizard).toBe(false)
  })
})

import { describe, it, expect, afterEach } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import WeavePlugin from "../../src/index"
import { createBuiltinAgents } from "../../src/agents/builtin-agents"
import { ConfigHandler } from "../../src/managers/config-handler"
import { DEFAULT_CONTINUATION_CONFIG } from "../../src/config/continuation"
import { WeaveConfigSchema } from "../../src/config/schema"
import { getAgentDisplayName, getAgentConfigKey, resetDisplayNames } from "../../src/shared/agent-display-names"
import { createManagers } from "../../src/create-managers"
import { resetNameVariants } from "../../src/agents/agent-builder"

const makeMockCtx = (directory: string): PluginInput =>
  ({
    directory,
    client: {},
    project: { root: directory },
    serverUrl: "http://localhost:3000",
  }) as unknown as PluginInput

const defaultConfig = WeaveConfigSchema.parse({})

describe("WeavePlugin integration", () => {
  it("plugin loads and returns all 8 handlers", async () => {
    const result = await WeavePlugin(makeMockCtx(process.cwd()))
    const keys = Object.keys(result)
    expect(keys).toContain("tool")
    expect(keys).toContain("config")
    expect(keys).toContain("chat.message")
    expect(keys).toContain("chat.params")
    expect(keys).toContain("chat.headers")
    expect(keys).toContain("event")
    expect(keys).toContain("tool.execute.before")
    expect(keys).toContain("tool.execute.after")
  })

  it("config handler registers all 8 agents with display name keys", async () => {
    const agents = createBuiltinAgents()
    const handler = new ConfigHandler({ pluginConfig: defaultConfig, agents })
    const result = await handler.handle({ pluginConfig: defaultConfig, agents })

    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("bard"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("fighter"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("ranger"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("wizard"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("rogue"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("warlock"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("cleric"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("paladin"))

    for (const [, agent] of Object.entries(result.agents)) {
      expect(agent.model).toBeTruthy()
      expect(agent.prompt).toBeTruthy()
    }
  })

  it("config handler sets defaultAgent to bard display name", async () => {
    const agents = createBuiltinAgents()
    const handler = new ConfigHandler({ pluginConfig: defaultConfig, agents })
    const result = await handler.handle({ pluginConfig: defaultConfig, agents })

    expect(result.defaultAgent).toBe(getAgentDisplayName("bard"))
  })

  it("config handler applies agent overrides", async () => {
    const overrideModel = "override-model-test"
    const config = WeaveConfigSchema.parse({
      agents: { bard: { model: overrideModel } },
    })
    const agents = createBuiltinAgents({ agentOverrides: config.agents })
    const handler = new ConfigHandler({ pluginConfig: config, agents })
    const result = await handler.handle({ pluginConfig: config, agents })

    const bardKey = getAgentDisplayName("bard")
    expect(result.agents[bardKey].model).toBe(overrideModel)
  })

  it("tool permissions enforced per agent — rogue and warlock are read-only", () => {
    const agents = createBuiltinAgents()
    const rogueAgent = agents["rogue"]
    const warlockAgent = agents["warlock"]
    const bardAgent = agents["bard"]

    expect(rogueAgent).toBeDefined()
    expect(warlockAgent).toBeDefined()
    expect(bardAgent).toBeDefined()

    const rogueTools = rogueAgent.tools as Record<string, boolean> | undefined
    const warlockTools = warlockAgent.tools as Record<string, boolean> | undefined
    expect(rogueTools?.write).toBe(false)
    expect(warlockTools?.write).toBe(false)
    expect(rogueTools?.edit).toBe(false)
    expect(warlockTools?.edit).toBe(false)
  })

  it("disabled agent excluded from config handler output", async () => {
    const config = WeaveConfigSchema.parse({ disabled_agents: ["warlock"] })
    const agents = createBuiltinAgents({ disabledAgents: ["warlock"] })
    const handler = new ConfigHandler({ pluginConfig: config, agents })
    const result = await handler.handle({ pluginConfig: config, agents })

    expect(Object.keys(result.agents)).not.toContain(getAgentDisplayName("warlock"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("bard"))
    expect(Object.keys(result.agents)).toHaveLength(14)
  })

  it("disabled hook not created — context-window-monitor disabled", async () => {
    const config = WeaveConfigSchema.parse({ disabled_hooks: ["context-window-monitor"] })
    const { createHooks } = await import("../../src/hooks/create-hooks")
    const hooks = createHooks({
      pluginConfig: config,
      continuation: DEFAULT_CONTINUATION_CONFIG,
      isHookEnabled: (name) => !["context-window-monitor"].includes(name),
      directory: process.cwd(),
    })

    expect(hooks.contextWindowThresholds).toBeNull()
    expect(hooks.writeGuard).not.toBeNull()
  })
})

describe("createManagers — builtin display_name override", () => {
  const mockCtx = {
    directory: process.cwd(),
    client: {},
    project: { root: process.cwd() },
    serverUrl: "http://localhost:3000",
  } as unknown as PluginInput

  afterEach(() => {
    resetDisplayNames()
    resetNameVariants()
  })

  it("custom display_name appears as agent key in config handler output", async () => {
    const config = WeaveConfigSchema.parse({
      agents: { bard: { display_name: "My Bard" } },
    })
    const { agents, configHandler } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    const result = await configHandler.handle({ pluginConfig: config, agents })

    expect(Object.keys(result.agents)).toContain("My Bard")
    expect(Object.keys(result.agents)).not.toContain("Bard (Guildmaster)")
  })

  it("agents without display_name keep their default display names", async () => {
    const config = WeaveConfigSchema.parse({
      agents: { bard: { display_name: "My Bard" } },
    })
    const { agents, configHandler } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    const result = await configHandler.handle({ pluginConfig: config, agents })

    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("fighter"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("rogue"))
    expect(Object.keys(result.agents)).toContain(getAgentDisplayName("wizard"))
  })

  it("getAgentConfigKey resolves custom display name back to config key", async () => {
    const config = WeaveConfigSchema.parse({
      agents: { bard: { display_name: "My Bard" } },
    })
    createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    expect(getAgentConfigKey("My Bard")).toBe("bard")
  })

  it("defaultAgent is updated to custom display name", async () => {
    const config = WeaveConfigSchema.parse({
      agents: { bard: { display_name: "My Bard" } },
    })
    const { agents, configHandler } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    const result = await configHandler.handle({ pluginConfig: config, agents })

    expect(result.defaultAgent).toBe("My Bard")
  })

  it("agent description is updated to match custom display name", () => {
    const config = WeaveConfigSchema.parse({
      agents: { cleric: { display_name: "My Reviewer" } },
    })
    const { agents } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })

    expect(agents["cleric"]?.description).toBe("My Reviewer")
  })

  it("setting display_name on a disabled builtin agent does NOT crash", async () => {
    const config = WeaveConfigSchema.parse({
      disabled_agents: ["cleric"],
      agents: { cleric: { display_name: "My Reviewer" } },
    })
    const { agents, configHandler } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    const result = await configHandler.handle({ pluginConfig: config, agents })

    expect(Object.keys(result.agents)).not.toContain("My Reviewer")
    expect(Object.keys(result.agents)).not.toContain("cleric")
  })

  it("unicode display name works end-to-end", async () => {
    const config = WeaveConfigSchema.parse({
      agents: { bard: { display_name: "織機 (メインオーケストレーター)" } },
    })
    const { agents, configHandler } = createManagers({ ctx: mockCtx, pluginConfig: config, continuation: DEFAULT_CONTINUATION_CONFIG })
    const result = await configHandler.handle({ pluginConfig: config, agents })

    expect(Object.keys(result.agents)).toContain("織機 (メインオーケストレーター)")
    expect(result.defaultAgent).toBe("織機 (メインオーケストレーター)")
  })
})

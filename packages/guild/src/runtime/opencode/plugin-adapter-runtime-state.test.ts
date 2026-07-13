import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createPluginAdapter } from "./plugin-adapter"
import { createExecutionLeaseFsStore } from "../../infrastructure/fs/execution-lease-fs-store"

describe("plugin adapter runtime state", () => {
  const executionLeaseRepository = createExecutionLeaseFsStore()
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "guild-plugin-runtime-state-"))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it("captures ad-hoc foreground agent from chat.params without creating ownership", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: { handle: async () => ({ agents: {}, commands: {}, defaultAgent: undefined }) } as never,
      agents: {},
      directory,
    })

    await adapter.handleChatParams({ sessionID: "sess-ad-hoc", agent: "Bard (Guildmaster)" })
    const sessionRuntime = executionLeaseRepository.readSessionRuntime(directory, "sess-ad-hoc")

    expect(executionLeaseRepository.readExecutionLease(directory)).toBeNull()
    expect(sessionRuntime).not.toBeNull()
    expect(sessionRuntime).toEqual({
      session_id: "sess-ad-hoc",
      foreground_agent: "bard",
      mode: "ad_hoc",
      execution_ref: null,
      status: "running",
      updated_at: sessionRuntime!.updated_at,
    })
  })
})

describe("plugin adapter config merge", () => {
  it("strips explore subagent from existing config", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { bard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        explore: { model: "anthropic/claude-opus-4-1" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.explore).toBeUndefined()
    expect(agents.general).toBeDefined()
    expect(agents.bard).toBeDefined()
  })

  it("strips plan subagent from existing config", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { wizard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        plan: { model: "anthropic/claude-opus-4-1" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.plan).toBeUndefined()
    expect(agents.general).toBeDefined()
    expect(agents.wizard).toBeDefined()
  })

  it("preserves general agent in merged config", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { bard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        general: { model: "anthropic/claude-opus-4-1", name: "General Assistant" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.general).toBeDefined()
    expect((agents.general as Record<string, unknown>).model).toBe("anthropic/claude-opus-4-1")
  })

  it("preserves Guild agent display names over OpenCode native", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: {
            warlock: { model: "anthropic/claude-sonnet-4.6", name: "Warlock (Researcher)" },
          },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        warlock: { model: "anthropic/claude-opus-4-1", name: "Old Warlock" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.warlock).toBeDefined()
    expect((agents.warlock as Record<string, unknown>).name).toBe("Warlock (Researcher)")
  })

  it("preserves unknown user-registered agent keys", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { bard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        "custom-agent": { model: "anthropic/claude-opus-4-1", name: "My Custom Agent" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents["custom-agent"]).toBeDefined()
    expect((agents["custom-agent"] as Record<string, unknown>).name).toBe("My Custom Agent")
    expect(agents.general).toBeDefined()
    expect(agents.bard).toBeDefined()
  })

  it("strips all OpenCode native subagents (explore, plan, build, title, summary, compaction)", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { bard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        explore: { model: "anthropic/claude-opus-4-1" },
        plan: { model: "anthropic/claude-opus-4-1" },
        build: { model: "anthropic/claude-opus-4-1" },
        title: { model: "anthropic/claude-opus-4-1" },
        summary: { model: "anthropic/claude-opus-4-1" },
        compaction: { model: "anthropic/claude-opus-4-1" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.explore).toBeUndefined()
    expect(agents.plan).toBeUndefined()
    expect(agents.build).toBeUndefined()
    expect(agents.title).toBeUndefined()
    expect(agents.summary).toBeUndefined()
    expect(agents.compaction).toBeUndefined()
    expect(agents.general).toBeDefined()
    expect(agents.bard).toBeDefined()
  })

  it("handles case-insensitive stripping of native subagents", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: { bard: { model: "anthropic/claude-sonnet-4.6" } },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        EXPLORE: { model: "anthropic/claude-opus-4-1" },
        Plan: { model: "anthropic/claude-opus-4-1" },
        general: { model: "anthropic/claude-sonnet-4.6" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(agents.EXPLORE).toBeUndefined()
    expect(agents.Plan).toBeUndefined()
    expect(agents.general).toBeDefined()
    expect(agents.bard).toBeDefined()
  })

  it("merges Guild agents with filtered existing agents", async () => {
    const adapter = createPluginAdapter({
      pluginConfig: {},
      hooks: {
        analyticsEnabled: false,
        compactionTodoPreserverEnabled: false,
        todoContinuationEnforcerEnabled: false,
        continuation: { recovery: { compaction: true }, idle: { enabled: true, work: true, workflow: true, todo_prompt: false } },
      } as never,
      tools: {},
      configHandler: {
        handle: async () => ({
          agents: {
            bard: { model: "anthropic/claude-sonnet-4.6", name: "Bard (Guildmaster)" },
            fighter: { model: "anthropic/claude-sonnet-4.6", name: "Fighter (Execution Lead)" },
          },
          commands: {},
          defaultAgent: undefined,
        }),
      } as never,
      agents: {},
    })

    const config: Record<string, unknown> = {
      agent: {
        explore: { model: "anthropic/claude-opus-4-1" },
        general: { model: "anthropic/claude-sonnet-4.6" },
        "custom-tool": { model: "anthropic/claude-opus-4-1" },
      },
    }

    await adapter.config(config)

    expect(config.agent).toBeDefined()
    const agents = config.agent as Record<string, unknown>
    expect(Object.keys(agents)).toContain("bard")
    expect(Object.keys(agents)).toContain("fighter")
    expect(Object.keys(agents)).toContain("general")
    expect(Object.keys(agents)).toContain("custom-tool")
    expect(Object.keys(agents)).not.toContain("explore")
  })
})

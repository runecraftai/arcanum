import { describe, it, expect } from "bun:test"
import { createBardAgent, createBardAgentWithOptions } from "./index"

describe("createBardAgent", () => {
  it("is a callable factory", () => {
    expect(typeof createBardAgent).toBe("function")
  })

  it("has mode primary", () => {
    expect(createBardAgent.mode).toBe("primary")
  })

  it("sets model from argument", () => {
    const config = createBardAgent("claude-opus-4")
    expect(config.model).toBe("claude-opus-4")
  })

  it("has a non-empty prompt", () => {
    const config = createBardAgent("claude-opus-4")
    expect(typeof config.prompt).toBe("string")
    expect(config.prompt!.length).toBeGreaterThan(0)
  })

  it("has guild_spawn_wizard in tool policy (Bard-only)", () => {
    const config = createBardAgent("claude-opus-4")
    expect(config.tools?.guild_spawn_wizard).toBe(true)
  })

  it("PlanWorkflow review step is not marked optional", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).not.toContain("(optional)")
  })

  it("PlanWorkflow specifies when to use plan workflow", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).toContain("5+ step tasks")
    expect(planWorkflow).toContain("multi-file refactors")
  })

  it("PlanWorkflow includes review step with Cleric and Paladin", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).toContain("REVIEW")
    expect(planWorkflow).toContain("Cleric")
    expect(planWorkflow).toContain("Paladin")
  })

  it("ReviewWorkflow contains Paladin mandatory language", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const reviewWorkflow = prompt.slice(
      prompt.indexOf("<ReviewWorkflow>"),
      prompt.indexOf("</ReviewWorkflow>"),
    )
    expect(reviewWorkflow).toContain("Paladin is mandatory")
  })

  it("ReviewWorkflow contains key security trigger keywords", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const reviewWorkflow = prompt.slice(
      prompt.indexOf("<ReviewWorkflow>"),
      prompt.indexOf("</ReviewWorkflow>"),
    )
    const triggers = ["crypto", "auth", "tokens", "secrets", "input validation"]
    for (const trigger of triggers) {
      expect(reviewWorkflow).toContain(trigger)
    }
  })

  it("PlanWorkflow references Paladin for security-relevant plans", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow.toLowerCase()).toContain("paladin")
    expect(planWorkflow.toLowerCase()).toContain("security")
  })

  it("Delegation section uses mandatory language for Paladin", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const delegation = prompt.slice(
      prompt.indexOf("<Delegation>"),
      prompt.indexOf("</Delegation>"),
    )
    expect(delegation).toContain("delegate to Paladin for security")
  })

  it("PlanWorkflow notes Fighter handles execution", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).toContain("Fighter handles execution")
  })

  it("PlanWorkflow does not contain Step 5 POST-EXECUTION REVIEW", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const planWorkflow = prompt.slice(
      prompt.indexOf("<PlanWorkflow>"),
      prompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).not.toContain("5. POST-EXECUTION REVIEW")
  })

  it("ReviewWorkflow is ad-hoc only (no post-plan section)", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const reviewWorkflow = prompt.slice(
      prompt.indexOf("<ReviewWorkflow>"),
      prompt.indexOf("</ReviewWorkflow>"),
    )
    expect(reviewWorkflow).toContain("Ad-hoc review")
    expect(reviewWorkflow).toContain("Cleric")
    expect(reviewWorkflow).not.toContain("Post-Plan")
  })
})

describe("createBardAgentWithOptions", () => {
  it("includes custom agent triggers in prompt when provided", () => {
    const config = createBardAgentWithOptions("claude-opus-4", undefined, null, [{
      name: "code-reviewer",
      description: "Reviews code",
      metadata: {
        category: "advisor",
        cost: "CHEAP",
        triggers: [{ domain: "Code Review", trigger: "Code quality review" }],
      },
    }])
    expect(config.prompt).toContain("<CustomDelegation>")
    expect(config.prompt).toContain("code-reviewer")
    expect(config.prompt).toContain("Code Review")
  })

  it("returns composed default prompt when no custom agents, disabled, or fingerprint", () => {
    const config = createBardAgentWithOptions("claude-opus-4")
    expect(config.prompt).not.toContain("<CustomDelegation>")
    expect(config.prompt).toContain("Runtime fan-out is owned by Guild for direct")
  })

  it("returns default prompt with empty custom agents array", () => {
    const config = createBardAgentWithOptions("claude-opus-4", undefined, null, [])
    expect(config.prompt).not.toContain("<CustomDelegation>")
    expect(config.prompt).toContain("Runtime fan-out is owned by Guild for direct")
  })

  it("includes multiple custom agents in delegation table", () => {
    const config = createBardAgentWithOptions("claude-opus-4", undefined, null, [
      {
        name: "code-reviewer",
        description: "Reviews code",
        metadata: {
          category: "advisor",
          cost: "CHEAP",
          triggers: [{ domain: "Code Review", trigger: "Quality review" }],
        },
      },
      {
        name: "compliance",
        description: "Checks compliance",
        metadata: {
          category: "advisor",
          cost: "CHEAP",
          triggers: [{ domain: "Compliance", trigger: "License checks" }],
        },
      },
    ])
    expect(config.prompt).toContain("code-reviewer")
    expect(config.prompt).toContain("compliance")
    expect(config.prompt).toContain("Code Review")
    expect(config.prompt).toContain("Compliance")
  })

  it("combines custom agents with fingerprint and disabled agents", () => {
    const config = createBardAgentWithOptions(
      "claude-opus-4",
      new Set(["warlock"]),
      {
        generatedAt: new Date().toISOString(),
        stack: [{ name: "bun", confidence: "high", evidence: "bun.lockb" }],
        isMonorepo: false,
        primaryLanguage: "typescript",
        packageManager: "bun",
      },
      [{
        name: "test-agent",
        description: "Test agent",
        metadata: {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "Testing", trigger: "Run tests" }],
        },
      }],
    )
    expect(config.prompt).toContain("<CustomDelegation>")
    expect(config.prompt).toContain("<ProjectContext>")
    expect(config.prompt).not.toContain("Use warlock")
  })

  it("sets mode to primary", () => {
    const config = createBardAgentWithOptions("claude-opus-4", undefined, null, [{
      name: "test",
      description: "Test",
      metadata: { category: "utility", cost: "CHEAP", triggers: [{ domain: "Test", trigger: "test" }] },
    }])
    expect(config.mode).toBe("primary")
  })
})

describe("wizard mode non-regression — automatic path produces no new effects", () => {
  it("Bard prompt only permits guild_spawn_wizard tool (no other wizard tools)", () => {
    const config = createBardAgent("claude-opus-4")
    const tools = config.tools ?? {}
    // Only guild_spawn_wizard should be set explicitly
    const toolKeys = Object.keys(tools)
    expect(toolKeys).toContain("guild_spawn_wizard")
    expect(tools.guild_spawn_wizard).toBe(true)
    // No other wizard-specific tools
    expect(toolKeys).not.toContain("spawnWizardSession")
    expect(toolKeys).not.toContain("wizardReturnHandoff")
  })

  it("Bard prompt never mentions effect type names (spawnWizardSession, wizardReturnHandoff)", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    expect(prompt).not.toContain("spawnWizardSession")
    expect(prompt).not.toContain("wizardReturnHandoff")
  })

  it("WizardMode section maps interactive → guild_spawn_wizard and automatic → call_guild_agent", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const wizardMode = prompt.slice(
      prompt.indexOf("<WizardMode>"),
      prompt.indexOf("</WizardMode>"),
    )

    // Interactive mode uses guild_spawn_wizard
    const interactiveLine = wizardMode.split("\n").find((l) => l.includes("MODE: interactive"))
    expect(interactiveLine).toBeDefined()
    expect(interactiveLine).toContain("guild_spawn_wizard")
    expect(interactiveLine).not.toContain("call_guild_agent")

    // Automatic mode uses call_guild_agent
    const automaticLine = wizardMode.split("\n").find((l) => l.includes("MODE: automatic"))
    expect(automaticLine).toBeDefined()
    expect(automaticLine).toContain("call_guild_agent")
    expect(automaticLine).not.toContain("guild_spawn_wizard")
  })

  it("Delegation section distinguishes interactive vs automatic flows for Wizard delegation", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const delegation = prompt.slice(
      prompt.indexOf("<Delegation>"),
      prompt.indexOf("</Delegation>"),
    )

    // Find Wizard-related delegation line
    const wizardLine = delegation.split("\n").find((l) => l.includes("Delegate to Wizard"))
    expect(wizardLine).toBeDefined()
    expect(wizardLine).toContain("interactive flow")
    expect(wizardLine).toContain("automatic flow")
    expect(wizardLine).toContain("guild_spawn_wizard")
    expect(wizardLine).toContain("call_guild_agent")
    // Must offer user choice before delegating
    expect(wizardLine).toContain("ask_user")
    expect(wizardLine).toContain("WizardMode")
  })

  it("automatic mode guidance never mentions guild_spawn_wizard or interactive session spawning", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string
    const wizardMode = prompt.slice(
      prompt.indexOf("<WizardMode>"),
      prompt.indexOf("</WizardMode>"),
    )

    // Automatic line should not use guild_spawn_wizard
    // And should not mention "separate session" or "spawn"
    const automaticLine = wizardMode.split("\n").find((l) => l.includes("MODE: automatic"))
    expect(automaticLine).not.toContain("guild_spawn_wizard")
    expect(automaticLine).not.toContain("separate")

    // The interactive line should be the only one mentioning guild_spawn_wizard
    const allGuildSpawnWizardMentions = wizardMode.split("\n").filter((l) => l.includes("guild_spawn_wizard"))
    // Should only appear in the interactive mode line
    expect(allGuildSpawnWizardMentions).toHaveLength(1)
    expect(allGuildSpawnWizardMentions[0]).toContain("MODE: interactive")
  })

  it("call_guild_agent is the ONLY tool named for automatic Wizard delegation", () => {
    const config = createBardAgent("claude-opus-4")
    const prompt = config.prompt as string

    // count mentions: call_guild_agent vs guild_spawn_wizard in automatic context
    const wizardMode = prompt.slice(
      prompt.indexOf("<WizardMode>"),
      prompt.indexOf("</WizardMode>"),
    )

    // In automatic line, ONLY call_guild_agent should appear (not guild_spawn_wizard)
    const automaticLine = wizardMode.split("\n").find((l) => l.includes("MODE: automatic"))
    expect(automaticLine).toContain("call_guild_agent")
    expect(automaticLine).not.toContain("guild_spawn_wizard")

    // In interactive line, ONLY guild_spawn_wizard should appear (not call_guild_agent)
    const interactiveLine = wizardMode.split("\n").find((l) => l.includes("MODE: interactive"))
    expect(interactiveLine).toContain("guild_spawn_wizard")
    expect(interactiveLine).not.toContain("call_guild_agent")
  })
})

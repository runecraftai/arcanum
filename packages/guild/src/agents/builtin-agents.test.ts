import { describe, it, expect } from "bun:test"
import { createBuiltinAgents, AGENT_METADATA } from "./builtin-agents"

const ALL_AGENT_NAMES = ["bard", "fighter", "ranger", "wizard", "rogue", "warlock", "cleric", "paladin"]

describe("createBuiltinAgents", () => {
  it("returns all 8 agents when none disabled", () => {
    const agents = createBuiltinAgents()
    for (const name of ALL_AGENT_NAMES) {
      expect(agents[name]).toBeDefined()
    }
    expect(Object.keys(agents)).toHaveLength(8)
  })

  it("excludes disabled agents", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["warlock", "rogue"] })
    expect(agents["warlock"]).toBeUndefined()
    expect(agents["rogue"]).toBeUndefined()
    expect(agents["bard"]).toBeDefined()
    expect(Object.keys(agents)).toHaveLength(6)
  })

  it("each agent has a model string", () => {
    const agents = createBuiltinAgents({ systemDefaultModel: "claude-3-5-sonnet" })
    for (const name of ALL_AGENT_NAMES) {
      const agent = agents[name]
      expect(agent).toBeDefined()
      expect(typeof agent.model).toBe("string")
      expect(agent.model!.length).toBeGreaterThan(0)
    }
  })

  it("applies agent model override from agentOverrides", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { bard: { model: "gpt-4o-custom" } },
      availableModels: new Set(["gpt-4o-custom"]),
    })
    expect(agents["bard"]?.model).toBe("gpt-4o-custom")
  })

  it("applies prompt_append from agentOverrides", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { wizard: { prompt_append: "EXTRA INSTRUCTIONS" } },
    })
    expect(agents["wizard"]?.prompt).toContain("EXTRA INSTRUCTIONS")
  })

  it("applies temperature override from agentOverrides", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { bard: { temperature: 0.3 } },
    })
    expect(agents["bard"]?.temperature).toBe(0.3)
  })

  it("applies modelOptions override to builtin subagents", () => {
    const agents = createBuiltinAgents({
      agentOverrides: {
        wizard: {
          modelOptions: {
            reasoningEffort: "high",
            reasoning: { effort: "medium" },
          },
        },
      },
    })
    const wizard = agents["wizard"] as { options?: Record<string, unknown> } | undefined
    expect(wizard?.options).toEqual({
      reasoningEffort: "high",
      reasoning: { effort: "medium" },
    })
  })

  it("binds approved guild skills to builtin agents", () => {
    const agents = createBuiltinAgents()

    expect(agents.bard?.skills).toEqual([
      "guild-init",
      "guild-load",
      "guild-scope",
      "guild-spec",
      "guild-plan",
      "guild-handoff",
      "guild-ship",
    ])
    expect(agents.fighter?.skills).toEqual([
      "guild-load",
      "guild-execute",
      "guild-verify",
      "guild-handoff",
    ])
    expect(agents.wizard?.skills).toEqual(["guild-load", "guild-scope", "guild-spec", "guild-plan"])
    expect(agents.rogue?.skills).toEqual(["guild-research"])
    expect(agents.warlock?.skills).toEqual(["guild-research"])
    expect(agents.ranger?.skills).toEqual(["guild-execute"])
    expect(agents.cleric?.skills).toEqual(["guild-review", "guild-verify"])
    expect(agents.paladin?.skills).toEqual(["guild-security"])
  })

  it("prepends resolved builtin skills to builtin prompts", () => {
    const agents = createBuiltinAgents({
      resolveSkills: (skillNames) => `SKILLS:${skillNames.join(",")}`,
    })

    expect(agents.bard?.prompt).toContain("SKILLS:guild-init,guild-load,guild-scope,guild-spec,guild-plan,guild-handoff,guild-ship")
    expect(agents.wizard?.prompt).toContain("SKILLS:guild-load,guild-scope,guild-spec,guild-plan")
  })

  it("generates visible review model variants from review_models", () => {
    const agents = createBuiltinAgents({
      agentOverrides: {
        cleric: {
          model: "openai/gpt-5.5",
          modelOptions: { reasoningEffort: "xhigh" },
          review_models: ["opencode-go/kimi-k2.6", "opencode-go/glm-5.1"],
        },
      },
    })

    const kimi = agents["cleric-review-opencode-go-kimi-k2-6"] as (typeof agents["cleric"] & { options?: Record<string, unknown> }) | undefined
    const glm = agents["cleric-review-opencode-go-glm-5-1"]

    expect(kimi).toBeDefined()
    expect(kimi?.model).toBe("opencode-go/kimi-k2.6")
    expect(kimi?.mode).toBe("subagent")
    expect(kimi?.description).toContain("cleric @ opencode-go/kimi-k2.6")
    expect(kimi?.prompt).toContain("visible independent CLERIC review variant")
    expect(kimi?.options).toBeUndefined()

    expect(glm).toBeDefined()
    expect(glm?.model).toBe("opencode-go/glm-5.1")
  })

  it("generates unique review variant keys when sanitized model names collide", () => {
    const models = ["provider/model@v1", "provider/model.v1", "provider/model+v1"]
    const agents = createBuiltinAgents({
      agentOverrides: {
        cleric: { review_models: models },
      },
    })

    const keys = [
      "cleric-review-provider-model-v1",
      "cleric-review-provider-model-v1-2",
      "cleric-review-provider-model-v1-3",
    ]
    const generatedKeys = Object.entries(agents)
      .filter(([, agent]) => models.includes(agent.model ?? ""))
      .map(([key]) => key)

    expect(generatedKeys).toEqual(keys)
    expect(keys.map((key) => agents[key]?.model)).toEqual(models)
  })

  it("omits visible review variants when their base agent is disabled", () => {
    const agents = createBuiltinAgents({
      disabledAgents: ["cleric"],
      agentOverrides: {
        cleric: { review_models: ["opencode-go/kimi-k2.6"] },
      },
    })

    expect(agents["cleric"]).toBeUndefined()
    expect(agents["cleric-review-opencode-go-kimi-k2-6"]).toBeUndefined()
  })

  it("resolves override skills and prepends them to the agent prompt", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["test-skill"] } },
      resolveSkills: () => "SKILL_CONTENT",
    })
    expect(agents["wizard"]?.prompt).toMatch(/^SKILL_CONTENT/)
  })

  it("override skills appear before the base prompt content", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["test-skill"] } },
      resolveSkills: () => "SKILL_CONTENT",
    })
    const prompt = agents["wizard"]?.prompt ?? ""
    const skillIndex = prompt.indexOf("SKILL_CONTENT")
    const baseIndex = prompt.indexOf("Wizard — interactive planning specialist for Guild.")
    expect(skillIndex).toBeGreaterThanOrEqual(0)
    expect(baseIndex).toBeGreaterThan(skillIndex)
  })

  it("override skills work alongside prompt_append", () => {
    const agents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["test-skill"], prompt_append: "APPENDED" } },
      resolveSkills: () => "SKILL_CONTENT",
    })
    const prompt = agents["wizard"]?.prompt ?? ""
    expect(prompt.startsWith("SKILL_CONTENT")).toBe(true)
    expect(prompt.endsWith("APPENDED")).toBe(true)
    expect(prompt.indexOf("Wizard — interactive planning specialist for Guild.")).toBeGreaterThan(0)
  })

  it("empty skills array does not suppress builtin skill content", () => {
    const defaultAgents = createBuiltinAgents({
      resolveSkills: () => "SKILL_CONTENT",
    })
    const overrideAgents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: [] } },
      resolveSkills: () => "SKILL_CONTENT",
    })
    expect(overrideAgents["wizard"]?.prompt).toBe(defaultAgents["wizard"]?.prompt)
  })

  it("resolveSkills returning empty string does not affect the prompt", () => {
    const defaultAgents = createBuiltinAgents()
    const overrideAgents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["disabled-skill"] } },
      resolveSkills: () => "",
    })
    expect(overrideAgents["wizard"]?.prompt).toBe(defaultAgents["wizard"]?.prompt)
  })

  it("disabledSkills set is forwarded to resolveSkills", () => {
    let capturedDisabledSkills: Set<string> | undefined
    createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["test-skill"] } },
      disabledSkills: new Set(["blocked-skill"]),
      resolveSkills: (_names, disabled) => { capturedDisabledSkills = disabled; return "SKILL_CONTENT" },
    })
    expect(capturedDisabledSkills).toBeDefined()
    expect(capturedDisabledSkills?.has("blocked-skill")).toBe(true)
  })

  it("skills are no-op when resolveSkills is not provided", () => {
    const defaultAgents = createBuiltinAgents()
    const overrideAgents = createBuiltinAgents({
      agentOverrides: { wizard: { skills: ["test-skill"] } },
      // resolveSkills intentionally omitted
    })
    expect(overrideAgents["wizard"]?.prompt).toBe(defaultAgents["wizard"]?.prompt)
  })

  it("rogue agent has denied write tools", () => {
    const agents = createBuiltinAgents()
    const rogue = agents["rogue"]
    expect(rogue).toBeDefined()
    // rogue factory sets tools: { write: false, edit: false }
    const tools = (rogue as Record<string, unknown>)["tools"] as Record<string, boolean> | undefined
    if (tools) {
      expect(tools["write"]).toBe(false)
    }
  })

  it("each agent has a description", () => {
    const agents = createBuiltinAgents()
    for (const name of ALL_AGENT_NAMES) {
      const agent = agents[name]
      expect(agent).toBeDefined()
      expect(typeof agent.description).toBe("string")
      expect(agent.description!.length).toBeGreaterThan(0)
    }
  })

  it("each agent has a mode", () => {
    const agents = createBuiltinAgents()
    const expectedModes: Record<string, string> = {
      bard: "primary",
      fighter: "primary",
      ranger: "all",
      wizard: "all",
      rogue: "subagent",
      warlock: "subagent",
      cleric: "subagent",
      paladin: "subagent",
    }
    for (const name of ALL_AGENT_NAMES) {
      const agent = agents[name]
      expect(agent).toBeDefined()
      expect(agent.mode).toBe(expectedModes[name])
    }
  })
})

describe("AGENT_METADATA", () => {
  it("has entries for all 8 agents", () => {
    for (const name of ALL_AGENT_NAMES) {
      expect(AGENT_METADATA[name as keyof typeof AGENT_METADATA]).toBeDefined()
    }
  })

  it("each metadata has triggers array", () => {
    for (const name of ALL_AGENT_NAMES) {
      const meta = AGENT_METADATA[name as keyof typeof AGENT_METADATA]
      expect(Array.isArray(meta.triggers)).toBe(true)
      expect(meta.triggers.length).toBeGreaterThan(0)
    }
  })

  it("bard has keyTrigger for ultrawork", () => {
    expect(AGENT_METADATA.bard.keyTrigger).toContain("ultrawork")
  })

  it("paladin can be disabled like any other agent", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["paladin"] })
    expect(agents["paladin"]).toBeUndefined()
    expect(Object.keys(agents)).toHaveLength(7)
  })

  it("any agent can be disabled via disabledAgents", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["warlock"] })
    expect(agents["warlock"]).toBeUndefined()
  })

  it("bard prompt strips references to disabled agents", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["warlock", "rogue"] })
    const prompt = agents["bard"]?.prompt ?? ""
    expect(prompt).not.toContain("delegate to Warlock")
    expect(prompt).not.toContain("delegate to Rogue")
    // Paladin references should still be present (not disabled in this test)
    expect(prompt).toContain("delegate to Paladin")
  })

  it("fighter prompt adapts PostExecutionReview when cleric disabled", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["cleric"] })
    const prompt = agents["fighter"]?.prompt ?? ""
    const reviewSection = prompt.slice(
      prompt.indexOf("<PostExecutionReview>"),
      prompt.indexOf("</PostExecutionReview>"),
    )
    // Should not include Cleric delegation when cleric is disabled
    expect(reviewSection).not.toContain('Delegate to Cleric')
  })

  it("fighter PlanExecution section omits review references when cleric disabled", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["cleric"] })
    const prompt = agents["fighter"]?.prompt ?? ""
    const planSection = prompt.slice(
      prompt.indexOf("<PlanExecution>"),
      prompt.indexOf("</PlanExecution>"),
    )
    expect(planSection).not.toContain("Weft")
    expect(planSection).not.toContain("Paladin")
  })

  it("fighter PlanExecution section stays execution-focused by default", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["fighter"]?.prompt ?? ""
    const planSection = prompt.slice(
      prompt.indexOf("<PlanExecution>"),
      prompt.indexOf("</PlanExecution>"),
    )
    expect(planSection).not.toContain("Weft")
    expect(planSection).not.toContain("Paladin")
  })

  it("threads continuation config into the fighter factory", () => {
    const agents = createBuiltinAgents({
      continuation: {
        recovery: { compaction: true },
        idle: { enabled: false, work: false, workflow: false, todo_prompt: false },
      },
    })
    const prompt = agents["fighter"]?.prompt ?? ""
    expect(prompt).toContain("<PlanExecution>")
    expect(prompt).toContain("<Style>")
    expect(prompt).toContain("<Continuation>")
  })

  it("wizard prompt strips rogue reference when rogue disabled", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["rogue"] })
    const prompt = agents["wizard"]?.prompt ?? ""
    expect(prompt).not.toContain("rogue")
    expect(prompt).not.toContain("Thread")
    // warlock should still be present
    expect(prompt).toContain("warlock")
  })

  it("wizard prompt strips warlock reference when warlock disabled", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["warlock"] })
    const prompt = agents["wizard"]?.prompt ?? ""
    expect(prompt).not.toContain("warlock")
    expect(prompt).not.toContain("Spindle")
    // rogue should still be present
    expect(prompt).toContain("rogue")
  })

  it("wizard prompt references guild-scope, guild-plan, guild-spec, guild-handoff skills", () => {
    const agents = createBuiltinAgents({
      resolveSkills: (names) => `SKILLS:${names.join(",")}`,
    })
    const prompt = agents["wizard"]?.prompt ?? ""
    // Skill content is prepended; the base prompt should reference the skills by name
    expect(prompt).toContain("guild-scope")
    expect(prompt).toContain("guild-plan")
    expect(prompt).toContain("guild-spec")
    expect(prompt).toContain("guild-handoff")
    // Inline artifact tier block removed — scope is delegated to guild-scope
    expect(prompt).not.toContain("SMALL (1-3 files")
    expect(prompt).not.toContain("MEDIUM (4-10 files")
    expect(prompt).not.toContain("LARGE (10+ files")
    // Inline question tool rules consolidated into a concise pointer
    expect(prompt).not.toContain("Iteration cadence")
    expect(prompt).toContain("**ask_user tool**")
    expect(prompt).toContain("**Artifact scope**")
    expect(prompt).toContain("**Plan structure**")
    expect(prompt).toContain("**Pause/resume**")
  })

  it("wizard prompt delegates artifact scope to guild-skill, not inline tiers", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["wizard"]?.prompt ?? ""
    // The prompt should reference guild-scope for artifact decisions
    expect(prompt).toContain("See guild-scope")
    // Should NOT contain inline size-based tiers (the old approach)
    expect(prompt).not.toContain("SMALL")
    expect(prompt).not.toContain("MEDIUM")
    expect(prompt).not.toContain("LARGE")
    expect(prompt).not.toContain("1-3 files")
    expect(prompt).not.toContain("4-10 files")
    expect(prompt).not.toContain("10+ files")
  })

  it("wizard prompt delegates pause/resume to guild-handoff skill", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["wizard"]?.prompt ?? ""
    expect(prompt).toContain("See guild-handoff")
    expect(prompt).toContain(".guild/plans/<slug>/state.md")
  })

  it("wizard prompt delegates plan structure to guild-plan skill", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["wizard"]?.prompt ?? ""
    expect(prompt).toContain("See guild-plan")
    expect(prompt).toContain("**What**, **Files**, and **Acceptance**")
  })

  it("wizard agent is skill-driven: skills are bound and base prompt references them", () => {
    const agents = createBuiltinAgents()
    const wizard = agents["wizard"]
    expect(wizard?.skills).toEqual(["guild-load", "guild-scope", "guild-spec", "guild-plan"])

    // The base prompt references the skills it directly uses in its workflow
    const prompt = wizard?.prompt ?? ""
    // guild-scope for artifact scope decisions
    expect(prompt).toContain("guild-scope")
    // guild-plan for plan structure
    expect(prompt).toContain("guild-plan")
    // guild-handoff for pause/resume boundaries
    expect(prompt).toContain("guild-handoff")
    // Guild skills are now named explicitly to reinforce first-class usage
    expect(prompt).toContain("guild-spec")
    expect(prompt).toContain("guild-load")
  })

  it("wizard prompt is under 60 lines (base prompt only, excluding skill content)", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["wizard"]?.prompt ?? ""
    // Extract base prompt (after skill content is prepended)
    const roleStart = prompt.indexOf("<Role>")
    const constraintsEnd = prompt.lastIndexOf("</Constraints>")
    const styleEnd = prompt.lastIndexOf("</Style>")
    const endMarker = styleEnd > 0 ? styleEnd : (constraintsEnd > 0 ? constraintsEnd + 14 : prompt.length)
    const basePrompt = prompt.slice(roleStart, endMarker > 0 ? endMarker : prompt.length)
    expect(basePrompt.split("\n").length).toBeLessThan(60)
  })

  it("wizard prompt is materially shorter than the original inline version", () => {
    const agents = createBuiltinAgents()
    const prompt = agents["wizard"]?.prompt ?? ""
    // The old prompt had ~120 lines with a full markdown template block.
    // The new prompt should be under 60 lines (prompt text only, excluding skill content).
    // Extract just the base prompt text by finding the Role section.
    const roleStart = prompt.indexOf("<Role>")
    const styleEnd = prompt.lastIndexOf("</Style>")
    const basePrompt = prompt.slice(roleStart, styleEnd > 0 ? styleEnd + 9 : prompt.length)
    expect(basePrompt.split("\n").length).toBeLessThan(60)
  })

  it("cleric prompt strips wizard reference when wizard disabled", () => {
    const agents = createBuiltinAgents({ disabledAgents: ["wizard"] })
    const prompt = agents["cleric"]?.prompt ?? ""
    expect(prompt).not.toContain("Wizard")
    expect(prompt).not.toContain("wizard")
  })

  it("all agent prompts are unmodified when no agents disabled", () => {
    const withDisabled = createBuiltinAgents({ disabledAgents: [] })
    const withoutDisabled = createBuiltinAgents()
    for (const name of ALL_AGENT_NAMES) {
      expect(withDisabled[name]?.prompt).toBe(withoutDisabled[name]?.prompt)
    }
  })

  it("registers ranger-{category} agents for categories with patterns", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: {
          model: "fast-model",
          prompt_append: "React expert",
          patterns: ["*.tsx", "*.css"],
        },
      },
      availableModels: new Set(["fast-model"]),
    })
    expect(agents["ranger"]).toBeDefined()
    expect(agents["ranger-frontend"]).toBeDefined()
    expect(agents["ranger-frontend"]?.model).toBe("fast-model")
    expect(agents["ranger-frontend"]?.prompt).toContain("React expert")
  })

  it("registers ranger-{category} agents for categories without patterns", () => {
    const agents = createBuiltinAgents({
      categories: {
        backend: { model: "claude-opus-4", temperature: 0.3 },
      },
      availableModels: new Set(["claude-opus-4"]),
    })
    expect(agents["ranger"]).toBeDefined()
    expect(agents["ranger-backend"]).toBeDefined()
  })

  it("category ranger has category-specific description", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"], model: "fast-model" },
      },
      availableModels: new Set(["fast-model"]),
    })
    const desc = agents["ranger-frontend"]?.description ?? ""
    expect(desc).toContain("frontend")
    expect(desc).not.toBe(agents["ranger"]?.description)
  })

  it("base ranger agent always registered even when categories have patterns", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"], model: "fast-model" },
      },
      availableModels: new Set(["fast-model"]),
    })
    expect(agents["ranger"]).toBeDefined()
  })

  it("skips registering only disabled category ranger agents", () => {
    const agents = createBuiltinAgents({
      disabledAgents: ["ranger-frontend"],
      categories: {
        frontend: { patterns: ["*.tsx"], model: "fast-model" },
        backend: { patterns: ["*.go"], model: "fast-model" },
      },
      availableModels: new Set(["fast-model"]),
    })

    expect(agents["ranger"]).toBeDefined()
    expect(agents["ranger-frontend"]).toBeUndefined()
    expect(agents["ranger-backend"]).toBeDefined()
  })

  it("category ranger inherits base ranger tools", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"] },
      },
    })
    expect(agents["ranger-frontend"]?.tools).toEqual(agents["ranger"]?.tools)
  })

  it("category ranger merges tool overrides with base ranger tools", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: {
          patterns: ["*.tsx"],
          tools: { web_search: true },
        },
      },
    })
    expect(agents["ranger-frontend"]?.tools?.["call_guild_agent"]).toBe(false)
    expect(agents["ranger-frontend"]?.tools?.["web_search"]).toBe(true)
  })

  it("category ranger agents have mode 'subagent'", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"] },
        backend: { patterns: ["*.go"], model: "claude-opus-4" },
      },
      availableModels: new Set(["claude-opus-4"]),
    })
    expect(agents["ranger-frontend"]?.mode).toBe("subagent")
    expect(agents["ranger-backend"]?.mode).toBe("subagent")
  })

  it("base ranger agent mode is unchanged ('all') when categories are registered", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"] },
      },
    })
    expect(agents["ranger"]?.mode).toBe("all")
  })

  it("creates category ranger agent with category-specific description", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: {
          patterns: ["*.tsx"],
        },
      },
    })
    expect(agents["ranger-frontend"]?.description).toContain("frontend")
    expect(agents["ranger-frontend"]?.description).not.toBe(agents["ranger"]?.description)
  })

  it("category ranger agents have mode 'subagent'", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"] },
        backend: { model: "claude-opus-4" },
      },
      availableModels: new Set(["claude-opus-4"]),
    })
    expect(agents["ranger-frontend"]?.mode).toBe("subagent")
    expect(agents["ranger-backend"]?.mode).toBe("subagent")
  })

  it("base ranger agent mode is unchanged ('all') when categories are registered", () => {
    const agents = createBuiltinAgents({
      categories: {
        frontend: { patterns: ["*.tsx"] },
      },
    })
    expect(agents["ranger"]?.mode).toBe("all")
  })
})

/**
 * Mode 2 prompt composition tests — deterministic assertions against the
 * composed Tapestry prompt for categorized delegation.
 *
 * These tests verify the prompt *says the right things* without calling an LLM.
 */

import { describe, it, expect } from "bun:test"
import {
  composeFighterPrompt,
  buildTapestryCategoryRoutingSection,
} from "./prompt-composer"

function getSection(prompt: string, tagName: string): string | null {
  const startTag = `<${tagName}>`
  const endTag = `</${tagName}>`
  const startIndex = prompt.indexOf(startTag)

  if (startIndex === -1) {
    return null
  }

  const endIndex = prompt.indexOf(endTag, startIndex)
  return prompt.slice(startIndex, endIndex + endTag.length)
}

describe("Mode 2 prompt composition — category routing section", () => {
  it("routing section instructs routing to ranger-frontend for *.tsx files", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx", "*.css"] },
    })
    expect(section).toContain("ranger-frontend")
    expect(section).toContain("*.tsx")
    expect(section).toContain("*.css")
  })

  it("routing section instructs explicit tag override takes priority over file patterns", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
      backend: { patterns: ["*.go"] },
    })
    expect(section).toContain("[category:")
    // Explicit tag should be listed as highest priority
    const priorityIdx = section!.indexOf("ROUTING PRIORITY")
    const tagIdx = section!.indexOf("[category:")
    expect(tagIdx).toBeGreaterThan(priorityIdx)
  })

  it("routing section instructs overlapping file-wizard matches use the first declared category", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["src/**"] },
      backend: { patterns: ["src/**/*.ts"] },
    })

    expect(section).toContain(
      "Match task's **Files** against category patterns in config declaration order → use the first matching `ranger-{category}`",
    )
    expect(section).toContain(
      "If multiple categories match the same task's files, the earliest declared matching category wins; later matches do not override earlier ones",
    )

    const frontendIdx = section!.indexOf("ranger-frontend: patterns [src/**]")
    const backendIdx = section!.indexOf("ranger-backend: patterns [src/**/*.ts]")
    expect(frontendIdx).toBeGreaterThan(-1)
    expect(frontendIdx).toBeLessThan(backendIdx)
  })

  it("routing section instructs fallback to generic ranger for unmatched files", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
    })
    expect(section).toContain("ranger")
    expect(section).toContain("fallback")
  })

  it("routing section instructs spawning different category shuttles in parallel for disjoint tasks", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
      backend: { patterns: ["*.go"] },
    })
    expect(section).toContain("ranger-frontend")
    expect(section).toContain("ranger-backend")
    expect(section).toContain("parallel")
  })

  it("routing section states no-wizard categories are manual-only and excluded from file-wizard auto-routing", () => {
    const section = buildTapestryCategoryRoutingSection({
      frontend: { patterns: ["*.tsx"] },
      backend: { model: "claude-opus-4", temperature: 0.3 },
    })
    expect(section).toContain(
      "ranger-backend: (no file patterns — explicit/manual-use only; never auto-select from file matches)",
    )
    expect(section).toContain(
      "Categories without file patterns are explicit/manual-use only and are never eligible for file-wizard auto-routing",
    )
  })

  it("routing section for manual-only categories does not include file-match routing instructions", () => {
    const section = buildTapestryCategoryRoutingSection({
      backend: { model: "claude-opus-4", temperature: 0.3 },
    })

    expect(section).toContain("ranger-backend")
    expect(section).toContain("explicit/manual-use only")
    expect(section).not.toContain("ROUTING PRIORITY")
    expect(section).not.toContain("Match task's **Files** against category patterns in config declaration order")
  })
})

describe("Mode 2 prompt composition — full composed prompt", () => {
  it("includes CategoryRouting in the composed prompt when at least one category has patterns", () => {
    const prompt = composeFighterPrompt({
      categories: {
        frontend: { patterns: ["*.tsx", "*.css"], prompt_append: "React expert" },
        backend: { model: "claude-opus-4", temperature: 0.3 },
      },
    })
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")
    const delegationSection = getSection(prompt, "Delegation")

    expect(categoryRoutingSection).not.toBeNull()
    expect(categoryRoutingSection).toContain("ranger-frontend")
    expect(categoryRoutingSection).toContain("*.tsx")
    expect(categoryRoutingSection).toContain("ranger-backend")
    expect(categoryRoutingSection).toContain("explicit/manual-use only")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain("ranger-frontend")
    expect(delegationSection).not.toContain("ranger-{category}")
    expect(delegationSection).not.toContain("ranger-backend")
  })

  it("composed prompt with categories uses concrete agent names in delegation section", () => {
    const prompt = composeFighterPrompt({
      categories: { frontend: { patterns: ["*.tsx"] } },
    })
    const delegationSection = prompt.slice(prompt.indexOf("<Delegation>"), prompt.indexOf("</Delegation>"))
    expect(delegationSection).toContain("ranger-frontend")
    expect(delegationSection).not.toContain("ranger-{category}")
  })

  it("omits CategoryRouting and keeps plain ranger delegation when no categories are provided", () => {
    const prompt = composeFighterPrompt()
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")
    const delegationSection = getSection(prompt, "Delegation")

    expect(categoryRoutingSection).toBeNull()
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain('subagent_type="ranger"')
    expect(delegationSection).not.toContain("ranger-{category}")
  })

  it("CategoryRouting section appears before PlanExecution", () => {
    const prompt = composeFighterPrompt({
      categories: { frontend: { patterns: ["*.tsx"] } },
    })
    const categoryRoutingIdx = prompt.indexOf("<CategoryRouting>")
    const planExecIdx = prompt.indexOf("<PlanExecution>")
    expect(categoryRoutingIdx).toBeGreaterThan(-1)
    expect(categoryRoutingIdx).toBeLessThan(planExecIdx)
  })

  it("includes CategoryRouting but keeps plain ranger delegation when categories have no patterns", () => {
    const prompt = composeFighterPrompt({
      categories: {
        backend: { model: "claude-opus-4", temperature: 0.3 },
      },
    })
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")
    const delegationSection = getSection(prompt, "Delegation")

    expect(categoryRoutingSection).not.toBeNull()
    expect(categoryRoutingSection).toContain("ranger-backend")
    expect(categoryRoutingSection).toContain("explicit/manual-use only")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain('subagent_type="ranger"')
    expect(delegationSection).not.toContain("ranger-{category}")
    expect(delegationSection).not.toContain("ranger-backend")
    expect(categoryRoutingSection).not.toContain("Match task's **Files** against category patterns in config declaration order")
  })

  it("composed prompt never auto-selects no-wizard categories from file matches", () => {
    const prompt = composeFighterPrompt({
      categories: {
        frontend: { patterns: ["*.tsx"] },
        backend: { model: "claude-opus-4", temperature: 0.3 },
      },
    })
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")
    const delegationSection = getSection(prompt, "Delegation")

    expect(categoryRoutingSection).not.toBeNull()
    expect(categoryRoutingSection).toContain(
      "2. Match task's **Files** against category patterns in config declaration order → use the first matching `ranger-{category}`",
    )
    expect(categoryRoutingSection).toContain("ranger-backend: (no file patterns — explicit/manual-use only; never auto-select from file matches)")
    expect(delegationSection).not.toBeNull()
    expect(delegationSection).toContain("ranger-frontend")
    expect(delegationSection).not.toContain("ranger-backend")
  })

  it("composed prompt keeps earlier matching categories ahead of later overlapping matches", () => {
    const prompt = composeFighterPrompt({
      categories: {
        frontend: { patterns: ["src/**"] },
        backend: { patterns: ["src/**/*.ts"] },
      },
    })
    const categoryRoutingSection = getSection(prompt, "CategoryRouting")

    expect(categoryRoutingSection).not.toBeNull()
    expect(categoryRoutingSection).toContain(
      "If multiple categories match the same task's files, the earliest declared matching category wins; later matches do not override earlier ones",
    )

    const frontendIdx = categoryRoutingSection!.indexOf("ranger-frontend: patterns [src/**]")
    const backendIdx = categoryRoutingSection!.indexOf("ranger-backend: patterns [src/**/*.ts]")
    expect(frontendIdx).toBeGreaterThan(-1)
    expect(frontendIdx).toBeLessThan(backendIdx)
  })
})

import { describe, it, expect } from "bun:test"
import { resolve } from "path"
import { scanDirectory } from "./discovery"

const BUILTIN_SKILLS_DIR = resolve(import.meta.dir, "..", "..", "..", "skills")

const EXPECTED_BUILTIN_SKILLS = [
  "guild-commit-learning",
  "guild-configurator",
  "guild-execute",
  "guild-handoff",
  "guild-init",
  "guild-load",
  "guild-plan",
  "guild-recon",
  "guild-research",
  "guild-review",
  "guild-scope",
  "guild-security",
  "guild-ship",
  "guild-spec",
  "guild-verify",
]

describe("builtin skill catalog", () => {
  it("discovers all guild builtin skills with valid frontmatter names", () => {
    const skills = scanDirectory({ directory: BUILTIN_SKILLS_DIR, scope: "builtin" })
    const names = skills.map((skill) => skill.name).sort()

    expect(names).toEqual([...EXPECTED_BUILTIN_SKILLS].sort())
    expect(skills).toHaveLength(EXPECTED_BUILTIN_SKILLS.length)
    for (const skill of skills) {
      expect(skill.scope).toBe("builtin")
      expect(skill.description.length > 0).toBe(true)
    }
  })
})

import { describe, it, expect } from "bun:test"
import { buildVerificationReminder } from "./verification-reminder"

describe("buildVerificationReminder", () => {
  it("returns non-null verificationPrompt", () => {
    const result = buildVerificationReminder({})
    expect(result.verificationPrompt).not.toBeNull()
    expect(typeof result.verificationPrompt).toBe("string")
  })

  it("includes plan context when planName and progress provided", () => {
    const result = buildVerificationReminder({
      planName: "my-feature",
      progress: { total: 10, completed: 5 },
    })
    expect(result.verificationPrompt).toContain("my-feature")
    expect(result.verificationPrompt).toContain("5/10")
  })

  it("omits plan context when no planName provided", () => {
    const result = buildVerificationReminder({})
    expect(result.verificationPrompt).not.toContain("**Plan**")
  })

  it("omits plan context when planName provided but no progress", () => {
    const result = buildVerificationReminder({ planName: "orphan-plan" })
    expect(result.verificationPrompt).not.toContain("**Plan**")
  })

  it("prompt mentions cleric agent", () => {
    const result = buildVerificationReminder({})
    expect(result.verificationPrompt).toContain("cleric")
  })

  it("prompt mentions git diff", () => {
    const result = buildVerificationReminder({})
    expect(result.verificationPrompt).toContain("git diff")
  })

  it("prompt uses mandatory language for paladin delegation", () => {
    const result = buildVerificationReminder({})
    expect(result.verificationPrompt).toContain("MUST delegate")
    expect(result.verificationPrompt).toContain("NOT optional")
  })

  it("prompt contains all security trigger keywords for paladin", () => {
    const result = buildVerificationReminder({})
    const triggers = ["auth", "crypto", "certificates", "tokens", "signatures", "input validation"]
    for (const trigger of triggers) {
      expect(result.verificationPrompt).toContain(trigger)
    }
  })
})

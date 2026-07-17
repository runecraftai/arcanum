/**
 * End-to-end workflow tests for the full Guild orchestration lifecycle.
 *
 * Exercises the complete pipeline:
 *   Wizard (plan) → /start-work → Tapestry (execute) → Idle/Resume → Weft (review)
 *
 * Uses real hook functions and real file I/O in isolated temp directories.
 * No mocking of internals.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

import { handleStartWork } from "./hooks/start-work-hook"
import { checkContinuation } from "./hooks/work-continuation"
import { checkRangerWrite } from "./hooks/ranger-md-only"
import { buildVerificationReminder } from "./hooks/verification-reminder"
import { createHooks } from "./hooks/create-hooks"
import { DEFAULT_CONTINUATION_CONFIG } from "./config/continuation"

import {
  readWorkState,
  writeWorkState,
  createWorkState,
  appendSessionId,
  getPlanProgress,
} from "./features/work-state/storage"
import { PLANS_DIR } from "./features/work-state/constants"

import { createClericAgent } from "./agents/cleric"
import { createPaladinAgent } from "./agents/paladin"
import { createBardAgent } from "./agents/bard"
import { createFighterAgent } from "./agents/fighter"
import { createToolPermissions } from "./tools/permissions"

// ---------------------------------------------------------------------------
// Test scaffolding
// ---------------------------------------------------------------------------

let testDir: string

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "guild-e2e-"))
})

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a plan file in the test directory's .guild/plans/ folder. */
function createPlanFile(name: string, content: string): string {
  const plansDir = join(testDir, PLANS_DIR)
  mkdirSync(plansDir, { recursive: true })
  const filePath = join(plansDir, `${name}.md`)
  writeFileSync(filePath, content, "utf-8")
  return filePath
}

/** Build a /start-work prompt that contains the required <session-context> tag. */
function makeStartWorkPrompt(planName: string = ""): string {
  return `<command-instruction>Execute plan</command-instruction>
<session-context>Session ID: sess_test  Timestamp: 2026-01-01</session-context>
<user-request>${planName}</user-request>`
}

/** Build a structurally valid plan file content with the given checkbox lines in ## TODOs. */
function makeValidPlanContent(checkboxLines: string): string {
  return `## TL;DR\n> **Summary**: A test plan.\n> **Estimated Effort**: Quick\n\n## TODOs\n${checkboxLines}\n\n## Verification\n- [ ] All done\n`
}

/**
 * Mark the nth unchecked `- [ ]` task as complete in a plan file.
 * taskIndex is 0-based.
 */
function markTaskComplete(planPath: string, taskIndex: number): void {
  let content = readFileSync(planPath, "utf-8")
  let count = 0
  content = content.replace(/^([-*])\s*\[\s*\]/gm, (match, bullet) => {
    if (count === taskIndex) {
      count++
      return `${bullet} [x]`
    }
    count++
    return match
  })
  writeFileSync(planPath, content, "utf-8")
}

// ---------------------------------------------------------------------------
// Phase 1: Plan Creation → /start-work → Agent Switch
// ---------------------------------------------------------------------------

describe("Phase 1: Plan to Execution", () => {
  it("full flow: create plan → /start-work → switches to fighter and creates state", () => {
    createPlanFile(
      "auth-feature",
      makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"),
    )

    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    expect(result.switchAgent).toBe("fighter")
    expect(result.contextInjection).toContain("Starting Plan: auth-feature")
    expect(result.contextInjection).toContain("0/4 tasks completed")

    const state = readWorkState(testDir)
    expect(state).not.toBeNull()
    expect(state!.plan_name).toBe("auth-feature")
    expect(state!.session_ids).toEqual(["sess_1"])
    expect(state!.agent).toBe("fighter")
    expect(state!.active_plan).toContain("auth-feature.md")
  })

  it("explicit plan selection with multiple plans", () => {
    createPlanFile("plan-alpha", makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2"))
    createPlanFile("plan-beta", makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"))

    const result = handleStartWork({
      promptText: makeStartWorkPrompt("plan-beta"),
      sessionId: "sess_1",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("Starting Plan: plan-beta")

    const state = readWorkState(testDir)
    expect(state!.plan_name).toBe("plan-beta")
    expect(state!.active_plan).not.toContain("alpha")
  })

  it("no plans → instructs to use Wizard agent", () => {
    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("No Plans Found")
    expect(result.contextInjection).toContain("Wizard")
    expect(result.switchAgent).toBe("fighter")
    expect(readWorkState(testDir)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Phase 2: Work Progress Tracking
// ---------------------------------------------------------------------------

describe("Phase 2: Work Progress Tracking", () => {
  it("progress updates as checkboxes are marked complete", () => {
    const planPath = createPlanFile(
      "progress-plan",
      "# Plan\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n- [ ] Task 4\n",
    )

    // Start: 0/4
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_1", directory: testDir })
    expect(getPlanProgress(planPath)).toMatchObject({ total: 4, completed: 0, isComplete: false })

    // Mark task 0
    markTaskComplete(planPath, 0)
    expect(getPlanProgress(planPath)).toMatchObject({ total: 4, completed: 1, isComplete: false })

    // Mark tasks 1 and 2
    markTaskComplete(planPath, 0) // now index 0 among remaining unchecked
    markTaskComplete(planPath, 0)
    expect(getPlanProgress(planPath)).toMatchObject({ total: 4, completed: 3, isComplete: false })

    // Mark final task
    markTaskComplete(planPath, 0)
    expect(getPlanProgress(planPath)).toMatchObject({ total: 4, completed: 4, isComplete: true })
  })

  it("verification reminder includes progress context and references cleric", () => {
    const result = buildVerificationReminder({
      planName: "my-plan",
      progress: { total: 5, completed: 2 },
    })

    expect(result.verificationPrompt).not.toBeNull()
    expect(result.verificationPrompt).toContain("my-plan")
    expect(result.verificationPrompt).toContain("2/5")
    expect(result.verificationPrompt!.toLowerCase()).toContain("cleric")
  })
})

// ---------------------------------------------------------------------------
// Phase 3: Session Idle → Work Continuation
// ---------------------------------------------------------------------------

describe("Phase 3: Session Idle and Continuation", () => {
  it("idle session with active incomplete plan gets continuation prompt", () => {
    const planPath = createPlanFile(
      "idle-plan",
      makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"),
    )
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_1", directory: testDir })

    // Mark 1 complete
    markTaskComplete(planPath, 0)

    const result = checkContinuation({ sessionId: "sess_1", directory: testDir })
    expect(result.continuationPrompt).not.toBeNull()
    expect(result.continuationPrompt).toContain("idle-plan")
    expect(result.continuationPrompt).toContain("1/4")
    expect(result.continuationPrompt).toContain("3 remaining")
  })

  it("idle session with complete plan gets no continuation", () => {
    const planPath = createPlanFile("done-plan", "# Done\n- [ ] Task 1\n- [ ] Task 2\n")
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_1", directory: testDir })

    markTaskComplete(planPath, 0)
    markTaskComplete(planPath, 0)

    const result = checkContinuation({ sessionId: "sess_1", directory: testDir })
    expect(result.continuationPrompt).toBeNull()
  })

  it("idle session with no work state gets no continuation", () => {
    const result = checkContinuation({ sessionId: "sess_1", directory: testDir })
    expect(result.continuationPrompt).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Phase 4: Session Resume
// ---------------------------------------------------------------------------

describe("Phase 4: Session Resume", () => {
  it("new session resumes incomplete plan and appends session ID", () => {
    const planPath = createPlanFile(
      "resume-plan",
      makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"),
    )
    // Start with original session
    handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_original",
      directory: testDir,
    })
    markTaskComplete(planPath, 0)

    // New session resumes
    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_new",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("Resuming Plan: resume-plan")
    expect(result.contextInjection).toContain("1/4 tasks completed")

    const state = readWorkState(testDir)
    expect(state!.session_ids).toContain("sess_original")
    expect(state!.session_ids).toContain("sess_new")
  })

  it("resume detects completed plan and discovers new incomplete plan", () => {
    const donePlan = createPlanFile("old-plan", "# Old\n- [x] Task 1\n- [x] Task 2\n")
    writeWorkState(testDir, createWorkState(donePlan, "sess_old", "fighter"))

    // Ensure new plan has a different mtime
    createPlanFile("new-plan", makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"))

    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_new",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("Starting Plan: new-plan")
    expect(result.contextInjection).not.toContain("old-plan")

    const state = readWorkState(testDir)
    expect(state!.plan_name).toBe("new-plan")
    expect(state!.session_ids).toContain("sess_new")
  })

  it("multiple sessions accumulate in session_ids via sequential resumes", () => {
    createPlanFile("multi-session", makeValidPlanContent("- [ ] T1\n- [ ] T2\n- [ ] T3\n- [ ] T4\n- [ ] T5"))

    // Start
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_1", directory: testDir })
    expect(readWorkState(testDir)!.session_ids).toEqual(["sess_1"])

    // Resume with sess_2
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_2", directory: testDir })
    expect(readWorkState(testDir)!.session_ids).toEqual(["sess_1", "sess_2"])

    // Resume with sess_3
    handleStartWork({ promptText: makeStartWorkPrompt(), sessionId: "sess_3", directory: testDir })
    expect(readWorkState(testDir)!.session_ids).toEqual(["sess_1", "sess_2", "sess_3"])

    // Resume with sess_2 again — no duplicate
    appendSessionId(testDir, "sess_2")
    expect(readWorkState(testDir)!.session_ids).toEqual(["sess_1", "sess_2", "sess_3"])
  })
})

// ---------------------------------------------------------------------------
// Phase 5: Plan Completion Detection
// ---------------------------------------------------------------------------

describe("Phase 5: Plan Completion", () => {
  it("all plans complete → reports all complete", () => {
    createPlanFile("feature-a", "# A\n- [x] Task 1\n- [x] Task 2\n")
    createPlanFile("feature-b", "# B\n- [x] Task 1\n")

    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("All Plans Complete")
    expect(readWorkState(testDir)).toBeNull()
  })

  it("completed active plan with new incomplete plan → auto-selects new plan", () => {
    const donePlan = createPlanFile("done", "# Done\n- [x] Task 1\n")
    writeWorkState(testDir, createWorkState(donePlan, "sess_old", "fighter"))

    createPlanFile("todo", makeValidPlanContent("- [ ] Task 1"))

    const result = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    expect(result.contextInjection).toContain("Starting Plan: todo")

    const state = readWorkState(testDir)
    expect(state!.plan_name).toBe("todo")
  })
})

// ---------------------------------------------------------------------------
// Guard: Ranger MD-Only Write Restriction
// ---------------------------------------------------------------------------

describe("Guard: Ranger MD-Only Write Restriction", () => {
  it("ranger agent blocked from writing .ts source files", () => {
    const result = checkRangerWrite("ranger", "write", join(testDir, "src", "component.ts"))
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain(".guild/")
  })

  it("ranger agent allowed to write .md inside .guild/plans/", () => {
    const result = checkRangerWrite(
      "ranger",
      "write",
      join(testDir, ".guild", "plans", "my-plan.md"),
    )
    expect(result.allowed).toBe(true)
  })

  it("fighter agent not restricted by ranger guard", () => {
    const result = checkRangerWrite("fighter", "write", join(testDir, "src", "component.ts"))
    expect(result.allowed).toBe(true)
  })

  it("ranger blocked from writing .json inside .guild/", () => {
    const result = checkRangerWrite("ranger", "write", join(testDir, ".guild", "state.json"))
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain(".md")
  })
})

// ---------------------------------------------------------------------------
// Phase 6: Weft Review Gate
// ---------------------------------------------------------------------------

describe("Phase 6: Cleric Review Gate", () => {
  it("Cleric agent config enforces read-only access", () => {
    const config = createClericAgent("test-model")

    expect(config.tools?.write).toBe(false)
    expect(config.tools?.edit).toBe(false)
    expect(config.tools?.task).toBe(false)
    expect(config.tools?.call_guild_agent).toBe(false)
    expect(config.temperature).toBe(0.1)
  })

  it("Cleric agent prompt contains review guidelines", () => {
    const config = createClericAgent("test-model")
    const prompt = config.prompt as string

    expect(prompt).toContain("blocking issues")
    expect(prompt).toContain("APPROVE")
    expect(prompt).toContain("REJECT")
    expect(prompt).toContain("Plan Review")
    expect(prompt).toContain("Work Review")
    // Approval bias
    expect(prompt).toContain("APPROVE by default")
  })

  it("tool permission system blocks Cleric from writing", () => {
    const permissions = createToolPermissions({
      cleric: { write: false, edit: false, task: false, call_guild_agent: false },
    })

    expect(permissions.isToolAllowed("cleric", "write")).toBe(false)
    expect(permissions.isToolAllowed("cleric", "edit")).toBe(false)
    expect(permissions.isToolAllowed("cleric", "task")).toBe(false)
    expect(permissions.isToolAllowed("cleric", "call_guild_agent")).toBe(false)
    // Read tools are not restricted → allowed
    expect(permissions.isToolAllowed("cleric", "read")).toBe(true)
    expect(permissions.isToolAllowed("cleric", "glob")).toBe(true)
    // Other agents unaffected
    expect(permissions.isToolAllowed("fighter", "write")).toBe(true)
  })

  it("verification reminder generates correct Cleric review prompt after plan completion", () => {
    const result = buildVerificationReminder({
      planName: "my-feature",
      progress: { total: 3, completed: 3 },
    })

    expect(result.verificationPrompt).not.toBeNull()
    expect(result.verificationPrompt!.toLowerCase()).toContain("cleric")
    expect(result.verificationPrompt).toContain("git diff")
    expect(result.verificationPrompt).toContain("my-feature")
    expect(result.verificationPrompt).toContain("3/3")
  })

  it("verification reminder mid-progress still references Cleric as review option", () => {
    const result = buildVerificationReminder({
      planName: "partial",
      progress: { total: 5, completed: 2 },
    })

    expect(result.verificationPrompt!.toLowerCase()).toContain("cleric")
    expect(result.verificationPrompt).toContain("2/5")
  })
})

// ---------------------------------------------------------------------------
// Phase 7: Warp Security Gate
// ---------------------------------------------------------------------------

describe("Phase 7: Paladin Security Gate", () => {
  it("Paladin agent config enforces read-only access", () => {
    const config = createPaladinAgent("test-model")

    expect(config.tools?.write).toBe(false)
    expect(config.tools?.edit).toBe(false)
    expect(config.tools?.task).toBe(false)
    expect(config.tools?.call_guild_agent).toBe(false)
    expect(config.temperature).toBe(0.1)
  })

  it("Paladin agent prompt contains security audit guidelines", () => {
    const config = createPaladinAgent("test-model")
    const prompt = config.prompt as string

    expect(prompt).toContain("blocking issues")
    expect(prompt).toContain("APPROVE")
    expect(prompt).toContain("REJECT")
    expect(prompt).toContain("SecurityReview")
    expect(prompt).toContain("SpecificationCompliance")
    // Skeptical bias (opposite of Weft)
    expect(prompt).toContain("REJECT by default")
  })

  it("Paladin agent prompt contains spec reference table", () => {
    const config = createPaladinAgent("test-model")
    const prompt = config.prompt as string

    expect(prompt).toContain("RFC 6749")
    expect(prompt).toContain("RFC 7636")
    expect(prompt).toContain("JWT")
    expect(prompt).toContain("OIDC")
    expect(prompt).toContain("WebAuthn")
  })

  it("tool permission system blocks Paladin from writing", () => {
    const permissions = createToolPermissions({
      paladin: { write: false, edit: false, task: false, call_guild_agent: false },
    })

    expect(permissions.isToolAllowed("paladin", "write")).toBe(false)
    expect(permissions.isToolAllowed("paladin", "edit")).toBe(false)
    expect(permissions.isToolAllowed("paladin", "task")).toBe(false)
    expect(permissions.isToolAllowed("paladin", "call_guild_agent")).toBe(false)
    // Read tools are not restricted
    expect(permissions.isToolAllowed("paladin", "read")).toBe(true)
    expect(permissions.isToolAllowed("paladin", "glob")).toBe(true)
  })

  it("verification reminder references both cleric and paladin", () => {
    const result = buildVerificationReminder({
      planName: "auth-feature",
      progress: { total: 3, completed: 3 },
    })

    expect(result.verificationPrompt).not.toBeNull()
    expect(result.verificationPrompt!.toLowerCase()).toContain("cleric")
    expect(result.verificationPrompt!.toLowerCase()).toContain("paladin")
  })

  it("verification reminder uses mandatory language for paladin invocation", () => {
    const result = buildVerificationReminder({
      planName: "security-feature",
      progress: { total: 3, completed: 3 },
    })

    expect(result.verificationPrompt).toContain("MUST delegate")
    expect(result.verificationPrompt).toContain("NOT optional")
  })
})

// ---------------------------------------------------------------------------
// Integration: createHooks() wired workflow
// ---------------------------------------------------------------------------

describe("Integration: createHooks wired workflow", () => {
  it("startWork → workContinuation → full cycle through hooks object", () => {
    const hooks = createHooks({
      pluginConfig: {} as any,
      continuation: DEFAULT_CONTINUATION_CONFIG,
      isHookEnabled: () => true,
      directory: testDir,
    })

    const planPath = createPlanFile("hooks-plan", makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2"))

    // Start work
    const startResult = hooks.startWork!(makeStartWorkPrompt(), "sess_1")
    expect(startResult.switchAgent).toBe("fighter")
    expect(startResult.contextInjection).toContain("Starting Plan")

    // Mark task 0 complete, check continuation
    markTaskComplete(planPath, 0)
    const cont1 = hooks.workContinuation!("sess_1")
    expect(cont1.continuationPrompt).not.toBeNull()
    expect(cont1.continuationPrompt).toContain("1/3")

    // Mark task 1 complete, then verification checkbox → done
    markTaskComplete(planPath, 0)
    markTaskComplete(planPath, 0)
    const cont2 = hooks.workContinuation!("sess_1")
    expect(cont2.continuationPrompt).toBeNull()
  })

  it("verificationReminder is wired and references Weft", () => {
    const hooks = createHooks({
      pluginConfig: {} as any,
      continuation: DEFAULT_CONTINUATION_CONFIG,
      isHookEnabled: () => true,
      directory: testDir,
    })

    const result = buildVerificationReminder({
      planName: "test-plan",
      progress: { total: 3, completed: 3 },
    })

    expect(hooks.verificationReminderEnabled).toBe(true)
    expect(result.verificationPrompt).not.toBeNull()
    expect(result.verificationPrompt!.toLowerCase()).toContain("cleric")
    expect(result.verificationPrompt).toContain("test-plan")
  })

  it("createHooks patternMdOnly guard is wired correctly", () => {
    const hooks = createHooks({
      pluginConfig: {} as any,
      continuation: DEFAULT_CONTINUATION_CONFIG,
      isHookEnabled: () => true,
      directory: testDir,
    })

    const blocked = checkRangerWrite("ranger", "write", join(testDir, "src", "foo.ts"))
    expect(blocked.allowed).toBe(false)

    const allowed = checkRangerWrite("ranger", "write", join(testDir, ".guild", "plans", "plan.md"))
    expect(allowed.allowed).toBe(true)
    expect(hooks.rangerMdOnlyEnabled).toBe(true)
  })

  it("disabled hooks return null via createHooks", () => {
    const disabledNames = new Set(["start-work", "work-continuation", "verification-reminder"])
    const hooks = createHooks({
      pluginConfig: {} as any,
      continuation: DEFAULT_CONTINUATION_CONFIG,
      isHookEnabled: (name) => !disabledNames.has(name),
      directory: testDir,
    })

    expect(hooks.startWork).toBeNull()
    expect(hooks.workContinuation).toBeNull()
    expect(hooks.verificationReminderEnabled).toBe(false)
    // Others should still be active
    expect(hooks.rangerMdOnlyEnabled).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Plan-State Lifecycle: state.md creation and refresh
// Note: Detailed state.md tests are in plan-execution.test.ts
// These tests verify the lifecycle integration
// ---------------------------------------------------------------------------

describe("Plan-State Lifecycle: state.md creation and refresh", () => {
  it("plan execution creates work state that tracks session IDs", () => {
    const planPath = createPlanFile(
      "state-lifecycle-test",
      makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2"),
    )

    handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    const state = readWorkState(testDir)
    expect(state).not.toBeNull()
    expect(state!.plan_name).toBe("state-lifecycle-test")
    expect(state!.session_ids).toEqual(["sess_1"])
  })

  it("plan resume appends session ID to work state", () => {
    const planPath = createPlanFile(
      "resume-lifecycle-test",
      makeValidPlanContent("- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"),
    )

    // Start work
    handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })

    // Resume with new session
    handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_2",
      directory: testDir,
    })

    const state = readWorkState(testDir)
    expect(state!.session_ids).toContain("sess_1")
    expect(state!.session_ids).toContain("sess_2")
  })
})

// ---------------------------------------------------------------------------
// Full Lifecycle: Wizard → /start-work → Execute → Idle → Resume → Complete → Weft Review
// ---------------------------------------------------------------------------

describe("Full Lifecycle: Wizard → /start-work → Execute → Idle → Resume → Complete → Weft Review", () => {
  it("complete workflow lifecycle from plan creation through Weft review", () => {
    // 1. Wizard creates a plan
    const planPath = createPlanFile(
      "e2e-feature",
      makeValidPlanContent(
        "- [ ] Task 1: Create component\n- [ ] Task 2: Add tests\n- [ ] Task 3: Wire integration",
      ),
    )

    // 2. Wizard guard: allowed to write .md in .guild/
    const guardAllowed = checkRangerWrite("ranger", "write", planPath)
    expect(guardAllowed.allowed).toBe(true)

    // 3. Wizard guard: blocked from writing source code
    const guardBlocked = checkRangerWrite("ranger", "write", join(testDir, "src", "app.ts"))
    expect(guardBlocked.allowed).toBe(false)

    // 4. Session 1 starts work
    const startResult = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })
    expect(startResult.switchAgent).toBe("fighter")
    expect(startResult.contextInjection).toContain("Starting Plan: e2e-feature")
    expect(startResult.contextInjection).toContain("0/4 tasks completed")

    // 5. Execute task 1
    markTaskComplete(planPath, 0)

    // 6. Progress check
    const progress1 = getPlanProgress(planPath)
    expect(progress1).toMatchObject({ total: 4, completed: 1, isComplete: false })

    // 7. Mid-progress verification reminder mentions Weft
    const reminder1 = buildVerificationReminder({
      planName: "e2e-feature",
      progress: { total: 4, completed: 1 },
    })
    expect(reminder1.verificationPrompt!.toLowerCase()).toContain("cleric")

    // 8. Session goes idle → continuation prompt
    const cont1 = checkContinuation({ sessionId: "sess_1", directory: testDir })
    expect(cont1.continuationPrompt).not.toBeNull()
    expect(cont1.continuationPrompt).toContain("1/4")
    expect(cont1.continuationPrompt).toContain("3 remaining")

    // 9. Execute task 2
    markTaskComplete(planPath, 0)

    // 10. Session 2 resumes
    const resumeResult = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_2",
      directory: testDir,
    })
    expect(resumeResult.contextInjection).toContain("Resuming Plan: e2e-feature")
    expect(resumeResult.contextInjection).toContain("2/4 tasks completed")

    // 11. Session IDs accumulated
    const stateAfterResume = readWorkState(testDir)
    expect(stateAfterResume!.session_ids).toContain("sess_1")
    expect(stateAfterResume!.session_ids).toContain("sess_2")

    // 12. Execute task 3 and verification checkbox
    markTaskComplete(planPath, 0)
    markTaskComplete(planPath, 0)

    // 13. Plan complete
    const progress2 = getPlanProgress(planPath)
    expect(progress2).toMatchObject({ total: 4, completed: 4, isComplete: true })

    // 14. No more continuation
    const cont2 = checkContinuation({ sessionId: "sess_2", directory: testDir })
    expect(cont2.continuationPrompt).toBeNull()

    // 15. Weft review gate — verification reminder at completion
    const reminder2 = buildVerificationReminder({
      planName: "e2e-feature",
      progress: { total: 4, completed: 4 },
    })
    expect(reminder2.verificationPrompt!.toLowerCase()).toContain("cleric")
    expect(reminder2.verificationPrompt).toContain("git diff")
    expect(reminder2.verificationPrompt).toContain("e2e-feature")
    expect(reminder2.verificationPrompt).toContain("4/4")

    // 16. Cleric agent is read-only
    const clericConfig = createClericAgent("test-model")
    expect(clericConfig.tools?.write).toBe(false)
    expect(clericConfig.tools?.edit).toBe(false)

    // 17. Cleric prompt enforces review protocol
    const clericPrompt = clericConfig.prompt as string
    expect(clericPrompt).toContain("[APPROVE]")
    expect(clericPrompt).toContain("[REJECT]")
    expect(clericPrompt).toContain("blocking issues")

    // 18. Subsequent /start-work with no new plans → all complete
    const finalResult = handleStartWork({
      promptText: makeStartWorkPrompt(),
      sessionId: "sess_3",
      directory: testDir,
    })
    expect(finalResult.contextInjection).toContain("All Plans Complete")

    // 19. Bard's PlanWorkflow notes Fighter handles execution
    const bardConfig = createBardAgent("claude-opus-4")
    const bardPrompt = bardConfig.prompt as string
    const planWorkflow = bardPrompt.slice(
      bardPrompt.indexOf("<PlanWorkflow>"),
      bardPrompt.indexOf("</PlanWorkflow>"),
    )
    expect(planWorkflow).toContain("Fighter handles execution")

    // 20. Fighter invokes Cleric and Paladin directly via PostExecutionReview
    const fighterConfig = createFighterAgent("claude-sonnet-4")
    const fighterPrompt = fighterConfig.prompt as string
    expect(fighterPrompt).toContain("<PostExecutionReview>")
    expect(fighterPrompt).toContain("Cleric")
    expect(fighterPrompt).toContain("Paladin")

    // 21. Paladin self-triages — always safe to invoke
    const paladinConfig = createPaladinAgent("test-model")
    const paladinPrompt = paladinConfig.prompt as string
    expect(paladinPrompt).toContain("<Triage>")
    expect(paladinPrompt).toContain("FAST EXIT")
  })
})

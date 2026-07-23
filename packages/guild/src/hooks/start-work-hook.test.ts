import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execFileSync } from "child_process"
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { createPlanFsRepository } from "../infrastructure/fs/plan-fs-repository"
import { createPlanService } from "../domain/plans/plan-service"
import { handleStartWork, formatValidationResults } from "./start-work-hook"
import { PLANS_DIR } from "../features/work-state/constants"
import { writeWorkState, createWorkState, readWorkState } from "../features/work-state/storage"
import { createExecutionLeaseFsStore } from "../infrastructure/fs/execution-lease-fs-store"
import {
  createWorkflowInstance,
  writeWorkflowInstance,
  setActiveInstance,
} from "../features/workflow/storage"
import { WORKFLOWS_STATE_DIR, WORKFLOWS_DIR_PROJECT } from "../features/workflow/constants"
import type { WorkflowDefinition } from "../features/workflow/types"

let testDir: string
const ExecutionLeaseRepository = createExecutionLeaseFsStore()

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "guild-sw-test-"))
})

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
})

function makePrompt(args: string = ""): string {
  return `<command-instruction>Execute plan</command-instruction>
<session-context>Session ID: sess_test  Timestamp: 2026-01-01</session-context>
<user-request>${args}</user-request>`
}

function createPlanFile(name: string, content: string): string {
  const plansDir = join(testDir, PLANS_DIR)
  mkdirSync(plansDir, { recursive: true })
  const filePath = join(plansDir, `${name}.md`)
  writeFileSync(filePath, content, "utf-8")
  return filePath
}

/**
 * Minimal plan content that passes all validation checks.
 * Accepts custom checkbox lines for the TODOs section.
 */
function validPlanContent(checkboxLines: string): string {
  return `# Plan

## TL;DR
> **Summary**: A test plan.
> **Estimated Effort**: Quick

## TODOs
${checkboxLines}

## Verification
- [ ] All done
`
}

describe("handleStartWork", () => {
  it("returns null for non-command messages", () => {
    const result = handleStartWork({
      promptText: "Just a normal message",
      sessionId: "sess_1",
      directory: testDir,
    })
    expect(result.contextInjection).toBeNull()
    expect(result.switchAgent).toBeNull()
  })

  it("always sets switchAgent to fighter for commands", () => {
    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess_1",
      directory: testDir,
    })
    expect(result.switchAgent).toBe("fighter")
  })

  describe("no plans", () => {
    it("returns no-plans message", () => {
      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })
      expect(result.contextInjection).toContain("No Plans Found")
      expect(result.contextInjection).toContain("Wizard")
    })
  })

  describe("single incomplete plan", () => {
    it("auto-selects and creates work state for a valid plan", () => {
      createPlanFile(
        "my-feature",
        validPlanContent(
          "- [ ] 1. Task 1\n  **What**: Do it\n  **Files**: src/new.ts (new)\n  **Acceptance**: Works\n- [ ] 2. Task 2\n  **What**: Do it\n  **Files**: src/new2.ts (new)\n  **Acceptance**: Works"
        )
      )

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: my-feature")
      expect(result.contextInjection).toContain("0/3 tasks completed")
      expect(result.contextInjection).toContain("SIDEBAR TODOS")

      const state = readWorkState(testDir)
      expect(state).not.toBeNull()
      expect(state!.plan_name).toBe("my-feature")
      expect(state!.agent).toBe("fighter")
      expect(ExecutionLeaseRepository.readExecutionLease(testDir)?.owner_kind).toBe("plan")
      expect(ExecutionLeaseRepository.readSessionRuntime(testDir, "sess_1")?.foreground_agent).toBe("fighter")
    })

    it("does not include Start SHA for non-git directory", () => {
      createPlanFile(
        "no-git-plan",
        validPlanContent(
          "- [ ] 1. Task 1\n  **What**: Do it\n  **Files**: src/new.ts (new)\n  **Acceptance**: Works"
        )
      )

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: no-git-plan")
      expect(result.contextInjection).not.toContain("Start SHA")

      const state = readWorkState(testDir)
      expect(state!.start_sha).toBeUndefined()
    })

    it("proceeds with warnings when plan is missing ## TODOs section but has checkboxes elsewhere", () => {
      createPlanFile(
        "bad-plan",
        "## TL;DR\n> **Summary**: Incomplete.\n> **Estimated Effort**: Quick\n\n## Verification\n- [ ] Done\n"
      )

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      // Missing ## TODOs is a warning, not an error — plan proceeds
      expect(result.contextInjection).toContain("Starting Plan: bad-plan")
      expect(result.contextInjection).toContain("Validation Warnings")
      expect(result.contextInjection).toContain("TODOs")
      expect(result.switchAgent).toBe("fighter")

      // Work state IS created since validation passes
      expect(readWorkState(testDir)).not.toBeNull()
    })

    it("proceeds with warnings included in context", () => {
      // Plan with missing optional sections (## Context, ## Objectives) → warnings only
      createPlanFile(
        "warn-plan",
        "## TL;DR\n> **Summary**: Minimal.\n> **Estimated Effort**: Quick\n\n## TODOs\n- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/new.ts (new)\n  **Acceptance**: Works\n\n## Verification\n- [ ] Done\n"
      )

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      // Should proceed (not blocked)
      expect(result.contextInjection).toContain("Starting Plan: warn-plan")
      // Warnings should be included
      expect(result.contextInjection).toContain("Validation Warnings")
      // Work state should be created
      expect(readWorkState(testDir)).not.toBeNull()
    })
  })

  describe("multiple incomplete plans", () => {
    it("lists plans for user to choose", () => {
      createPlanFile("plan-a", "# A\n- [ ] Task 1\n")
      createPlanFile("plan-b", "# B\n- [ ] Task 1\n- [x] Task 2\n")

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Multiple Plans Found")
      expect(result.contextInjection).toContain("plan-a")
      expect(result.contextInjection).toContain("plan-b")
    })
  })

  describe("explicit plan name", () => {
    it("selects matching plan by name", () => {
      createPlanFile(
        "alpha",
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works")
      )
      createPlanFile(
        "beta",
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/b.ts (new)\n  **Acceptance**: Works")
      )

      const result = handleStartWork({
        promptText: makePrompt("alpha"),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: alpha")
    })

    it("partial name match works", () => {
      createPlanFile(
        "my-big-feature",
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/f.ts (new)\n  **Acceptance**: Works")
      )

      const result = handleStartWork({
        promptText: makePrompt("big-feat"),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: my-big-feature")
    })

    it("reports not found for unknown name", () => {
      createPlanFile("alpha", "# Alpha\n- [ ] Task\n")

      const result = handleStartWork({
        promptText: makePrompt("nonexistent"),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Plan Not Found")
    })

    it("reports already complete for finished plan", () => {
      createPlanFile("done-plan", "# Done\n- [x] Task 1\n- [x] Task 2\n")

      const result = handleStartWork({
        promptText: makePrompt("done-plan"),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Plan Already Complete")
    })

    it("proceeds with warnings for explicitly named plan missing ## TODOs", () => {
      createPlanFile(
        "broken",
        "## TL;DR\n> **Summary**: Broken.\n> **Estimated Effort**: Quick\n\n## Verification\n- [ ] Done\n"
      )

      const result = handleStartWork({
        promptText: makePrompt("broken"),
        sessionId: "sess_1",
        directory: testDir,
      })

      // Missing ## TODOs is a warning, not an error — plan proceeds
      expect(result.contextInjection).toContain("Starting Plan: broken")
      expect(result.contextInjection).toContain("Validation Warnings")
      expect(result.contextInjection).toContain("TODOs")
      // Work state IS created
      expect(readWorkState(testDir)).not.toBeNull()
    })

    it("finds a trio-format plan by slug name", () => {
      const trioDir = join(testDir, PLANS_DIR, "trio-plan")
      mkdirSync(trioDir, { recursive: true })
      writeFileSync(
        join(trioDir, "tasks.md"),
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"),
        "utf-8"
      )
      writeFileSync(join(trioDir, "spec.md"), "# Spec\n", "utf-8")
      writeFileSync(join(trioDir, "state.md"), "# State\n", "utf-8")

      const result = handleStartWork({
        promptText: makePrompt("trio-plan"),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: trio-plan")
      expect(result.contextInjection).not.toContain("Plan Not Found")
    })

    it("discovers a trio-format plan during auto-selection", () => {
      const trioDir = join(testDir, PLANS_DIR, "solo-trio")
      mkdirSync(trioDir, { recursive: true })
      writeFileSync(
        join(trioDir, "tasks.md"),
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"),
        "utf-8"
      )
      writeFileSync(join(trioDir, "spec.md"), "# Spec\n", "utf-8")
      writeFileSync(join(trioDir, "state.md"), "# State\n", "utf-8")

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: solo-trio")
    })

    it("finds plan by slug name without ambiguity from the slug dir", () => {
      const trioDir = join(testDir, PLANS_DIR, "target-slug")
      mkdirSync(trioDir, { recursive: true })
      writeFileSync(
        join(trioDir, "tasks.md"),
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"),
        "utf-8"
      )
      writeFileSync(join(trioDir, "spec.md"), "# Spec\n", "utf-8")
      writeFileSync(join(trioDir, "state.md"), "# State\n", "utf-8")

      const planRepository = createPlanFsRepository()
      const planService = createPlanService(planRepository)
      const allPlans = planService.findPlans(testDir)
      const matched = planService.matchPlanByName(allPlans, "target-slug")

      expect(matched).not.toBeNull()
      if (matched) {
        const name = planService.getPlanName(matched)
        expect(name).toBe("target-slug")
      }
    })
  })

  describe("resume existing state", () => {
    it("resumes incomplete plan and appends session ID", () => {
      const planPath = createPlanFile(
        "my-plan",
        validPlanContent(
          "- [x] 1. Done\n  **What**: Done\n  **Files**: src/a.ts (new)\n  **Acceptance**: OK\n- [ ] 2. Todo\n  **What**: Todo\n  **Files**: src/b.ts (new)\n  **Acceptance**: OK"
        )
      )
      const state = createWorkState(planPath, "sess_old", "fighter")
      writeWorkState(testDir, state)

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_new",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Resuming Plan: my-plan")
      expect(result.contextInjection).toContain("1/3 tasks completed")
      expect(result.contextInjection).toContain("SIDEBAR TODOS")

      const updated = readWorkState(testDir)
      expect(updated!.session_ids).toContain("sess_new")
    })

    it("resumes plan with warnings when plan is missing ## TODOs but has checkboxes", () => {
      // Create a plan missing ## TODOs but with raw checkboxes
      const planPath2 = createPlanFile(
        "corrupt-plan2",
        "- [ ] Raw task\n## TL;DR\n> **Summary**: Broken.\n> **Estimated Effort**: Quick\n\n## Verification\n- [ ] Done\n"
      )
      const state = createWorkState(planPath2, "sess_old", "fighter")
      writeWorkState(testDir, state)

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_new",
        directory: testDir,
      })

      // Missing ## TODOs is a warning, not an error — plan resumes
      expect(result.contextInjection).toContain("Resuming Plan: corrupt-plan2")
      expect(result.contextInjection).toContain("Validation Warnings")
      expect(result.switchAgent).toBe("fighter")
      // Work state should still exist
      expect(readWorkState(testDir)).not.toBeNull()
    })

    it("discovers new plans when existing plan is complete", () => {
      const donePlan = createPlanFile("old-plan", "# Old\n- [x] Done\n")
      writeWorkState(testDir, createWorkState(donePlan, "sess_old", "fighter"))

      createPlanFile(
        "new-plan",
        validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/n.ts (new)\n  **Acceptance**: Works")
      )

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("Starting Plan: new-plan")
    })
  })

  describe("all plans complete", () => {
    it("reports all plans complete", () => {
      createPlanFile("done-a", "# A\n- [x] Done\n")
      createPlanFile("done-b", "# B\n- [x] Done\n")

      const result = handleStartWork({
        promptText: makePrompt(),
        sessionId: "sess_1",
        directory: testDir,
      })

      expect(result.contextInjection).toContain("All Plans Complete")
    })
  })

  describe("precondition checks", () => {
    function initGitRepo(dir: string): void {
      execFileSync("git", ["init"], { cwd: dir })
      execFileSync("git", ["config", "user.email", "test@test.com"], { cwd: dir })
      execFileSync("git", ["config", "user.name", "Test"], { cwd: dir })
    }

    function initialCommit(dir: string): void {
      writeFileSync(join(dir, ".gitignore"), ".guild/\n", "utf-8")
      writeFileSync(join(dir, "initial.txt"), "initial", "utf-8")
      execFileSync("git", ["add", "."], { cwd: dir })
      execFileSync("git", ["commit", "-m", "init"], { cwd: dir })
    }

    function getCurrentBranch(dir: string): string {
      return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: dir,
        encoding: "utf-8",
      }).trim()
    }

    describe("fresh start — git dirty-tree check", () => {
      it("warns about uncommitted changes on fresh start with explicit plan", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        createPlanFile(
          "git-plan",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )
        // Dirty the tree: modify a tracked file
        writeFileSync(join(testDir, "initial.txt"), "modified", "utf-8")

        const result = handleStartWork({
          promptText: makePrompt("git-plan"),
          sessionId: "sess_dirty",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Uncommitted Changes Detected")
        expect(result.contextInjection).toContain("Starting Plan: git-plan")
      })

      it("no warning for clean tree on fresh start with explicit plan", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        createPlanFile(
          "clean-plan",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )

        const result = handleStartWork({
          promptText: makePrompt("clean-plan"),
          sessionId: "sess_clean",
          directory: testDir,
        })

        expect(result.contextInjection).not.toContain("Uncommitted Changes Detected")
        expect(result.contextInjection).toContain("Starting Plan: clean-plan")
      })

      it("no crash and no warning for non-git directory on fresh start", () => {
        createPlanFile(
          "non-git-plan",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )

        const result = handleStartWork({
          promptText: makePrompt("non-git-plan"),
          sessionId: "sess_nogit",
          directory: testDir,
        })

        expect(result.contextInjection).not.toContain("Uncommitted Changes")
        expect(result.contextInjection).toContain("Starting Plan: non-git-plan")
      })

      it("warns about uncommitted changes on auto-select with single incomplete plan", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        createPlanFile(
          "auto-plan",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )
        // Dirty the tree: modify a tracked file
        writeFileSync(join(testDir, "initial.txt"), "modified", "utf-8")

        const result = handleStartWork({
          promptText: makePrompt(),
          sessionId: "sess_auto",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Uncommitted Changes Detected")
        expect(result.contextInjection).toContain("Starting Plan: auto-plan")
      })
    })

    describe("resume — branch mismatch check", () => {
      it("no warning when current branch matches start_branch", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        const planPath = createPlanFile(
          "resume-same",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )
        const state = createWorkState(planPath, "sess_old", "fighter", testDir)
        writeWorkState(testDir, state)

        const result = handleStartWork({
          promptText: makePrompt(),
          sessionId: "sess_new",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Resuming Plan: resume-same")
        expect(result.contextInjection).not.toContain("Branch Changed")
      })

      it("warns when current branch differs from start_branch", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        const planPath = createPlanFile(
          "resume-diff",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )
        const currentBranch = getCurrentBranch(testDir)
        // Manually construct state with a different start_branch
        const state = {
          active_plan: planPath,
          started_at: new Date().toISOString(),
          session_ids: ["sess_old"],
          plan_name: "resume-diff",
          agent: "fighter",
          start_branch: "other-branch",
        }
        writeWorkState(testDir, state)

        const result = handleStartWork({
          promptText: makePrompt(),
          sessionId: "sess_new",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Branch Changed Since Plan Start")
        expect(result.contextInjection).toContain("other-branch")
        expect(result.contextInjection).toContain(currentBranch)
      })

      it("no crash and no warning when work state has no start_branch", () => {
        const planPath = createPlanFile(
          "resume-nobranch",
          validPlanContent(
            "- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works"
          )
        )
        const state = {
          active_plan: planPath,
          started_at: new Date().toISOString(),
          session_ids: ["sess_old"],
          plan_name: "resume-nobranch",
          agent: "fighter",
          // start_branch intentionally omitted — simulates pre-existing plan
        }
        writeWorkState(testDir, state)

        const result = handleStartWork({
          promptText: makePrompt(),
          sessionId: "sess_new",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Resuming Plan: resume-nobranch")
        expect(result.contextInjection).not.toContain("Branch Changed")
      })
    })

    describe("discovery — multiple plans with dirty tree", () => {
      it("lists multiple plans without dirty-tree warning", () => {
        initGitRepo(testDir)
        initialCommit(testDir)
        createPlanFile("plan-a", "- [ ] Task 1\n- [ ] Task 2\n")
        createPlanFile("plan-b", "- [ ] Task 1\n- [x] Task 2\n")
        // Dirty the tree
        writeFileSync(join(testDir, "initial.txt"), "modified", "utf-8")

        const result = handleStartWork({
          promptText: makePrompt(),
          sessionId: "sess_multi",
          directory: testDir,
        })

        expect(result.contextInjection).toContain("Multiple Plans Found")
        expect(result.contextInjection).not.toContain("Uncommitted Changes Detected")
      })
    })
  })
})

describe("formatValidationResults", () => {
  it("formats errors only", () => {
    const result = {
      valid: false,
      errors: [{ severity: "error" as const, category: "structure" as const, message: "Missing ## TODOs" }],
      warnings: [],
    }
    const text = formatValidationResults(result)
    expect(text).toContain("Errors (blocking):")
    expect(text).toContain("[structure] Missing ## TODOs")
    expect(text).not.toContain("Warnings:")
  })

  it("formats warnings only", () => {
    const result = {
      valid: true,
      errors: [],
      warnings: [{ severity: "warning" as const, category: "structure" as const, message: "Missing ## Context" }],
    }
    const text = formatValidationResults(result)
    expect(text).toContain("Warnings:")
    expect(text).toContain("[structure] Missing ## Context")
    expect(text).not.toContain("Errors")
  })

  it("formats both errors and warnings with blank line separator", () => {
    const result = {
      valid: false,
      errors: [{ severity: "error" as const, category: "structure" as const, message: "Error one" }],
      warnings: [{ severity: "warning" as const, category: "effort-estimate" as const, message: "Warn one" }],
    }
    const text = formatValidationResults(result)
    expect(text).toContain("Errors (blocking):")
    expect(text).toContain("Warnings:")
    expect(text).toContain("Error one")
    expect(text).toContain("Warn one")
  })
})

const THREE_STEP_DEF: WorkflowDefinition = {
  name: "test-workflow",
  description: "A test workflow",
  version: 1,
  steps: [
    {
      id: "step-1",
      name: "Step One",
      type: "interactive",
      agent: "bard",
      prompt: "Do step 1: {{instance.goal}}",
      completion: { method: "user_confirm" },
    },
    {
      id: "step-2",
      name: "Step Two",
      type: "autonomous",
      agent: "fighter",
      prompt: "Do step 2: {{instance.goal}}",
      completion: { method: "agent_signal" },
    },
    {
      id: "step-3",
      name: "Step Three",
      type: "interactive",
      agent: "bard",
      prompt: "Do step 3: {{instance.goal}}",
      completion: { method: "user_confirm" },
    },
  ],
}

function writeWorkflowDefFile(dir: string, def: WorkflowDefinition = THREE_STEP_DEF): string {
  const defDir = join(dir, WORKFLOWS_DIR_PROJECT)
  mkdirSync(defDir, { recursive: true })
  const defPath = join(defDir, `${def.name}.json`)
  writeFileSync(defPath, JSON.stringify(def))
  return defPath
}

function setupRunningWorkflow(dir: string, opts?: { paused?: boolean; completedSteps?: number }) {
  const defPath = writeWorkflowDefFile(dir)
  mkdirSync(join(dir, WORKFLOWS_STATE_DIR), { recursive: true })
  const instance = createWorkflowInstance(THREE_STEP_DEF, defPath, "Build OAuth2 login", "sess-1")

  const completedCount = opts?.completedSteps ?? 0
  const stepIds = THREE_STEP_DEF.steps.map((s) => s.id)
  for (let i = 0; i < completedCount && i < stepIds.length; i++) {
    instance.steps[stepIds[i]].status = "completed"
    instance.steps[stepIds[i]].started_at = new Date().toISOString()
  }
  if (completedCount < stepIds.length) {
    instance.current_step_id = stepIds[completedCount]
    instance.steps[stepIds[completedCount]].status = "active"
    instance.steps[stepIds[completedCount]].started_at = new Date().toISOString()
  }

  if (opts?.paused) {
    instance.status = "paused"
  }

  writeWorkflowInstance(dir, instance)
  setActiveInstance(dir, instance.instance_id)
  return instance
}

describe("handleStartWork with active workflow", () => {
  it("shows warning when workflow is running", () => {
    const instance = setupRunningWorkflow(testDir)

    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess-1",
      directory: testDir,
    })
    expect(result.contextInjection).toContain("Active Workflow Detected")
    expect(result.contextInjection).toContain("test-workflow")
    expect(result.contextInjection).toContain(instance.instance_id)
    expect(result.contextInjection).toContain("Build OAuth2 login")
    expect(result.contextInjection).toContain("Proceed anyway")
    expect(result.contextInjection).toContain("Abort the workflow first")
    expect(result.contextInjection).toContain("Cancel")
  })

  it("shows warning when workflow is paused", () => {
    setupRunningWorkflow(testDir, { paused: true })

    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess-1",
      directory: testDir,
    })
    expect(result.contextInjection).toContain("Active Workflow Detected")
    expect(result.contextInjection).toContain("paused")
  })

  it("no warning when no workflow is active", () => {
    // Just create a plan, no workflow
    createPlanFile(
      "my-plan",
      validPlanContent("- [ ] 1. Task\n  **What**: Do it\n  **Files**: src/a.ts (new)\n  **Acceptance**: Works")
    )

    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess-1",
      directory: testDir,
    })
    expect(result.contextInjection).not.toContain("Active Workflow Detected")
  })

  it("warning includes progress", () => {
    setupRunningWorkflow(testDir, { completedSteps: 1 })

    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess-1",
      directory: testDir,
    })
    expect(result.contextInjection).toContain("1/3")
  })

  it("switchAgent is null for the warning", () => {
    setupRunningWorkflow(testDir)

    const result = handleStartWork({
      promptText: makePrompt(),
      sessionId: "sess-1",
      directory: testDir,
    })
    expect(result.switchAgent).toBeNull()
  })
})

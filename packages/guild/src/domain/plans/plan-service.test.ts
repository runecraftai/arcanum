import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createPlanServiceWithExecutionLease } from "./plan-service"
import { createPlanFsRepository } from "../../infrastructure/fs/plan-fs-repository"
import { createExecutionLeaseFsStore } from "../../infrastructure/fs/execution-lease-fs-store"
import { PLANS_DIR } from "../../features/work-state/constants"

describe("plan service ownership transitions", () => {
  const planRepository = createPlanFsRepository()
  const executionLeaseRepository = createExecutionLeaseFsStore()
  const planService = createPlanServiceWithExecutionLease(planRepository, executionLeaseRepository)
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "guild-plan-service-"))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it("writes plan ownership and session runtime on createExecution", () => {
    const plansDir = join(directory, PLANS_DIR)
    mkdirSync(plansDir, { recursive: true })
    const planPath = join(plansDir, "alpha.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task\n", "utf-8")

    const state = planService.createExecution(directory, planPath, "sess-plan", "fighter")
    const lease = executionLeaseRepository.readExecutionLease(directory)
    const sessionRuntime = executionLeaseRepository.readSessionRuntime(directory, "sess-plan")

    expect(state.plan_name).toBe("alpha")
    expect(lease).not.toBeNull()
    expect(sessionRuntime).not.toBeNull()
    expect(lease).toEqual({
      owner_kind: "plan",
      owner_ref: planPath,
      status: "running",
      session_id: "sess-plan",
      executor_agent: "fighter",
      started_at: lease!.started_at,
      updated_at: lease!.updated_at,
    })
    expect(sessionRuntime).toEqual({
      session_id: "sess-plan",
      foreground_agent: "fighter",
      mode: "plan",
      execution_ref: planPath,
      status: "running",
      updated_at: sessionRuntime!.updated_at,
    })
  })

  it("rebinds plan ownership to the resuming session", () => {
    const plansDir = join(directory, PLANS_DIR)
    mkdirSync(plansDir, { recursive: true })
    const planPath = join(plansDir, "beta.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task\n", "utf-8")

    planService.createExecution(directory, planPath, "sess-plan-1", "fighter")
    const resumed = planService.resumeExecution(directory, "sess-plan-2")

    expect(resumed?.session_ids).toEqual(["sess-plan-1", "sess-plan-2"])
    expect(executionLeaseRepository.readExecutionLease(directory)?.session_id).toBe("sess-plan-2")
    expect(executionLeaseRepository.readSessionRuntime(directory, "sess-plan-2")?.mode).toBe("plan")
    expect(executionLeaseRepository.readSessionRuntime(directory, "sess-plan-2")?.foreground_agent).toBe("fighter")
  })
})

describe("plan service trio-format discovery", () => {
  const planRepository = createPlanFsRepository()
  const planService = createPlanServiceWithExecutionLease(planRepository)
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "guild-plan-trio-"))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  function createTrioPlan(slug: string, tasksContent: string): string {
    const trioDir = join(directory, PLANS_DIR, slug)
    mkdirSync(trioDir, { recursive: true })
    writeFileSync(join(trioDir, "spec.md"), "# Spec\n", "utf-8")
    writeFileSync(join(trioDir, "state.md"), "# State\n", "utf-8")
    writeFileSync(join(trioDir, "tasks.md"), tasksContent, "utf-8")
    return join(trioDir, "tasks.md")
  }

  it("discovers a trio-format plan and returns a single plan path", () => {
    createTrioPlan("scope-x", "# Tasks\n- [ ] Step 1\n- [x] Step 2\n- [ ] Step 3\n")

    const allPlans = planService.findPlans(directory)

    expect(allPlans.length).toBe(1)
  })

  it("matchPlanByName resolves a trio plan by its slug", () => {
    const tasksPath = createTrioPlan("scope-x", "# Tasks\n- [ ] Step 1\n- [x] Step 2\n- [ ] Step 3\n")

    const allPlans = planService.findPlans(directory)
    const matched = planService.matchPlanByName(allPlans, "scope-x")

    expect(matched).not.toBeNull()
    expect(matched).toBe(tasksPath)
  })

  it("getPlanName returns the slug for a trio plan path", () => {
    const tasksPath = createTrioPlan("my-feature", "- [ ] Task\n")

    const name = planService.getPlanName(tasksPath)

    expect(name).toBe("my-feature")
  })

  it("getPlanProgress counts checkboxes from the tasks.md of a trio plan", () => {
    const tasksPath = createTrioPlan(
      "proj",
      "# Tasks\n- [ ] Todo 1\n- [x] Done 1\n- [ ] Todo 2\n- [x] Done 2\n- [ ] Todo 3\n"
    )

    const progress = planService.getPlanProgress(tasksPath)

    expect(progress.total).toBe(5)
    expect(progress.completed).toBe(2)
    expect(progress.isComplete).toBe(false)
  })

  it("findIncompletePlans includes a trio plan with unchecked tasks", () => {
    createTrioPlan("wip", "# Tasks\n- [ ] Step 1\n- [x] Step 2\n")

    const allPlans = planService.findPlans(directory)
    const incomplete = planService.findIncompletePlans(allPlans)

    expect(incomplete.length).toBe(1)
  })

  it("matchPlanByName does not match non-existent slug for trio plans", () => {
    createTrioPlan("scope-x", "# Tasks\n- [ ] Step 1\n")

    const allPlans = planService.findPlans(directory)
    const matched = planService.matchPlanByName(allPlans, "nonexistent")

    expect(matched).toBeNull()
  })

  it("creates execution for a trio plan and stores the tasks.md path", () => {
    const tasksPath = createTrioPlan("trio-exec", "# Tasks\n- [ ] Step 1\n")

    const state = planService.createExecution(directory, tasksPath, "sess-trio", "fighter")

    expect(state.plan_name).toBe("trio-exec")
    expect(state.active_plan).toBe(tasksPath)
  })
})

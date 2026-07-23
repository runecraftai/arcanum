import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  readWorkState,
  writeWorkState,
  clearWorkState,
  appendSessionId,
  createWorkState,
  findPlans,
  getPlanProgress,
  getPlanName,
  getHeadSha,
  getBranch,
  pauseWork,
  resumeWork,
} from "./storage"
import { GUILD_DIR, PLANS_DIR } from "./constants"

let testDir: string

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "guild-test-"))
})

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors on Windows
  }
})

describe("readWorkState", () => {
  it("returns null when file does not exist", () => {
    expect(readWorkState(testDir)).toBeNull()
  })

  it("returns null for invalid JSON", () => {
    const dir = join(testDir, GUILD_DIR)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "state.json"), "not json", "utf-8")
    expect(readWorkState(testDir)).toBeNull()
  })

  it("returns null for array JSON", () => {
    const dir = join(testDir, GUILD_DIR)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "state.json"), "[]", "utf-8")
    expect(readWorkState(testDir)).toBeNull()
  })

  it("returns null when active_plan is missing", () => {
    const dir = join(testDir, GUILD_DIR)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "state.json"), '{"plan_name":"test"}', "utf-8")
    expect(readWorkState(testDir)).toBeNull()
  })

  it("normalizes missing session_ids to empty array", () => {
    const dir = join(testDir, GUILD_DIR)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, "state.json"),
      JSON.stringify({ active_plan: "/path/to/plan.md", started_at: "2026-01-01", plan_name: "test" }),
      "utf-8",
    )
    const state = readWorkState(testDir)
    expect(state).not.toBeNull()
    expect(state!.session_ids).toEqual([])
  })

  it("reads valid state", () => {
    const dir = join(testDir, GUILD_DIR)
    mkdirSync(dir, { recursive: true })
    const expected = {
      active_plan: "/path/plan.md",
      started_at: "2026-01-01T00:00:00Z",
      session_ids: ["sess_1"],
      plan_name: "plan",
    }
    writeFileSync(join(dir, "state.json"), JSON.stringify(expected), "utf-8")
    expect(readWorkState(testDir)).toEqual(expected)
  })
})

describe("writeWorkState", () => {
  it("creates .guild directory and writes state", () => {
    const state = createWorkState("/path/plan.md", "sess_1")
    expect(writeWorkState(testDir, state)).toBe(true)
    expect(existsSync(join(testDir, GUILD_DIR, "state.json"))).toBe(true)
    const read = readWorkState(testDir)
    expect(read!.active_plan).toBe("/path/plan.md")
  })
})

describe("clearWorkState", () => {
  it("deletes state file", () => {
    writeWorkState(testDir, createWorkState("/path/plan.md", "sess_1"))
    expect(clearWorkState(testDir)).toBe(true)
    expect(readWorkState(testDir)).toBeNull()
  })

  it("returns true even if file does not exist", () => {
    expect(clearWorkState(testDir)).toBe(true)
  })
})

describe("appendSessionId", () => {
  it("returns null when no state exists", () => {
    expect(appendSessionId(testDir, "sess_1")).toBeNull()
  })

  it("appends new session ID", () => {
    writeWorkState(testDir, createWorkState("/path/plan.md", "sess_1"))
    const updated = appendSessionId(testDir, "sess_2")
    expect(updated!.session_ids).toEqual(["sess_1", "sess_2"])
  })

  it("does not duplicate existing session ID", () => {
    writeWorkState(testDir, createWorkState("/path/plan.md", "sess_1"))
    appendSessionId(testDir, "sess_1")
    const state = readWorkState(testDir)
    expect(state!.session_ids).toEqual(["sess_1"])
  })
})

describe("createWorkState", () => {
  it("creates state with required fields", () => {
    const state = createWorkState("/proj/.guild/plans/my-plan.md", "sess_abc")
    expect(state.active_plan).toBe("/proj/.guild/plans/my-plan.md")
    expect(state.plan_name).toBe("my-plan")
    expect(state.session_ids).toEqual(["sess_abc"])
    expect(state.started_at).toBeTruthy()
    expect(state.agent).toBeUndefined()
  })

  it("includes agent when provided", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter")
    expect(state.agent).toBe("fighter")
  })

  it("includes start_sha when directory is a git repo", () => {
    // Use the actual guild repo root as the directory
    const state = createWorkState("/path/plan.md", "sess_1", "fighter", process.cwd())
    expect(state.start_sha).toBeDefined()
    expect(state.start_sha!.length).toBe(40)
  })

  it("omits start_sha when directory is not provided", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter")
    expect(state.start_sha).toBeUndefined()
  })

  it("omits start_sha when directory is not a git repo", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter", testDir)
    expect(state.start_sha).toBeUndefined()
  })

  it("includes start_branch when directory is a git repo", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter", process.cwd())
    expect(state.start_branch).toBeDefined()
    expect(typeof state.start_branch).toBe("string")
    expect(state.start_branch!.length).toBeGreaterThan(0)
  })

  it("omits start_branch when directory is not provided", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter")
    expect(state.start_branch).toBeUndefined()
  })

  it("omits start_branch when directory is not a git repo", () => {
    const state = createWorkState("/path/plan.md", "sess_1", "fighter", testDir)
    expect(state.start_branch).toBeUndefined()
  })
})

describe("getHeadSha", () => {
  it("returns a 40-char SHA for a git repo", () => {
    const sha = getHeadSha(process.cwd())
    expect(sha).toBeDefined()
    expect(sha!.length).toBe(40)
    expect(/^[0-9a-f]{40}$/.test(sha!)).toBe(true)
  })

  it("returns undefined for a non-git directory", () => {
    const sha = getHeadSha(testDir)
    expect(sha).toBeUndefined()
  })
})

describe("getBranch", () => {
  it("returns the current branch for a git repo", () => {
    const branch = getBranch(process.cwd())
    expect(branch).toBeDefined()
    expect(typeof branch).toBe("string")
    expect(branch!.length).toBeGreaterThan(0)
  })

  it("returns undefined for a non-git directory", () => {
    const branch = getBranch(testDir)
    expect(branch).toBeUndefined()
  })
})

describe("findPlans", () => {
  it("returns empty array when plans directory does not exist", () => {
    expect(findPlans(testDir)).toEqual([])
  })

  it("returns only .md files", () => {
    const plansDir = join(testDir, PLANS_DIR)
    mkdirSync(plansDir, { recursive: true })
    writeFileSync(join(plansDir, "plan-a.md"), "# Plan A", "utf-8")
    writeFileSync(join(plansDir, "notes.txt"), "not a plan", "utf-8")
    writeFileSync(join(plansDir, "plan-b.md"), "# Plan B", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(2)
    expect(plans.every((p) => p.endsWith(".md"))).toBe(true)
  })

  it("returns absolute paths", () => {
    const plansDir = join(testDir, PLANS_DIR)
    mkdirSync(plansDir, { recursive: true })
    writeFileSync(join(plansDir, "plan.md"), "# Plan", "utf-8")
    const plans = findPlans(testDir)
    expect(plans[0]).toContain(testDir)
  })

  it("collapses trio slug dir to one plan (tasks.md precedence)", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const slugDir = join(plansDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(join(slugDir, "spec.md"), "# Spec", "utf-8")
    writeFileSync(join(slugDir, "tasks.md"), "# Tasks", "utf-8")
    writeFileSync(join(slugDir, "state.md"), "# State", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/scope-x[/\\]tasks\.md$/)
  })

  it("collapses spec-only slug dir to spec.md", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const slugDir = join(plansDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(join(slugDir, "spec.md"), "# Spec", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/scope-x[/\\]spec\.md$/)
  })

  it("returns loose legacy .md as one plan", () => {
    const plansDir = join(testDir, PLANS_DIR)
    mkdirSync(plansDir, { recursive: true })
    writeFileSync(join(plansDir, "legacy.md"), "# Legacy", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/legacy\.md$/)
  })

  it("returns mixed trio slug dir + loose legacy as two plans", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const slugDir = join(plansDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(join(slugDir, "spec.md"), "# Spec", "utf-8")
    writeFileSync(join(slugDir, "tasks.md"), "# Tasks", "utf-8")
    writeFileSync(join(plansDir, "legacy.md"), "# Legacy", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(2)
    const tasksPlan = plans.find((p) => p.includes("scope-x"))
    const legacyPlan = plans.find((p) => p.includes("legacy"))
    expect(tasksPlan).toBeDefined()
    expect(tasksPlan).toMatch(/scope-x[/\\]tasks\.md$/)
    expect(legacyPlan).toBeDefined()
    expect(legacyPlan).toMatch(/legacy\.md$/)
  })

  it("slug dir with tasks.md + non-canonical notes.md returns only tasks.md", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const slugDir = join(plansDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(join(slugDir, "tasks.md"), "# Tasks", "utf-8")
    writeFileSync(join(slugDir, "notes.md"), "# Notes", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/scope-x[/\\]tasks\.md$/)
  })

  it("skips archive directory", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const archiveDir = join(plansDir, "archive")
    mkdirSync(archiveDir, { recursive: true })
    writeFileSync(join(plansDir, "active.md"), "# Active", "utf-8")
    writeFileSync(join(archiveDir, "archived.md"), "# Archived", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/active\.md$/)
  })

  it("excludes archived trio-format slug dir", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const archiveSlugDir = join(plansDir, "archive", "scope-x")
    mkdirSync(archiveSlugDir, { recursive: true })
    writeFileSync(join(archiveSlugDir, "spec.md"), "# Spec", "utf-8")
    writeFileSync(join(archiveSlugDir, "tasks.md"), "# Tasks", "utf-8")
    writeFileSync(join(archiveSlugDir, "state.md"), "# State", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(0)
  })

  it("excludes archived slug dir while returning active plans", () => {
    const plansDir = join(testDir, PLANS_DIR)
    const archiveSlugDir = join(plansDir, "archive", "scope-x")
    mkdirSync(archiveSlugDir, { recursive: true })
    writeFileSync(join(archiveSlugDir, "tasks.md"), "# Archived Tasks", "utf-8")
    const activeSlugDir = join(plansDir, "active-plan")
    mkdirSync(activeSlugDir, { recursive: true })
    writeFileSync(join(activeSlugDir, "tasks.md"), "# Active Tasks", "utf-8")
    const plans = findPlans(testDir)
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatch(/active-plan[/\\]tasks\.md$/)
  })
})

describe("getPlanProgress", () => {
  it("returns isComplete:true for missing file", () => {
    const progress = getPlanProgress("/nonexistent/plan.md")
    expect(progress).toEqual({ total: 0, completed: 0, isComplete: true })
  })

  it("returns isComplete:true for file with no checkboxes", () => {
    const file = join(testDir, "no-checkboxes.md")
    writeFileSync(file, "# Plan\n\nJust text, no tasks.", "utf-8")
    expect(getPlanProgress(file).isComplete).toBe(true)
  })

  it("counts unchecked checkboxes", () => {
    const file = join(testDir, "plan.md")
    writeFileSync(file, "- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n", "utf-8")
    const progress = getPlanProgress(file)
    expect(progress.total).toBe(3)
    expect(progress.completed).toBe(0)
    expect(progress.isComplete).toBe(false)
  })

  it("counts mixed checked/unchecked", () => {
    const file = join(testDir, "plan.md")
    writeFileSync(file, "- [x] Done 1\n- [ ] Todo 2\n- [X] Done 3\n- [ ] Todo 4\n", "utf-8")
    const progress = getPlanProgress(file)
    expect(progress.total).toBe(4)
    expect(progress.completed).toBe(2)
    expect(progress.isComplete).toBe(false)
  })

  it("returns isComplete:true when all checked", () => {
    const file = join(testDir, "plan.md")
    writeFileSync(file, "- [x] Done 1\n- [X] Done 2\n", "utf-8")
    const progress = getPlanProgress(file)
    expect(progress.total).toBe(2)
    expect(progress.completed).toBe(2)
    expect(progress.isComplete).toBe(true)
  })

  it("handles * bullet style", () => {
    const file = join(testDir, "plan.md")
    writeFileSync(file, "* [ ] Task 1\n* [x] Done 1\n", "utf-8")
    const progress = getPlanProgress(file)
    expect(progress.total).toBe(2)
    expect(progress.completed).toBe(1)
  })

  it("counts checkboxes in trio-format tasks.md (2 checked / 3 total)", () => {
    const slugDir = join(testDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    const tasksFile = join(slugDir, "tasks.md")
    writeFileSync(tasksFile, "- [x] Add login\n- [x] Add dashboard\n- [ ] Add settings\n", "utf-8")
    const progress = getPlanProgress(tasksFile)
    expect(progress).toEqual({ total: 3, completed: 2, isComplete: false })
  })

  it("returns isComplete:true for spec-only slug dir (spec.md, no checkboxes)", () => {
    const slugDir = join(testDir, "scope-x")
    mkdirSync(slugDir, { recursive: true })
    const specFile = join(slugDir, "spec.md")
    writeFileSync(specFile, "# Spec\n\nRequirements text here.\n", "utf-8")
    const progress = getPlanProgress(specFile)
    expect(progress).toEqual({ total: 0, completed: 0, isComplete: true })
  })

  it("counts checkboxes in legacy plan.md (1 checked / 3 total)", () => {
    const plansDir = join(testDir, "plans")
    mkdirSync(plansDir, { recursive: true })
    const legacyFile = join(plansDir, "plan.md")
    writeFileSync(legacyFile, "- [x] Setup\n- [ ] Migration\n- [ ] Cleanup\n", "utf-8")
    const progress = getPlanProgress(legacyFile)
    expect(progress).toEqual({ total: 3, completed: 1, isComplete: false })
  })
})

describe("getPlanName", () => {
  it("extracts name from path", () => {
    expect(getPlanName("/proj/.guild/plans/my-feature.md")).toBe("my-feature")
  })

  it("handles path without .md extension", () => {
    expect(getPlanName("/proj/.guild/plans/readme")).toBe("readme")
  })

  it("returns slug for trio-format tasks.md", () => {
    expect(getPlanName("/proj/.guild/plans/worktree-parallel-fighter/tasks.md")).toBe("worktree-parallel-fighter")
  })

  it("returns slug for trio-format spec.md", () => {
    expect(getPlanName("/proj/.guild/plans/my-feature/spec.md")).toBe("my-feature")
  })

  it("returns slug for trio-format design.md", () => {
    expect(getPlanName("/proj/.guild/plans/scope-x/design.md")).toBe("scope-x")
  })

  it("returns slug for trio-format state.md", () => {
    expect(getPlanName("/proj/.guild/plans/some-plan/state.md")).toBe("some-plan")
  })

  it("returns basename for legacy loose file", () => {
    expect(getPlanName("/proj/.guild/plans/legacy.md")).toBe("legacy")
  })
})

describe("pauseWork", () => {
  it("returns false when no state exists", () => {
    expect(pauseWork(testDir)).toBe(false)
  })

  it("sets paused: true on existing state", () => {
    writeWorkState(testDir, createWorkState("/path/plan.md", "sess_1"))
    expect(pauseWork(testDir)).toBe(true)
    const state = readWorkState(testDir)
    expect(state!.paused).toBe(true)
  })

  it("preserves other state fields when pausing", () => {
    const original = createWorkState("/path/plan.md", "sess_1", "fighter")
    writeWorkState(testDir, original)
    pauseWork(testDir)
    const state = readWorkState(testDir)
    expect(state!.active_plan).toBe("/path/plan.md")
    expect(state!.session_ids).toEqual(["sess_1"])
    expect(state!.agent).toBe("fighter")
    expect(state!.paused).toBe(true)
  })
})

describe("resumeWork", () => {
  it("returns false when no state exists", () => {
    expect(resumeWork(testDir)).toBe(false)
  })

  it("sets paused: false on existing state", () => {
    const state = createWorkState("/path/plan.md", "sess_1")
    writeWorkState(testDir, { ...state, paused: true })
    expect(resumeWork(testDir)).toBe(true)
    const updated = readWorkState(testDir)
    expect(updated!.paused).toBe(false)
  })

  it("clears paused even when it was already false", () => {
    writeWorkState(testDir, createWorkState("/path/plan.md", "sess_1"))
    expect(resumeWork(testDir)).toBe(true)
    const state = readWorkState(testDir)
    expect(state!.paused).toBe(false)
  })
})

import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { detectDelegation, executeTrajectoryRun } from "./trajectory-run"
import type { ExecutionContext, ResolvedTarget, TrajectoryRunExecutor } from "../types"

describe("detectDelegation", () => {
  it("detects [delegates to X] wizard", () => {
    expect(detectDelegation("Let me handle this. [delegates to wizard]")).toBe("wizard")
  })

  it("detects [delegate to X] wizard", () => {
    expect(detectDelegation("[delegate to rogue]")).toBe("rogue")
  })

  it("detects 'Delegating to X' wizard", () => {
    expect(detectDelegation("Delegating to Wizard for planning...")).toBe("wizard")
  })

  it("detects 'delegate to X' wizard in sentence", () => {
    expect(detectDelegation("I will delegate to paladin for security review")).toBe("paladin")
  })

  it("detects 'route to X' wizard", () => {
    expect(detectDelegation("Let me route to rogue for this exploration")).toBe("rogue")
  })

  it("detects 'routing to X' wizard", () => {
    expect(detectDelegation("Routing to paladin for security audit")).toBe("paladin")
  })

  it("detects plain delegation targets", () => {
    expect(detectDelegation("Delegating to worker for backend work")).toBe("worker")
  })

  it("detects hyphenated delegation targets", () => {
    expect(detectDelegation("Delegating to worker-ui for UI work")).toBe("worker-ui")
  })

  it("is case-insensitive", () => {
    expect(detectDelegation("[DELEGATES TO WIZARD]")).toBe("wizard")
  })

  it("returns null when no delegation found", () => {
    expect(detectDelegation("Here is the answer to your question.")).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(detectDelegation("")).toBeNull()
  })
})

describe("executeTrajectoryRun", () => {
  it("records delegation targets separately from acting-agent sequence", async () => {
    const directory = mkdtempSync(join(tmpdir(), "guild-trajectory-run-"))

    try {
      const scenariosDir = join(directory, "evals", "scenarios")
      mkdirSync(scenariosDir, { recursive: true })

      writeFileSync(
        join(scenariosDir, "delegation-targets.jsonc"),
        JSON.stringify({
          id: "delegation-targets",
          title: "Delegation targets trace coverage",
          agents: ["bard", "worker", "worker-ui"],
          turns: [
            {
              turn: 1,
              role: "user",
              content: "Please investigate and implement the UI fix.",
            },
            {
              turn: 2,
              role: "assistant",
              agent: "bard",
              content: "Delegating to worker for investigation.",
            },
            {
              turn: 3,
              role: "assistant",
              agent: "worker",
              content: "Routing to worker-ui for the UI update.",
            },
            {
              turn: 4,
              role: "assistant",
              agent: "worker-ui",
              content: "Implemented the requested UI fix.",
            },
          ],
        }),
        "utf-8",
      )

      const resolvedTarget: ResolvedTarget = {
        target: {
          kind: "trajectory-agent",
          agent: "bard",
          scenarioRef: "evals/scenarios/delegation-targets.jsonc",
        },
        artifacts: {},
      }

      const executor: TrajectoryRunExecutor = {
        kind: "trajectory-run",
        scenarioRef: "evals/scenarios/delegation-targets.jsonc",
      }

      const context: ExecutionContext = {
        mode: "local",
        directory,
      }

      const artifacts = await executeTrajectoryRun(resolvedTarget, executor, context)

      expect(artifacts.trace).toEqual({
        scenarioId: "delegation-targets",
        turns: [
          {
            turn: 1,
            agent: "user",
            role: "user",
            response: "Please investigate and implement the UI fix.",
            durationMs: expect.any(Number),
          },
          {
            turn: 2,
            agent: "bard",
            role: "assistant",
            response: "Delegating to worker for investigation.",
            observedDelegation: "worker",
            durationMs: expect.any(Number),
          },
          {
            turn: 3,
            agent: "worker",
            role: "assistant",
            response: "Routing to worker-ui for the UI update.",
            observedDelegation: "worker-ui",
            durationMs: expect.any(Number),
          },
          {
            turn: 4,
            agent: "worker-ui",
            role: "assistant",
            response: "Implemented the requested UI fix.",
            observedDelegation: null,
            durationMs: expect.any(Number),
          },
        ],
        delegationSequence: ["bard", "worker", "worker-ui"],
        delegationTargets: ["worker", "worker-ui"],
        totalTurns: 4,
        completedTurns: 4,
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

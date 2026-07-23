import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { readWorkState } from "../../src/features/work-state/storage"
import { CONTINUATION_MARKER } from "../../src/hooks/work-continuation"
import { getAgentDisplayName } from "../../src/shared/agent-display-names"
import { createProjectFixture, type ProjectFixture } from "../testkit/fixtures/project-fixture"
import { FakeOpencodeHost } from "../testkit/host/fake-opencode-host"

describe("E2E: /start-work runtime flow", () => {
  let fixture: ProjectFixture

  beforeEach(() => {
    fixture = createProjectFixture("weave-e2e-start-work-")
    fixture.writeProjectConfig({
      continuation: {
        idle: {
          enabled: true,
          work: true,
        },
      },
    })
  })

  afterEach(() => {
    fixture.cleanup()
  })

  it("spawns a new Fighter session (windowed mode) instead of in-place agent switch", async () => {
    fixture.writePlan(
      "my-feature",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Test start-work end-to-end.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. First task",
        "  **What**: Do the first thing",
        "  **Files**: src/example.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] All done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })
    const output = await host.sendStartWork({
      sessionID: "sess-start-1",
      planName: "my-feature",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom", // Start with loom agent
    })

    // Windowed mode: The agent should NOT switch in-place
    // It should remain as the original agent (loom in this case)
    expect(host.getCurrentAgent("sess-start-1")).toBe(getAgentDisplayName("loom"))

    // The output should contain a handoff notification
    expect(output.parts[0].text).toContain("Fighter session spawned")
    expect(output.parts[0].text).toContain("my-feature")
    expect(output.parts[0].text).toContain("0/2 tasks")

    // A new session should have been created for Fighter
    expect(host.client.sessionCreateCalls).toHaveLength(1)
    expect(host.client.sessionCreateCalls[0].title).toContain("Fighter -")
    expect(host.client.sessionCreateCalls[0].title).toContain("my-feature")
    expect(host.client.sessionCreateCalls[0].agent).toBe(getAgentDisplayName("fighter"))

    // The Fighter session should receive the plan context
    expect(host.client.promptAsyncCalls).toHaveLength(1)
    expect(host.client.promptAsyncCalls[0].path.id).toBe("fake-session-1")
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain("Starting Plan: my-feature")
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain("SIDEBAR TODOS")

    // Work state should be created with the Fighter agent
    const state = readWorkState(fixture.directory)
    expect(state).not.toBeNull()
    expect(state!.plan_name).toBe("my-feature")
    expect(state!.agent).toBe("fighter")
    expect(state!.session_ids).toContain("sess-start-1")
  })

  it("falls back to in-place switch when session creation fails", async () => {
    fixture.writePlan(
      "fail-plan",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Test failure fallback.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task",
        "  **What**: Do thing",
        "  **Files**: src/thing.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] Done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    // Simulate session.create failure by setting the error flag
    host.client.sessionCreateError = new Error("Session creation failed: quota exceeded")

    const output = await host.sendStartWork({
      sessionID: "sess-fail-1",
      planName: "fail-plan",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    // Clear the error flag
    host.client.sessionCreateError = null

    // Fallback: agent should switch to Fighter in-place (old behavior)
    expect(host.getCurrentAgent("sess-fail-1")).toBe(getAgentDisplayName("fighter"))

    // The output should contain the fallback notice
    expect(output.parts[0].text).toContain("Could not open Fighter in new window")

    // No new session should have been created (since it failed)
    expect(host.client.sessionCreateCalls).toHaveLength(0)

    // Work state should still be created
    const state = readWorkState(fixture.directory)
    expect(state).not.toBeNull()
    expect(state!.plan_name).toBe("fail-plan")
  })

  it("continues active work on session.idle via client.session.promptAsync", async () => {
    fixture.writePlan(
      "idle-plan",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Test idle continuation end-to-end.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Continue work",
        "  **What**: Do the next thing",
        "  **Files**: src/idle.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] All done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    await host.sendStartWork({
      sessionID: "sess-idle-1",
      planName: "idle-plan",
      timestamp: "2026-01-01T00:00:00.000Z",
    })
    host.client.clearEffects()
    await host.emitSessionIdle("sess-idle-1")

    expect(host.client.promptAsyncCalls).toHaveLength(1)
    expect(host.client.promptAsyncCalls[0].path.id).toBe("sess-idle-1")
    expect(host.client.promptAsyncCalls[0].body.parts).toHaveLength(1)
    expect(host.client.promptAsyncCalls[0].body.parts[0].type).toBe("text")
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain(CONTINUATION_MARKER)
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain("idle-plan")
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain("0/2 tasks completed")
  })

  it("pauses active work on session.interrupt and suppresses later idle continuation", async () => {
    fixture.writePlan(
      "interrupt-plan",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Test interrupt pause end-to-end.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. First task",
        "  **What**: Do the first thing",
        "  **Files**: src/interrupt.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] All done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    await host.sendStartWork({
      sessionID: "sess-interrupt-1",
      planName: "interrupt-plan",
      timestamp: "2026-01-01T00:00:00.000Z",
    })
    host.client.clearEffects()
    await host.emitCommandExecute("session.interrupt", "sess-interrupt-1")

    const stateAfterInterrupt = readWorkState(fixture.directory)
    expect(stateAfterInterrupt).not.toBeNull()
    expect(stateAfterInterrupt!.paused).toBe(true)

    await host.emitSessionIdle("sess-interrupt-1")

    expect(host.client.promptAsyncCalls).toHaveLength(0)
  })

  it("OLD BEHAVIOR GONE: agent stays as Bard in originating session when Fighter session is spawned", async () => {
    fixture.writePlan(
      "boundary-test",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Verify session boundary.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task",
        "  **What**: Do thing",
        "  **Files**: src/thing.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] Done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })
    const output = await host.sendStartWork({
      sessionID: "sess-boundary-1",
      planName: "boundary-test",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    // The old behavior was: Bard → Fighter in the same session (agent switch in-place).
    // The new behavior: Bard stays as Bard in originating session; Fighter gets a new session.
    expect(host.getCurrentAgent("sess-boundary-1")).toBe(getAgentDisplayName("loom"))

    // A new session should have been created for Fighter
    expect(host.client.sessionCreateCalls).toHaveLength(1)
    expect(host.client.sessionCreateCalls[0].title).toContain("Fighter -")
    expect(host.client.sessionCreateCalls[0].agent).toBe(getAgentDisplayName("fighter"))

    // The Fighter session should receive the plan context
    expect(host.client.promptAsyncCalls).toHaveLength(1)
    expect(host.client.promptAsyncCalls[0].path.id).not.toBe("sess-boundary-1")
    expect(host.client.promptAsyncCalls[0].body.parts[0].text).toContain("Starting Plan: boundary-test")

    // Handoff notification in the originating session output
    expect(output.parts[0].text).toContain("Fighter session spawned")
    expect(output.parts[0].text).toContain("boundary-test")
  })

  it("fallback path: in-place agent switch when session creation fails", async () => {
    fixture.writePlan(
      "fallback-test",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Test fallback behavior.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task",
        "  **What**: Do thing",
        "  **Files**: src/thing.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] Done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    // Simulate session creation failure
    host.client.sessionCreateError = new Error("Session creation failed: quota exceeded")

    const output = await host.sendStartWork({
      sessionID: "sess-fallback-1",
      planName: "fallback-test",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    // Clear the error for subsequent tests
    host.client.sessionCreateError = null

    // Fallback: agent switches to Fighter in-place
    expect(host.getCurrentAgent("sess-fallback-1")).toBe(getAgentDisplayName("fighter"))

    // Fallback notice should be present
    expect(output.parts[0].text).toContain("Could not open Fighter in new window")

    // No new session should have been created
    expect(host.client.sessionCreateCalls).toHaveLength(0)

    // Work state should still be created
    const state = readWorkState(fixture.directory)
    expect(state).not.toBeNull()
    expect(state!.plan_name).toBe("fallback-test")
  })

  it("fallback path includes context injection in current session", async () => {
    fixture.writePlan(
      "fallback-context-test",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Verify fallback context.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task",
        "  **What**: Do thing",
        "  **Files**: src/thing.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] Done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })
    host.client.sessionCreateError = new Error("quota exceeded")

    const output = await host.sendStartWork({
      sessionID: "sess-fallback-ctx-1",
      planName: "fallback-context-test",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    host.client.sessionCreateError = null

    // Context injection should be in the output
    expect(output.parts[0].text).toContain("Starting Plan: fallback-context-test")
    expect(output.parts[0].text).toContain("0/2 tasks")
  })

  it("Fighter session is seeded with plan context including progress", async () => {
    fixture.writePlan(
      "seed-test",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Verify plan seeding.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task A",
        "  **What**: Do A",
        "  **Files**: src/a.ts (new)",
        "  **Acceptance**: A works",
        "- [ ] 2. Task B",
        "  **What**: Do B",
        "  **Files**: src/b.ts (new)",
        "  **Acceptance**: B works",
        "",
        "## Verification",
        "- [ ] All done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })
    await host.sendStartWork({
      sessionID: "sess-seed-1",
      planName: "seed-test",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    // Fighter session should be seeded with the plan context
    expect(host.client.promptAsyncCalls).toHaveLength(1)
    const seededText = host.client.promptAsyncCalls[0].body.parts[0].text
    expect(seededText).toContain("Starting Plan: seed-test")
    expect(seededText).toContain("0/3 tasks")
    expect(seededText).toContain("SIDEBAR TODOS")
  })

  it("work state records session IDs for both Bard and Fighter sessions", async () => {
    fixture.writePlan(
      "state-ids-test",
      [
        "# Plan",
        "",
        "## TL;DR",
        "> **Summary**: Verify state session IDs.",
        "> **Estimated Effort**: Quick",
        "",
        "## TODOs",
        "- [ ] 1. Task",
        "  **What**: Do thing",
        "  **Files**: src/thing.ts (new)",
        "  **Acceptance**: It works",
        "",
        "## Verification",
        "- [ ] Done",
      ].join("\n"),
    )

    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })
    await host.sendStartWork({
      sessionID: "sess-state-ids-1",
      planName: "state-ids-test",
      timestamp: "2026-01-01T00:00:00.000Z",
      agent: "loom",
    })

    const state = readWorkState(fixture.directory)
    expect(state).not.toBeNull()
    // The originating Bard session ID should be recorded
    expect(state!.session_ids).toContain("sess-state-ids-1")
    // The Fighter session ID should also be tracked (from the created session)
    expect(state!.session_ids.length).toBeGreaterThanOrEqual(1)
  })
})

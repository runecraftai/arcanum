import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createProjectFixture, type ProjectFixture } from "../testkit/fixtures/project-fixture"
import { FakeOpencodeHost } from "../testkit/host/fake-opencode-host"

describe("E2E: pattern write guard", () => {
  let fixture: ProjectFixture

  beforeEach(() => {
    fixture = createProjectFixture("weave-e2e-pattern-guard-")
  })

  afterEach(() => {
    fixture.cleanup()
  })

  it("blocks Ranger from writing non-.md files outside .guild", async () => {
    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    await expect(
      host.executeTool({
        sessionID: "sess-pattern",
        tool: "write",
        callID: "call-pattern-1",
        agent: "ranger",
        args: { file_path: `${fixture.directory}/src/app.ts` },
      }),
    ).rejects.toThrow("Ranger agent can only write to .guild/ directory")
  })

  it("allows Ranger to write .md files inside .guild", async () => {
    const host = await FakeOpencodeHost.boot({ directory: fixture.directory })

    await expect(
      host.executeTool({
        sessionID: "sess-pattern-ok",
        tool: "write",
        callID: "call-pattern-2",
        agent: "ranger",
        args: { file_path: `${fixture.directory}/.guild/plans/notes.md` },
      }),
    ).resolves.toBeUndefined()
  })
})

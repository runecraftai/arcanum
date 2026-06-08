import type { PluginContext } from "../../plugin/types"

export interface SessionClient {
  createSession(input: { title: string; agent?: string }): Promise<string>
  promptAsync(input: { sessionId: string; parts: Array<{ type: "text"; text: string }>; agent?: string }): Promise<void>
  restoreAgent(input: { sessionId: string; agent: string }): Promise<void>
  todo(sessionId: string): Promise<{ data?: unknown[] }>
}

export function createSessionClient(client: PluginContext["client"]): SessionClient {
  return {
    async createSession(input) {
      const response = await client.session.create({
        body: { title: input.title, ...(input.agent ? { agent: input.agent } : {}) },
      })
      const sessionId = extractSessionId(response)
      if (!sessionId) {
        throw new Error(`Failed to create session: ${input.title}`)
      }
      return sessionId
    },
    async promptAsync(input) {
      await client.session.promptAsync({
        path: { id: input.sessionId },
        body: {
          parts: input.parts,
          ...(input.agent ? { agent: input.agent } : {}),
        },
      })
    },
    async restoreAgent(input) {
      await client.session.promptAsync({
        path: { id: input.sessionId },
        body: {
          parts: [],
          agent: input.agent,
        },
      })
    },
    async todo(sessionId) {
      return client.session.todo({ path: { id: sessionId } })
    },
  }
}

function extractSessionId(response: unknown): string | null {
  if (!isRecord(response)) return null
  const id = response.id
  return typeof id === "string" && id.length > 0 ? id : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

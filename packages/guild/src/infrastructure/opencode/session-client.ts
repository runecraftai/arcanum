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
      const body: Record<string, unknown> = { title: input.title }
      if (input.agent) {
        body.agent = input.agent
      }
      const response = await client.session.create({ body })
      const sessionId = extractSessionId(unwrapResponseData(response))
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

function unwrapResponseData(response: unknown): unknown {
  if (!isRecord(response)) {
    return response
  }
  return "data" in response ? response.data : response
}

function extractSessionId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null
  }
  const id = value.id
  return typeof id === "string" && id.length > 0 ? id : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

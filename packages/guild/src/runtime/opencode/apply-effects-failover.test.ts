import { describe, expect, it, beforeEach } from "bun:test"
import { applyRuntimeEffects } from "./apply-effects"
import { clearFailoverGuard } from "../../application/failover/failover-guard"
import type { AgentConfig } from "@opencode-ai/sdk"

describe("applyRuntimeEffects failover with custom fallback chain", () => {
	beforeEach(() => {
		clearFailoverGuard()
	})

	function makeMockTracker() {
		return {
			setAgentName: () => {},
			trackModel: () => {},
			endSession: () => {},
			trackCost: () => {},
			trackTokenUsage: () => {},
			trackToolStart: () => {},
			trackToolEnd: () => {},
		}
	}

	it("uses custom fallback chain from agents record when provided", async () => {
		let callIndex = 0
		const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
		const client = {
			session: {
				promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
					calls.push(input)
					callIndex++
					// First call fails with eligible error, second succeeds
					if (callIndex === 1) {
						throw new Error("OpenAI: quota exceeded")
					}
				},
			},
		}

		const recorded: Array<{ sessionId: string; text: string }> = []

		// Custom fallback chain for fighter: google/gemini-3-pro -> openai/gpt-5
		const customAgents: Record<string, AgentConfig> = {
			fighter: {
				fallbackChain: [
					{ providers: ["google"], model: "gemini-3-pro" },
					{ providers: ["openai"], model: "gpt-5" },
				],
			} as AgentConfig,
		}

		await applyRuntimeEffects({
			effects: [
				// Track the first model in custom chain
				{ type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s1", modelId: "google/gemini-3-pro" } },
				{ type: "injectPromptAsync", sessionId: "s1", text: "continue", agent: "fighter" },
			],
			client: client as never,
			tracker: makeMockTracker(),
			// Only models from custom chain are available
			availableModels: new Set(["google/gemini-3-pro", "openai/gpt-5"]),
			agents: customAgents,
			recordInjectedPrompt: (sessionId, text) => recorded.push({ sessionId, text }),
		})

		// Two calls: original (failed) + retry with fallback from custom chain
		expect(calls).toHaveLength(2)
		expect(calls[0].path.id).toBe("s1")
		expect(calls[1].path.id).toBe("s1")
		expect(recorded).toHaveLength(1)
	})

	it("prefers custom chain over native chain for model resolution", async () => {
		let callIndex = 0
		const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
		const client = {
			session: {
				promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
					calls.push(input)
					callIndex++
					// First call fails
					if (callIndex === 1) {
						throw new Error("OpenAI: rate limit exceeded")
					}
				},
			},
		}

		// Custom chain for bard: google/gemini-3-pro -> openai/gpt-5
		// Native chain for bard: anthropic/claude-opus-4.6 -> anthropic/claude-opus-4 -> openai/gpt-5
		// We start with google/gemini-3-pro (from custom chain), so next should be openai/gpt-5 (also from custom chain)
		// NOT anthropic/claude-opus-4 (from native chain)
		const customAgents: Record<string, AgentConfig> = {
			bard: {
				fallbackChain: [
					{ providers: ["google"], model: "gemini-3-pro" },
					{ providers: ["openai"], model: "gpt-5" },
				],
			} as AgentConfig,
		}

		await applyRuntimeEffects({
			effects: [
				{ type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s2", modelId: "google/gemini-3-pro" } },
				{ type: "injectPromptAsync", sessionId: "s2", text: "continue", agent: "bard" },
			],
			client: client as never,
			tracker: makeMockTracker(),
			// Both custom and native models available, but custom should be preferred
			availableModels: new Set([
				"google/gemini-3-pro",
				"openai/gpt-5",
				"anthropic/claude-opus-4.6",
				"anthropic/claude-opus-4",
			]),
			agents: customAgents,
		})

		// Two calls: original + retry
		expect(calls).toHaveLength(2)
	})

	it("returns null when custom chain exhausted and no native chain fallback", async () => {
		const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
		const client = {
			session: {
				promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
					calls.push(input)
					throw new Error("OpenAI: quota exceeded")
				},
			},
		}

		// Custom chain with only one model
		const customAgents: Record<string, AgentConfig> = {
			ranger: {
				fallbackChain: [
					{ providers: ["google"], model: "gemini-3-pro" },
				],
			} as AgentConfig,
		}

		await expect(
			applyRuntimeEffects({
				effects: [
					{ type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s3", modelId: "google/gemini-3-pro" } },
					{ type: "injectPromptAsync", sessionId: "s3", text: "continue", agent: "ranger" },
				],
				client: client as never,
				tracker: makeMockTracker(),
				availableModels: new Set(["google/gemini-3-pro"]),
				agents: customAgents,
			}),
		).rejects.toThrow("OpenAI: quota exceeded")

		// Only one call — no retry because custom chain is exhausted
		expect(calls).toHaveLength(1)
	})

	it("skips unavailable models in custom chain during failover", async () => {
		let callIndex = 0
		const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
		const client = {
			session: {
				promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
					calls.push(input)
					callIndex++
					// First call fails
					if (callIndex === 1) {
						throw new Error("OpenAI: rate limit exceeded")
					}
				},
			},
		}

		// Custom chain: google/gemini-3-pro -> openai/gpt-5 -> anthropic/claude-opus-4
		// But only gemini and claude-opus-4 are available (gpt-5 is not)
		const customAgents: Record<string, AgentConfig> = {
			wizard: {
				fallbackChain: [
					{ providers: ["google"], model: "gemini-3-pro" },
					{ providers: ["openai"], model: "gpt-5" },
					{ providers: ["anthropic"], model: "claude-opus-4" },
				],
			} as AgentConfig,
		}

		await applyRuntimeEffects({
			effects: [
				{ type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s4", modelId: "google/gemini-3-pro" } },
				{ type: "injectPromptAsync", sessionId: "s4", text: "continue", agent: "wizard" },
			],
			client: client as never,
			tracker: makeMockTracker(),
			// Only gemini and claude-opus-4 available (gpt-5 is missing)
			availableModels: new Set(["google/gemini-3-pro", "anthropic/claude-opus-4"]),
			agents: customAgents,
		})

		// Two calls: original + retry with claude-opus-4 (skipping unavailable gpt-5)
		expect(calls).toHaveLength(2)
	})

	it("ignores custom chain when agent not in agents record", async () => {
		let callIndex = 0
		const calls: Array<{ path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }> = []
		const client = {
			session: {
				promptAsync: async (input: { path: { id: string }; body: { parts: Array<{ type: string; text?: string }>; agent?: string } }) => {
					calls.push(input)
					callIndex++
					// First call fails
					if (callIndex === 1) {
						throw new Error("OpenAI: quota exceeded")
					}
				},
			},
		}

		// agents record has custom chain for rogue, but we're using cleric
		const customAgents: Record<string, AgentConfig> = {
			rogue: {
				fallbackChain: [
					{ providers: ["google"], model: "gemini-3-pro" },
				],
			} as AgentConfig,
		}

		await applyRuntimeEffects({
			effects: [
				// cleric's native chain: anthropic/claude-sonnet-4.6 -> anthropic/claude-sonnet-4 -> openai/gpt-5
				{ type: "trackAnalytics", event: { kind: "trackModel", sessionId: "s5", modelId: "anthropic/claude-sonnet-4.6" } },
				{ type: "injectPromptAsync", sessionId: "s5", text: "continue", agent: "cleric" },
			],
			client: client as never,
			tracker: makeMockTracker(),
			availableModels: new Set(["anthropic/claude-sonnet-4.6", "anthropic/claude-sonnet-4", "openai/gpt-5"]),
			agents: customAgents,
		})

		// Two calls: original + retry with native chain (anthropic/claude-sonnet-4)
		expect(calls).toHaveLength(2)
	})
})

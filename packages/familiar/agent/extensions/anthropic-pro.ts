/**
 * Anthropic Pro/Max Extension for pi
 *
 * Uses raw fetch (no SDK) to ensure OAuth headers are sent correctly.
 * The Anthropic SDK overrides headers in ways that break Pro/Max billing.
 *
 * Headers that tell Anthropic to bill against the subscription:
 *   - Authorization: Bearer <oauth-token>
 *   - anthropic-beta: claude-code-20250219,oauth-2025-04-20,...
 *   - user-agent: claude-cli/2.1.90 (external, cli)
 *   - x-app: cli
 */

import fs from "fs";
import path from "path";
import os from "os";
import { createHash } from "crypto";
import {
	type Api,
	type AssistantMessage,
	type AssistantMessageEventStream,
	type Context,
	calculateCost,
	createAssistantMessageEventStream,
	type ImageContent,
	type Message,
	type Model,
	type OAuthCredentials,
	type OAuthLoginCallbacks,
	type SimpleStreamOptions,
	type StopReason,
	type TextContent,
	type ThinkingContent,
	type Tool,
	type ToolCall,
	type ToolResultMessage,
} from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// =============================================================================
// OAuth
// =============================================================================

const decode = (s: string) => atob(s);
const CLIENT_ID = decode("OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl");
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
const SCOPES = "org:create_api_key user:profile user:inference";

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	const verifier = btoa(String.fromCharCode(...array))
		.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	const encoder = new TextEncoder();
	const hash = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
	const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	return { verifier, challenge };
}

async function loginAnthropic(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
	const { verifier, challenge } = await generatePKCE();
	const authParams = new URLSearchParams({
		code: "true", client_id: CLIENT_ID, response_type: "code",
		redirect_uri: REDIRECT_URI, scope: SCOPES,
		code_challenge: challenge, code_challenge_method: "S256", state: verifier,
	});
	callbacks.onAuth({ url: `${AUTHORIZE_URL}?${authParams.toString()}` });
	const authCode = await callbacks.onPrompt({ message: "Paste the authorization code:" });
	const [code, state] = authCode.split("#");
	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ grant_type: "authorization_code", client_id: CLIENT_ID, code, state, redirect_uri: REDIRECT_URI, code_verifier: verifier }),
	});
	if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
	const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
	return { refresh: data.refresh_token, access: data.access_token, expires: Date.now() + data.expires_in * 1000 - 5 * 60 * 1000 };
}

async function refreshAnthropicToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ grant_type: "refresh_token", client_id: CLIENT_ID, refresh_token: credentials.refresh }),
	});
	if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
	const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
	return { refresh: data.refresh_token, access: data.access_token, expires: Date.now() + data.expires_in * 1000 - 5 * 60 * 1000 };
}

// =============================================================================
// Claude CLI Credentials
// =============================================================================

interface ClaudeCliCredentials {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

async function readClaudeCliCredentials(): Promise<ClaudeCliCredentials | null> {
	try {
		const credsPath = path.join(os.homedir(), ".claude", ".credentials.json");
		const content = await fs.promises.readFile(credsPath, "utf-8");
		const data = JSON.parse(content) as any;
		const oauth = data.claudeAiOauth;
		if (!oauth?.accessToken || !oauth?.refreshToken || !oauth?.expiresAt) return null;
		return {
			accessToken: oauth.accessToken,
			refreshToken: oauth.refreshToken,
			expiresAt: oauth.expiresAt,
		};
	} catch {
		return null;
	}
}

async function writeBackToken(access: string, refresh: string, expires: number): Promise<void> {
	try {
		const authPath = path.join(os.homedir(), ".pi", "agent", "auth.json");
		const content = await fs.promises.readFile(authPath, "utf-8");
		const auth = JSON.parse(content) as any;
		if (auth["anthropic-pro"]) {
			auth["anthropic-pro"].access = access;
			auth["anthropic-pro"].refresh = refresh;
			auth["anthropic-pro"].expires = expires;
		}
		await fs.promises.writeFile(authPath, JSON.stringify(auth, null, 2), { mode: 0o600 });
	} catch {
		// Silently ignore write errors
	}
}

// =============================================================================
// Billing header + System prompt transforms (matching opencode-claude-auth)
// =============================================================================

const BILLING_SALT = "59cf53e54c78";
const SYSTEM_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude.";
const TOOL_PREFIX = "mcp_";

function extractFirstUserMessageText(messages: any[]): string {
	const userMsg = messages.find((m) => m.role === "user");
	if (!userMsg) return "";
	const content = userMsg.content;
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		const textBlock = content.find((b) => b.type === "text");
		if (textBlock && textBlock.type === "text" && textBlock.text) {
			return textBlock.text;
		}
	}
	return "";
}

function computeCch(messageText: string): string {
	return createHash("sha256").update(messageText).digest("hex").slice(0, 5);
}

function computeVersionSuffix(messageText: string, version: string): string {
	const sampled = [4, 7, 20]
		.map((i) => (i < messageText.length ? messageText[i] : "0"))
		.join("");
	const input = `${BILLING_SALT}${sampled}${version}`;
	return createHash("sha256").update(input).digest("hex").slice(0, 3);
}

function buildBillingHeaderValue(messages: any[], version: string, entrypoint: string): string {
	const text = extractFirstUserMessageText(messages);
	const suffix = computeVersionSuffix(text, version);
	const cch = computeCch(text);
	return (`x-anthropic-billing-header: ` +
		`cc_version=${version}.${suffix}; ` +
		`cc_entrypoint=${entrypoint}; ` +
		`cch=${cch};`);
}

function transformBody(body: any, modelId: string, version: string): any {
	if (typeof body !== "object" || body === null) return body;

	const parsed = { ...body };

	// --- Billing header: inject as system[0] (no cache_control) ---
	const billingHeader = buildBillingHeaderValue(parsed.messages ?? [], version, "cli");
	if (!Array.isArray(parsed.system)) {
		parsed.system = [];
	}
	// Remove any existing billing header entries
	parsed.system = parsed.system.filter((e: any) => !(e.type === "text" &&
		typeof e.text === "string" &&
		e.text.startsWith("x-anthropic-billing-header")));
	// Insert billing header as system[0], without cache_control
	parsed.system.unshift({ type: "text", text: billingHeader });

	// --- Split identity prefix into its own system entry ---
	const splitSystem = [];
	for (const entry of parsed.system) {
		if (entry.type === "text" &&
			typeof entry.text === "string" &&
			entry.text.startsWith(SYSTEM_IDENTITY) &&
			entry.text.length > SYSTEM_IDENTITY.length) {
			const rest = entry.text
				.slice(SYSTEM_IDENTITY.length)
				.replace(/^\n+/, "");
			// Preserve all properties except text (e.g. cache_control)
			const { text: _text, ...entryProps } = entry;
			// Only keep cache_control on the remainder block
			const { cache_control: _cc, ...identityProps } = entryProps;
			splitSystem.push({ ...identityProps, type: "text", text: SYSTEM_IDENTITY });
			if (rest.length > 0) {
				splitSystem.push({ ...entryProps, text: rest });
			}
		}
		else {
			splitSystem.push(entry);
		}
	}
	parsed.system = splitSystem;

	// --- Relocate non-core system entries to user messages ---
	const BILLING_PREFIX = "x-anthropic-billing-header";
	const keptSystem = [];
	const movedTexts = [];
	for (const entry of parsed.system) {
		const txt = typeof entry === "string" ? entry : entry.text ?? "";
		if (txt.startsWith(BILLING_PREFIX) || txt.startsWith(SYSTEM_IDENTITY)) {
			keptSystem.push(entry);
		}
		else if (txt.length > 0) {
			movedTexts.push(txt);
		}
	}
	if (movedTexts.length > 0 && Array.isArray(parsed.messages)) {
		const firstUser = parsed.messages.find((m) => m.role === "user");
		if (firstUser) {
			parsed.system = keptSystem;
			const prefix = movedTexts.join("\n\n");
			if (typeof firstUser.content === "string") {
				firstUser.content = prefix + "\n\n" + firstUser.content;
			}
			else if (Array.isArray(firstUser.content)) {
				firstUser.content.unshift({ type: "text", text: prefix });
			}
		}
	}

	// --- Strip effort for models that don't support it (e.g. haiku) ---
	const isHaiku = modelId.toLowerCase().includes("haiku");
	if (isHaiku) {
		if (parsed.output_config && "effort" in parsed.output_config) {
			delete parsed.output_config.effort;
			if (Object.keys(parsed.output_config).length === 0) {
				delete parsed.output_config;
			}
		}
		if (parsed.thinking && "effort" in parsed.thinking) {
			delete parsed.thinking.effort;
			if (Object.keys(parsed.thinking).length === 0) {
				delete parsed.thinking;
			}
		}
	}

	// --- Add mcp_ prefix to tool names ---
	if (Array.isArray(parsed.tools)) {
		parsed.tools = parsed.tools.map((tool: any) => ({
			...tool,
			name: tool.name ? `${TOOL_PREFIX}${tool.name.charAt(0).toUpperCase()}${tool.name.slice(1)}` : tool.name,
		}));
	}
	if (Array.isArray(parsed.messages)) {
		parsed.messages = parsed.messages.map((message: any) => {
			if (!Array.isArray(message.content)) {
				return message;
			}
			return {
				...message,
				content: message.content.map((block: any) => {
					if (block.type !== "tool_use" || typeof block.name !== "string") {
						return block;
					}
					return {
						...block,
						name: `${TOOL_PREFIX}${block.name.charAt(0).toUpperCase()}${block.name.slice(1)}`,
					};
				}),
			};
		});
	}

	return parsed;
}

// =============================================================================
// Message conversion helpers
// =============================================================================

const claudeCodeTools = ["Read","Write","Edit","Bash","Grep","Glob","AskUserQuestion","TodoWrite","WebFetch","WebSearch"];
const ccToolLookup = new Map(claudeCodeTools.map((t) => [t.toLowerCase(), t]));
const toCC = (name: string) => ccToolLookup.get(name.toLowerCase()) ?? name;
const fromCC = (name: string, tools?: Tool[]) => tools?.find((t) => t.name.toLowerCase() === name.toLowerCase())?.name ?? name;

function sanitize(text: string): string {
	return text.replace(/[\uD800-\uDFFF]/g, "\uFFFD");
}

function convertContentBlocks(content: (TextContent | ImageContent)[]): any {
	const hasImages = content.some((c) => c.type === "image");
	if (!hasImages) return sanitize(content.map((c) => (c as TextContent).text).join("\n"));
	const blocks = content.map((b) =>
		b.type === "text"
			? { type: "text", text: sanitize(b.text) }
			: { type: "image", source: { type: "base64", media_type: b.mimeType, data: b.data } }
	);
	if (!blocks.some((b) => b.type === "text")) blocks.unshift({ type: "text", text: "(see attached image)" });
	return blocks;
}

function convertMessages(messages: Message[], tools?: Tool[]): any[] {
	const out: any[] = [];
	for (let i = 0; i < messages.length; i++) {
		const msg = messages[i];
		if (msg.role === "user") {
			const content = typeof msg.content === "string"
				? sanitize(msg.content)
				: msg.content.map((item) =>
					item.type === "text"
						? { type: "text", text: sanitize(item.text) }
						: { type: "image", source: { type: "base64", media_type: item.mimeType, data: item.data } }
				);
			if ((typeof content === "string" && content.trim()) || (Array.isArray(content) && content.length > 0))
				out.push({ role: "user", content });
		} else if (msg.role === "assistant") {
			const blocks: any[] = [];
			for (const block of msg.content) {
				if (block.type === "text" && block.text.trim())
					blocks.push({ type: "text", text: sanitize(block.text) });
				else if (block.type === "thinking" && block.thinking.trim()) {
					if ((block as ThinkingContent).thinkingSignature)
						blocks.push({ type: "thinking", thinking: sanitize(block.thinking), signature: (block as ThinkingContent).thinkingSignature });
					else
						blocks.push({ type: "text", text: sanitize(block.thinking) });
				} else if (block.type === "toolCall")
					blocks.push({ type: "tool_use", id: block.id, name: toCC(block.name), input: block.arguments });
			}
			if (blocks.length > 0) out.push({ role: "assistant", content: blocks });
		} else if (msg.role === "toolResult") {
			const results: any[] = [{ type: "tool_result", tool_use_id: msg.toolCallId, content: convertContentBlocks(msg.content), is_error: msg.isError }];
			let j = i + 1;
			while (j < messages.length && messages[j].role === "toolResult") {
				const nm = messages[j] as ToolResultMessage;
				results.push({ type: "tool_result", tool_use_id: nm.toolCallId, content: convertContentBlocks(nm.content), is_error: nm.isError });
				j++;
			}
			i = j - 1;
			out.push({ role: "user", content: results });
		}
	}
	// cache control on last user message
	if (out.length > 0) {
		const last = out[out.length - 1];
		if (last.role === "user" && Array.isArray(last.content)) {
			const lb = last.content[last.content.length - 1];
			if (lb) lb.cache_control = { type: "ephemeral" };
		}
	}
	return out;
}

function convertTools(tools: Tool[]): any[] {
	return tools.map((t) => ({
		name: toCC(t.name),
		description: t.description,
		input_schema: { type: "object", properties: (t.parameters as any).properties || {}, required: (t.parameters as any).required || [] },
	}));
}

function mapStopReason(reason: string): StopReason {
	switch (reason) {
		case "end_turn": case "pause_turn": case "stop_sequence": return "stop";
		case "max_tokens": return "length";
		case "tool_use": return "toolUse";
		default: return "error";
	}
}

function stripToolPrefix(name: string): string {
	return name.startsWith(TOOL_PREFIX) ? name.slice(TOOL_PREFIX.length) : name;
}

// =============================================================================
// Session management
// =============================================================================

const sessionId = crypto.randomUUID();

// =============================================================================
// Raw fetch streaming — no SDK, full control over headers
// =============================================================================

function streamAnthropicPro(model: Model<Api>, context: Context, options?: SimpleStreamOptions): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	(async () => {
		const output: AssistantMessage = {
			role: "assistant", content: [],
			api: model.api, provider: model.provider, model: model.id,
			usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
			stopReason: "stop", timestamp: Date.now(),
		};

		try {
			let apiKey = options?.apiKey ?? "";
			const isOAuth = apiKey.includes("sk-ant-oat");

		// Pre-flight token freshness check for OAuth
		if (isOAuth) {
			// Check if current token is within 5 minutes of expiry
			const tokenExpiresAt = options?.tokenExpires ?? 0;
			const now = Date.now();
			const fiveMinutes = 5 * 60 * 1000;
			if (tokenExpiresAt && tokenExpiresAt - now < fiveMinutes) {
				// Token is stale — try Claude CLI credentials first
				const cliCreds = await readClaudeCliCredentials();
				if (cliCreds && cliCreds.expiresAt > now) {
					apiKey = cliCreds.accessToken;
					writeBackToken(cliCreds.accessToken, cliCreds.refreshToken, cliCreds.expiresAt).catch(() => {});
				} else {
					// CLI creds also expired or unavailable — call refresh endpoint directly
					const refreshToken = cliCreds?.refreshToken ?? "";
					if (refreshToken) {
						try {
							const refreshed = await refreshAnthropicToken({ access: apiKey, refresh: refreshToken, expires: tokenExpiresAt });
							apiKey = refreshed.access;
							writeBackToken(refreshed.access, refreshed.refresh, refreshed.expires).catch(() => {});
						} catch {
							// Refresh failed — proceed with current token, will likely get 401
						}
					}
				}
			}
		}

			// Build beta list — matches opencode-claude-auth model-config.js exactly
			const isHaiku = model.id.toLowerCase().includes("haiku");
			const is46 = model.id.toLowerCase().includes("4-6");
			const betas = [
				"claude-code-20250219",
				"oauth-2025-04-20",
				...(!isHaiku ? ["interleaved-thinking-2025-05-14"] : []),
				"prompt-caching-scope-2026-01-05",
				"context-management-2025-06-27",
				...(is46 ? ["effort-2025-11-24"] : []),
			].join(",");

			// Build request body
			let body: any = {
				model: model.id,
				messages: convertMessages(context.messages, context.tools),
				max_tokens: options?.maxTokens || 16000,
				stream: true,
			};

			// System prompt — always prepend Claude Code identity for OAuth
			const systemBlocks: any[] = [];
			if (isOAuth) {
				systemBlocks.push({ type: "text", text: SYSTEM_IDENTITY, cache_control: { type: "ephemeral" } });
			}
			if (context.systemPrompt) {
				systemBlocks.push({ type: "text", text: sanitize(context.systemPrompt), cache_control: { type: "ephemeral" } });
			}
			if (systemBlocks.length > 0) body.system = systemBlocks;

			if (context.tools) body.tools = convertTools(context.tools);

			// Thinking/reasoning
			if (options?.reasoning && model.reasoning && !isHaiku) {
				const budgets: Record<string, number> = { minimal: 1024, low: 4096, medium: 10240, high: 20480 };
				body.thinking = { type: "enabled", budget_tokens: budgets[options.reasoning] ?? 10240 };
			}

			// Apply body transformation: billing header, system relocation, tool prefix, effort stripping
			const ccVersion = "2.1.90"; // Match opencode-claude-auth version
			body = transformBody(body, model.id, ccVersion);

			// Build headers — raw, no SDK interference
			const headers: Record<string, string> = {
				"content-type": "application/json",
				"accept": "text/event-stream",
				"anthropic-version": "2023-06-01",
				"anthropic-beta": betas,
			};

			if (isOAuth) {
				headers["authorization"] = `Bearer ${apiKey}`;
				headers["user-agent"] = "claude-cli/2.1.90 (external, cli)";
				headers["x-app"] = "cli";
				headers["x-client-request-id"] = crypto.randomUUID();
				headers["X-Claude-Code-Session-Id"] = sessionId;
			} else {
				headers["x-api-key"] = apiKey;
			}

		const baseUrl = (model.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");
		
		let response = await fetch(`${baseUrl}/v1/messages`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			signal: options?.signal,
		});

		// 401 retry logic for OAuth — try to refresh token
		if (response.status === 401 && isOAuth) {
			let refreshedKey: string | null = null;

			// First: try Claude CLI credentials
			const cliCreds = await readClaudeCliCredentials();
			if (cliCreds && cliCreds.accessToken !== apiKey && cliCreds.expiresAt > Date.now()) {
				refreshedKey = cliCreds.accessToken;
				writeBackToken(cliCreds.accessToken, cliCreds.refreshToken, cliCreds.expiresAt).catch(() => {});
			} else {
				// CLI creds also expired — call refresh endpoint directly
				const refreshToken = cliCreds?.refreshToken ?? "";
				if (refreshToken) {
					try {
						const refreshed = await refreshAnthropicToken({ access: apiKey, refresh: refreshToken, expires: 0 });
						refreshedKey = refreshed.access;
						writeBackToken(refreshed.access, refreshed.refresh, refreshed.expires).catch(() => {});
					} catch {
						// Refresh failed — cannot recover
					}
				}
			}

			if (refreshedKey) {
				apiKey = refreshedKey;
				headers["authorization"] = `Bearer ${apiKey}`;
				headers["x-client-request-id"] = crypto.randomUUID();

				// Retry once
				response = await fetch(`${baseUrl}/v1/messages`, {
					method: "POST",
					headers,
					body: JSON.stringify(body),
					signal: options?.signal,
				});
			}
		}

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`${response.status} ${errText}`);
		}

			// Parse SSE stream
			stream.push({ type: "start", partial: output });

			type Block = (ThinkingContent | TextContent | (ToolCall & { partialJson: string })) & { index: number };
			const blocks = output.content as Block[];

			const reader = response.body!.getReader();
			const decoder = new TextDecoder();
			let buf = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buf += decoder.decode(value, { stream: true });

				const lines = buf.split("\n");
				buf = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6).trim();
					if (data === "[DONE]") break;
					let event: any;
					try { event = JSON.parse(data); } catch { continue; }

					if (event.type === "message_start") {
						const u = event.message?.usage ?? {};
						output.usage.input = u.input_tokens || 0;
						output.usage.output = u.output_tokens || 0;
						output.usage.cacheRead = u.cache_read_input_tokens || 0;
						output.usage.cacheWrite = u.cache_creation_input_tokens || 0;
						output.usage.totalTokens = output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
						calculateCost(model, output.usage);
					} else if (event.type === "content_block_start") {
						const cb = event.content_block;
						if (cb.type === "text") {
							output.content.push({ type: "text", text: "", index: event.index } as any);
							stream.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });
						} else if (cb.type === "thinking") {
							output.content.push({ type: "thinking", thinking: "", thinkingSignature: "", index: event.index } as any);
							stream.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
					} else if (cb.type === "tool_use") {
						// Strip mcp_ prefix before converting from Claude Code naming
						const cleanName = stripToolPrefix(cb.name);
						output.content.push({ type: "toolCall", id: cb.id, name: fromCC(cleanName, context.tools), arguments: {}, partialJson: "", index: event.index } as any);
						stream.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });
					}
					} else if (event.type === "content_block_delta") {
						const idx = blocks.findIndex((b) => b.index === event.index);
						const block = blocks[idx];
						if (!block) continue;
						const d = event.delta;
						if (d.type === "text_delta" && block.type === "text") {
							block.text += d.text;
							stream.push({ type: "text_delta", contentIndex: idx, delta: d.text, partial: output });
						} else if (d.type === "thinking_delta" && block.type === "thinking") {
							block.thinking += d.thinking;
							stream.push({ type: "thinking_delta", contentIndex: idx, delta: d.thinking, partial: output });
						} else if (d.type === "input_json_delta" && block.type === "toolCall") {
							(block as any).partialJson += d.partial_json;
							try { block.arguments = JSON.parse((block as any).partialJson); } catch {}
							stream.push({ type: "toolcall_delta", contentIndex: idx, delta: d.partial_json, partial: output });
						} else if (d.type === "signature_delta" && block.type === "thinking") {
							block.thinkingSignature = (block.thinkingSignature || "") + d.signature;
						}
					} else if (event.type === "content_block_stop") {
						const idx = blocks.findIndex((b) => b.index === event.index);
						const block = blocks[idx];
						if (!block) continue;
						delete (block as any).index;
						if (block.type === "text") {
							stream.push({ type: "text_end", contentIndex: idx, content: block.text, partial: output });
						} else if (block.type === "thinking") {
							stream.push({ type: "thinking_end", contentIndex: idx, content: block.thinking, partial: output });
						} else if (block.type === "toolCall") {
							try { block.arguments = JSON.parse((block as any).partialJson); } catch {}
							delete (block as any).partialJson;
							stream.push({ type: "toolcall_end", contentIndex: idx, toolCall: block, partial: output });
						}
					} else if (event.type === "message_delta") {
						if (event.delta?.stop_reason) output.stopReason = mapStopReason(event.delta.stop_reason);
						const u = event.usage ?? {};
						output.usage.input = u.input_tokens || output.usage.input;
						output.usage.output = u.output_tokens || output.usage.output;
						output.usage.cacheRead = u.cache_read_input_tokens || output.usage.cacheRead;
						output.usage.cacheWrite = u.cache_creation_input_tokens || output.usage.cacheWrite;
						output.usage.totalTokens = output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
						calculateCost(model, output.usage);
					}
				}
			}

			if (options?.signal?.aborted) throw new Error("Request was aborted");

			stream.push({ type: "done", reason: output.stopReason as "stop" | "length" | "toolUse", message: output });
			stream.end();
		} catch (error) {
			for (const block of output.content) delete (block as any).index;
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
			stream.push({ type: "error", reason: output.stopReason, error: output });
			stream.end();
		}
	})();

	return stream;
}

// =============================================================================
// Extension Entry Point
// =============================================================================

export default function (pi: ExtensionAPI) {
	pi.registerProvider("anthropic-pro", {
		baseUrl: "https://api.anthropic.com",
		apiKey: "ANTHROPIC_PRO_API_KEY",
		api: "anthropic-pro-api",

		models: [
			{
				id: "claude-opus-4-6",
				name: "Claude Opus 4.6 (Pro/Max)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
				contextWindow: 200000,
				maxTokens: 32000,
			},
			{
				id: "claude-sonnet-4-6",
				name: "Claude Sonnet 4.6 (Pro/Max)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 64000,
			},
			{
				id: "claude-opus-4-5",
				name: "Claude Opus 4.5 (Pro/Max)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
				contextWindow: 200000,
				maxTokens: 32000,
			},
			{
				id: "claude-sonnet-4-5",
				name: "Claude Sonnet 4.5 (Pro/Max)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 64000,
			},
			{
				id: "claude-haiku-4-5",
				name: "Claude Haiku 4.5 (Pro/Max)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
				contextWindow: 200000,
				maxTokens: 8096,
			},
		],

		oauth: {
			name: "Anthropic Pro/Max (Claude subscription)",
			login: loginAnthropic,
			refreshToken: refreshAnthropicToken,
			getApiKey: (cred) => cred.access,
		},

		streamSimple: streamAnthropicPro,
	});
}

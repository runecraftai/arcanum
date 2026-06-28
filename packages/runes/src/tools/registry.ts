import type { ToolDefinition } from "@opencode-ai/plugin";
import { createContextTool } from "./context";
import { createDeleteTool } from "./delete";
import { createGetTool } from "./get";
import { createSaveTool } from "./save";
import { createSearchTool } from "./search";
import { createSessionEndTool } from "./session-end";
import { createSessionStartTool } from "./session-start";
import { createStatsTool } from "./stats";
import { createTimelineTool } from "./timeline";
import { createUpdateTool } from "./update";
import type { ToolDeps } from "./types";

export type RuneTool = ToolDefinition;
export type ToolsRecord = Record<string, RuneTool>;

export function createToolsRecord(deps: ToolDeps): ToolsRecord {
	return {
		rune_save: createSaveTool(deps),
		rune_search: createSearchTool(deps),
		rune_get: createGetTool(deps),
		rune_context: createContextTool(deps),
		rune_timeline: createTimelineTool(deps),
		rune_update: createUpdateTool(deps),
		rune_delete: createDeleteTool(deps),
		rune_session_start: createSessionStartTool(deps),
		rune_session_end: createSessionEndTool(deps),
		rune_stats: createStatsTool(deps),
	};
}

export function filterToolsByDisabled(
	tools: ToolsRecord,
	disabled: string[] | undefined,
): ToolsRecord {
	if (!disabled || disabled.length === 0) return tools;
	const set = new Set(disabled);
	const filtered: ToolsRecord = {};
	for (const [name, tool] of Object.entries(tools)) {
		if (!set.has(name)) filtered[name] = tool;
	}
	return filtered;
}

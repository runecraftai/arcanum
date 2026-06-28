import type { Database } from "../db/client";
import type { Repository } from "../db/repository";
import type { RunesConfig } from "../config/schema";
import { createToolsRecord, filterToolsByDisabled, type ToolsRecord } from "../tools/registry";

export interface PluginInterfaceArgs {
	config: RunesConfig;
	database: Database;
	repository: Repository;
	projectSlug: string;
}

export interface PluginOutput {
	name: string;
	tool: ToolsRecord;
}

export function createPluginInterface(args: PluginInterfaceArgs): PluginOutput {
	const project = args.repository.getProjectBySlug(args.projectSlug);
	const projectId = project?.id ?? 0;
	const tools = createToolsRecord({
		repository: args.repository,
		projectSlug: args.projectSlug,
		projectId,
	});
	const filtered = filterToolsByDisabled(tools, args.config.disabled_tools);
	return {
		name: "runes",
		tool: filtered,
	};
}

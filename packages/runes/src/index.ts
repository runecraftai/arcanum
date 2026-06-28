import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { loadConfig } from "./config/loader";
import { openDatabase, type Database } from "./db/client";
import { Repository } from "./db/repository";
import { ensureDataDir } from "./lib/paths";
import { resolveProjectSlug } from "./lib/project";
import { createPluginInterface, type PluginOutput } from "./plugin/plugin-interface";

const RunesPlugin: Plugin = async (ctx: PluginInput): Promise<PluginOutput> => {
	const config = loadConfig(ctx.directory);
	if (config.data_dir) {
		process.env.RUNES_DATA_DIR = config.data_dir;
	}
	const dataDir = await ensureDataDir();
	const db: Database = openDatabase(dataDir);
	const identity = await resolveProjectSlug(ctx.directory);
	const repository = new Repository(db);
	const project = repository.getOrCreateProject(identity.slug, identity.rootPath, identity.remoteUrl);

	return createPluginInterface({
		config,
		database: db,
		repository,
		projectSlug: project.slug,
	});
};

export default RunesPlugin;
export const server = RunesPlugin;

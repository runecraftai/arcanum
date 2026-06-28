import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

function homeDir(): string {
	return process.env.HOME || process.env.USERPROFILE || homedir();
}

export function resolveDataDir(): string {
	const override = process.env.RUNES_DATA_DIR;
	if (override && override.length > 0) {
		return override;
	}
	return join(homeDir(), ".runes");
}

export async function ensureDataDir(): Promise<string> {
	const dir = resolveDataDir();
	await mkdir(dir, { recursive: true });
	return dir;
}

export function resolveConfigPaths(directory: string): { user: string; project: string } {
	const home = homeDir();
	return {
		user: join(home, ".config", "opencode", "runes.jsonc"),
		project: join(directory, ".opencode", "runes.jsonc"),
	};
}

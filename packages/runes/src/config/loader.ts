import { existsSync, readFileSync } from "node:fs";
import { RunesConfigSchema, type RunesConfig } from "./schema";
import { resolveConfigPaths } from "../lib/paths";

function stripJsonc(input: string): string {
	let result = "";
	let i = 0;
	let inString = false;
	let stringQuote = "";
	while (i < input.length) {
		const ch = input[i];
		const next = input[i + 1];
		if (inString) {
			result += ch;
			if (ch === "\\" && i + 1 < input.length) {
				result += next;
				i += 2;
				continue;
			}
			if (ch === stringQuote) inString = false;
			i++;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inString = true;
			stringQuote = ch;
			result += ch;
			i++;
			continue;
		}
		if (ch === "/" && next === "/") {
			while (i < input.length && input[i] !== "\n") i++;
			continue;
		}
		if (ch === "/" && next === "*") {
			i += 2;
			while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i++;
			i += 2;
			continue;
		}
		result += ch;
		i++;
	}
	result = result.replace(/,(\s*[}\]])/g, "$1");
	return result;
}

function readJsoncFile(filePath: string): Partial<RunesConfig> | null {
	if (!existsSync(filePath)) return null;
	try {
		const text = readFileSync(filePath, "utf-8");
		const stripped = stripJsonc(text);
		if (stripped.trim().length === 0) return {};
		const parsed = JSON.parse(stripped);
		const validated = RunesConfigSchema.safeParse(parsed);
		if (!validated.success) {
			console.warn(
				`runes: invalid config at ${filePath}: ${validated.error.issues[0]?.message ?? "unknown"}`,
			);
			return null;
		}
		return validated.data;
	} catch (err) {
		console.warn(
			`runes: failed to parse ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
		);
		return null;
	}
}

function unionUnique<T>(a: T[] | undefined, b: T[] | undefined): T[] | undefined {
	if (!a && !b) return undefined;
	const set = new Set<T>([...(a ?? []), ...(b ?? [])]);
	return Array.from(set);
}

function mergeConfigs(base: Partial<RunesConfig>, override: Partial<RunesConfig>): RunesConfig {
	const merged: RunesConfig = {
		disabled_skills: unionUnique(base.disabled_skills, override.disabled_skills),
		disabled_tools: unionUnique(base.disabled_tools, override.disabled_tools),
		data_dir: override.data_dir ?? base.data_dir,
		importance_floor: override.importance_floor ?? base.importance_floor,
	};
	return merged;
}

export function loadConfig(directory: string): RunesConfig {
	const { user, project } = resolveConfigPaths(directory);
	const userConfig = readJsoncFile(user) ?? {};
	const projectConfig = readJsoncFile(project) ?? {};
	return mergeConfigs(userConfig, projectConfig);
}

export { resolveConfigPaths, resolveDataDir } from "../lib/paths";

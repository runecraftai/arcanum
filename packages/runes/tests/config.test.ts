import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config/loader";

let sandbox = "";
let projectDir = "";
const originalHome = process.env.HOME;

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-config-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	projectDir = join(sandbox, "project");
	mkdirSync(projectDir, { recursive: true });
	mkdirSync(join(sandbox, "user-config", ".config", "opencode"), { recursive: true });
	process.env.HOME = join(sandbox, "user-config");
});

afterEach(() => {
	process.env.HOME = originalHome;
	rmSync(sandbox, { recursive: true, force: true });
});

describe("config/loader", () => {
	it("returns empty config when no files exist", () => {
		const config = loadConfig(projectDir);
		expect(config.disabled_skills).toBeUndefined();
		expect(config.disabled_tools).toBeUndefined();
	});

	it("merges user disabled_skills with project disabled_tools", () => {
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(
			userConfig,
			JSON.stringify({ disabled_skills: ["using-runes"], data_dir: "/from-user" }),
		);
		const projectConfig = join(projectDir, ".opencode", "runes.jsonc");
		mkdirSync(join(projectDir, ".opencode"), { recursive: true });
		writeFileSync(projectConfig, JSON.stringify({ disabled_tools: ["rune_delete"] }));

		const config = loadConfig(projectDir);
		expect(config.disabled_skills).toEqual(["using-runes"]);
		expect(config.disabled_tools).toEqual(["rune_delete"]);
	});

	it("project wins for scalar fields", () => {
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(userConfig, JSON.stringify({ data_dir: "/user" }));
		const projectConfig = join(projectDir, ".opencode", "runes.jsonc");
		mkdirSync(join(projectDir, ".opencode"), { recursive: true });
		writeFileSync(projectConfig, JSON.stringify({ data_dir: "/project" }));
		const config = loadConfig(projectDir);
		expect(config.data_dir).toBe("/project");
	});

	it("parses JSONC with comments and trailing commas", () => {
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(
			userConfig,
			`{
				// line comment
				"disabled_skills": ["using-runes"], /* block */
				"importance_floor": 7,
			}`,
		);
		const config = loadConfig(projectDir);
		expect(config.disabled_skills).toEqual(["using-runes"]);
		expect(config.importance_floor).toBe(7);
	});

	it("warns and returns empty when user file is invalid JSON", () => {
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(userConfig, "{ this is not json");
		const projectConfig = join(projectDir, ".opencode", "runes.jsonc");
		mkdirSync(join(projectDir, ".opencode"), { recursive: true });
		writeFileSync(projectConfig, JSON.stringify({ disabled_tools: ["rune_save"] }));

		const config = loadConfig(projectDir);
		// Project still loads.
		expect(config.disabled_tools).toEqual(["rune_save"]);
	});

	it("warns and returns empty when project file is invalid JSON", () => {
		const projectConfig = join(projectDir, ".opencode", "runes.jsonc");
		mkdirSync(join(projectDir, ".opencode"), { recursive: true });
		writeFileSync(projectConfig, "garbage");

		const config = loadConfig(projectDir);
		expect(config.disabled_tools).toBeUndefined();
	});

	it("deduplicates array entries when both layers set them", () => {
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(userConfig, JSON.stringify({ disabled_skills: ["a", "b"] }));
		const projectConfig = join(projectDir, ".opencode", "runes.jsonc");
		mkdirSync(join(projectDir, ".opencode"), { recursive: true });
		writeFileSync(projectConfig, JSON.stringify({ disabled_skills: ["b", "c"] }));

		const config = loadConfig(projectDir);
		expect(config.disabled_skills?.sort()).toEqual(["a", "b", "c"]);
	});

	it("reads the home directory from $HOME for the user file", () => {
		// Just verify the resolved path includes .config/opencode/runes.jsonc
		const userConfig = join(sandbox, "user-config", ".config", "opencode", "runes.jsonc");
		writeFileSync(userConfig, JSON.stringify({ disabled_skills: ["using-runes"] }));
		expect(existsSync(userConfig)).toBe(true);
		const config = loadConfig(projectDir);
		expect(config.disabled_skills).toEqual(["using-runes"]);
	});
});

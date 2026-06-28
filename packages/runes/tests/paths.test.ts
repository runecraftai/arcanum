import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ensureDataDir, resolveConfigPaths, resolveDataDir } from "../src/lib/paths";

describe("lib/paths", () => {
	const originalEnv = { ...process.env };
	const sandboxHome = join(process.cwd(), ".runes-test-paths");

	beforeEach(() => {
		rmSync(sandboxHome, { recursive: true, force: true });
		for (const key of Object.keys(process.env)) {
			if (key.startsWith("RUNES_")) {
				delete process.env[key];
			}
		}
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		rmSync(sandboxHome, { recursive: true, force: true });
	});

	it("env override wins", () => {
		process.env.RUNES_DATA_DIR = join(sandboxHome, "custom");
		expect(resolveDataDir()).toBe(join(sandboxHome, "custom"));
	});

	it("default falls back to ~/.runes when no env", () => {
		const result = resolveDataDir();
		expect(result.endsWith(".runes")).toBe(true);
	});

	it("ensureDataDir creates the directory and is idempotent", async () => {
		process.env.RUNES_DATA_DIR = join(sandboxHome, "data");
		const first = await ensureDataDir();
		const second = await ensureDataDir();
		expect(first).toBe(join(sandboxHome, "data"));
		expect(second).toBe(first);
		expect(existsSync(first)).toBe(true);
	});

	it("resolveConfigPaths returns user and project paths", () => {
		const paths = resolveConfigPaths("/tmp/proj");
		expect(paths.user).toContain(".config/opencode/runes.jsonc");
		expect(paths.project).toBe(join("/tmp/proj", ".opencode", "runes.jsonc"));
	});
});

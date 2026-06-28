import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import RunesPlugin from "../src/index";

let sandbox = "";

beforeEach(() => {
	sandbox = join(tmpdir(), `runes-test-plugin-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(sandbox, { recursive: true });
	process.env.RUNES_DATA_DIR = sandbox;
});

afterEach(() => {
	delete process.env.RUNES_DATA_DIR;
	rmSync(sandbox, { recursive: true, force: true });
});

function makeCtx(directory: string) {
	return {
		directory,
		client: {} as never,
		project: { root: directory } as never,
		worktree: directory,
		serverUrl: new URL("http://localhost:4096"),
		$: {} as never,
		experimental_workspace: { register: () => {} },
	} as never;
}

describe("Integration: plugin bootstrap", () => {
	it("loads and returns the 10 rune_* tools", async () => {
		const plugin = await RunesPlugin(makeCtx(sandbox));
		expect(plugin.name).toBe("runes");
		const toolNames = Object.keys(plugin.tool).sort();
		expect(toolNames).toEqual(
			[
				"rune_context",
				"rune_delete",
				"rune_get",
				"rune_save",
				"rune_search",
				"rune_session_end",
				"rune_session_start",
				"rune_stats",
				"rune_timeline",
				"rune_update",
			].sort(),
		);
	});

	it("opens the DB and creates the schema on load", async () => {
		await RunesPlugin(makeCtx(sandbox));
		expect(existsSync(join(sandbox, "runes.db"))).toBe(true);
	});

	it("is idempotent — second load does not throw", async () => {
		await RunesPlugin(makeCtx(sandbox));
		await expect(RunesPlugin(makeCtx(sandbox))).resolves.toBeDefined();
	});
});

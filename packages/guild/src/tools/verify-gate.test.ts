import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type CommandResult, createVerifyGateTool } from "./verify-gate";

let testDir: string;

beforeEach(() => {
	testDir = mkdtempSync(join(tmpdir(), "guild-verify-gate-test-"));
});

afterEach(() => {
	try {
		rmSync(testDir, { recursive: true, force: true });
	} catch {
		// ignore cleanup errors
	}
});

function makeToolContext() {
	return {
		sessionID: "test-session",
		messageID: "test-message",
		agent: "fighter",
		directory: testDir,
		worktree: testDir,
		abort: new AbortController().signal,
		metadata: () => {},
		ask: () => {
			throw new Error("not implemented");
		},
	};
}

function createPackageDir(
	name: string,
	pkgJson: Record<string, unknown>,
): string {
	const dir = join(testDir, name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "package.json"), JSON.stringify(pkgJson), "utf-8");
	return dir;
}

function makeSuccess(): CommandResult {
	return { exitCode: 0, stdout: "ok", stderr: "", timedOut: false };
}

function makeFailure(exitCode: number, output: string): CommandResult {
	return { exitCode, stdout: "", stderr: output, timedOut: false };
}

function makeTimeout(): CommandResult {
	return { exitCode: -1, stdout: "", stderr: "", timedOut: true };
}

function mockExec(
	results: CommandResult[],
): (
	cmd: string[],
	cwd: string,
	timeoutMs: number,
	signal: AbortSignal,
) => Promise<CommandResult> {
	let callIndex = 0;
	return async () => {
		return results[callIndex++] ?? makeSuccess();
	};
}

describe("createVerifyGateTool", () => {
	// Case 1: Package with passing test/build scripts and no lint script
	it("returns ok:true with passing checks when package has passing scripts", async () => {
		const pkgName = "healthy-pkg";
		createPackageDir(pkgName, {
			scripts: {
				test: "echo ok",
				build: "echo ok",
			},
		});

		const exec = mockExec([makeSuccess(), makeSuccess(), makeSuccess()]);
		const tool = createVerifyGateTool({ directory: testDir, exec });
		const result = await tool.execute(
			{ package_path: pkgName },
			makeToolContext(),
		);

		const parsed = JSON.parse(result as string);
		expect(parsed.ok).toBe(true);
		expect(parsed.checks).toHaveLength(3);

		const testCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "test",
		);
		expect(testCheck).toBeDefined();
		expect(testCheck.passed).toBe(true);
		expect(testCheck.exitCode).toBe(0);
		expect(testCheck.command).toBe("bun run test");

		const lintCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "lint",
		);
		expect(lintCheck).toBeDefined();
		expect(lintCheck.command).toContain("biome");
		expect(lintCheck.passed).toBe(true);

		const buildCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "build",
		);
		expect(buildCheck).toBeDefined();
		expect(buildCheck.passed).toBe(true);
	});

	// Case 2: Package with a failing test script
	it("returns ok:false with failed test check when test script exits non-zero", async () => {
		const pkgName = "failing-pkg";
		createPackageDir(pkgName, {
			scripts: {
				test: "exit 1",
				build: "echo ok",
			},
		});

		const exec = mockExec([
			makeFailure(1, "AssertionError: expected 2 to be 3"),
			makeSuccess(),
			makeSuccess(),
		]);
		const tool = createVerifyGateTool({ directory: testDir, exec });
		const result = await tool.execute(
			{ package_path: pkgName },
			makeToolContext(),
		);

		const parsed = JSON.parse(result as string);
		expect(parsed.ok).toBe(false);

		const testCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "test",
		);
		expect(testCheck).toBeDefined();
		expect(testCheck.passed).toBe(false);
		expect(testCheck.exitCode).toBe(1);
		expect(testCheck.outputExcerpt).toBeTruthy();
		expect(testCheck.outputExcerpt?.length).toBeGreaterThan(0);

		const buildCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "build",
		);
		expect(buildCheck).toBeDefined();
		expect(buildCheck.passed).toBe(true);
	});

	// Case 3: Package with no test/build script at all
	it("returns ok:false with 'no script configured' when scripts are missing", async () => {
		const pkgName = "empty-pkg";
		createPackageDir(pkgName, { scripts: {} });

		const exec = mockExec([makeSuccess()]);
		const tool = createVerifyGateTool({ directory: testDir, exec });
		const result = await tool.execute(
			{ package_path: pkgName },
			makeToolContext(),
		);

		const parsed = JSON.parse(result as string);
		expect(parsed.ok).toBe(false);

		const testCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "test",
		);
		expect(testCheck).toBeDefined();
		expect(testCheck.passed).toBe(false);
		expect(testCheck.error).toContain("no script configured");

		const buildCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "build",
		);
		expect(buildCheck).toBeDefined();
		expect(buildCheck.passed).toBe(false);
		expect(buildCheck.error).toContain("no script configured");

		// Lint should still fall back to biome, not report "no script configured"
		const lintCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "lint",
		);
		expect(lintCheck).toBeDefined();
		expect(lintCheck.command).toContain("biome");
		expect(lintCheck.error).toBeUndefined();
	});

	// Case 4: Check exceeds timeout_ms
	it("reports timeout when command exceeds timeout", async () => {
		const pkgName = "slow-pkg";
		createPackageDir(pkgName, {
			scripts: {
				test: "sleep 10",
			},
		});

		const exec = mockExec([makeTimeout(), makeSuccess(), makeSuccess()]);
		const tool = createVerifyGateTool({ directory: testDir, exec });
		const result = await tool.execute(
			{ package_path: pkgName, timeout_ms: 100 },
			makeToolContext(),
		);

		const parsed = JSON.parse(result as string);
		const testCheck = parsed.checks.find(
			(c: { name: string }) => c.name === "test",
		);
		expect(testCheck).toBeDefined();
		expect(testCheck.passed).toBe(false);
		expect(testCheck.outputExcerpt).toContain("timed out");
		expect(parsed.warnings).toBeArray();
		expect(
			parsed.warnings.some((w: string) =>
				w.toLowerCase().includes("timed out"),
			),
		).toBe(true);
	});

	// Case 5: No package_path supplied — uses root-level commands
	it("uses root-level commands when no package_path supplied", async () => {
		const exec = mockExec([makeSuccess(), makeSuccess(), makeSuccess()]);
		const tool = createVerifyGateTool({ directory: testDir, exec });
		const result = await tool.execute({}, makeToolContext());

		const parsed = JSON.parse(result as string);

		const commands = parsed.checks.map((c: { command: string }) => c.command);
		expect(commands).toContain("bun test");
		expect(commands).toContain("bunx @biomejs/biome check .");
		expect(commands).toContain("bunx turbo build");
	});
});

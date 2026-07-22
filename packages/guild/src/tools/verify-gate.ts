import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ToolDefinition } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

export interface VerifyGateCheck {
	name: string;
	passed: boolean;
	exitCode: number;
	outputExcerpt?: string;
	command?: string;
	error?: string;
}

export interface VerifyGateOutput {
	ok: boolean;
	checks: VerifyGateCheck[];
	warnings: string[];
}

export interface CommandResult {
	exitCode: number;
	stdout: string;
	stderr: string;
	timedOut: boolean;
}

export interface VerifyGateDeps {
	directory: string;
	exec?: (
		cmd: string[],
		cwd: string,
		timeoutMs: number,
		signal: AbortSignal,
	) => Promise<CommandResult>;
}

const s = tool.schema;

function defaultExec(
	cmd: string[],
	cwd: string,
	timeoutMs: number,
	signal: AbortSignal,
): Promise<CommandResult> {
	return new Promise((resolve) => {
		const proc = Bun.spawn(cmd, {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
			signal,
		});

		const timer = setTimeout(() => {
			proc.kill();
			resolve({
				exitCode: -1,
				stdout: "",
				stderr: "",
				timedOut: true,
			});
		}, timeoutMs);

		proc.exited
			.then((exitCode) => {
				clearTimeout(timer);
				return Promise.all([
					new Response(proc.stdout).text(),
					new Response(proc.stderr).text(),
				]).then(([stdout, stderr]) => {
					resolve({ exitCode, stdout, stderr, timedOut: false });
				});
			})
			.catch(() => {
				clearTimeout(timer);
				resolve({ exitCode: -1, stdout: "", stderr: "", timedOut: false });
			});
	});
}

function makeFailedCheck(name: string, reason: string): VerifyGateCheck {
	return {
		name,
		passed: false,
		exitCode: -1,
		outputExcerpt: reason,
		command: "",
		error: reason,
	};
}

function excerpt(text: string, maxLines = 40): string {
	const lines = text.split("\n");
	if (lines.length <= maxLines) return text;
	const last = lines.slice(-maxLines);
	return `(truncated, ${lines.length - maxLines} more lines before this)\n${last.join("\n")}`;
}

export function createVerifyGateTool(deps: VerifyGateDeps): ToolDefinition {
	const exec = deps.exec ?? defaultExec;

	return tool({
		description:
			"Run gate checks (test, lint, build) for the current workspace or a specific package. " +
			"Verifies that tests pass, linting is clean, and the package builds before allowing progress.",
		args: {
			package_path: s.string().optional(),
			timeout_ms: s.number().default(120_000),
		},
		async execute(args, ctx) {
			try {
				const warnings: string[] = [];
				const checks: VerifyGateCheck[] = [];
				const timeoutMs = args.timeout_ms ?? 120_000;
				const rootDir = deps.directory;

				if (args.package_path) {
					const pkgDir = join(rootDir, args.package_path);
					const pkgJsonPath = join(pkgDir, "package.json");

					if (!existsSync(pkgJsonPath)) {
						const output: VerifyGateOutput = {
							ok: false,
							checks: [
								makeFailedCheck(
									"package",
									`package.json not found at ${pkgJsonPath}`,
								),
							],
							warnings: [`No package.json at ${pkgJsonPath}`],
						};
						return JSON.stringify(output);
					}

					const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
						scripts?: Record<string, string>;
					};
					const scripts = pkgJson.scripts ?? {};

					// Test check
					if (scripts.test) {
						const cmd = ["bun", "run", "test"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							pkgDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Test command timed out");
							checks.push({
								name: "test",
								passed: false,
								exitCode,
								outputExcerpt: `Test command timed out after ${timeoutMs}ms`,
								command: cmd.join(" "),
							});
						} else {
							checks.push({
								name: "test",
								passed: exitCode === 0,
								exitCode,
								outputExcerpt: excerpt(stdout + stderr) || undefined,
								command: cmd.join(" "),
							});
						}
					} else {
						checks.push({
							name: "test",
							passed: false,
							exitCode: -1,
							outputExcerpt: "No test script configured",
							command: "bun run test",
							error: "no script configured",
						});
					}

					// Lint check
					if (scripts.lint) {
						const cmd = ["bun", "run", "lint"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							pkgDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Lint command timed out");
							checks.push({
								name: "lint",
								passed: false,
								exitCode,
								outputExcerpt: `Lint command timed out after ${timeoutMs}ms`,
								command: cmd.join(" "),
							});
						} else {
							checks.push({
								name: "lint",
								passed: exitCode === 0,
								exitCode,
								outputExcerpt: excerpt(stdout + stderr) || undefined,
								command: cmd.join(" "),
							});
						}
					} else {
						// Fall back to Biome
						const cmd = ["bunx", "@biomejs/biome", "check", "."];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							pkgDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Lint (biome) command timed out");
							checks.push({
								name: "lint",
								passed: false,
								exitCode,
								outputExcerpt: `Biome check timed out after ${timeoutMs}ms`,
								command: cmd.join(" "),
							});
						} else {
							checks.push({
								name: "lint",
								passed: exitCode === 0,
								exitCode,
								outputExcerpt: excerpt(stdout + stderr) || undefined,
								command: cmd.join(" "),
							});
						}
					}

					// Build check
					if (scripts.build) {
						const cmd = ["bun", "run", "build"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							pkgDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Build command timed out");
							checks.push({
								name: "build",
								passed: false,
								exitCode,
								outputExcerpt: `Build command timed out after ${timeoutMs}ms`,
								command: cmd.join(" "),
							});
						} else {
							checks.push({
								name: "build",
								passed: exitCode === 0,
								exitCode,
								outputExcerpt: excerpt(stdout + stderr) || undefined,
								command: cmd.join(" "),
							});
						}
					} else {
						checks.push({
							name: "build",
							passed: false,
							exitCode: -1,
							outputExcerpt: "No build script configured",
							command: "bun run build",
							error: "no script configured",
						});
					}
				} else {
					// Root mode: check root package.json for scripts, fall back to canonical commands
					const rootPkgJsonPath = join(rootDir, "package.json");
					const rootScripts: Record<string, string> = existsSync(
						rootPkgJsonPath,
					)
						? ((
								JSON.parse(readFileSync(rootPkgJsonPath, "utf-8")) as {
									scripts?: Record<string, string>;
								}
							).scripts ?? {})
						: {};

					// Test
					if (rootScripts.test) {
						const cmd = ["bun", "run", "test"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Test command timed out");
						}
						checks.push({
							name: "test",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Test command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					} else {
						const cmd = ["bun", "test"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Test command timed out");
						}
						checks.push({
							name: "test",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Test command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					}

					// Lint
					if (rootScripts.lint) {
						const cmd = ["bun", "run", "lint"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Lint command timed out");
						}
						checks.push({
							name: "lint",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Lint command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					} else {
						const cmd = ["bunx", "@biomejs/biome", "check", "."];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Lint command timed out");
						}
						checks.push({
							name: "lint",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Lint command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					}

					// Build
					if (rootScripts.build) {
						const cmd = ["bun", "run", "build"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Build command timed out");
						}
						checks.push({
							name: "build",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Build command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					} else {
						const cmd = ["bunx", "turbo", "build"];
						const { exitCode, stdout, stderr, timedOut } = await exec(
							cmd,
							rootDir,
							timeoutMs,
							ctx.abort,
						);
						if (timedOut) {
							warnings.push("Build command timed out");
						}
						checks.push({
							name: "build",
							passed: exitCode === 0,
							exitCode,
							outputExcerpt: timedOut
								? `Build command timed out after ${timeoutMs}ms`
								: excerpt(stdout + stderr) || undefined,
							command: cmd.join(" "),
						});
					}
				}

				const ok = checks.every((c) => c.passed);

				const output: VerifyGateOutput = { ok, checks, warnings };
				return JSON.stringify(output);
			} catch (err) {
				const output: VerifyGateOutput = {
					ok: false,
					checks: [],
					warnings: [String(err)],
				};
				return JSON.stringify(output);
			}
		},
	});
}

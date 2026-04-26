/**
 * Handoff file builder and result reader
 *
 * HANDOFF format: what Herald sends to each sub-agent
 * DIGEST format:  what sub-agents write back (structured, lightweight)
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as crypto from "node:crypto";

export function generateId(): string {
	return crypto.randomBytes(4).toString("hex");
}

/** Write the handoff file the agent will receive as its task prompt */
export function buildHandoffFile(
	id: string,
	from: string,
	to: string,
	context: string,
	task: string,
): string {
	const filePath = path.join(os.tmpdir(), `pi-handoff-${id}.md`);

	const resultPath = path.join(os.tmpdir(), `pi-result-${id}.md`);

	const content = [
		`HANDOFF`,
		`from: ${from}  to: ${to}  id: ${id}`,
		`---`,
		context.trim() ? `## Context\n${context.trim()}` : "",
		`## Task\n${task.trim()}`,
		`## Output`,
		`Save your result to: ${resultPath}`,
		`Use the DIGEST format:`,
		``,
		"```",
		`DIGEST`,
		`agent: ${to}`,
		`status: done | error | blocked`,
		`---`,
		`## Summary`,
		`[max 2 sentences]`,
		``,
		`## Findings`,
		`- finding 1`,
		``,
		`## Files`,
		`- path/file.ts:42 — reason`,
		``,
		`## Next`,
		`[optional: what the orchestrator needs to do with this]`,
		"```",
	]
		.filter((line) => line !== null)
		.join("\n");

	fs.writeFileSync(filePath, content, { encoding: "utf-8", mode: 0o600 });
	return filePath;
}

/** Write the agent's system prompt to a temp file for --append-system-prompt */
export function buildSystemPromptFile(id: string, agentName: string, systemPrompt: string): string {
	const filePath = path.join(os.tmpdir(), `pi-sysprompt-${id}-${agentName}.md`);
	fs.writeFileSync(filePath, systemPrompt, { encoding: "utf-8", mode: 0o600 });
	return filePath;
}

/** Write the shell script that runs pi in the tmux pane */
export function buildRunScript(
	id: string,
	model: string | undefined,
	syspromptPath: string,
	tools: string[] | undefined,
	handoffPath: string,
	resultPath: string,
	donePath: string,
): string {
	const scriptPath = path.join(os.tmpdir(), `pi-run-${id}.sh`);

	const modelFlag = model ? `--model "${model}"` : "";
	const toolsFlag = tools && tools.length > 0 ? `--tools "${tools.join(",")}"` : "--no-tools";

	const script = `#!/bin/bash
# pi tmux-delegate run script — id: ${id}
RESULT="${resultPath}"
DONE="${donePath}"
HANDOFF="${handoffPath}"

pi --no-session ${modelFlag} \\
   --append-system-prompt "${syspromptPath}" \\
   ${toolsFlag} \\
   -p "$(cat "$HANDOFF")" \\
   2>&1 | tee "$RESULT"

EXIT_CODE=$\{PIPESTATUS[0]}
echo "$EXIT_CODE" > "$DONE"

# Keep pane briefly visible — will be killed by orchestrator after result is read
sleep 3
`;

	fs.writeFileSync(scriptPath, script, { encoding: "utf-8", mode: 0o755 });
	return scriptPath;
}

const POLL_INTERVAL_MS = 500;

/** Poll until the done sentinel exists or timeout/abort */
export async function waitForResult(
	donePath: string,
	timeoutMs = 300_000,
	signal?: AbortSignal,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;

	return new Promise((resolve, reject) => {
		const check = () => {
			if (signal?.aborted) {
				reject(new Error("Delegate aborted by user"));
				return;
			}
			if (Date.now() > deadline) {
				reject(new Error(`Agent timed out after ${timeoutMs / 1000}s`));
				return;
			}
			if (fs.existsSync(donePath)) {
				resolve();
				return;
			}
			setTimeout(check, POLL_INTERVAL_MS);
		};
		check();
	});
}

/** Read the result file written by the agent */
export function readResult(resultPath: string): string {
	try {
		return fs.readFileSync(resultPath, "utf-8").trim();
	} catch {
		return "(no output — agent may have crashed)";
	}
}

/** Remove temp files */
export function cleanup(paths: string[]): void {
	for (const p of paths) {
		try {
			fs.unlinkSync(p);
		} catch {}
	}
}

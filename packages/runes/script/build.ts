import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const result = await Bun.build({
	entrypoints: ["./src/index.ts", "./src/bin/runes.ts"],
	outdir: "./dist",
	target: "node",
	format: "esm",
	external: ["@opencode-ai/plugin", "zod", "node:sqlite", "bun:sqlite"],
	minify: false,
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

// Prepend shebang to the CLI bundle and make it executable.
const cliPath = resolve("dist/bin/runes.js");
const original = readFileSync(cliPath, "utf-8");
if (!original.startsWith("#!")) {
	writeFileSync(cliPath, `#!/usr/bin/env node\n${original}`);
}
chmodSync(cliPath, 0o755);

console.log("Build succeeded:", result.outputs.map((o) => o.path));

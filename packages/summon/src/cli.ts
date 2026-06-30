import { defineCommand, runMain } from "citty";
import { runInteractiveFlow } from "./tui/flow.js";

const main = defineCommand({
	meta: {
		name: "summon",
		version: "0.0.1",
		description: "Arcanum skill installer",
	},
	subCommands: {
		install: () => import("./commands/install").then((m) => m.default),
		"install-commands": () =>
			import("./commands/install-commands").then((m) => m.default),
		update: () => import("./commands/update").then((m) => m.default),
		remove: () => import("./commands/remove").then((m) => m.default),
		list: () => import("./commands/list").then((m) => m.default),
		tools: () => import("./commands/tools-install").then((m) => m.default),
	},
	async run() {
		// No subcommand provided — launch interactive TUI
		await runInteractiveFlow();
	},
});

runMain(main);

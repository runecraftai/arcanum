import { defineCommand, runMain } from "citty";

const main = defineCommand({
	meta: {
		name: "summon",
		version: "0.0.1",
		description: "Arcanum skill installer",
	},
	subCommands: {
		install: () => import("./commands/install").then((m) => m.default),
	},
});

runMain(main);

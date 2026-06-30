import * as clack from "@clack/prompts";
import { promptProjectRoots } from "./project-prompt.js";
import { promptCommandLocations } from "./command-location-prompt.js";
import {
  installCommands,
  printCommandsSummary,
} from "../commands/install-commands.js";
import { listGenerators } from "../commands/generators.js";
import type { InstallLocation, SupportedRuntime } from "../commands/generator.js";

export async function runCommandsFlow(): Promise<void> {
  const result = await promptProjectRoots();
  if (clack.isCancel(result)) {
    clack.outro("Cancelled.");
    return;
  }
  const roots = result as string[];
  if (roots.length === 0) {
    clack.outro("No project roots — aborting.");
    return;
  }

  const detectedPairs: {
    gen: ReturnType<typeof listGenerators>[number];
    projectRoot: string;
  }[] = [];
  for (const projectRoot of roots) {
    for (const gen of listGenerators()) {
      const localHere = await gen.detectLocal(projectRoot);
      const globalHere = await gen.detectGlobal();
      if (localHere || globalHere) {
        detectedPairs.push({ gen, projectRoot });
      }
    }
  }

  const uniqueByRuntime = new Map<
    SupportedRuntime,
    ReturnType<typeof listGenerators>[number]
  >();
  for (const { gen } of detectedPairs) {
    uniqueByRuntime.set(gen.runtime as SupportedRuntime, gen);
  }
  const detectedForPrompt = Array.from(uniqueByRuntime.values()).map((gen) => ({
    gen,
    projectRoot: roots[0] ?? "",
  }));

  const locations = await promptCommandLocations(detectedForPrompt);
  if (clack.isCancel(locations)) {
    clack.outro("Cancelled.");
    return;
  }

  const cmdResult = await installCommands({
    projectRoots: roots,
    locationByRuntime: locations as Partial<Record<SupportedRuntime, InstallLocation[]>>,
  });
  printCommandsSummary(cmdResult);
  clack.outro("Done!");
}

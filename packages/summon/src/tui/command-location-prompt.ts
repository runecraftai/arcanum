import * as clack from "@clack/prompts";
import type { CommandGenerator, InstallLocation, SupportedRuntime } from "../commands/generator";

export interface RuntimeLocationChoice {
  runtime: SupportedRuntime;
  locations: InstallLocation[];
}

/**
 * For each detected runtime, ask the user which location(s) to install to.
 * Each option (`local` / `global`) is shown as a checkbox. Runtimes that
 * don't support a given location are filtered out.
 *
 * Returns a map of runtime -> chosen locations. Runtimes where the user
 * unchecked everything are omitted from the result.
 */
export async function promptCommandLocations(
  detected: { gen: CommandGenerator; projectRoot: string }[]
): Promise<Partial<Record<SupportedRuntime, InstallLocation[]>> | symbol> {
  if (detected.length === 0) return {};

  const byRuntime = new Map<SupportedRuntime, CommandGenerator>();
  for (const { gen } of detected) {
    byRuntime.set(gen.runtime as SupportedRuntime, gen);
  }

  clack.note("Toggle per-runtime: Local writes to the project, Global writes to $HOME.", "Install location");

  const choices: RuntimeLocationChoice[] = [];
  for (const [runtime, gen] of byRuntime) {
    const options: { value: InstallLocation; label: string; hint: string }[] = [];
    if (gen.supportedLocations.includes("local")) {
      options.push({
        value: "local",
        label: `${gen.displayName} — local`,
        hint: "writes to <project>/.<runtime>/commands/",
      });
    }
    if (gen.supportedLocations.includes("global")) {
      options.push({
        value: "global",
        label: `${gen.displayName} — global`,
        hint: `writes to $HOME for ${gen.displayName}`,
      });
    }
    if (options.length === 0) continue;

    const initial: InstallLocation[] = gen.supportedLocations.filter((l) =>
      detected.some((d) => d.gen.runtime === runtime)
    );

    clack.note(
      `${gen.displayName} supports: ${gen.supportedLocations.join(", ")}`,
      gen.displayName
    );

    const picked = await clack.multiselect({
      message: `Where to install ${gen.displayName} slash commands?`,
      options,
      initialValues: initial,
      required: false,
    });

    if (clack.isCancel(picked)) return picked;

    const selected = (picked as InstallLocation[]).filter((l) =>
      gen.supportedLocations.includes(l)
    );

    if (selected.length > 0) {
      choices.push({ runtime, locations: selected });
    }
  }

  const out: Partial<Record<SupportedRuntime, InstallLocation[]>> = {};
  for (const c of choices) {
    out[c.runtime] = c.locations;
  }
  return out;
}

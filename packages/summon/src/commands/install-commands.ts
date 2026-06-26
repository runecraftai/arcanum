import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import path from "node:path";
import { COMMANDS, type CommandMapping } from "./registry";
import { listGenerators, getGenerator } from "./generators";
import type { CommandGenerator } from "./generator";
import { resolveSpellsDir, resolveAgentPath } from "../utils/paths";
import { loadSkillCatalog } from "../skills/loader";
import { exists } from "../utils/fs";

export interface InstallCommandsOptions {
  projectRoot: string;
  installedSkillNames?: string[];
}

export interface InstallCommandsResult {
  detected: { runtime: string; displayName: string }[];
  generated: { runtime: string; command: string; path: string }[];
  skipped: { command: string; reason: string }[];
}

function skillIsInstalled(skillName: string, installed: Set<string>): boolean {
  return installed.has(skillName);
}

export async function installCommands(
  options: InstallCommandsOptions
): Promise<InstallCommandsResult> {
  const projectRoot = path.resolve(options.projectRoot);
  const result: InstallCommandsResult = {
    detected: [],
    generated: [],
    skipped: [],
  };

  const detected: CommandGenerator[] = [];
  for (const gen of listGenerators()) {
    if (await gen.detect(projectRoot)) {
      detected.push(gen);
      result.detected.push({ runtime: gen.runtime, displayName: gen.displayName });
    }
  }

  if (detected.length === 0) {
    return result;
  }

  const installed = new Set(options.installedSkillNames ?? []);
  if (installed.size === 0) {
    const spellsDir = await resolveSpellsDir();
    const catalog = await loadSkillCatalog(spellsDir);
    for (const skill of catalog) installed.add(skill.name);
  }

  for (const gen of detected) {
    for (const mapping of COMMANDS) {
      const builtin = mapping.builtinNames?.[gen.runtime as keyof typeof mapping.builtinNames];
      if (builtin) {
        result.skipped.push({
          command: mapping.name,
          reason: `collides with built-in command "${builtin}" for ${gen.displayName}`,
        });
        continue;
      }
      if (!skillIsInstalled(mapping.skill, installed)) {
        result.skipped.push({
          command: mapping.name,
          reason: `target skill "${mapping.skill}" is not installed`,
        });
        continue;
      }
      const filePath = await gen.generate(mapping, projectRoot);
      result.generated.push({
        runtime: gen.runtime,
        command: mapping.name,
        path: filePath,
      });
    }
  }

  return result;
}

function printSummary(result: InstallCommandsResult): void {
  if (result.detected.length === 0) {
    clack.log.error(
      "No supported runtime detected. Expected one of: .claude/, .opencode/, or .cursor/."
    );
    return;
  }

  clack.log.info(`Detected runtimes: ${result.detected.map((d) => d.displayName).join(", ")}`);

  if (result.generated.length > 0) {
    clack.log.success(`Generated ${result.generated.length} command files:`);
    for (const g of result.generated) {
      clack.log.info(`  [${g.runtime}] /${g.command} → ${g.path}`);
    }
  } else {
    clack.log.info("No command files generated.");
  }

  if (result.skipped.length > 0) {
    clack.log.warn(`Skipped ${result.skipped.length} command(s):`);
    for (const s of result.skipped) {
      clack.log.warn(`  /${s.command} — ${s.reason}`);
    }
  }
}

export function printCommandsSummary(result: InstallCommandsResult): void {
  printSummary(result);
}

export default defineCommand({
  meta: {
    name: "install-commands",
    description: "Generate slash command files for detected AI runtimes",
  },
  async run() {
    const projectRoot = process.cwd();
    const skillsDir = path.join(projectRoot, "node_modules", "@runecraft", "spells", "skills");
    const hasLocalSpells = await exists(skillsDir);

    const result = await installCommands({
      projectRoot,
      ...(hasLocalSpells ? {} : {}),
    });

    if (result.detected.length === 0) {
      clack.log.error(
        "No supported runtime detected. Expected one of: .claude/, .opencode/, or .cursor/."
      );
      process.exit(1);
    }

    printSummary(result);
    process.exit(0);
  },
});

export { getGenerator };
export type { CommandMapping };

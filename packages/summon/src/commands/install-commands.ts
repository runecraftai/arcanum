import { defineCommand } from "citty";
import * as clack from "@clack/prompts";
import path from "node:path";
import { COMMANDS, type CommandMapping } from "./registry";
import { listGenerators, getGenerator } from "./generators";
import type { CommandGenerator, InstallLocation, SupportedRuntime } from "./generator";
import { resolveSpellsDir, resolveHome } from "../utils/paths";
import { loadSkillCatalog } from "../skills/loader";
import { installSkill, type InstallMethod, type InstallResult } from "../skills/installer";
import { exists } from "../utils/fs";

export interface InstallCommandsOptions {
  projectRoots: string[];
  locationByRuntime: Partial<Record<SupportedRuntime, InstallLocation[]>>;
  installedSkillNames?: string[];
  installMissingSkills?: boolean;
  skillMethod?: InstallMethod;
}

export interface DetectedTarget {
  runtime: SupportedRuntime;
  displayName: string;
  projectRoot: string;
  location: InstallLocation;
}

export interface GeneratedCommand {
  runtime: SupportedRuntime;
  command: string;
  path: string;
  projectRoot: string;
  location: InstallLocation;
  installedSkill?: string;
}

export interface InstallCommandsResult {
  detected: DetectedTarget[];
  generated: GeneratedCommand[];
  skipped: { command: string; reason: string }[];
  skillInstalls: InstallResult[];
}

function skillIsInstalled(skillName: string, installed: Set<string>): boolean {
  return installed.has(skillName);
}

function isLocationSupported(
  gen: CommandGenerator,
  location: InstallLocation
): boolean {
  return gen.supportedLocations.includes(location);
}

type TypedGenerator = CommandGenerator & { runtime: SupportedRuntime };

function getAgentInstallDir(
  runtime: SupportedRuntime,
  projectRoot: string,
  location: InstallLocation
): string {
  if (location === "global") {
    switch (runtime) {
      case "claude-code":
        return resolveHome("~/.claude/skills");
      case "opencode":
        return resolveHome("~/.config/opencode/skills");
      case "cursor":
        return path.join(projectRoot, ".cursor", "skills");
    }
  }
  switch (runtime) {
    case "claude-code":
      return path.join(projectRoot, ".claude", "skills");
    case "opencode":
      return path.join(projectRoot, ".opencode", "skills");
    case "cursor":
      return path.join(projectRoot, ".cursor", "skills");
  }
}

export async function installCommands(
  options: InstallCommandsOptions
): Promise<InstallCommandsResult> {
  const projectRoots = options.projectRoots.map((r) => path.resolve(r));
  const locationByRuntime = options.locationByRuntime;
  const installMissingSkills = options.installMissingSkills ?? true;
  const skillMethod: InstallMethod = options.skillMethod ?? "copy";
  const result: InstallCommandsResult = {
    detected: [],
    generated: [],
    skipped: [],
    skillInstalls: [],
  };

  const detected: { gen: TypedGenerator; projectRoot: string; location: InstallLocation }[] = [];
  for (const projectRoot of projectRoots) {
    for (const gen of listGenerators() as TypedGenerator[]) {
      const locations = locationByRuntime[gen.runtime] ?? [];
      for (const location of locations) {
        if (!isLocationSupported(gen, location)) continue;
        const detectedHere =
          location === "global" ? await gen.detectGlobal() : await gen.detectLocal(projectRoot);
        if (detectedHere) {
          detected.push({ gen, projectRoot, location });
          result.detected.push({
            runtime: gen.runtime,
            displayName: gen.displayName,
            projectRoot,
            location,
          });
        }
      }
    }
  }

  if (detected.length === 0) {
    return result;
  }

  const spellsDir = await resolveSpellsDir();
  const catalog = await loadSkillCatalog(spellsDir);
  const catalogByName = new Map(catalog.map((s) => [s.name, s]));

  const installed = new Set(options.installedSkillNames ?? []);
  if (options.installedSkillNames === undefined) {
    for (const skill of catalog) installed.add(skill.name);
  }

  for (const { gen, projectRoot, location } of detected) {
    for (const mapping of COMMANDS) {
      const builtin = mapping.builtinNames?.[gen.runtime as keyof typeof mapping.builtinNames];
      if (builtin) {
        result.skipped.push({
          command: mapping.name,
          reason: `collides with built-in command "${builtin}" for ${gen.displayName}`,
        });
        continue;
      }
      if (skillIsInstalled(mapping.skill!, installed)) {
        const filePath = await gen.generate(mapping, projectRoot, location);
        result.generated.push({
          runtime: gen.runtime,
          command: mapping.name,
          path: filePath,
          projectRoot,
          location,
        });
        continue;
      }
      if (!installMissingSkills) {
        result.skipped.push({
          command: mapping.name,
          reason: `target skill "${mapping.skill}" is not installed`,
        });
        continue;
      }
      const skill = catalogByName.get(mapping.skill!);
      if (!skill) {
        result.skipped.push({
          command: mapping.name,
          reason: `target skill "${mapping.skill}" is not in the catalog`,
        });
        continue;
      }
      const agentInstallDir = getAgentInstallDir(gen.runtime, projectRoot, location);
      const installRes = await installSkill(
        skill,
        skill.filePath,
        agentInstallDir,
        skillMethod,
        gen.runtime,
        projectRoot,
        location === "global" ? "global" : "project"
      );
      result.skillInstalls.push(installRes);
      if (!installRes.success) {
        result.skipped.push({
          command: mapping.name,
          reason: `install failed for skill "${mapping.skill}": ${installRes.error ?? "unknown error"}`,
        });
        continue;
      }
      installed.add(skill.name);
      const filePath = await gen.generate(mapping, projectRoot, location);
      result.generated.push({
        runtime: gen.runtime,
        command: mapping.name,
        path: filePath,
        projectRoot,
        location,
        installedSkill: skill.name,
      });
    }
  }

  return result;
}

function formatLocation(loc: InstallLocation, projectRoot: string): string {
  return loc === "global" ? "global" : `${projectRoot} (local)`;
}

function printSummary(result: InstallCommandsResult): void {
  if (result.detected.length === 0) {
    clack.log.error(
      "No supported runtime detected. Expected one of: .claude/, .opencode/, or .cursor/."
    );
    return;
  }

  clack.log.info(
    `Detected ${result.detected.length} target(s): ${result.detected
      .map((d) => `${d.displayName}@${formatLocation(d.location, d.projectRoot)}`)
      .join(", ")}`
  );

  if (result.skillInstalls.length > 0) {
    const ok = result.skillInstalls.filter((r) => r.success).length;
    clack.log.info(
      `Installed ${ok}/${result.skillInstalls.length} missing skill(s) into target agents.`
    );
  }

  if (result.generated.length > 0) {
    clack.log.success(`Generated ${result.generated.length} command files:`);
    for (const g of result.generated) {
      const tag = g.installedSkill ? ` (+ skill ${g.installedSkill})` : "";
      clack.log.info(
        `  [${g.runtime}/${g.location}] /${g.command} (${g.projectRoot})${tag} → ${g.path}`
      );
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
      projectRoots: [projectRoot],
      locationByRuntime: { "claude-code": ["local"], opencode: ["local"], cursor: ["local"] },
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
export { getAgentInstallDir };

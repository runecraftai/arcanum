import path from "node:path";
import os from "node:os";
import * as clack from "@clack/prompts";
import { defineCommand } from "citty";
import { createRequire } from "node:module";
import { TOOLS, stepsFor, type InstallStep, type Tool } from "./tools-registry";
import {
  detectPlatform,
  which,
  runStep,
  toolIsInstalled,
  type StepResult,
  type Platform,
} from "./runtime";
import { opencodeConfigPath } from "./runtime";
import {
  readOpencodeConfig,
  mergeMcpEntry,
  mcpEntryExists,
  writeOpencodeConfig,
  mcpEntryExistsOnDisk,
} from "./mcp-config";
import { exists, ensureDir } from "../utils/fs";

export interface RunToolsInstallOptions {
  toolNames?: string[];
  scope?: "global" | "local";
  dryRun?: boolean;
  checkOnly?: boolean;
  projectRoot?: string;
  envValues?: Record<string, string>;
}

export interface ToolOutcome {
  tool: string;
  status: "installed" | "skipped" | "failed" | "dry-run" | "checked";
  reason?: string;
  steps: StepResult[];
}

export interface RunToolsInstallResult {
  platform: Platform;
  scope: "global" | "local";
  dryRun: boolean;
  checkOnly: boolean;
  outcomes: ToolOutcome[];
}

async function resolveTemplatePath(): Promise<string> {
  const require = createRequire(import.meta.url);
  try {
    const pkgJson = require.resolve("@runecraft/summon/package.json");
    return path.resolve(path.dirname(pkgJson), "docs", "setup-prompts", "agents-template.md");
  } catch {
    return path.resolve(
      process.cwd(),
      "packages/summon/docs/setup-prompts/agents-template.md"
    );
  }
}

async function copyAgentsTemplate(
  projectRoot: string,
  mode: "skip" | "append-marker"
): Promise<string> {
  const from = await resolveTemplatePath();
  const to = path.resolve(projectRoot, "AGENTS.md");
  if (await exists(to)) {
    if (mode === "skip") return "skipped (exists)";
    const markerBegin = "<!-- BEGIN arcanum:agents-md -->\n";
    const markerEnd = "<!-- END arcanum:agents-md -->\n";
    const source = await (await import("node:fs/promises")).readFile(from, "utf8");
    const block = `${markerBegin}Source: ${from}\n\n${source}\n${markerEnd}`;
    const { appendFile } = await import("node:fs/promises");
    await appendFile(to, `\n${block}`, "utf8");
    return `appended marker to ${to}`;
  }
  const { copyFile } = await import("node:fs/promises");
  await copyFile(from, to);
  return `copied to ${to}`;
}

function whichExists(bin: string): Promise<boolean> {
  return which(bin);
}

async function mcpEntryExistsFor(
  name: string,
  configPath: string
): Promise<boolean> {
  return mcpEntryExistsOnDisk(configPath, name);
}

export async function runToolsInstall(
  options: RunToolsInstallOptions = {}
): Promise<RunToolsInstallResult> {
  const platform = detectPlatform();
  const scope: "global" | "local" = options.scope ?? "global";
  const projectRoot = options.projectRoot ?? process.cwd();
  const dryRun = options.dryRun ?? false;
  const checkOnly = options.checkOnly ?? false;
  const envValues = options.envValues ?? {};

  const selected = options.toolNames && options.toolNames.length > 0
    ? options.toolNames
        .map((n) => TOOLS.find((t) => t.name === n))
        .filter((t): t is Tool => Boolean(t))
    : TOOLS;

  if (selected.length === 0) {
    clack.log.error(`No matching tools. Available: ${TOOLS.map((t) => t.name).join(", ")}`);
    return { platform, scope, dryRun, checkOnly, outcomes: [] };
  }

  const outcomes: ToolOutcome[] = [];

  for (const tool of selected) {
    if (tool.scope !== "both" && tool.scope !== scope) {
      outcomes.push({
        tool: tool.name,
        status: "failed",
        reason: `${tool.name} is ${tool.scope}-only; remove --scope=${scope} or skip this tool`,
        steps: [],
      });
      continue;
    }

    if (tool.needsNode) {
      if (!(await which("node"))) {
        outcomes.push({
          tool: tool.name,
          status: "failed",
          reason: "Node.js not found; install Node 18+ first",
          steps: [],
        });
        continue;
      }
    }

    if (tool.needsOpencode) {
      if (!(await which("opencode"))) {
        outcomes.push({
          tool: tool.name,
          status: "failed",
          reason: "opencode CLI not found; install opencode first",
          steps: [],
        });
        continue;
      }
    }

    const presence = await toolIsInstalled(tool, {
      platform,
      scope,
      projectRoot,
      dryRun,
      envValues,
      checkExisting: true,
      whichExists: whichExists,
      mcpEntryExists: mcpEntryExistsFor,
    });

    if (presence.installed) {
      outcomes.push({
        tool: tool.name,
        status: "skipped",
        reason: presence.reason,
        steps: [],
      });
      continue;
    }

    if (checkOnly) {
      outcomes.push({ tool: tool.name, status: "checked", steps: [] });
      continue;
    }

    const steps = stepsFor(tool, platform);
    const stepResults: StepResult[] = [];
    let failed: StepResult | undefined;

    for (const step of steps) {
      if (step.kind === "opencode-mcp") {
        const configPath = opencodeConfigPath(
          step.configPath === "global" ? "global" : scope,
          projectRoot
        );
        const present = await mcpEntryExistsOnDisk(configPath, step.name);
        if (present) {
          stepResults.push({
            step,
            command: `mergeMcpEntry(${configPath}, ${step.name}, ...)`,
            status: "skipped",
            output: `mcp.${step.name} already present`,
          });
          continue;
        }
        const res = await runMcpMerge(step, configPath, envValues, dryRun);
        stepResults.push(res);
        if (res.status === "failed") {
          failed = res;
          break;
        }
        continue;
      }

      if (step.kind === "copy-template") {
        if (dryRun) {
          stepResults.push({
            step,
            command: `cp ${step.from} ${path.resolve(projectRoot, step.to)}`,
            status: "dry-run",
          });
          continue;
        }
        try {
          const msg = await copyAgentsTemplate(projectRoot, step.mode);
          stepResults.push({
            step,
            command: `cp ${step.from} -> ${path.resolve(projectRoot, step.to)}`,
            status: "ok",
            output: msg,
          });
        } catch (err) {
          stepResults.push({
            step,
            command: `cp ${step.from} -> ${path.resolve(projectRoot, step.to)}`,
            status: "failed",
            error: (err as Error).message,
          });
          failed = stepResults[stepResults.length - 1];
          break;
        }
        continue;
      }

      const result = await runStep(step, {
        platform,
        scope,
        projectRoot,
        dryRun,
        envValues,
        checkExisting: true,
        whichExists: whichExists,
        mcpEntryExists: mcpEntryExistsFor,
      });
      stepResults.push(result);
      if (result.status === "failed") {
        failed = result;
        break;
      }
    }

    if (failed) {
      outcomes.push({
        tool: tool.name,
        status: "failed",
        reason: failed.error ?? `step failed: ${failed.command}`,
        steps: stepResults,
      });
    } else {
      outcomes.push({
        tool: tool.name,
        status: dryRun ? "dry-run" : "installed",
        steps: stepResults,
      });
    }
  }

  return { platform, scope, dryRun, checkOnly, outcomes };
}

async function runMcpMerge(
  step: Extract<InstallStep, { kind: "opencode-mcp" }>,
  configPath: string,
  envValues: Record<string, string>,
  dryRun: boolean
): Promise<StepResult> {
  const entry: Record<string, unknown> = { type: step.transport };
  if (step.transport === "remote" && step.url) entry.url = step.url;
  if (step.transport === "stdio" && step.command) entry.command = step.command;
  if (step.envKey) {
    entry.environment = { [step.envKey]: `\${${step.envKey}}` };
    if (!envValues[step.envKey]) {
      clack.log.warn(
        `Set the actual ${step.envKey} value in your shell profile to use ${step.name}.`
      );
    }
  }

  if (dryRun) {
    return {
      step,
      command: `mergeMcpEntry(${configPath}, ${step.name}, ${JSON.stringify(entry)})`,
      status: "dry-run",
    };
  }

  const { config, created, backedUpFrom } = await readOpencodeConfig(configPath);
  if (backedUpFrom) {
    clack.log.warn(`Corrupt config at ${configPath}; backed up to ${backedUpFrom} and starting fresh.`);
  } else if (created) {
    await ensureDir(path.dirname(configPath));
  }
  const merged = mergeMcpEntry(config, step.name, entry);
  await writeOpencodeConfig(configPath, merged);
  return {
    step,
    command: `mergeMcpEntry(${configPath}, ${step.name}, ...)`,
    status: "ok",
    output: `merged mcp.${step.name} into ${configPath}`,
  };
}

export default defineCommand({
  meta: {
    name: "tools",
    description: "Install external tools (Graphify, markitdown, MCP servers, etc.) directly",
  },
  subCommands: {
    install: () => import("./tools-install-impl").then((m) => m.installCommand),
    list: () => import("./tools-install-impl").then((m) => m.listCommand),
  },
  async run() {
    const { runInteractive } = await import("./tools-install-impl");
    await runInteractive();
  },
});

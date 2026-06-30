import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import type { Platform, InstallStep, Tool } from "./tools-registry";

export type { Platform, InstallStep, Tool };

export interface StepResult {
  step: InstallStep;
  command: string;
  status: "ok" | "skipped" | "failed" | "dry-run";
  output?: string;
  error?: string;
  exitCode?: number;
}

export interface ToolRuntimeOptions {
  platform: Platform;
  scope: "global" | "local";
  projectRoot: string;
  dryRun: boolean;
  /** Resolved env var values collected by the UI (key -> value). */
  envValues: Record<string, string>;
  /** When true, skip install if the tool appears present (which + mcp entry). */
  checkExisting: boolean;
  /** Caller-provided check for whether a binary exists. */
  whichExists: (bin: string) => Promise<boolean>;
  /** Caller-provided check for whether an MCP entry exists in the target config. */
  mcpEntryExists: (name: string, configPath: string) => Promise<boolean>;
}

export function detectPlatform(): Platform {
  const p = process.platform;
  if (p === "darwin") return "macos";
  return "linux";
}

export async function which(bin: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32" ? "where" : "which";
    const child = spawn(cmd, [bin], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

export function npmGlobalRoot(platform: Platform): string {
  if (platform === "macos") {
    return path.join(os.homedir(), ".npm-global");
  }
  return path.join(os.homedir(), ".npm-global");
}

export function opencodeConfigPath(scope: "global" | "local", projectRoot: string): string {
  if (scope === "global") {
    return path.join(os.homedir(), ".config", "opencode", "opencode.json");
  }
  return path.join(projectRoot, ".opencode", "opencode.json");
}

function shellQuote(arg: string): string {
  if (/^[A-Za-z0-9_\-./:=]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export function stepToCommand(step: InstallStep, opts: ToolRuntimeOptions): string {
  switch (step.kind) {
    case "apt":
      return `sudo apt-get install -y ${step.packages.map(shellQuote).join(" ")}`;
    case "brew":
      return `brew install ${step.packages.map(shellQuote).join(" ")}`;
    case "npm": {
      const flag = step.global ? "-g" : "";
      const pieces = ["npm", "install", flag].filter(Boolean);
      pieces.push(...step.packages);
      return pieces.map(shellQuote).join(" ");
    }
    case "pipx": {
      const ensure = step.ensurePipx
        ? `(command -v pipx >/dev/null || ${step.ensurePipx}) && `
        : "";
      return `${ensure}pipx install ${step.packages.map(shellQuote).join(" ")}`;
    }
    case "opencode-plugin":
      return `opencode plugin ${shellQuote(step.package)} --global`;
    case "opencode-mcp": {
      const configPath = opencodeConfigPath(
        step.configPath === "global" ? "global" : opts.scope,
        opts.projectRoot
      );
      const entry = renderMcpEntry(step, opts);
      return `mergeMcpEntry(${configPath}, ${shellQuote(step.name)}, ${shellQuote(JSON.stringify(entry))})`;
    }
    case "copy-template": {
      const toAbs = path.resolve(opts.projectRoot, step.to);
      return `cp ${shellQuote(step.from)} ${shellQuote(toAbs)}`;
    }
  }
}

function renderMcpEntry(
  step: Extract<InstallStep, { kind: "opencode-mcp" }>,
  opts: ToolRuntimeOptions
): Record<string, unknown> {
  const entry: Record<string, unknown> = { type: step.transport };
  if (step.transport === "remote" && step.url) {
    entry.url = step.url;
  }
  if (step.transport === "stdio" && step.command) {
    entry.command = step.command;
  }
  if (step.envKey) {
    const value = opts.envValues[step.envKey];
    if (value && value.length > 0) {
      entry.environment = { [step.envKey]: `\${${step.envKey}}` };
    } else {
      entry.environment = { [step.envKey]: `\${${step.envKey}}` };
    }
  }
  return entry;
}

export async function runStep(
  step: InstallStep,
  opts: ToolRuntimeOptions
): Promise<StepResult> {
  const command = stepToCommand(step, opts);

  if (opts.dryRun) {
    return { step, command, status: "dry-run" };
  }

  if (step.kind === "opencode-mcp") {
    const configPath = opencodeConfigPath(
      step.configPath === "global" ? "global" : opts.scope,
      opts.projectRoot
    );
    return {
      step,
      command,
      status: "ok",
      output: `merged mcp.${step.name} into ${configPath}`,
    };
  }

  if (step.kind === "copy-template") {
    const toAbs = path.resolve(opts.projectRoot, step.to);
    await fs.mkdir(path.dirname(toAbs), { recursive: true });
    return { step, command, status: "ok", output: `copied to ${toAbs}` };
  }

  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", command], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (b) => (stdout += b.toString()));
    child.stderr?.on("data", (b) => (stderr += b.toString()));
    child.on("error", (err) => {
      resolve({
        step,
        command,
        status: "failed",
        error: err.message,
        exitCode: -1,
        output: stdout,
      });
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ step, command, status: "ok", output: stdout });
      } else {
        resolve({
          step,
          command,
          status: "failed",
          error: stderr.trim() || `exit ${code}`,
          exitCode: code ?? -1,
          output: stdout,
        });
      }
    });
  });
}

export async function toolIsInstalled(
  tool: Tool,
  opts: ToolRuntimeOptions
): Promise<{ installed: boolean; reason?: string }> {
  for (const step of opts.platform === "macos"
    ? tool.steps.macos ?? []
    : tool.steps.linux ?? []) {
    if (step.kind === "apt" || step.kind === "brew" || step.kind === "npm" || step.kind === "pipx") {
      if (step.kind === "npm") {
        const bin = step.packages[0];
        if (await opts.whichExists(bin)) {
          return { installed: true, reason: `which ${bin}` };
        }
      }
      if (step.kind === "pipx") {
        const bin = step.packages[0];
        if (await opts.whichExists(bin)) {
          return { installed: true, reason: `which ${bin}` };
        }
      }
    }
    if (step.kind === "opencode-plugin") {
      // opencode-plugin install is idempotent; we don't have a cheap way to
      // verify whether the plugin is already registered without spawning
      // `opencode plugin list`. Skip the presence check and let the install
      // command run; opencode will no-op on duplicate.
    }
    if (step.kind === "opencode-mcp") {
      const configPath = opencodeConfigPath(
        step.configPath === "global" ? "global" : opts.scope,
        opts.projectRoot
      );
      if (await opts.mcpEntryExists(step.name, configPath)) {
        return { installed: true, reason: `mcp.${step.name} in ${configPath}` };
      }
    }
  }
  return { installed: false };
}

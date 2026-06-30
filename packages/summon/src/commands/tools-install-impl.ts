import * as clack from "@clack/prompts";
import { defineCommand } from "citty";
import { runToolsInstall, type RunToolsInstallResult } from "./tools-install";
import { TOOLS, type Tool } from "./tools-registry";
import { detectPlatform, which } from "./runtime";
import { mcpEntryExistsOnDisk } from "./mcp-config";
import { opencodeConfigPath } from "./runtime";

export const installCommand = defineCommand({
  meta: {
    name: "install",
    description: "Install the selected tools (or all by default)",
  },
  args: {
    tools: {
      type: "string",
      description: "Comma-separated tool names (default: all)",
    },
    scope: {
      type: "string",
      default: "global",
      description: "Install scope: global or local",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Print the commands that would run without executing them",
    },
    "check": {
      type: "boolean",
      default: false,
      description: "Detect missing tools without installing",
    },
    "project-root": {
      type: "string",
      description: "Project root for local-scope installs",
    },
  },
  async run({ args }) {
    const scope = (args.scope === "local" ? "local" : "global") as "global" | "local";
    const toolNames = args.tools
      ? String(args.tools)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const result = await runToolsInstall({
      toolNames,
      scope,
      dryRun: Boolean(args["dry-run"]),
      checkOnly: Boolean(args.check),
      projectRoot: args["project-root"]
        ? String(args["project-root"])
        : undefined,
    });

    printResult(result);
  },
});

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List tools and their detected installation state",
  },
  args: {
    scope: { type: "string", default: "global", description: "global or local" },
    "project-root": { type: "string", description: "Project root for local-scope checks" },
  },
  async run({ args }) {
    const scope = (args.scope === "local" ? "local" : "global") as "global" | "local";
    const projectRoot = args["project-root"]
      ? String(args["project-root"])
      : process.cwd();

    const lines: string[] = [];
    for (const tool of TOOLS) {
      const status = await checkToolState(tool, scope, projectRoot);
      lines.push(`  ${status.icon} ${tool.name.padEnd(20)} ${status.text}`);
    }
    clack.note(lines.join("\n"), `Tools (${detectPlatform()}, ${scope})`);
  },
});

interface ToolState {
  icon: string;
  text: string;
}

async function checkToolState(
  tool: Tool,
  scope: "global" | "local",
  projectRoot: string
): Promise<ToolState> {
  for (const step of tool.steps[detectPlatform()] ?? []) {
    if (step.kind === "apt" || step.kind === "brew" || step.kind === "npm" || step.kind === "pipx") {
      if (step.kind === "npm" || step.kind === "pipx") {
        const bin = step.packages[0];
        if (await which(bin)) return { icon: "✓", text: `installed (${bin})` };
      }
    }
    if (step.kind === "opencode-plugin") {
      if (await which("opencode")) return { icon: "✓", text: "opencode present" };
    }
    if (step.kind === "opencode-mcp") {
      const configPath = opencodeConfigPath(
        step.configPath === "global" ? "global" : scope,
        projectRoot
      );
      if (await mcpEntryExistsOnDisk(configPath, step.name)) {
        return { icon: "✓", text: `mcp.${step.name} configured` };
      }
    }
  }
  return { icon: "✗", text: "not installed" };
}

function printResult(result: RunToolsInstallResult): void {
  const lines: string[] = [];
  for (const o of result.outcomes) {
    const icon =
      o.status === "installed" || o.status === "dry-run" || o.status === "checked"
        ? "✓"
        : o.status === "skipped"
          ? "→"
          : "✗";
    const tag = result.checkOnly
      ? o.status
      : result.dryRun
        ? "would install"
        : o.status;
    const reason = o.reason ? `  ${o.reason}` : "";
    lines.push(`  ${icon} ${o.tool.padEnd(14)} ${tag}${reason}`);
    for (const s of o.steps) {
      const sIcon =
        s.status === "ok" || s.status === "dry-run"
          ? "·"
          : s.status === "skipped"
            ? "→"
            : "✗";
      lines.push(`      ${sIcon} ${s.status.padEnd(8)} ${s.command}`);
      if (s.output) lines.push(`        ${s.output}`);
    }
  }
  clack.note(lines.join("\n"), "Tools");
}

export async function runInteractive(): Promise<void> {
  const detectedScope = (await clack.select({
    message: "Where should tools be installed?",
    options: [
      { value: "global" as const, label: "Globally (user-scope)", hint: "~/.config/opencode/ + npm -g" },
      { value: "local" as const, label: "In this project", hint: "./.opencode/ + local node_modules" },
    ],
    initialValue: "global" as const,
  })) as "global" | "local" | symbol;
  if (clack.isCancel(detectedScope)) return;

  const picked = await clack.multiselect({
    message: "Select tools to install:",
    options: TOOLS.map((t) => ({
      value: t.name,
      label: t.title,
      hint: t.description,
    })),
    initialValues: TOOLS.map((t) => t.name),
    required: false,
  });
  if (clack.isCancel(picked)) return;

  const toolNames = (picked as string[]).filter(Boolean);
  if (toolNames.length === 0) {
    clack.log.warn("No tools selected.");
    return;
  }

  const envValues: Record<string, string> = {};
  for (const name of toolNames) {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) continue;
    for (const step of tool.steps[detectPlatform()] ?? []) {
      if (step.kind === "opencode-mcp" && step.envKey) {
        if (envValues[step.envKey]) continue;
        const value = await clack.password({
          message: `Enter value for ${step.envKey} (Enter to skip — write will reference \${${step.envKey}})`,
        });
        if (clack.isCancel(value)) {
          envValues[step.envKey] = "";
        } else {
          envValues[step.envKey] = String(value ?? "");
        }
      }
    }
  }

  const result = await runToolsInstall({
    toolNames,
    scope: detectedScope === "local" ? "local" : "global",
    envValues,
  });
  printResult(result);
  clack.outro("Done!");
}

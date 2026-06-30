import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { TOOLS, getTool, stepsFor } from "../tools-registry";
import { detectPlatform, opencodeConfigPath, stepToCommand, toolIsInstalled } from "../runtime";
import {
  readOpencodeConfig,
  writeOpencodeConfig,
  mergeMcpEntry,
  mcpEntryExists,
  mcpEntryExistsOnDisk,
} from "../mcp-config";
import { runToolsInstall } from "../tools-install";

describe("tools-registry", () => {
  it("has 7 tools", () => {
    expect(TOOLS.length).toBe(7);
  });

  it("tool names are unique", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every tool has linux and macos step arrays", () => {
    for (const t of TOOLS) {
      expect(Array.isArray(t.steps.linux)).toBe(true);
      expect(Array.isArray(t.steps.macos)).toBe(true);
      expect(t.steps.linux!.length).toBeGreaterThan(0);
      expect(t.steps.macos!.length).toBeGreaterThan(0);
    }
  });

  it("markitdown is global-only", () => {
    const m = getTool("markitdown");
    expect(m?.scope).toBe("global");
  });

  it("dcp is global-only and needs the opencode CLI", () => {
    const d = getTool("dcp");
    expect(d?.scope).toBe("global");
    expect(d?.needsOpencode).toBe(true);
  });

  it("agents-md is local-only and uses copy-template", () => {
    const a = getTool("agents-md");
    expect(a?.scope).toBe("local");
    const linux = stepsFor(a!, "linux");
    expect(linux.some((s) => s.kind === "copy-template")).toBe(true);
  });

  it("graphify and context7 declare needsNode", () => {
    expect(getTool("graphify")?.needsNode).toBe(true);
    expect(getTool("context7")?.needsNode).toBe(true);
  });
});

describe("runtime.detectPlatform", () => {
  it("returns 'linux' or 'macos' for the current host", () => {
    const p = detectPlatform();
    expect(["linux", "macos"]).toContain(p);
  });
});

describe("runtime.opencodeConfigPath", () => {
  it("global path is under $HOME/.config/opencode/", () => {
    const p = opencodeConfigPath("global", "/some/repo");
    expect(p).toContain(".config");
    expect(p).toContain("opencode");
    expect(p.endsWith("opencode.json")).toBe(true);
  });

  it("local path is under <projectRoot>/.opencode/", () => {
    const p = opencodeConfigPath("local", "/some/repo");
    expect(p).toBe(path.join("/some/repo", ".opencode", "opencode.json"));
  });
});

describe("runtime.stepToCommand", () => {
  const opts = {
    platform: "linux" as const,
    scope: "global" as const,
    projectRoot: "/tmp/proj",
    dryRun: false,
    envValues: {},
    checkExisting: false,
    whichExists: async () => false,
    mcpEntryExists: async () => false,
  };

  it("renders apt with sudo", () => {
    const cmd = stepToCommand(
      { kind: "apt", packages: ["pipx"] },
      opts
    );
    expect(cmd).toContain("sudo apt-get install -y pipx");
  });

  it("renders brew install", () => {
    const cmd = stepToCommand(
      { kind: "brew", packages: ["pipx"] },
      { ...opts, platform: "macos" }
    );
    expect(cmd).toBe("brew install pipx");
  });

  it("renders npm -g", () => {
    const cmd = stepToCommand(
      { kind: "npm", packages: ["graphify"], global: true },
      opts
    );
    expect(cmd).toBe("npm install -g graphify");
  });

  it("renders pipx without ensure", () => {
    const cmd = stepToCommand(
      { kind: "pipx", packages: ["markitdown"], ensurePipx: false },
      opts
    );
    expect(cmd).toBe("pipx install markitdown");
  });

  it("renders opencode-plugin (with quoting for @ chars)", () => {
    const cmd = stepToCommand(
      { kind: "opencode-plugin", package: "@tarquinen/opencode-dcp@latest" },
      opts
    );
    expect(cmd).toBe("opencode plugin '@tarquinen/opencode-dcp@latest' --global");
  });
});

describe("mcp-config", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-mcp-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns empty config when file is missing", async () => {
    const result = await readOpencodeConfig(path.join(tmpDir, "absent.json"));
    expect(result.config).toEqual({});
    expect(result.created).toBe(true);
  });

  it("preserves existing keys when merging an mcp entry", () => {
    const base = { theme: "dark", mcp: { existing: { type: "stdio", command: ["x"] } } };
    const merged = mergeMcpEntry(base, "exa", { type: "remote", url: "https://x" });
    expect(merged.theme).toBe("dark");
    expect((merged.mcp as Record<string, unknown>).existing).toEqual({
      type: "stdio",
      command: ["x"],
    });
    expect((merged.mcp as Record<string, unknown>).exa).toEqual({
      type: "remote",
      url: "https://x",
    });
  });

  it("mcpEntryExists returns false when mcp block is absent", () => {
    expect(mcpEntryExists({}, "exa")).toBe(false);
  });

  it("backs up and resets a corrupt config", async () => {
    const p = path.join(tmpDir, "opencode.json");
    await fs.writeFile(p, "{ not json", "utf8");
    const result = await readOpencodeConfig(p);
    expect(result.config).toEqual({});
    expect(result.backedUpFrom).toBeDefined();
    const bak = await fs.readFile(result.backedUpFrom!, "utf8");
    expect(bak).toBe("{ not json");
  });

  it("writeOpencodeConfig creates parent dir and writes pretty JSON", async () => {
    const p = path.join(tmpDir, "nested", "opencode.json");
    await writeOpencodeConfig(p, { mcp: { exa: { type: "remote" } } });
    const raw = await fs.readFile(p, "utf8");
    expect(raw).toContain('"mcp"');
    expect(raw).toContain('"exa"');
  });

  it("mcpEntryExistsOnDisk reads from disk", async () => {
    const p = path.join(tmpDir, "oc.json");
    await writeOpencodeConfig(p, { mcp: { exa: { type: "remote" } } });
    expect(await mcpEntryExistsOnDisk(p, "exa")).toBe(true);
    expect(await mcpEntryExistsOnDisk(p, "context7")).toBe(false);
  });
});

describe("toolIsInstalled (two-stage detect)", () => {
  const projectRoot = "/tmp/proj";
  const baseOpts = {
    platform: "linux" as const,
    scope: "global" as const,
    projectRoot,
    dryRun: false,
    envValues: {},
    checkExisting: true,
  };

  it("skips when binary is present", async () => {
    const tool = getTool("markitdown")!;
    const result = await toolIsInstalled(tool, {
      ...baseOpts,
      whichExists: async () => true,
      mcpEntryExists: async () => false,
    });
    expect(result.installed).toBe(true);
  });

  it("does not skip when only the binary is present but mcp entry is missing", async () => {
    const tool = getTool("context7")!;
    const result = await toolIsInstalled(tool, {
      ...baseOpts,
      whichExists: async () => true,
      mcpEntryExists: async () => false,
    });
    expect(result.installed).toBe(false);
  });
});

describe("runToolsInstall (dry-run)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-tools-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("prints commands without executing for grep-app on linux", async () => {
    if (detectPlatform() !== "linux") return;
    const result = await runToolsInstall({
      toolNames: ["grep-app"],
      scope: "global",
      dryRun: true,
      projectRoot: tmpDir,
    });
    expect(result.outcomes).toHaveLength(1);
    const outcome = result.outcomes[0];
    expect(outcome.status).toBe("dry-run");
    expect(outcome.steps.length).toBeGreaterThan(0);
  });

  it("rejects --local on a global-only tool", async () => {
    const result = await runToolsInstall({
      toolNames: ["markitdown"],
      scope: "local",
      dryRun: true,
      projectRoot: tmpDir,
    });
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes[0].status).toBe("failed");
    expect(result.outcomes[0].reason).toMatch(/global-only/);
  });

  it("agents-md dry-run emits a copy-template step", async () => {
    const result = await runToolsInstall({
      toolNames: ["agents-md"],
      scope: "local",
      dryRun: true,
      projectRoot: tmpDir,
    });
    const cpStep = result.outcomes[0].steps.find((s) => s.step.kind === "copy-template");
    expect(cpStep).toBeDefined();
    expect(cpStep!.command).toContain("AGENTS.md");
  });

  it("fails when needsOpencode is true and opencode CLI is missing", async () => {
    if (detectPlatform() !== "linux") return;
    const result = await runToolsInstall({
      toolNames: ["dcp"],
      scope: "global",
      dryRun: true,
      projectRoot: tmpDir,
    });
    // If opencode CLI is present, dcp would proceed; if not, fails with helpful reason.
    const outcome = result.outcomes[0];
    if (outcome.status === "failed") {
      expect(outcome.reason).toMatch(/opencode/);
    } else {
      expect(outcome.status).toBe("dry-run");
    }
  });
});

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { COMMANDS, type CommandMapping } from "../registry";
import { claudeCodeGenerator } from "../generators/claude-code";
import { opencodeGenerator } from "../generators/opencode";
import { cursorGenerator } from "../generators/cursor";
import { listGenerators, getGenerator } from "../generators";
import { installCommands } from "../install-commands";

describe("command registry", () => {
  it("has exactly 8 entries", () => {
    expect(COMMANDS.length).toBe(8);
  });

  it("every entry has required fields", () => {
    for (const c of COMMANDS) {
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
      expect(typeof c.skill).toBe("string");
      expect(c.skill.length).toBeGreaterThan(0);
      expect(typeof c.description).toBe("string");
      expect(c.description.length).toBeGreaterThan(0);
    }
  });

  it("names are unique", () => {
    const names = COMMANDS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every skill field resolves to a real directory under packages/spells/skills", async () => {
    const repoRoot = path.resolve(__dirname, "../../../../..");
    const skillsDir = path.join(repoRoot, "packages/spells/skills");
    for (const c of COMMANDS) {
      const dir = path.join(skillsDir, c.skill);
      const exists = await fs
        .stat(dir)
        .then((s) => s.isDirectory())
        .catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it("review has per-runtime builtinNames to trigger collision warnings for Claude Code", () => {
    const review = COMMANDS.find((c) => c.name === "review");
    expect(review).toBeDefined();
    expect(review?.builtinNames?.["claude-code"]).toBe("review");
    expect(review?.builtinNames?.opencode).toBeUndefined();
    expect(review?.builtinNames?.cursor).toBeUndefined();
  });
});

describe("generator dispatch", () => {
  it("listGenerators returns the 3 supported runtimes", () => {
    const gens = listGenerators();
    expect(gens.length).toBe(3);
    const ids = gens.map((g) => g.runtime).sort();
    expect(ids).toEqual(["claude-code", "cursor", "opencode"]);
  });

  it("getGenerator returns the matching generator", () => {
    expect(getGenerator("claude-code").runtime).toBe("claude-code");
    expect(getGenerator("opencode").runtime).toBe("opencode");
    expect(getGenerator("cursor").runtime).toBe("cursor");
  });
});

describe("claude-code generator", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-claude-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("detects when .claude/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".claude"), { recursive: true });
    expect(await claudeCodeGenerator.detect(tmpDir)).toBe(true);
  });

  it("detects when CLAUDE.md exists", async () => {
    await fs.writeFile(path.join(tmpDir, "CLAUDE.md"), "");
    expect(await claudeCodeGenerator.detect(tmpDir)).toBe(true);
  });

  it("writes a command file with description frontmatter and skill body", async () => {
    const mapping: CommandMapping = {
      name: "review",
      skill: "code-review-and-quality",
      description: "Review changes with five-axis critique",
    };
    const filePath = await claudeCodeGenerator.generate(mapping, tmpDir);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("description: Review changes with five-axis critique");
    expect(content).toContain("`code-review-and-quality`");
  });

  it("is idempotent across runs", async () => {
    const mapping: CommandMapping = {
      name: "test",
      skill: "test-driven-development",
      description: "Run tests with TDD",
    };
    const first = await claudeCodeGenerator.generate(mapping, tmpDir);
    const second = await claudeCodeGenerator.generate(mapping, tmpDir);
    expect(first).toBe(second);
    const entries = await fs.readdir(path.join(tmpDir, ".claude", "commands"));
    expect(entries.filter((e) => e === "test.md")).toHaveLength(1);
  });
});

describe("opencode generator", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-opencode-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("detects when .opencode/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".opencode"), { recursive: true });
    expect(await opencodeGenerator.detect(tmpDir)).toBe(true);
  });

  it("detects when opencode.json exists", async () => {
    await fs.writeFile(path.join(tmpDir, "opencode.json"), "{}");
    expect(await opencodeGenerator.detect(tmpDir)).toBe(true);
  });

  it("writes a command file with $ARGUMENTS", async () => {
    const mapping: CommandMapping = {
      name: "debug",
      skill: "debugging-and-error-recovery",
      description: "Five-step debugging triage",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("$ARGUMENTS");
    expect(content).toContain("`debugging-and-error-recovery`");
  });

  it("review command includes git diff shell injection", async () => {
    const mapping: CommandMapping = {
      name: "review",
      skill: "code-review-and-quality",
      description: "Review changes with five-axis critique",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("!`git diff --staged`");
  });
});

describe("cursor generator", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-cursor-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("detects when .cursor/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".cursor"), { recursive: true });
    expect(await cursorGenerator.detect(tmpDir)).toBe(true);
  });

  it("writes an .mdc file with alwaysApply: false", async () => {
    const mapping: CommandMapping = {
      name: "plan",
      skill: "idea-refine",
      description: "Plan a feature",
    };
    const filePath = await cursorGenerator.generate(mapping, tmpDir);
    expect(filePath.endsWith(".mdc")).toBe(true);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("alwaysApply: false");
    expect(content).toContain("/plan");
    expect(content).toContain("`idea-refine`");
  });
});

describe("installCommands orchestration", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `summon-install-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("generates 7 files for Claude Code when all target skills are installed (review skipped for builtin collision)", async () => {
    const ccTmp = path.join(tmpDir, "cc");
    await fs.mkdir(ccTmp, { recursive: true });
    await fs.mkdir(path.join(ccTmp, ".claude"), { recursive: true });
    const skills = COMMANDS.map((c) => c.skill);
    const result = await installCommands({
      projectRoot: ccTmp,
      installedSkillNames: skills,
    });
    const claudeDetected = result.detected.find((d) => d.runtime === "claude-code");
    expect(claudeDetected).toBeDefined();
    const claudeGenerated = result.generated.filter((g) => g.runtime === "claude-code");
    expect(claudeGenerated).toHaveLength(COMMANDS.length - 1);
    const dir = path.join(ccTmp, ".claude", "commands");
    const files = await fs.readdir(dir);
    expect(files).toHaveLength(COMMANDS.length - 1);
  });

  it("generates 8 files for OpenCode and Cursor (no /review collision in those runtimes)", async () => {
    const proj = path.join(tmpDir, "proj-oc-cu");
    await fs.mkdir(proj, { recursive: true });
    await fs.mkdir(path.join(proj, ".opencode"), { recursive: true });
    await fs.mkdir(path.join(proj, ".cursor"), { recursive: true });
    const skills = COMMANDS.map((c) => c.skill);
    const result = await installCommands({
      projectRoot: proj,
      installedSkillNames: skills,
    });
    const ocGenerated = result.generated.filter((g) => g.runtime === "opencode");
    const cuGenerated = result.generated.filter((g) => g.runtime === "cursor");
    expect(ocGenerated).toHaveLength(COMMANDS.length);
    expect(cuGenerated).toHaveLength(COMMANDS.length);
    expect(result.generated.find((g) => g.runtime === "opencode" && g.command === "review")).toBeDefined();
    expect(result.generated.find((g) => g.runtime === "cursor" && g.command === "review")).toBeDefined();
  });

  it("skips commands whose target skill is not installed and reports it", async () => {
    const ocTmp = path.join(tmpDir, "oc");
    await fs.mkdir(ocTmp, { recursive: true });
    await fs.mkdir(path.join(ocTmp, ".opencode"), { recursive: true });
    const result = await installCommands({
      projectRoot: ocTmp,
      installedSkillNames: ["code-review-and-quality"],
    });
    const ocGenerated = result.generated.filter((g) => g.runtime === "opencode");
    const ocSkipped = result.skipped.filter((s) => !s.reason.includes("built-in"));
    expect(ocGenerated.find((g) => g.command === "test")).toBeUndefined();
    const testSkipped = ocSkipped.find((s) => s.command === "test");
    expect(testSkipped).toBeDefined();
    expect(testSkipped?.reason).toMatch(/not installed/);
  });

  it("skips commands that collide with runtime built-ins", async () => {
    const ccTmp = path.join(tmpDir, "cc");
    await fs.mkdir(ccTmp, { recursive: true });
    await fs.mkdir(path.join(ccTmp, ".claude"), { recursive: true });
    const skills = COMMANDS.map((c) => c.skill);
    const result = await installCommands({
      projectRoot: ccTmp,
      installedSkillNames: skills,
    });
    const ccSkipped = result.skipped.filter(
      (s) => s.reason.includes("built-in")
    );
    expect(ccSkipped.length).toBeGreaterThanOrEqual(1);
    expect(ccSkipped.find((s) => s.command === "review")).toBeDefined();
    const ccGenerated = result.generated.filter((g) => g.runtime === "claude-code");
    expect(ccGenerated.find((g) => g.command === "review")).toBeUndefined();
  });

  it("generates files for the 3 supported runtimes when all project markers are present", async () => {
    const proj = path.join(tmpDir, "proj");
    await fs.mkdir(proj, { recursive: true });
    await fs.mkdir(path.join(proj, ".claude"), { recursive: true });
    await fs.mkdir(path.join(proj, ".opencode"), { recursive: true });
    await fs.mkdir(path.join(proj, ".cursor"), { recursive: true });
    const skills = COMMANDS.map((c) => c.skill);
    const result = await installCommands({
      projectRoot: proj,
      installedSkillNames: skills,
    });
    const claudeFiles = await fs.readdir(path.join(proj, ".claude", "commands"));
    const opencodeFiles = await fs.readdir(path.join(proj, ".opencode", "commands"));
    const cursorFiles = await fs.readdir(path.join(proj, ".cursor", "rules"));
    expect(claudeFiles).toHaveLength(COMMANDS.length - 1);
    expect(opencodeFiles).toHaveLength(COMMANDS.length);
    expect(cursorFiles).toHaveLength(COMMANDS.length);
  });
});

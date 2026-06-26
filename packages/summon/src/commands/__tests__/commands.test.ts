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

  it("claude-code supports local and global", () => {
    expect(claudeCodeGenerator.supportedLocations.sort()).toEqual(["global", "local"]);
  });

  it("opencode supports local and global", () => {
    expect(opencodeGenerator.supportedLocations.sort()).toEqual(["global", "local"]);
  });

  it("cursor supports only local", () => {
    expect(cursorGenerator.supportedLocations).toEqual(["local"]);
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

  it("detects local when .claude/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".claude"), { recursive: true });
    expect(await claudeCodeGenerator.detectLocal(tmpDir)).toBe(true);
  });

  it("detects local when CLAUDE.md exists", async () => {
    await fs.writeFile(path.join(tmpDir, "CLAUDE.md"), "");
    expect(await claudeCodeGenerator.detectLocal(tmpDir)).toBe(true);
  });

  it("detects global when ~/.claude/ exists", async () => {
    const exists = await claudeCodeGenerator.detectGlobal();
    expect(typeof exists).toBe("boolean");
  });

  it("writes a command file with description frontmatter and skill body (local)", async () => {
    const mapping: CommandMapping = {
      name: "review",
      skill: "code-review-and-quality",
      description: "Review changes with five-axis critique",
    };
    const filePath = await claudeCodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("description: Review changes with five-axis critique");
    expect(content).toContain("`code-review-and-quality`");
  });

  it("is idempotent across runs (local)", async () => {
    const mapping: CommandMapping = {
      name: "test",
      skill: "test-driven-development",
      description: "Run tests with TDD",
    };
    const first = await claudeCodeGenerator.generate(mapping, tmpDir, "local");
    const second = await claudeCodeGenerator.generate(mapping, tmpDir, "local");
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

  it("detects local when .opencode/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".opencode"), { recursive: true });
    expect(await opencodeGenerator.detectLocal(tmpDir)).toBe(true);
  });

  it("detects local when opencode.json exists", async () => {
    await fs.writeFile(path.join(tmpDir, "opencode.json"), "{}");
    expect(await opencodeGenerator.detectLocal(tmpDir)).toBe(true);
  });

  it("writes a command file with $ARGUMENTS (local)", async () => {
    const mapping: CommandMapping = {
      name: "debug",
      skill: "debugging-and-error-recovery",
      description: "Five-step debugging triage",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("$ARGUMENTS");
    expect(content).toContain("`debugging-and-error-recovery`");
  });

  it("review command includes git diff shell injection (local)", async () => {
    const mapping: CommandMapping = {
      name: "review",
      skill: "code-review-and-quality",
      description: "Review changes with five-axis critique",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("!`git diff --staged`");
  });

  it("writes a command file to ~/.config/opencode/commands/ (global)", async () => {
    const mapping: CommandMapping = {
      name: "plan",
      skill: "idea-refine",
      description: "Plan a feature",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir, "global");
    expect(filePath).toContain(`.config${path.sep}opencode${path.sep}commands${path.sep}plan.md`);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("description: Plan a feature");
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

  it("detects local when .cursor/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".cursor"), { recursive: true });
    expect(await cursorGenerator.detectLocal(tmpDir)).toBe(true);
  });

  it("does not support global", () => {
    expect(cursorGenerator.detectGlobal()).resolves.toBe(false);
  });

  it("writes an .mdc file with alwaysApply: false (local)", async () => {
    const mapping: CommandMapping = {
      name: "plan",
      skill: "idea-refine",
      description: "Plan a feature",
    };
    const filePath = await cursorGenerator.generate(mapping, tmpDir, "local");
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
      projectRoots: [ccTmp],
      locationByRuntime: { "claude-code": ["local"] },
      installedSkillNames: skills,
    });
    const claudeDetected = result.detected.find(
      (d) => d.runtime === "claude-code" && d.projectRoot === ccTmp
    );
    expect(claudeDetected).toBeDefined();
    const claudeGenerated = result.generated.filter(
      (g) => g.runtime === "claude-code" && g.projectRoot === ccTmp
    );
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
      projectRoots: [proj],
      locationByRuntime: { opencode: ["local"], cursor: ["local"] },
      installedSkillNames: skills,
    });
    const ocGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === proj
    );
    const cuGenerated = result.generated.filter(
      (g) => g.runtime === "cursor" && g.projectRoot === proj
    );
    expect(ocGenerated).toHaveLength(COMMANDS.length);
    expect(cuGenerated).toHaveLength(COMMANDS.length);
    expect(
      result.generated.find(
        (g) => g.runtime === "opencode" && g.command === "review" && g.projectRoot === proj
      )
    ).toBeDefined();
    expect(
      result.generated.find(
        (g) => g.runtime === "cursor" && g.command === "review" && g.projectRoot === proj
      )
    ).toBeDefined();
  });

  it("skips commands whose target skill is not installed and reports it", async () => {
    const ocTmp = path.join(tmpDir, "oc");
    await fs.mkdir(ocTmp, { recursive: true });
    await fs.mkdir(path.join(ocTmp, ".opencode"), { recursive: true });
    const result = await installCommands({
      projectRoots: [ocTmp],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: ["code-review-and-quality"],
    });
    const ocGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === ocTmp
    );
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
      projectRoots: [ccTmp],
      locationByRuntime: { "claude-code": ["local"] },
      installedSkillNames: skills,
    });
    const ccSkipped = result.skipped.filter((s) => s.reason.includes("built-in"));
    expect(ccSkipped.length).toBeGreaterThanOrEqual(1);
    expect(ccSkipped.find((s) => s.command === "review")).toBeDefined();
    const ccGenerated = result.generated.filter(
      (g) => g.runtime === "claude-code" && g.projectRoot === ccTmp
    );
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
      projectRoots: [proj],
      locationByRuntime: { "claude-code": ["local"], opencode: ["local"], cursor: ["local"] },
      installedSkillNames: skills,
    });
    const claudeFiles = await fs.readdir(path.join(proj, ".claude", "commands"));
    const opencodeFiles = await fs.readdir(path.join(proj, ".opencode", "commands"));
    const cursorFiles = await fs.readdir(path.join(proj, ".cursor", "rules"));
    expect(claudeFiles).toHaveLength(COMMANDS.length - 1);
    expect(opencodeFiles).toHaveLength(COMMANDS.length);
    expect(cursorFiles).toHaveLength(COMMANDS.length);
  });

  it("applies across multiple project roots", async () => {
    const a = path.join(tmpDir, "a");
    const b = path.join(tmpDir, "b");
    await fs.mkdir(a, { recursive: true });
    await fs.mkdir(b, { recursive: true });
    await fs.mkdir(path.join(a, ".opencode"), { recursive: true });
    await fs.mkdir(path.join(b, ".opencode"), { recursive: true });
    const skills = COMMANDS.map((c) => c.skill);
    const result = await installCommands({
      projectRoots: [a, b],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: skills,
    });
    const aFiles = await fs.readdir(path.join(a, ".opencode", "commands"));
    const bFiles = await fs.readdir(path.join(b, ".opencode", "commands"));
    expect(aFiles).toHaveLength(COMMANDS.length);
    expect(bFiles).toHaveLength(COMMANDS.length);
    const aGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === a
    );
    const bGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === b
    );
    expect(aGenerated).toHaveLength(COMMANDS.length);
    expect(bGenerated).toHaveLength(COMMANDS.length);
  });

  it("skips global when not requested in locationByRuntime", async () => {
    const proj = path.join(tmpDir, "proj");
    await fs.mkdir(proj, { recursive: true });
    await fs.mkdir(path.join(proj, ".opencode"), { recursive: true });
    const result = await installCommands({
      projectRoots: [proj],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: COMMANDS.map((c) => c.skill),
    });
    expect(result.detected.find((d) => d.location === "global")).toBeUndefined();
    expect(result.generated.find((g) => g.location === "global")).toBeUndefined();
  });
});

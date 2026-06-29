import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { COMMANDS, type CommandMapping, isStandaloneCommand } from "../registry";
import { claudeCodeGenerator } from "../generators/claude-code";
import { opencodeGenerator } from "../generators/opencode";
import { cursorGenerator } from "../generators/cursor";
import { listGenerators, getGenerator } from "../generators";
import { installCommands } from "../install-commands";

const STANDALONE_COMMANDS = COMMANDS.filter(isStandaloneCommand);
const INVOKER_COMMANDS = COMMANDS.filter((c) => !isStandaloneCommand(c));

describe("command registry", () => {
  it("has the expected number of entries (invokers + standalone)", () => {
    expect(COMMANDS.length).toBe(INVOKER_COMMANDS.length + STANDALONE_COMMANDS.length);
    expect(INVOKER_COMMANDS.length).toBe(8);
    expect(STANDALONE_COMMANDS.length).toBe(7);
  });

  it("every entry has required fields and exactly one of {skill, body}", () => {
    for (const c of COMMANDS) {
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
      expect(typeof c.description).toBe("string");
      expect(c.description.length).toBeGreaterThan(0);
      const hasSkill = typeof c.skill === "string" && c.skill.length > 0;
      const hasBody = typeof c.body === "string" && c.body.length > 0;
      expect(hasSkill !== hasBody).toBe(true); // XOR
    }
  });

  it("names are unique", () => {
    const names = COMMANDS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every invoker's skill field resolves to a real directory under packages/spells/skills", async () => {
    const repoRoot = path.resolve(__dirname, "../../../../..");
    const skillsDir = path.join(repoRoot, "packages/spells/skills");
    for (const c of INVOKER_COMMANDS) {
      const dir = path.join(skillsDir, c.skill!);
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

  it("all standalone entries have non-empty body", () => {
    for (const c of STANDALONE_COMMANDS) {
      expect(c.body).toBeDefined();
      expect(c.body!.length).toBeGreaterThan(20);
    }
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

  it("invoker body includes a skill-install fallback line", async () => {
    const mapping: CommandMapping = {
      name: "review",
      skill: "code-review-and-quality",
      description: "Review changes with five-axis critique",
    };
    const filePath = await claudeCodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("If the skill is unavailable");
    expect(content).toContain("npx @runecraft/summon install");
  });

  it("writes a standalone command file with the embedded body and no skill reference", async () => {
    const mapping: CommandMapping = {
      name: "setup-context7",
      body: "Goal: install context7.\nInstructions: do the thing.\n",
      description: "Install Context7",
    };
    const filePath = await claudeCodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("description: Install Context7");
    expect(content).toContain("Goal: install context7.");
    expect(content).toContain("Instructions: do the thing.");
    expect(content).not.toMatch(/Load the \`/);
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

  it("invoker body includes a skill-install fallback line", async () => {
    const mapping: CommandMapping = {
      name: "debug",
      skill: "debugging-and-error-recovery",
      description: "Five-step debugging triage",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("If the skill is unavailable");
    expect(content).toContain("npx @runecraft/summon install");
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

  it("writes a standalone command file with the embedded body and $ARGUMENTS", async () => {
    const mapping: CommandMapping = {
      name: "setup-markitdown",
      body: "Goal: install markitdown.\nInstructions: pipx install markitdown.\n",
      description: "Install markitdown",
    };
    const filePath = await opencodeGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("description: Install markitdown");
    expect(content).toContain("Goal: install markitdown.");
    expect(content).toContain("$ARGUMENTS");
    expect(content).not.toMatch(/!`git diff/);
    expect(content).not.toMatch(/Load the \`/);
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

  it("invoker body includes a skill-install fallback line", async () => {
    const mapping: CommandMapping = {
      name: "plan",
      skill: "idea-refine",
      description: "Plan a feature",
    };
    const filePath = await cursorGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("If the skill is unavailable");
    expect(content).toContain("npx @runecraft/summon install");
  });

  it("writes a standalone .mdc file with the embedded body and $ARGUMENTS", async () => {
    const mapping: CommandMapping = {
      name: "setup-exa",
      body: "Goal: install exa.\nInstructions: do the thing.\n",
      description: "Install Exa",
    };
    const filePath = await cursorGenerator.generate(mapping, tmpDir, "local");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("alwaysApply: false");
    expect(content).toContain("/setup-exa");
    expect(content).toContain("Goal: install exa.");
    expect(content).toContain("$ARGUMENTS");
    expect(content).not.toMatch(/load the \`/i);
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

  it("generates 7 invoker files for Claude Code (review skipped for builtin collision), plus all 7 standalone files", async () => {
    const ccTmp = path.join(tmpDir, "cc");
    await fs.mkdir(ccTmp, { recursive: true });
    await fs.mkdir(path.join(ccTmp, ".claude"), { recursive: true });
    const installedSkills = INVOKER_COMMANDS.map((c) => c.skill!);
    const result = await installCommands({
      projectRoots: [ccTmp],
      locationByRuntime: { "claude-code": ["local"] },
      installedSkillNames: installedSkills,
    });
    const claudeGenerated = result.generated.filter(
      (g) => g.runtime === "claude-code" && g.projectRoot === ccTmp
    );
    expect(claudeGenerated).toHaveLength(INVOKER_COMMANDS.length - 1 + STANDALONE_COMMANDS.length);
    const dir = path.join(ccTmp, ".claude", "commands");
    const files = await fs.readdir(dir);
    expect(files).toHaveLength(INVOKER_COMMANDS.length - 1 + STANDALONE_COMMANDS.length);
  });

  it("generates all 15 files for OpenCode and Cursor (no /review collision in those runtimes)", async () => {
    const proj = path.join(tmpDir, "proj-oc-cu");
    await fs.mkdir(proj, { recursive: true });
    await fs.mkdir(path.join(proj, ".opencode"), { recursive: true });
    await fs.mkdir(path.join(proj, ".cursor"), { recursive: true });
    const installedSkills = INVOKER_COMMANDS.map((c) => c.skill!);
    const result = await installCommands({
      projectRoots: [proj],
      locationByRuntime: { opencode: ["local"], cursor: ["local"] },
      installedSkillNames: installedSkills,
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

  it("auto-installs missing invoker skills into the target runtime and generates the command", async () => {
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
    const testGenerated = ocGenerated.find((g) => g.command === "test");
    expect(testGenerated).toBeDefined();
    expect(testGenerated?.installedSkill).toBe("test-driven-development");
    const skillFile = path.join(ocTmp, ".opencode", "skills", "test-driven-development.md");
    const exists = await fs.stat(skillFile).then((s) => s.isFile()).catch(() => false);
    expect(exists).toBe(true);
    expect(result.skillInstalls.length).toBeGreaterThan(0);
    expect(result.skillInstalls.every((r) => r.success)).toBe(true);
  });

  it("does NOT skip standalone commands even when no skills are installed", async () => {
    const ocTmp = path.join(tmpDir, "oc-standalone");
    await fs.mkdir(ocTmp, { recursive: true });
    await fs.mkdir(path.join(ocTmp, ".opencode"), { recursive: true });
    const result = await installCommands({
      projectRoots: [ocTmp],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: [],
    });
    const ocGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === ocTmp
    );
    const standaloneGenerated = ocGenerated.filter((g) =>
      STANDALONE_COMMANDS.some((c) => c.name === g.command)
    );
    expect(standaloneGenerated).toHaveLength(STANDALONE_COMMANDS.length);
    for (const name of STANDALONE_COMMANDS.map((c) => c.name)) {
      expect(ocGenerated.find((g) => g.command === name)).toBeDefined();
    }
    for (const g of standaloneGenerated) {
      expect(g.installedSkill).toBeUndefined();
    }
  });

  it("with installMissingSkills: false, skips invokers whose target skill is not installed and reports it", async () => {
    const ocTmp = path.join(tmpDir, "oc-skip");
    await fs.mkdir(ocTmp, { recursive: true });
    await fs.mkdir(path.join(ocTmp, ".opencode"), { recursive: true });
    const result = await installCommands({
      projectRoots: [ocTmp],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: ["code-review-and-quality"],
      installMissingSkills: false,
    });
    const ocGenerated = result.generated.filter(
      (g) => g.runtime === "opencode" && g.projectRoot === ocTmp
    );
    expect(ocGenerated.find((g) => g.command === "test")).toBeUndefined();
    const ocSkipped = result.skipped.filter((s) => !s.reason.includes("built-in"));
    const testSkipped = ocSkipped.find((s) => s.command === "test");
    expect(testSkipped).toBeDefined();
    expect(testSkipped?.reason).toMatch(/not installed/);
    expect(result.skillInstalls).toHaveLength(0);
  });

  it("skips an invoker cleanly when its target skill is not in the spells catalog", async () => {
    const ocTmp = path.join(tmpDir, "oc-isolated");
    await fs.mkdir(ocTmp, { recursive: true });
    await fs.mkdir(path.join(ocTmp, ".opencode"), { recursive: true });
    const emptySpells = path.join(tmpDir, "empty-spells");
    await fs.mkdir(emptySpells, { recursive: true });
    const prev = process.env.ARCANUM_SPELLS_DIR;
    process.env.ARCANUM_SPELLS_DIR = emptySpells;
    try {
      const result = await installCommands({
        projectRoots: [ocTmp],
        locationByRuntime: { opencode: ["local"] },
        installedSkillNames: [],
      });
      const invokerSkipped = result.skipped.filter(
        (s) => !s.reason.includes("built-in") && INVOKER_COMMANDS.some((c) => c.name === s.command)
      );
      expect(invokerSkipped).toHaveLength(INVOKER_COMMANDS.length);
      for (const s of invokerSkipped) {
        expect(s.reason).toMatch(/not in the catalog/);
      }
      const standaloneGenerated = result.generated.filter((g) =>
        STANDALONE_COMMANDS.some((c) => c.name === g.command)
      );
      expect(standaloneGenerated).toHaveLength(STANDALONE_COMMANDS.length);
    } finally {
      if (prev === undefined) delete process.env.ARCANUM_SPELLS_DIR;
      else process.env.ARCANUM_SPELLS_DIR = prev;
    }
  });

  it("skips commands that collide with runtime built-ins", async () => {
    const ccTmp = path.join(tmpDir, "cc");
    await fs.mkdir(ccTmp, { recursive: true });
    await fs.mkdir(path.join(ccTmp, ".claude"), { recursive: true });
    const installedSkills = INVOKER_COMMANDS.map((c) => c.skill!);
    const result = await installCommands({
      projectRoots: [ccTmp],
      locationByRuntime: { "claude-code": ["local"] },
      installedSkillNames: installedSkills,
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
    const installedSkills = INVOKER_COMMANDS.map((c) => c.skill!);
    const result = await installCommands({
      projectRoots: [proj],
      locationByRuntime: { "claude-code": ["local"], opencode: ["local"], cursor: ["local"] },
      installedSkillNames: installedSkills,
    });
    const claudeFiles = await fs.readdir(path.join(proj, ".claude", "commands"));
    const opencodeFiles = await fs.readdir(path.join(proj, ".opencode", "commands"));
    const cursorFiles = await fs.readdir(path.join(proj, ".cursor", "rules"));
    expect(claudeFiles).toHaveLength(INVOKER_COMMANDS.length - 1 + STANDALONE_COMMANDS.length);
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
    const installedSkills = INVOKER_COMMANDS.map((c) => c.skill!);
    const result = await installCommands({
      projectRoots: [a, b],
      locationByRuntime: { opencode: ["local"] },
      installedSkillNames: installedSkills,
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
      installedSkillNames: INVOKER_COMMANDS.map((c) => c.skill!),
    });
    expect(result.detected.find((d) => d.location === "global")).toBeUndefined();
    expect(result.generated.find((g) => g.location === "global")).toBeUndefined();
  });
});

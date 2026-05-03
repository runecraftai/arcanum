import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  createHubSymlink,
  computeRelativePath,
  getHubSkillPath,
  installSkill,
  removeSkill,
} from "../installer";
import type { SkillMeta } from "../loader";
import { copyFile } from "../../utils/fs";
import * as pathUtils from "../../utils/paths";

describe("installer", () => {
  let tmpDir: string;
  let sourceDir: string;
  let skillSourcePath: string;
  let agentInstallDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `arcanum-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    sourceDir = path.join(tmpDir, "source");
    agentInstallDir = path.join(tmpDir, "agent", "skills");
    skillSourcePath = path.join(sourceDir, "test-skill", "SKILL.md");

    await fs.mkdir(path.dirname(skillSourcePath), { recursive: true });
    await fs.writeFile(skillSourcePath, "# Test Skill");
    await fs.mkdir(agentInstallDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    // Clean up any global test skills created during tests
    try {
      const globalTestSkillDir = path.join(os.homedir(), ".agents", "skills", "test-skill");
      await fs.rm(globalTestSkillDir, { recursive: true, force: true });
    } catch {}
    try {
      const globalTestSkillCopyDir = path.join(os.homedir(), ".agents", "skills", "test-skill-copy");
      await fs.rm(globalTestSkillCopyDir, { recursive: true, force: true });
    } catch {}
  });

  it("createHubSymlink creates relative symlink for SKILL.md", async () => {
    const hubPath = path.join(tmpDir, ".agents", "skills", "test-skill");
    await createHubSymlink(skillSourcePath, hubPath);

    const hubSkillFile = path.join(hubPath, "SKILL.md");
    const stats = await fs.lstat(hubSkillFile);
    expect(stats.isSymbolicLink()).toBe(true);

    const linkTarget = await fs.readlink(hubSkillFile);
    expect(linkTarget.startsWith("..")).toBe(true);
  });

  it("installSkill with symlink method creates relative symlink at agent", async () => {
    const skill: SkillMeta = {
      name: "test-skill",
      category: "test",
      description: "Test skill",
      filePath: skillSourcePath,
    };

    const result = await installSkill(
      skill,
      skillSourcePath,
      agentInstallDir,
      "symlink",
      "test-agent",
      tmpDir
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe("symlink");

    const agentSkillFile = path.join(agentInstallDir, "test-skill.md");
    const stats = await fs.lstat(agentSkillFile);
    expect(stats.isSymbolicLink()).toBe(true);

    const linkTarget = await fs.readlink(agentSkillFile);
    expect(!path.isAbsolute(linkTarget)).toBe(true);
  });

  it("installSkill with copy method does NOT create hub directory", async () => {
    const skill: SkillMeta = {
      name: "test-skill",
      category: "test",
      description: "Test skill",
      filePath: skillSourcePath,
    };

    const result = await installSkill(
      skill,
      skillSourcePath,
      agentInstallDir,
      "copy",
      "test-agent",
      tmpDir
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe("copy");

    const agentSkillFile = path.join(agentInstallDir, "test-skill.md");
    const stats = await fs.lstat(agentSkillFile);
    expect(stats.isSymbolicLink()).toBe(false);

    const hubPath = getHubSkillPath(tmpDir, "test-skill");
    try {
      await fs.lstat(hubPath);
      expect.unreachable();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  });

  it("removeSkill for hub-managed skill removes agent symlink and hub directory", async () => {
    const skill: SkillMeta = {
      name: "test-skill",
      category: "test",
      description: "Test skill",
      filePath: skillSourcePath,
    };

    const installResult = await installSkill(
      skill,
      skillSourcePath,
      agentInstallDir,
      "symlink",
      "test-agent",
      tmpDir
    );
    expect(installResult.success).toBe(true);

    const agentSkillFile = path.join(agentInstallDir, "test-skill.md");
    const removeResult = await removeSkill(
      "test-skill",
      agentSkillFile,
      "test-agent",
      tmpDir
    );

    expect(removeResult.success).toBe(true);

    try {
      await fs.lstat(agentSkillFile);
      expect.unreachable();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }

    const hubPath = getHubSkillPath(tmpDir, "test-skill");
    try {
      await fs.lstat(hubPath);
      expect.unreachable();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  });

  it("getHubSkillPath with scope='global' returns ~/.config/opencode/skills/<name>", () => {
    const skillName = "test-skill";
    const globalPath = getHubSkillPath(tmpDir, skillName, "global");
    const homedir = os.homedir();
    const expectedPath = path.join(homedir, ".config", "opencode", "skills", skillName);
    expect(globalPath).toBe(expectedPath);
  });

  it("getHubSkillPath with scope='project' returns <root>/.agents/skills/<name>", () => {
    const skillName = "test-skill";
    const projectPath = getHubSkillPath(tmpDir, skillName, "project");
    const expectedPath = path.join(tmpDir, ".agents", "skills", skillName);
    expect(projectPath).toBe(expectedPath);
  });

  it("getHubSkillPath with default scope returns <root>/.agents/skills/<name>", () => {
    const skillName = "test-skill";
    const defaultPath = getHubSkillPath(tmpDir, skillName);
    const expectedPath = path.join(tmpDir, ".agents", "skills", skillName);
    expect(defaultPath).toBe(expectedPath);
  });

  it("installSkill with global scope symlink uses global hub path", async () => {
    const skill: SkillMeta = {
      name: "test-skill",
      category: "test",
      description: "Test skill",
      filePath: skillSourcePath,
    };

    const result = await installSkill(
      skill,
      skillSourcePath,
      agentInstallDir,
      "symlink",
      "test-agent",
      tmpDir,
      "global"
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe("symlink");

    // Check agent symlink was created
    const agentSkillFile = path.join(agentInstallDir, "test-skill.md");
    const stats = await fs.lstat(agentSkillFile);
    expect(stats.isSymbolicLink()).toBe(true);

    // Check that global hub was created
    const globalHubPath = pathUtils.resolveGlobalSkillsHub("test-skill");
    const hubSkillFile = path.join(globalHubPath, "SKILL.md");
    try {
      const hubStats = await fs.lstat(hubSkillFile);
      expect(hubStats.isSymbolicLink()).toBe(true);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        expect.unreachable(`Global hub symlink not created at ${hubSkillFile}`);
      }
      throw err;
    }
  });

  it("installSkill with copy method does NOT use hub path regardless of scope", async () => {
    const skill: SkillMeta = {
      name: "test-skill-copy",
      category: "test",
      description: "Test skill",
      filePath: skillSourcePath,
    };

    const result = await installSkill(
      skill,
      skillSourcePath,
      agentInstallDir,
      "copy",
      "test-agent",
      tmpDir,
      "global"
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe("copy");

    const agentSkillFile = path.join(agentInstallDir, "test-skill-copy.md");
    const stats = await fs.lstat(agentSkillFile);
    expect(stats.isSymbolicLink()).toBe(false);

    // Verify no global hub was created for copy method
    const globalHubPath = pathUtils.resolveGlobalSkillsHub("test-skill-copy");
    try {
      await fs.lstat(globalHubPath);
      expect.unreachable("Copy method should NOT create hub directory");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  });
});

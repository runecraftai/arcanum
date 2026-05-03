import path from "node:path";
import fs from "node:fs/promises";
import {
  copyFile,
  symlinkFile,
  removeFile,
  ensureDir,
  exists,
  isSymlink,
} from "../utils/fs";
import { SKILLS_DIR, SKILL_MANIFEST } from "../constants";
import { resolveGlobalSkillsHub } from "../utils/paths";
import type { SkillMeta } from "./loader";
import type { AgentScope } from "../utils/paths";

export type InstallMethod = "copy" | "symlink";

/**
 * Validates that a child path is within a parent directory.
 * Returns true if child is within parent, false if it escapes (../), or is absolute.
 */
function isPathWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

/**
 * Validates that a symlink target is safe (within expected directories)
 */
function isSymlinkTargetSafe(target: string, spellsDir: string): boolean {
  const resolvedTarget = path.resolve(target);
  const resolvedSpellsDir = path.resolve(spellsDir);
  return isPathWithin(resolvedSpellsDir, resolvedTarget);
}

export interface InstallResult {
  skillName: string;
  agentId: string;
  success: boolean;
  method: InstallMethod;
  error?: string;
}

/**
 * Get the hub skill path for a given project root and skill name.
 * Returns: 
 *   - For global scope: ~/.config/opencode/skills/<skillName>
 *   - Otherwise: <projectRoot>/.agents/skills/<skillName>/
 */
export function getHubSkillPath(
  projectRoot: string,
  skillName: string,
  scope: AgentScope = "project"
): string {
  if (scope === "global") {
    return resolveGlobalSkillsHub(skillName);
  }
  return path.join(projectRoot, SKILLS_DIR, skillName);
}

/**
 * Compute a relative path from one directory to another.
 * Used for symlink target computation.
 */
export function computeRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Create a hub symlink structure for a skill.
 * Creates .agents/skills/<name>/ directory and symlinks SKILL.md + .skill-meta.json
 * from source to hub using relative paths.
 */
export async function createHubSymlink(
  sourcePath: string,
  hubPath: string,
  scope: AgentScope = "project"
): Promise<void> {
  await ensureDir(hubPath);

  const sourceDir = path.dirname(sourcePath);
  const sourceFileName = path.basename(sourcePath);
  const skillName = path.basename(hubPath);

  const hubSkillFile = path.join(hubPath, sourceFileName);
  const relativeTarget = computeRelativePath(hubPath, sourcePath);

  if (await exists(hubSkillFile)) {
    await removeFile(hubSkillFile);
  }

  await symlinkFile(relativeTarget, hubSkillFile);

  const sourceMetaPath = path.join(sourceDir, ".skill-meta.json");
  if (await exists(sourceMetaPath)) {
    const hubMetaPath = path.join(hubPath, ".skill-meta.json");
    if (await exists(hubMetaPath)) {
      await removeFile(hubMetaPath);
    }
    const relativeMetaTarget = computeRelativePath(hubPath, sourceMetaPath);
    await symlinkFile(relativeMetaTarget, hubMetaPath);
  }
}

async function validateSkillSource(
  skill: SkillMeta,
  method: InstallMethod
): Promise<InstallResult | null> {
  if (method !== "symlink") return null;
  const resolved = path.resolve(skill.filePath);
  if (!path.isAbsolute(resolved)) {
    return {
      skillName: skill.name,
      agentId: "",
      success: false,
      method,
      error: "Path traversal detected — skill source path is not absolute",
    };
  }
  return null;
}

async function resolveInstallTarget(
  agentInstallDir: string,
  skillName: string
): Promise<InstallResult | null> {
  const skillFilePath = path.join(agentInstallDir, `${skillName}.md`);
  const resolvedDest = path.resolve(skillFilePath);
  const safeInstallDir = path.resolve(agentInstallDir);
  if (!isPathWithin(safeInstallDir, resolvedDest)) {
    return {
      skillName,
      agentId: "",
      success: false,
      method: "copy",
      error: "Path traversal detected — destination path is outside agent install directory",
    };
  }
  return null;
}

async function createHubSymlinkOrError(
  skill: SkillMeta,
  hubPath: string
): Promise<InstallResult | null> {
  try {
    await createHubSymlink(skill.filePath, hubPath);
    return null;
  } catch (hubError) {
    return {
      skillName: skill.name,
      agentId: "",
      success: false,
      method: "symlink",
      error: `Failed to create hub symlink: ${hubError instanceof Error ? hubError.message : String(hubError)}`,
    };
  }
}

async function linkAgentSkill(
  skillFilePath: string,
  hubPath: string
): Promise<void> {
  if (await exists(skillFilePath)) {
    await removeFile(skillFilePath);
  }
  const relativeTargetPath = computeRelativePath(
    path.dirname(skillFilePath),
    path.join(hubPath, SKILL_MANIFEST)
  );
  await symlinkFile(relativeTargetPath, skillFilePath);
}

function resultError(
  skillName: string,
  agentId: string,
  method: InstallMethod,
  error: string
): InstallResult {
  return { skillName, agentId, success: false, method, error };
}

function resultSuccess(
  skillName: string,
  agentId: string,
  method: InstallMethod
): InstallResult {
  return { skillName, agentId, success: true, method };
}

async function createSkillSymlink(
  skill: SkillMeta,
  hubPath: string,
  skillFilePath: string
): Promise<InstallResult | null> {
  if (!(await exists(skill.filePath))) {
    return resultError(skill.name, "", "symlink", `Source skill file not found: ${skill.filePath}`);
  }
  const hubErr = await createHubSymlinkOrError(skill, hubPath);
  if (hubErr) return hubErr;
  await linkAgentSkill(skillFilePath, hubPath);
  return null;
}

export async function installSkill(
  skill: SkillMeta,
  skillSourcePath: string,
  agentInstallDir: string,
  method: InstallMethod = "copy",
  agentId: string = "",
  cwd: string = process.cwd(),
  scope: AgentScope = "project"
): Promise<InstallResult> {
  const skillFilePath = path.join(agentInstallDir, `${skill.name}.md`);
  try {
    let err = await validateSkillSource(skill, method);
    if (err) return { ...err, agentId };
    err = await resolveInstallTarget(agentInstallDir, skill.name);
    if (err) return { ...err, agentId };
    await ensureDir(agentInstallDir);
    if (method === "symlink") {
      const hubPath = getHubSkillPath(cwd, skill.name, scope);
      const symErr = await createSkillSymlink(skill, hubPath, skillFilePath);
      if (symErr) return { ...symErr, agentId };
    } else {
      await copyFile(skillSourcePath, skillFilePath);
    }
    return resultSuccess(skill.name, agentId, method);
  } catch (error) {
    return resultError(skill.name, agentId, method, "Installation failed — check file permissions");
  }
}

export async function removeSkill(
  skillName: string,
  skillFilePath: string,
  agentId: string = "",
  cwd: string = process.cwd(),
  scope: AgentScope = "project"
): Promise<InstallResult> {
  try {
    await removeFile(skillFilePath);
    const hubPath = getHubSkillPath(cwd, skillName, scope);
    if (await exists(hubPath)) {
      try {
        await fs.rm(hubPath, { recursive: true, force: true });
      } catch (hubError) {
        console.warn(`Warning: Failed to remove hub directory ${hubPath}: ${hubError instanceof Error ? hubError.message : String(hubError)}`);
      }
    }
    return resultSuccess(skillName, agentId, "copy");
  } catch (error) {
    return resultError(skillName, agentId, "copy", "Removal failed — check file permissions");
  }
}

async function validateUpdateTarget(
  skill: SkillMeta
): Promise<InstallResult | null> {
  if (!(await exists(skill.filePath))) {
    return {
      skillName: skill.name,
      agentId: "",
      success: false,
      method: "symlink",
      error: `Source skill file not found: ${skill.filePath}`,
    };
  }
  return null;
}

async function healSymlinkChain(
  skill: SkillMeta,
  hubPath: string,
  hubSkillFile: string,
  skillFilePath: string
): Promise<InstallResult | null> {
  if (!(await exists(hubSkillFile)) || !(await isSymlink(hubSkillFile))) {
    try {
      await createHubSymlink(skill.filePath, hubPath);
    } catch (hubError) {
      return {
        skillName: skill.name,
        agentId: "",
        success: false,
        method: "symlink",
        error: `Failed to heal hub symlink: ${hubError instanceof Error ? hubError.message : String(hubError)}`,
      };
    }
  }

  if (!(await exists(skillFilePath)) || !(await isSymlink(skillFilePath))) {
    try {
      await removeFile(skillFilePath);
    } catch {}
    const relativeTargetPath = computeRelativePath(
      path.dirname(skillFilePath),
      hubSkillFile
    );
    await symlinkFile(relativeTargetPath, skillFilePath);
  }

  return null;
}

export async function updateSkill(
  skill: SkillMeta,
  skillSourcePath: string,
  skillFilePath: string,
  method: InstallMethod = "copy",
  agentId: string = "",
  cwd: string = process.cwd(),
  scope: AgentScope = "project"
): Promise<InstallResult> {
  try {
    const agentInstallDir = path.dirname(skillFilePath);
    if (method === "symlink") {
      let err = await validateUpdateTarget(skill);
      if (err) return { ...err, agentId };
      const hubPath = getHubSkillPath(cwd, skill.name, scope);
      const hubSkillFile = path.join(hubPath, SKILL_MANIFEST);
      const healErr = await healSymlinkChain(skill, hubPath, hubSkillFile, skillFilePath);
      if (healErr) return { ...healErr, agentId };
      return resultSuccess(skill.name, agentId, method);
    } else {
      await removeFile(skillFilePath);
      return await installSkill(skill, skillSourcePath, agentInstallDir, method, agentId, cwd, scope);
    }
  } catch (error) {
    return resultError(skill.name, agentId, method, "Update failed — check file permissions");
  }
}

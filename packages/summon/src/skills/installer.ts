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
import type { SkillMeta } from "./loader";

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
 * Install a skill to an agent's directory
 * Creates install directory if needed
 */
export async function installSkill(
  skill: SkillMeta,
  skillSourcePath: string,
  agentInstallDir: string,
  method: InstallMethod = "copy",
  agentId: string = ""
): Promise<InstallResult> {
  const skillFilePath = path.join(agentInstallDir, `${skill.name}.md`);

  try {
    // Validate symlink source path (use skill.filePath set by trusted loader)
    if (method === "symlink") {
      const resolved = path.resolve(skill.filePath);
      // Verify the path is absolute and exists (set by loader)
      if (!path.isAbsolute(resolved)) {
         return {
           skillName: skill.name,
           agentId,
           success: false,
           method,
           error: "Path traversal detected — skill source path is not absolute",
         };
       }
    }

    // Validate destination path stays within agent install directory
    const resolvedDest = path.resolve(skillFilePath);
    const safeInstallDir = path.resolve(agentInstallDir);
    if (!isPathWithin(safeInstallDir, resolvedDest)) {
      return {
        skillName: skill.name,
        agentId,
        success: false,
        method,
        error: "Path traversal detected — destination path is outside agent install directory",
      };
    }

     // Ensure agent's install directory exists
     await ensureDir(agentInstallDir);

     if (method === "symlink") {
       // Validate source file exists before creating symlink
       if (!(await exists(skill.filePath))) {
         return {
           skillName: skill.name,
           agentId,
           success: false,
           method,
           error: `Source skill file not found: ${skill.filePath}`,
         };
       }

       // Remove existing file if present, with symlink target validation
       const alreadyExists = await exists(skillFilePath);
       if (alreadyExists) {
         const isLink = await isSymlink(skillFilePath);
         if (isLink) {
           // Read symlink target and validate it's safe before removing
           const target = await fs.readlink(skillFilePath);
           const spellsDir = path.dirname(skill.filePath);
           if (!isSymlinkTargetSafe(target, spellsDir)) {
             console.warn(
               `Skipping removal of symlink ${skillFilePath} — target outside safe directory: ${target}`
             );
             return {
               skillName: skill.name,
               agentId,
               success: false,
               method,
               error: `Unsafe symlink target — not removing: ${target}`,
             };
           }
         }
         await removeFile(skillFilePath);
       }

       await symlinkFile(skill.filePath, skillFilePath);
    } else {
      // Copy method
      await copyFile(skillSourcePath, skillFilePath);
    }

    return {
       skillName: skill.name,
       agentId,
       success: true,
       method,
     };
   } catch (error) {
     return {
       skillName: skill.name,
       agentId,
       success: false,
       method,
       error: "Installation failed — check file permissions",
     };
   }
 }

/**
 * Remove an installed skill from an agent's directory
 */
export async function removeSkill(
  skillName: string,
  skillFilePath: string,
  agentId: string = ""
): Promise<InstallResult> {
   try {
     await removeFile(skillFilePath);

     return {
       skillName,
       agentId,
       success: true,
       method: "copy", // Irrelevant for removal
     };
   } catch (error) {
     return {
       skillName,
       agentId,
       success: false,
       method: "copy",
       error: "Removal failed — check file permissions",
     };
   }
 }

/**
 * Update an installed skill (re-copy or re-link)
 */
export async function updateSkill(
  skill: SkillMeta,
  skillSourcePath: string,
  skillFilePath: string,
  method: InstallMethod = "copy",
  agentId: string = ""
): Promise<InstallResult> {
  try {
    // Remove existing file
    await removeFile(skillFilePath);

    // Get parent directory
    const agentInstallDir = path.dirname(skillFilePath);

     // Re-install with new content
     return await installSkill(
       skill,
       skillSourcePath,
       agentInstallDir,
       method,
       agentId
     );
   } catch (error) {
     return {
       skillName: skill.name,
       agentId,
       success: false,
       method,
       error: "Update failed — check file permissions",
     };
   }
}

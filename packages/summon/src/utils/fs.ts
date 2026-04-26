import fs from "node:fs/promises";
import path from "node:path";

/**
 * Check if file or directory exists
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is a symlink
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Copy file from source to destination
 * Creates parent directories if needed
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

/**
 * Create a symlink from source to destination
 * Creates parent directories if needed
 */
export async function symlinkFile(src: string, dest: string): Promise<void> {
  // Verify source file exists before creating symlink
  if (!(await exists(src))) {
    throw new Error(`Source file not found: ${src}`);
  }
  await ensureDir(path.dirname(dest));
  await fs.symlink(src, dest);
}

/**
 * Remove file or directory
 */
export async function removeFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.lstat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Ensure directory exists, creating parent directories if needed
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

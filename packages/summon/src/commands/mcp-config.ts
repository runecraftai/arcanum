import fs from "node:fs/promises";
import path from "node:path";

export class OpencodeConfigError extends Error {
  constructor(
    message: string,
    public configPath: string
  ) {
    super(message);
    this.name = "OpencodeConfigError";
  }
}

export async function readOpencodeConfig(
  configPath: string
): Promise<{ config: Record<string, unknown>; created: boolean; backedUpFrom?: string }> {
  let raw: string | null = null;
  let created = false;
  let backedUpFrom: string | undefined;

  try {
    raw = await fs.readFile(configPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { config: {}, created: true };
    }
    throw new OpencodeConfigError(
      `Failed to read ${configPath}: ${(err as Error).message}`,
      configPath
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const backupPath = `${configPath}.bak`;
    await fs.writeFile(backupPath, raw, "utf8");
    backedUpFrom = backupPath;
    return { config: {}, created: true, backedUpFrom };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    const backupPath = `${configPath}.bak`;
    await fs.writeFile(backupPath, raw, "utf8");
    backedUpFrom = backupPath;
    return { config: {}, created: true, backedUpFrom };
  }

  return { config: parsed as Record<string, unknown>, created: false };
}

export function mcpEntryExists(
  config: Record<string, unknown>,
  mcpName: string
): boolean {
  const mcp = config.mcp;
  if (!mcp || typeof mcp !== "object" || Array.isArray(mcp)) return false;
  return Object.prototype.hasOwnProperty.call(mcp, mcpName);
}

export function mergeMcpEntry(
  config: Record<string, unknown>,
  mcpName: string,
  entry: Record<string, unknown>
): Record<string, unknown> {
  const mcpRaw = config.mcp;
  const mcp: Record<string, unknown> =
    mcpRaw && typeof mcpRaw === "object" && !Array.isArray(mcpRaw)
      ? { ...(mcpRaw as Record<string, unknown>) }
      : {};
  mcp[mcpName] = entry;
  return { ...config, mcp };
}

export async function writeOpencodeConfig(
  configPath: string,
  config: Record<string, unknown>
): Promise<void> {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
}

export async function mcpEntryExistsOnDisk(
  configPath: string,
  mcpName: string
): Promise<boolean> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return mcpEntryExists(parsed, mcpName);
  } catch {
    return false;
  }
}

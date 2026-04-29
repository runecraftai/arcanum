/**
 * Hierarchical JSONC config loading for @runecraft/guild
 */

import { promises as fs } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { parse as parseJSONC } from "jsonc-parser";
import pc from "picocolors";
import { GuildConfigSchema } from "./schema.js";
import type { GuildConfig } from "./schema.js";

const USER_CONFIG = join(homedir(), ".config/opencode/guild-opencode.jsonc");
const PROJECT_CONFIG_NAME = "guild-opencode.jsonc";

/**
 * Try to read a file, return null if not found or error
 */
async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch (error) {
    return null;
  }
}

/**
 * Deep merge objects: b overrides a, arrays replace, objects recurse
 */
export function deepMerge<T extends Record<string, any>>(
  a: T,
  b: Partial<T>
): T {
  const result = { ...a };

  for (const key in b) {
    const bValue = b[key];
    const aValue = result[key];

    if (
      bValue &&
      typeof bValue === "object" &&
      !Array.isArray(bValue) &&
      aValue &&
      typeof aValue === "object" &&
      !Array.isArray(aValue)
    ) {
      // Recurse for nested objects
      result[key] = deepMerge(aValue, bValue);
    } else {
      // Replace (including arrays)
      result[key] = bValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Load and merge user + project config, validate, return defaults if missing
 */
export async function loadConfig(projectDir: string): Promise<GuildConfig> {
  // Validate and normalize projectDir (HIGH-2 security fix)
  if (!projectDir || typeof projectDir !== "string") {
    throw new Error("projectDir must be a non-empty string");
  }
  const normalizedDir = resolve(projectDir);

  const userRaw = await tryReadFile(USER_CONFIG);
  const projectRaw = await tryReadFile(
    join(normalizedDir, ".opencode", PROJECT_CONFIG_NAME)
  );

  let userConfig: Record<string, any> = {};
  let projectConfig: Record<string, any> = {};

  // Parse user config
  if (userRaw) {
    try {
      userConfig = parseJSONC(userRaw) || {};
    } catch (error) {
      console.warn(
        pc.yellow("[guild]"),
        "Failed to parse user config at",
        USER_CONFIG
      );
      console.warn(pc.dim("  → Using defaults"));
    }
  }

  // Parse project config
  if (projectRaw) {
    try {
      projectConfig = parseJSONC(projectRaw) || {};
    } catch (error) {
      console.warn(
        pc.yellow("[guild]"),
        "Failed to parse project config at",
        join(normalizedDir, ".opencode", PROJECT_CONFIG_NAME)
      );
      console.warn(pc.dim("  → Using user config"));
    }
  }

  // Merge (project over user)
  const merged = deepMerge(userConfig, projectConfig);

  // Validate and apply defaults
  const parsed = GuildConfigSchema.parse(merged);

  // Apply defaults for missing sections
  const withDefaults = {
    agents: {
      herald: parsed.agents?.herald || { enabled: true },
      scout: parsed.agents?.scout || { enabled: true },
      sage: parsed.agents?.sage || { enabled: true },
      forge: parsed.agents?.forge || { enabled: true },
      ward: parsed.agents?.ward || { enabled: false },
      arbiter: parsed.agents?.arbiter || { enabled: false },
    },
    graphify: {
      enabled: parsed.graphify?.enabled ?? true,
      reportPath:
        parsed.graphify?.reportPath || "graphify-out/GRAPH_REPORT.md",
    },
    prompt: {
      appendCoordination: parsed.prompt?.appendCoordination ?? true,
      maxLength: parsed.prompt?.maxLength ?? 500,
    },
  };

  return withDefaults;
}

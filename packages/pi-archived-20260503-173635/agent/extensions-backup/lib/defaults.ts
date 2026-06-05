// ABOUTME: Shared default constants for @runecraft/familiar extensions.
// ABOUTME: Uses opencode-go models for subagents.

import { loadAgentModelsConfig, buildModelString } from "./agent-defs.ts";

// Load once at import time
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const _extDir = dirname(fileURLToPath(import.meta.url));
const _extProjectDir = resolve(_extDir, "..");
const _config = loadAgentModelsConfig(process.cwd(), _extProjectDir);

/**
 * The default model string for subagents.
 * Using deepseek-v4-flash for speed on background tasks.
 */
export const DEFAULT_SUBAGENT_MODEL = buildModelString(_config.default);

/**
 * Agent models — mapped to opencode-go provider
 * These are the models used when no models.json is present.
 */
export const AGENT_MODELS: Record<string, string> = {
  herald: "opencode-go/minimax-m2.7",
  scout: "opencode-go/deepseek-v4-flash",
  sage: "opencode-go/deepseek-v4-pro",
  forge: "opencode-go/minimax-m2.7",
  ward: "opencode-go/deepseek-v4-flash",
  arbiter: "opencode-go/deepseek-v4-flash",
};

/**
 * Timeout per agent role (ms)
 * Prevents zombie subagents by killing after timeout.
 */
export const ROLE_TIMEOUT_MS: Record<string, number> = {
  HERALD: 20 * 60 * 1000,  // 20 min
  SCOUT: 10 * 60 * 1000,   // 10 min
  SAGE: 15 * 60 * 1000,    // 15 min
  FORGE: 30 * 60 * 1000,   // 30 min
  WARD: 15 * 60 * 1000,    // 15 min
  ARBITER: 15 * 60 * 1000, // 15 min
};

export const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000; // 20 min

/**
 * ANSI color codes for runecraft theme
 * Dark backgrounds that keep white text readable.
 */
export const STATUS_BG: Record<string, string> = {
  running: "\x1b[48;2;26;58;92m",   // dark steel blue
  done:    "\x1b[48;2;35;50;55m",    // dark teal-gray  
  error:   "\x1b[48;2;70;35;35m",    // dark muted red
  idle:    "\x1b[48;2;40;40;50m",    // dark gray
};

export const RESET_BG = "\x1b[49m";
export const WHITE_BOLD = "\x1b[1;97m";
export const RESET_ALL = "\x1b[0m";

/**
 * Session storage directory
 */
export const SESSION_DIR = ".pi/agent-sessions";

/**
 * Config filenames
 */
export const TEAMS_FILE = "teams.yaml";
export const CHAIN_FILE = "agent-chain.yaml";

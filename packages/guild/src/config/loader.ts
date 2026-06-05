import type { GuildConfig } from "./schema"
import { createConfigFsLoader } from "../infrastructure/fs/config-fs-loader"

export type { ConfigDiagnostic, ConfigLoadResult } from "../infrastructure/fs/config-fs-loader"

const DefaultConfigLoader = createConfigFsLoader()

export function getLastConfigLoadResult() {
  return DefaultConfigLoader.getLastConfigLoadResult()
}

export function loadGuildConfig(
  directory: string,
  ctx?: unknown,
  homeDir?: string,
): GuildConfig {
  return DefaultConfigLoader.loadGuildConfig(directory, ctx, homeDir)
}

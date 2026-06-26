import type { CommandMapping } from "./registry";

export type InstallLocation = "local" | "global";

export interface CommandGenerator {
  runtime: string;
  displayName: string;
  supportedLocations: InstallLocation[];
  detectLocal(projectRoot: string): Promise<boolean>;
  detectGlobal(): Promise<boolean>;
  generate(
    mapping: CommandMapping,
    projectRoot: string,
    location: InstallLocation
  ): Promise<string>;
}

export const SUPPORTED_RUNTIMES = ["claude-code", "opencode", "cursor"] as const;
export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export function isSupportedRuntime(id: string): id is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(id);
}

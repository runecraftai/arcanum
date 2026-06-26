import type { CommandMapping } from "./registry";

export interface CommandGenerator {
  runtime: string;
  displayName: string;
  detect(projectRoot: string): Promise<boolean>;
  generate(mapping: CommandMapping, projectRoot: string): Promise<string>;
}

export const SUPPORTED_RUNTIMES = ["claude-code", "opencode", "cursor"] as const;
export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export function isSupportedRuntime(id: string): id is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(id);
}

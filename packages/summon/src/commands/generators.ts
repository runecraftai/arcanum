import { claudeCodeGenerator } from "./generators/claude-code";
import { opencodeGenerator } from "./generators/opencode";
import { cursorGenerator } from "./generators/cursor";
import type { CommandGenerator } from "./generator";
import type { SupportedRuntime } from "./generator";

const GENERATORS: Record<SupportedRuntime, CommandGenerator> = {
  "claude-code": claudeCodeGenerator,
  opencode: opencodeGenerator,
  cursor: cursorGenerator,
};

export function getGenerator(runtime: SupportedRuntime): CommandGenerator {
  const gen = GENERATORS[runtime];
  if (!gen) {
    throw new Error(
      `No generator registered for runtime "${runtime}". Supported: ${Object.keys(GENERATORS).join(", ")}`,
    );
  }
  return gen;
}

export function listGenerators(): CommandGenerator[] {
  return [claudeCodeGenerator, opencodeGenerator, cursorGenerator];
}

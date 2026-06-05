import { createPolicyResult, type PolicyResult } from "../../domain/policy/policy-result"
import type { RuntimeEffect } from "../../runtime/opencode/effects"
import { checkRangerWrite } from "../../hooks/ranger-md-only"
import type { RuntimeBeforeToolInput } from "./runtime-policy"

export interface RangerToolPolicy {
  beforeTool(input: RuntimeBeforeToolInput): PolicyResult<RuntimeEffect>
}

export function createRangerToolPolicy(): RangerToolPolicy {
  return {
    beforeTool(input) {
      const filePath =
        (input.toolArgs?.file_path as string | undefined) ??
        (input.toolArgs?.path as string | undefined) ??
        ""

      if (filePath && input.agent && input.hooks.rangerMdOnlyEnabled) {
        const check = checkRangerWrite(input.agent, input.tool, filePath)
        if (!check.allowed) {
          throw new Error(check.reason ?? "Ranger agent is restricted to .md files in .guild/")
        }
      }

      return createPolicyResult<RuntimeEffect>()
    },
  }
}

import type { PluginInput } from "@opencode-ai/plugin"
import type { GuildConfig } from "./config/schema"
import type { ToolsRecord } from "./plugin/types"
import type { LoadedSkill } from "./features/skill-loader/types"
import type { ResolveSkillsFn } from "./agents/agent-builder"
import { loadSkills, createSkillResolver } from "./features/skill-loader"

export interface ToolsResult {
  tools: ToolsRecord
  availableSkills: LoadedSkill[]
  resolveSkillsFn: ResolveSkillsFn
}

export async function createTools(options: {
  ctx: PluginInput
  pluginConfig: GuildConfig
}): Promise<ToolsResult> {
  const { ctx, pluginConfig } = options

  const skillResult = await loadSkills({
    serverUrl: ctx.serverUrl,
    directory: ctx.directory,
    disabledSkills: pluginConfig.disabled_skills ?? [],
    customDirs: pluginConfig.skill_directories,
  })

  const resolveSkillsFn = createSkillResolver(skillResult)

  // Tools come from OpenCode's tool system — Guild registers an empty record
  // and relies on the config pipeline (ConfigHandler) to apply tool permissions
  const tools: ToolsRecord = {}

  return {
    tools,
    availableSkills: skillResult.skills,
    resolveSkillsFn,
  }
}

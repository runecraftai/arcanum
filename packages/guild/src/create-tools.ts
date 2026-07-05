import type { PluginInput } from "@opencode-ai/plugin"
import type { GuildConfig } from "./config/schema"
import type { ToolsRecord } from "./plugin/types"
import type { LoadedSkill } from "./features/skill-loader/types"
import type { ResolveSkillsFn } from "./agents/agent-builder"
import { loadSkills, createSkillResolver } from "./features/skill-loader"
import { createCompactContextTool } from "./tools/compact-context"

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

  const tools: ToolsRecord = {}

  // Register guild_compact_context unless explicitly disabled via config
  if (pluginConfig.tools?.compact_context !== false) {
    tools.guild_compact_context = createCompactContextTool({
      directory: ctx.directory,
      client: ctx.client,
    })
  }

  return {
    tools,
    availableSkills: skillResult.skills,
    resolveSkillsFn,
  }
}

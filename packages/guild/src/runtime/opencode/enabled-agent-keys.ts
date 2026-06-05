import type { GuildConfig } from "../../config/schema"

const BUILTIN_AGENT_NAMES = ["bard", "fighter", "ranger", "wizard", "rogue", "warlock", "cleric", "paladin"] as const

/**
 * Derives the full set of enabled agent keys from a GuildConfig.
 *
 * Includes:
 * - Built-in agents that are not disabled
 * - Custom agents that are not disabled
 * - `ranger-{category}` agents for all defined categories (patterns only affect
 *   routing hints in Fighter's prompt, not agent existence),
 *   as long as the base `ranger` agent is not disabled and the specific
 *   `ranger-{category}` key is not disabled
 */
export function buildEnabledAgentKeys(pluginConfig: GuildConfig): Set<string> {
  const disabled = new Set(pluginConfig.disabled_agents ?? [])
  const enabled = new Set<string>()

  for (const builtin of BUILTIN_AGENT_NAMES) {
    if (!disabled.has(builtin)) {
      enabled.add(builtin)
    }
  }

  for (const custom of Object.keys(pluginConfig.custom_agents ?? {})) {
    if (!disabled.has(custom)) {
      enabled.add(custom)
    }
  }

  // Add ranger-{category} agents for all defined categories (patterns affect routing hints only, not existence)
  const rangerEnabled = !disabled.has("ranger")
  if (rangerEnabled && pluginConfig.categories) {
    for (const categoryName of Object.keys(pluginConfig.categories)) {
      const categoryAgentName = `ranger-${categoryName}`
      if (!disabled.has(categoryAgentName)) {
        enabled.add(categoryAgentName)
      }
    }
  }

  return enabled
}

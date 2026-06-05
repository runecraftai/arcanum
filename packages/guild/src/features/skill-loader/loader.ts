import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import type { LoadedSkill, SkillDiscoveryResult } from './types'
import { fetchSkillsFromOpenCode } from './opencode-client'
import { scanDirectory } from './discovery'
import { debug } from '../../shared/log'
import { resolveSafePath } from '../../shared/resolve-safe-path'

export interface LoadSkillsOptions {
  serverUrl: string | URL
  directory?: string
  disabledSkills?: string[]
  /** Additional directories to scan for skills (from config `skill_directories`) */
  customDirs?: string[]
}

/**
 * Resolve the package-local builtin skills directory.
 * Uses import.meta.dir to find package root, then appends `skills/`.
 * Tolerates missing directory (returns undefined).
 */
function resolveBuiltinSkillsDir(): string | undefined {
  // import.meta.dir = <pkg-root>/dist/features/skill-loader/ (built) or <pkg-root>/src/features/skill-loader/ (dev)
  const pkgRoot = path.resolve(import.meta.dir, '..', '..', '..')
  const skillsDir = path.join(pkgRoot, 'skills')
  if (fs.existsSync(skillsDir) && fs.statSync(skillsDir).isDirectory()) {
    return skillsDir
  }
  return undefined
}

/**
 * Scan package-local builtin skills from `packages/guild/skills/`.
 * Returns empty array if the directory is missing.
 */
function scanBuiltinSkills(): LoadedSkill[] {
  const dir = resolveBuiltinSkillsDir()
  if (!dir) return []
  return scanDirectory({ directory: dir, scope: 'builtin' })
}

/**
 * Scan the filesystem for skills in OpenCode's standard locations plus any custom directories.
 * This covers both user-level (~/.config/opencode/skills/) and
 * project-level ({directory}/.opencode/skills/) skill directories,
 * plus any extra directories provided via config.
 */
function scanFilesystemSkills(directory: string, customDirs?: string[]): LoadedSkill[] {
  const userDir = path.join(os.homedir(), '.config', 'opencode', 'skills')
  const projectDir = path.join(directory, '.opencode', 'skills')
  const userSkills = scanDirectory({ directory: userDir, scope: 'user' })
  const projectSkills = scanDirectory({ directory: projectDir, scope: 'project' })

  // Custom directories (from config) — scanned as "project" scope, sandboxed to project root
  const customSkills: LoadedSkill[] = []
  if (customDirs) {
    for (const dir of customDirs) {
      const resolved = resolveSafePath(dir, directory)
      if (resolved) {
        customSkills.push(...scanDirectory({ directory: resolved, scope: 'project' }))
      }
    }
  }

  return [...projectSkills, ...customSkills, ...userSkills]
}

/**
 * Merge skills from multiple sources with the following precedence:
 * api > filesystem (project/custom/user) > builtin
 * Sources earlier in the args list win over later ones.
 */
function mergeSkillSources(...sources: LoadedSkill[][]): LoadedSkill[] {
  const seen = new Set<string>()
  const merged: LoadedSkill[] = []
  for (const source of sources) {
    for (const skill of source) {
      if (!seen.has(skill.name)) {
        merged.push(skill)
        seen.add(skill.name)
      }
    }
  }
  return merged
}

export async function loadSkills(options: LoadSkillsOptions): Promise<SkillDiscoveryResult> {
  const { serverUrl, directory = process.cwd(), disabledSkills = [], customDirs } = options

  // Primary: fetch from OpenCode HTTP API
  const apiSkills = await fetchSkillsFromOpenCode(serverUrl, directory)

  // Fallback: scan filesystem for skills the API may not have returned
  const fsSkills = scanFilesystemSkills(directory, customDirs)

  // Builtin: package-local skills with lowest precedence
  const builtinSkills = scanBuiltinSkills()

  const skills = mergeSkillSources(apiSkills, fsSkills, builtinSkills)

  if (apiSkills.length === 0 && fsSkills.length > 0) {
    debug('OpenCode API returned no skills — using filesystem fallback', {
      fsSkillCount: fsSkills.length,
      fsSkillNames: fsSkills.map((s) => s.name),
    })
  }

  if (builtinSkills.length > 0) {
    debug('Loaded builtin skills from package', {
      builtinCount: builtinSkills.length,
      builtinNames: builtinSkills.map((s) => s.name),
    })
  }

  if (disabledSkills.length === 0) return { skills }
  const disabledSet = new Set(disabledSkills)
  return { skills: skills.filter((s) => !disabledSet.has(s.name)) }
}
